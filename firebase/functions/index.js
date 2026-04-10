const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { randomInt } = require("crypto");

admin.initializeApp();

const db = admin.firestore();
const region = functions.region("asia-southeast1");
const permissionKeys = [
  "canViewAdminPanel",
  "canManageGames",
  "canCreateGame",
  "canEditGame",
  "canDeleteGame",
  "canManageUsers",
  "canBanUsers",
  "canManageVip",
  "canApproveVip",
  "canAdjustCoin",
  "canBroadcastAnnouncement",
  "canSendNotifications",
  "canViewAuditLogs",
  "canManageSettings",
  "canViewReports"
];

const permissionByRole = {
  member: {},
  support: {
    canViewAdminPanel: true,
    canSendNotifications: true
  },
  editor: {
    canViewAdminPanel: true,
    canManageGames: true,
    canCreateGame: true,
    canEditGame: true
  },
  moderator: {
    canViewAdminPanel: true,
    canManageUsers: true,
    canBanUsers: true,
    canViewReports: true
  },
  finance: {
    canViewAdminPanel: true,
    canManageVip: true,
    canApproveVip: true,
    canAdjustCoin: true,
    canViewReports: true
  },
  admin: {
    canViewAdminPanel: true,
    canManageGames: true,
    canCreateGame: true,
    canEditGame: true,
    canDeleteGame: true,
    canManageUsers: true,
    canBanUsers: true,
    canManageVip: true,
    canApproveVip: true,
    canAdjustCoin: true,
    canBroadcastAnnouncement: true,
    canSendNotifications: true,
    canViewAuditLogs: true,
    canManageSettings: true,
    canViewReports: true
  },
  superadmin: Object.fromEntries(permissionKeys.map((permission) => [permission, true]))
};

function assertAuth(context) {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Bạn cần đăng nhập.");
  }
  return context.auth.uid;
}

async function getActor(context) {
  const uid = assertAuth(context);
  const actorRef = db.collection("users").doc(uid);
  const actorSnap = await actorRef.get();
  if (!actorSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Không tìm thấy hồ sơ người dùng.");
  }
  const actor = {
    id: actorSnap.id,
    ...actorSnap.data()
  };
  if (actor.accountStatus !== "active") {
    throw new functions.https.HttpsError("permission-denied", "Tài khoản không ở trạng thái active.");
  }
  return actor;
}

function hasPermission(actor, permission) {
  return actor.role === "superadmin" || actor.permissions?.[permission] === true;
}

function assertPermission(actor, permission) {
  if (!hasPermission(actor, permission)) {
    throw new functions.https.HttpsError("permission-denied", "Thiếu quyền thao tác.");
  }
}

function buildPermissions(role) {
  const base = Object.fromEntries(permissionKeys.map((permission) => [permission, false]));
  return {
    ...base,
    ...(permissionByRole[role] || {})
  };
}

async function writeAudit({ actor, action, targetType, targetId, reason = "", before = null, after = null, context }) {
  await db.collection("audit_logs").add({
    actorUid: actor.id,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    before,
    after,
    reason,
    ipHash: context.rawRequest.ip || "unknown",
    userAgent: context.rawRequest.get("user-agent") || "unknown",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function createNotifications(targetUids, payload) {
  const batch = db.batch();
  targetUids.forEach((uid) => {
    const ref = db.collection("notifications").doc();
    batch.set(ref, {
      toUid: uid,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...payload
    });
  });
  await batch.commit();
}

exports.adjustUserCoin = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  assertPermission(actor, "canAdjustCoin");
  const uid = String(data.uid || "");
  const amount = Number(data.amount || 0);
  const reason = String(data.reason || "").trim();
  if (!uid || !Number.isFinite(amount) || amount === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Thiếu uid hoặc amount không hợp lệ.");
  }
  const userRef = db.collection("users").doc(uid);
  const result = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Không tìm thấy user.");
    }
    const before = userSnap.data();
    const nextCoin = Number(before.coin || 0) + amount;
    if (nextCoin < 0) {
      throw new functions.https.HttpsError("failed-precondition", "Không thể trừ coin âm quá số dư.");
    }
    transaction.set(userRef, {
      coin: nextCoin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    const notificationRef = db.collection("notifications").doc();
    transaction.set(notificationRef, {
      toUid: uid,
      title: amount > 0 ? "Coin đã được cộng" : "Coin đã bị trừ",
      msg: `${amount > 0 ? "Bạn được cộng" : "Bạn bị trừ"} ${Math.abs(amount)} Coin. Lý do: ${reason || "Admin adjustment"}`,
      type: "coin",
      read: false,
      createdBy: actor.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return {
      before,
      after: {
        coin: nextCoin
      }
    };
  });
  await writeAudit({
    actor,
    action: "adjustCoin",
    targetType: "user",
    targetId: uid,
    reason,
    before: { coin: result.before.coin },
    after: result.after,
    context
  });
  return {
    ok: true
  };
});

exports.publishAnnouncement = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  if (!hasPermission(actor, "canBroadcastAnnouncement") && !hasPermission(actor, "canManageSettings")) {
    throw new functions.https.HttpsError("permission-denied", "Thiếu quyền broadcast.");
  }
  const settingsRef = db.collection("settings").doc("global");
  const beforeSnap = await settingsRef.get();
  const announcement = {
    enabled: Boolean(data.enabled),
    title: String(data.title || "").trim(),
    msg: String(data.msg || "").trim(),
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null
  };
  await settingsRef.set({
    announcement
  }, { merge: true });
  await writeAudit({
    actor,
    action: "publishAnnouncement",
    targetType: "settings",
    targetId: "global",
    reason: announcement.title,
    before: beforeSnap.exists ? beforeSnap.data().announcement || null : null,
    after: announcement,
    context
  });
  return {
    ok: true
  };
});

exports.saveVipConfig = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  if (!hasPermission(actor, "canManageVip") && !hasPermission(actor, "canManageSettings")) {
    throw new functions.https.HttpsError("permission-denied", "Thiếu quyền quản lý VIP.");
  }
  const settingsRef = db.collection("settings").doc("global");
  const beforeSnap = await settingsRef.get();
  const vipConfig = {
    priceVip: Number(data.priceVip || 0),
    priceVvip: Number(data.priceVvip || 0),
    bankInfo: String(data.bankInfo || "").trim()
  };
  await settingsRef.set({
    vipConfig
  }, { merge: true });
  await writeAudit({
    actor,
    action: "saveVipConfig",
    targetType: "settings",
    targetId: "global",
    before: beforeSnap.exists ? beforeSnap.data().vipConfig || null : null,
    after: vipConfig,
    context
  });
  return {
    ok: true
  };
});

exports.sendNotification = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  assertPermission(actor, "canSendNotifications");
  const targetScope = String(data.targetScope || "all");
  const targetValue = String(data.targetValue || "");
  const title = String(data.title || "").trim();
  const msg = String(data.msg || "").trim();
  if (!title || !msg) {
    throw new functions.https.HttpsError("invalid-argument", "Thiếu tiêu đề hoặc nội dung.");
  }
  let querySnapshot;
  if (targetScope === "all") {
    querySnapshot = await db.collection("users").where("accountStatus", "==", "active").get();
  } else if (targetScope === "role") {
    querySnapshot = await db.collection("users").where("role", "==", targetValue).get();
  } else {
    const directDoc = await db.collection("users").doc(targetValue).get();
    if (directDoc.exists) {
      querySnapshot = {
        docs: [directDoc]
      };
    } else {
      querySnapshot = await db.collection("users").where("username", "==", targetValue).limit(1).get();
    }
  }
  const targetUids = querySnapshot.docs.map((doc) => doc.id);
  if (!targetUids.length) {
    throw new functions.https.HttpsError("not-found", "Không tìm thấy người nhận.");
  }
  await createNotifications(targetUids, {
    title,
    msg,
    type: String(data.type || "admin"),
    createdBy: actor.id
  });
  await writeAudit({
    actor,
    action: "sendNotification",
    targetType: targetScope,
    targetId: targetValue || "all",
    reason: title,
    context
  });
  return {
    ok: true,
    sent: targetUids.length
  };
});

exports.reviewVipRequest = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  assertPermission(actor, "canApproveVip");
  const requestId = String(data.requestId || "");
  const days = Math.max(1, Number(data.days || 30));
  const requestRef = db.collection("vip_requests").doc(requestId);
  const result = await db.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Không tìm thấy yêu cầu VIP.");
    }
    const request = requestSnap.data();
    if (request.status !== "pending") {
      throw new functions.https.HttpsError("failed-precondition", "Yêu cầu này đã được xử lý.");
    }
    const userRef = db.collection("users").doc(request.uid);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Không tìm thấy user.");
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    transaction.set(requestRef, {
      status: "approved",
      reviewedBy: actor.id,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    transaction.set(userRef, {
      vipLevel: request.requestedTier,
      vipExpiry: expiry.toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    const notificationRef = db.collection("notifications").doc();
    transaction.set(notificationRef, {
      toUid: request.uid,
      title: "VIP đã được duyệt",
      msg: `Gói ${String(request.requestedTier || "vip").toUpperCase()} của bạn đã được duyệt trong ${days} ngày.`,
      type: "vip",
      read: false,
      createdBy: actor.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return {
      targetUid: request.uid,
      tier: request.requestedTier
    };
  });
  await writeAudit({
    actor,
    action: "reviewVipRequest",
    targetType: "vip_request",
    targetId: requestId,
    reason: `${result.tier}:${days}`,
    context
  });
  return {
    ok: true,
    uid: result.targetUid
  };
});

exports.setUserRole = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  if (actor.role !== "superadmin") {
    throw new functions.https.HttpsError("permission-denied", "Chỉ superadmin mới được đổi role.");
  }
  const uid = String(data.uid || "");
  const role = String(data.role || "member");
  const targetRef = db.collection("users").doc(uid);
  const beforeSnap = await targetRef.get();
  if (!beforeSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Không tìm thấy user.");
  }
  const before = beforeSnap.data();
  await targetRef.set({
    role,
    permissions: buildPermissions(role),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await writeAudit({
    actor,
    action: "setUserRole",
    targetType: "user",
    targetId: uid,
    reason: role,
    before: {
      role: before.role
    },
    after: {
      role
    },
    context
  });
  return {
    ok: true
  };
});

exports.setUserStatus = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  assertPermission(actor, "canBanUsers");
  const uid = String(data.uid || "");
  const status = String(data.status || "active");
  const reason = String(data.reason || "").trim();
  const userRef = db.collection("users").doc(uid);
  const beforeSnap = await userRef.get();
  if (!beforeSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Không tìm thấy user.");
  }
  await userRef.set({
    accountStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await writeAudit({
    actor,
    action: "setUserStatus",
    targetType: "user",
    targetId: uid,
    reason,
    before: {
      accountStatus: beforeSnap.data().accountStatus
    },
    after: {
      accountStatus: status
    },
    context
  });
  return {
    ok: true
  };
});

exports.upsertGame = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  assertPermission(actor, "canManageGames");
  const gameRef = data.id ? db.collection("games").doc(String(data.id)) : db.collection("games").doc();
  const beforeSnap = await gameRef.get();
  const payload = {
    slug: String(data.slug || "").trim(),
    title: String(data.title || "").trim(),
    author: String(data.author || "").trim(),
    version: String(data.version || "").trim(),
    progress: String(data.progress || "").trim(),
    platform: String(data.platform || "").trim(),
    transType: String(data.transType || "").trim(),
    size: String(data.size || "").trim(),
    genre: String(data.genre || "").trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    team: String(data.team || "").trim(),
    coverUrl: String(data.coverUrl || beforeSnap.data()?.coverUrl || ""),
    desc: String(data.desc || "").trim(),
    adminMsg: String(data.adminMsg || "").trim(),
    is18: Boolean(data.is18),
    isFreeLink: Boolean(data.isFreeLink),
    links: data.links || {},
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.id
  };
  if (!beforeSnap.exists) {
    payload.views = 0;
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    payload.publishedAt = admin.firestore.FieldValue.serverTimestamp();
    payload.createdBy = actor.id;
  }
  await gameRef.set(payload, { merge: true });
  await writeAudit({
    actor,
    action: beforeSnap.exists ? "updateGame" : "createGame",
    targetType: "game",
    targetId: gameRef.id,
    reason: payload.title,
    before: beforeSnap.exists ? beforeSnap.data() : null,
    after: payload,
    context
  });
  return {
    ok: true,
    id: gameRef.id
  };
});

exports.playTaixiu = region.https.onCall(async (data, context) => {
  const actor = await getActor(context);
  const choice = String(data.choice || "").toLowerCase();
  const betAmount = Number(data.betAmount || 0);
  if (!["tai", "xiu"].includes(choice)) {
    throw new functions.https.HttpsError("invalid-argument", "Lựa chọn chưa hợp lệ.");
  }
  const settingsSnap = await db.collection("settings").doc("global").get();
  const minigameConfig = settingsSnap.exists ? settingsSnap.data().minigameConfig || {} : {};
  const minBet = Number(minigameConfig.minBet || 10);
  const maxBet = Number(minigameConfig.maxBet || 5000);
  const payout = Number(minigameConfig.payout || 1.95);
  const cooldownMs = Number(minigameConfig.cooldownMs || 2500);
  if (!Number.isFinite(betAmount) || betAmount < minBet || betAmount > maxBet) {
    throw new functions.https.HttpsError("invalid-argument", "Mức cược chưa hợp lệ.");
  }
  const userRef = db.collection("users").doc(actor.id);
  const result = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const user = userSnap.data();
    if (Number(user.coin || 0) < betAmount) {
      throw new functions.https.HttpsError("failed-precondition", "Coin hiện tại không đủ.");
    }
    const lastPlayAt = user.lastPlayAt ? new Date(user.lastPlayAt).getTime() : 0;
    if (Date.now() - lastPlayAt < cooldownMs) {
      throw new functions.https.HttpsError("failed-precondition", "Bạn đang trong cooldown.");
    }
    const dice = [randomInt(1, 7), randomInt(1, 7), randomInt(1, 7)];
    const total = dice.reduce((sum, value) => sum + value, 0);
    const outcome = total >= 11 ? "tai" : "xiu";
    const delta = outcome === choice ? Math.round(betAmount * (payout - 1)) : -betAmount;
    const currentCoin = Number(user.coin || 0) + delta;
    transaction.set(userRef, {
      coin: currentCoin,
      lastPlayAt: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return {
      play: {
        uid: actor.id,
        username: actor.username,
        choice,
        outcome,
        dice,
        total,
        delta,
        createdAt: new Date().toISOString()
      },
      currentCoin
    };
  });
  await writeAudit({
    actor,
    action: "playTaixiu",
    targetType: "minigame",
    targetId: actor.id,
    reason: `${choice}:${betAmount}`,
    after: result.play,
    context
  });
  return result;
});
