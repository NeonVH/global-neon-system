import { addAuditLog, createId, createPermissionSet, getCurrentUser, getUserById, patchRecord, store, upsertRecord } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";
import { createLocalNotification } from "./notification-service.js";
import { hasPermission, readFileAsDataUrl } from "../utils/security.js";
import { validateFile, validateOptionalUrl, validateText } from "../utils/validators.js";

let settingsUnsubscribe = null;
let auditUnsubscribe = null;

function ensurePermission(permission) {
  const currentUser = getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, permission)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
  return currentUser;
}

async function callProtectedFunction(name, payload) {
  const { functions } = getFirebaseServices();
  const callable = functions.httpsCallable(name);
  const result = await callable(payload);
  return result.data;
}

async function uploadVisual(pathPrefix, file) {
  const fileCheck = validateFile(file, { maxSizeMb: 2.5 });
  if (!fileCheck.valid) {
    throw new Error(fileCheck.message);
  }
  if (!isFirebaseReady()) {
    return readFileAsDataUrl(file);
  }
  const { storage } = getFirebaseServices();
  const ref = storage.ref().child(`${pathPrefix}/${Date.now()}-${file.name}`);
  await ref.put(file);
  return ref.getDownloadURL();
}

function updateGlobalSettings(mutator) {
  store.update((current) => ({
    ...current,
    settings: {
      ...current.settings,
      global: mutator(current.settings.global)
    }
  }));
}

export function startAdminStreams() {
  if (!isFirebaseReady() || settingsUnsubscribe || auditUnsubscribe) {
    return;
  }
  const { db } = getFirebaseServices();
  settingsUnsubscribe = db.collection("settings").doc("global").onSnapshot((doc) => {
    if (!doc.exists) {
      return;
    }
    updateGlobalSettings((current) => ({
      ...current,
      ...doc.data()
    }));
  });
  auditUnsubscribe = db.collection("audit_logs").limit(50).onSnapshot((snapshot) => {
    const auditLogs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    store.update((current) => ({
      ...current,
      auditLogs
    }));
  });
}

export function getAdminTabs(user) {
  if (!user || !hasPermission(user, "canViewAdminPanel")) {
    return [];
  }
  const tabs = [
    { id: "overview", label: "Overview", icon: "fa-chart-line", required: "canViewAdminPanel" },
    { id: "games", label: "Games", icon: "fa-gamepad", required: "canManageGames" },
    { id: "users", label: "Users", icon: "fa-users-gear", required: "canManageUsers" },
    { id: "vip", label: "VIP", icon: "fa-gem", required: "canManageVip" },
    { id: "broadcast", label: "Broadcast", icon: "fa-bullhorn", required: "canBroadcastAnnouncement" },
    { id: "settings", label: "Settings", icon: "fa-sliders", required: "canManageSettings" },
    { id: "audit", label: "Audit", icon: "fa-clipboard-list", required: "canViewAuditLogs" }
  ];
  return tabs.filter((tab) => hasPermission(user, tab.required));
}

export async function publishAnnouncement(payload) {
  const actor = ensurePermission("canBroadcastAnnouncement");
  const titleCheck = validateText(payload.title, 120);
  const messageCheck = validateText(payload.msg, 1200);
  if (!titleCheck.valid || !messageCheck.valid) {
    throw new Error(titleCheck.message || messageCheck.message);
  }
  const nextAnnouncement = {
    enabled: Boolean(payload.enabled),
    title: titleCheck.value,
    msg: messageCheck.value,
    startsAt: payload.startsAt || new Date().toISOString(),
    endsAt: payload.endsAt || null
  };
  if (isFirebaseReady()) {
    await callProtectedFunction("publishAnnouncement", nextAnnouncement);
    return;
  }
  updateGlobalSettings((current) => ({
    ...current,
    announcement: nextAnnouncement
  }));
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "publishAnnouncement",
    targetType: "settings",
    targetId: "global",
    reason: "Local admin update",
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function saveVipConfig(payload) {
  const actor = ensurePermission("canManageVip");
  const nextConfig = {
    priceVip: Number(payload.priceVip || 0),
    priceVvip: Number(payload.priceVvip || 0),
    bankInfo: String(payload.bankInfo || "").trim()
  };
  if (isFirebaseReady()) {
    await callProtectedFunction("saveVipConfig", nextConfig);
    return;
  }
  updateGlobalSettings((current) => ({
    ...current,
    vipConfig: nextConfig
  }));
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "saveVipConfig",
    targetType: "settings",
    targetId: "global",
    reason: "Local admin update",
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function adjustCoin({ target, amount, reason }) {
  const actor = ensurePermission("canAdjustCoin");
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    throw new Error("Số coin cần khác 0.");
  }
  const state = store.getState();
  const targetUser = state.users.find((user) => user.id === target || user.username.toLowerCase() === String(target).toLowerCase());
  if (!targetUser) {
    throw new Error("Không tìm thấy user.");
  }
  if (isFirebaseReady()) {
    await callProtectedFunction("adjustUserCoin", {
      uid: targetUser.id,
      amount: numericAmount,
      reason
    });
    return;
  }
  patchRecord("users", targetUser.id, {
    coin: Number(targetUser.coin || 0) + numericAmount,
    updatedAt: new Date().toISOString()
  });
  await createLocalNotification({
    toUid: targetUser.id,
    title: numericAmount > 0 ? "Coin đã được cộng" : "Coin đã bị trừ",
    msg: `${numericAmount > 0 ? "Bạn được cộng" : "Bạn bị trừ"} ${Math.abs(numericAmount)} Coin. Lý do: ${reason || "Admin adjustment"}`,
    type: "coin",
    createdBy: actor.id
  });
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "adjustCoin",
    targetType: "user",
    targetId: targetUser.id,
    reason,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function sendNotification({ targetScope, targetValue, title, msg, type = "admin" }) {
  const actor = ensurePermission("canSendNotifications");
  const titleCheck = validateText(title, 120);
  const messageCheck = validateText(msg, 1200);
  if (!titleCheck.valid || !messageCheck.valid) {
    throw new Error(titleCheck.message || messageCheck.message);
  }
  if (isFirebaseReady()) {
    await callProtectedFunction("sendNotification", {
      targetScope,
      targetValue,
      title: titleCheck.value,
      msg: messageCheck.value,
      type
    });
    return;
  }
  const state = store.getState();
  let targets = [];
  if (targetScope === "all") {
    targets = state.users.filter((user) => user.accountStatus === "active");
  } else if (targetScope === "role") {
    targets = state.users.filter((user) => user.role === targetValue);
  } else {
    targets = state.users.filter((user) => user.id === targetValue || user.username.toLowerCase() === String(targetValue).toLowerCase());
  }
  await Promise.all(targets.map((user) => createLocalNotification({
    id: createId("noti"),
    toUid: user.id,
    title: titleCheck.value,
    msg: messageCheck.value,
    type,
    createdBy: actor.id
  })));
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "sendNotification",
    targetType: targetScope,
    targetId: targetValue || "all",
    reason: titleCheck.value,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function reviewVipRequest({ requestId, days = 30 }) {
  const actor = ensurePermission("canApproveVip");
  const state = store.getState();
  const request = state.vipRequests.find((item) => item.id === requestId);
  if (!request) {
    throw new Error("Không tìm thấy yêu cầu VIP.");
  }
  if (isFirebaseReady()) {
    await callProtectedFunction("reviewVipRequest", {
      requestId,
      days
    });
    return;
  }
  const targetUser = getUserById(request.uid, state);
  if (!targetUser) {
    throw new Error("Không tìm thấy user cho yêu cầu này.");
  }
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + Number(days || 30));
  patchRecord("vipRequests", requestId, {
    status: "approved",
    reviewedBy: actor.id,
    reviewedAt: new Date().toISOString()
  });
  patchRecord("users", targetUser.id, {
    vipLevel: request.requestedTier,
    vipExpiry: expiry.toISOString(),
    updatedAt: new Date().toISOString()
  });
  await createLocalNotification({
    toUid: targetUser.id,
    title: "VIP đã được duyệt",
    msg: `Yêu cầu ${request.requestedTier.toUpperCase()} của bạn đã được duyệt trong ${days} ngày.`,
    type: "vip",
    createdBy: actor.id
  });
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "reviewVipRequest",
    targetType: "vip_request",
    targetId: requestId,
    reason: `Approved ${days} days`,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function setUserRole({ uid, role }) {
  const actor = ensurePermission("canManageUsers");
  if (actor.role !== "superadmin") {
    throw new Error("Chỉ superadmin mới đổi role.");
  }
  if (isFirebaseReady()) {
    await callProtectedFunction("setUserRole", { uid, role });
    return;
  }
  patchRecord("users", uid, {
    role,
    permissions: createPermissionSet(role),
    updatedAt: new Date().toISOString()
  });
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "setUserRole",
    targetType: "user",
    targetId: uid,
    reason: role,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function setUserStatus({ uid, status, reason }) {
  const actor = ensurePermission("canBanUsers");
  if (isFirebaseReady()) {
    await callProtectedFunction("setUserStatus", { uid, status, reason });
    return;
  }
  patchRecord("users", uid, {
    accountStatus: status,
    updatedAt: new Date().toISOString()
  });
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: "setUserStatus",
    targetType: "user",
    targetId: uid,
    reason,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}

export async function upsertGame(payload) {
  const actor = ensurePermission("canManageGames");
  const titleCheck = validateText(payload.title, 160);
  const descCheck = validateText(payload.desc, 4000);
  if (!titleCheck.valid || !descCheck.valid) {
    throw new Error(titleCheck.message || descCheck.message);
  }
  const coverCheck = validateOptionalUrl(payload.coverUrl || "");
  if (!coverCheck.valid) {
    throw new Error(coverCheck.message);
  }
  const existing = payload.id ? store.getState().games.find((game) => game.id === payload.id) : null;
  let coverUrl = existing?.coverUrl || coverCheck.value || "";
  if (payload.coverFile instanceof File && payload.coverFile.size > 0) {
    coverUrl = await uploadVisual(`covers/${actor.id}`, payload.coverFile);
  }
  if (isFirebaseReady()) {
    await callProtectedFunction("upsertGame", {
      ...payload,
      coverUrl
    });
    return;
  }
  upsertRecord("games", {
    id: existing?.id || createId("game"),
    slug: payload.slug,
    title: titleCheck.value,
    author: payload.author,
    version: payload.version,
    progress: payload.progress,
    platform: payload.platform,
    transType: payload.transType,
    size: payload.size,
    genre: payload.genre,
    tags: (payload.tags || []).filter(Boolean),
    team: payload.team,
    coverUrl,
    screenshotUrls: existing?.screenshotUrls || [],
    desc: descCheck.value,
    adminMsg: payload.adminMsg || "",
    is18: Boolean(payload.is18),
    isFreeLink: Boolean(payload.isFreeLink),
    views: existing?.views || 0,
    links: payload.links || existing?.links || {},
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: existing?.publishedAt || new Date().toISOString(),
    createdBy: existing?.createdBy || actor.id,
    updatedBy: actor.id
  });
  addAuditLog({
    actorUid: actor.id,
    actorRole: actor.role,
    action: existing ? "updateGame" : "createGame",
    targetType: "game",
    targetId: existing?.id || payload.slug,
    reason: titleCheck.value,
    ipHash: "demo-local",
    userAgent: navigator.userAgent
  });
}
