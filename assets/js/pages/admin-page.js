import { adjustCoin, getAdminTabs, publishAnnouncement, reviewVipRequest, saveVipConfig, sendNotification, setUserRole, setUserStatus, upsertGame } from "../services/admin-service.js";
import { clearFirebaseConfig, getStoredFirebaseConfig, saveFirebaseConfig } from "../firebase-config.js";
import { getAllUsers } from "../services/user-service.js";
import { formatCoin, formatDate, formatRoleLabel, formatStatusLabel, formatVipLabel } from "../utils/formatters.js";
import { hasPermission } from "../utils/security.js";

const roles = ["member", "support", "editor", "moderator", "finance", "admin", "superadmin"];
const v = (value, fallback = "") => value === undefined || value === null ? fallback : String(value);
const empty = (label) => `<div class="admin-list__item"><span class="muted">${label}</span></div>`;
const input = (label, name, extra = "") => `<div class="field"><label>${label}</label><input name="${name}" ${extra}></div>`;
const textarea = (label, name, value = "", extra = "") => `<div class="field"><label>${label}</label><textarea name="${name}" ${extra}>${value}</textarea></div>`;

function panel(title, eyebrow, body) {
  return `<article class="admin-card glass-panel"><div class="section-head"><div><div class="eyebrow">${eyebrow}</div><h2 class="section-title">${title}</h2></div></div>${body}</article>`;
}

function overview(state) {
  const activeUsers = state.users.filter((user) => user.accountStatus === "active").length;
  const pendingVip = state.vipRequests.filter((item) => item.status === "pending").length;
  const unread = state.notifications.filter((item) => !item.read).length;
  const totalCoin = state.users.reduce((sum, user) => sum + Number(user.coin || 0), 0);
  return `
    <section class="overview-cards">
      ${[
        ["Users", activeUsers, "active accounts"],
        ["VIP Queue", pendingVip, "waiting approval"],
        ["Unread Alerts", unread, "need attention"],
        ["Coin Reserve", Math.round(totalCoin).toLocaleString("vi-VN"), "coins in circulation"]
      ].map(([label, value, caption]) => `<article class="overview-card glass-panel"><div class="eyebrow">${label}</div><div class="overview-card__value">${value}</div><div class="muted">${caption}</div></article>`).join("")}
    </section>
    <section class="split-panel">
      ${panel("Audit stream", "Realtime pulse", `<div class="admin-list">${state.auditLogs.slice(0, 8).map((log) => `<div class="admin-list__item"><div><strong>${v(log.action)}</strong><div class="muted">${v(log.actorRole)} · ${v(log.targetType)}:${v(log.targetId)}</div></div><div class="muted">${formatDate(log.createdAt)}</div></div>`).join("") || empty("No audit activity yet.")}</div>`)}
      ${panel("VIP requests", "Pending queue", `<div class="admin-list">${state.vipRequests.filter((item) => item.status === "pending").slice(0, 8).map((item) => `<div class="admin-list__item"><div><strong>${v(item.username)}</strong><div class="muted">${v(item.requestedTier).toUpperCase()} · ${v(item.note)}</div></div><div class="muted">${formatDate(item.createdAt)}</div></div>`).join("") || empty("No pending VIP request.")}</div>`)}
    </section>
  `;
}

function games(state) {
  const fields = [
    ["Title", "title", "required"],
    ["Slug", "slug", "required"],
    ["Author", "author"],
    ["Version", "version"],
    ["Progress", "progress"],
    ["Platform", "platform", 'placeholder="Windows, Android"'],
    ["Trans Type", "transType"],
    ["Size", "size"],
    ["Genre", "genre"],
    ["Team", "team"],
    ["Cover URL", "coverUrl"],
    ["Tags", "tags", 'placeholder="VIP, Mature, Psychological"'],
    ["Admin Message", "adminMsg"]
  ];
  return `<section class="split-panel">
    ${panel("Create or edit game", "Game manager", `
      <form id="game-form" class="stack">
        <input type="hidden" name="id">
        <div class="form-grid">${fields.map(([label, name, extra]) => input(label, name, extra || "")).join("")}<div class="field"><label>Cover File</label><input type="file" name="coverFile" accept="image/png,image/jpeg,image/webp"></div></div>
        ${textarea("Description", "desc")}
        ${textarea("Links JSON", "linksJson", "", `placeholder='{"android":{"terabox":"https://..."},"pc":{"drive":"https://..."}}'`)}
        <div class="inline-actions"><label class="chip chip-gold"><input type="checkbox" name="is18" style="margin-right:.4rem;">18+</label><label class="chip chip-cyan"><input type="checkbox" name="isFreeLink" style="margin-right:.4rem;">Free Link</label></div>
        <div class="inline-actions"><button class="btn btn-primary" type="submit">Save game</button><button class="btn btn-secondary" type="reset">Reset</button></div>
      </form>`)}
    ${panel("Game list", "Current library", `<div class="table-shell"><table class="table"><thead><tr><th>Title</th><th>Version</th><th>Access</th><th>Views</th><th></th></tr></thead><tbody>${state.games.map((game) => `<tr><td>${v(game.title)}</td><td>${v(game.version)}</td><td>${game.isFreeLink ? "Free" : "VIP"}</td><td>${v(game.views, 0)}</td><td><button class="btn btn-secondary" type="button" data-load-game="${game.id}">Edit</button></td></tr>`).join("")}</tbody></table></div>`)}
  </section>`;
}

function users(state, currentUser) {
  return `<section class="split-panel">
    ${panel("Adjust wallet", "Coin console", `<form id="adjust-coin-form" class="stack"><div class="form-grid">${input("User", "target", 'placeholder="username or uid"')}${input("Amount", "amount", 'type="number" placeholder="1000 or -500"')}</div>${input("Reason", "reason", 'placeholder="Event reward, correction, penalty"')}<div class="inline-actions"><button class="btn btn-primary" type="submit">Confirm</button></div></form>`)}
    ${panel("Live account control", "User matrix", `<div class="table-shell"><table class="table"><thead><tr><th>User</th><th>Role</th><th>VIP</th><th>Coin</th><th>Status</th><th>Action</th></tr></thead><tbody>${getAllUsers(state).map((user) => `<tr><td>${v(user.username)}</td><td>${currentUser.role === "superadmin" ? `<select data-role-select="${user.id}">${roles.map((role) => `<option value="${role}" ${role === user.role ? "selected" : ""}>${formatRoleLabel(role)}</option>`).join("")}</select>` : formatRoleLabel(user.role)}</td><td>${formatVipLabel(user.vipLevel)}</td><td>${formatCoin(user.coin)}</td><td>${formatStatusLabel(user.accountStatus)}</td><td><div class="inline-actions"><button class="btn btn-secondary" type="button" data-user-status="${user.id}" data-status="suspended">Suspend</button><button class="btn btn-danger" type="button" data-user-status="${user.id}" data-status="banned">Ban</button><button class="btn btn-ghost" type="button" data-user-status="${user.id}" data-status="active">Activate</button></div></td></tr>`).join("")}</tbody></table></div>`)}
  </section>`;
}

function vip(state) {
  const config = state.settings.global.vipConfig;
  return `<section class="split-panel">
    ${panel("Pricing and bank", "VIP config", `<form id="vip-config-form" class="stack"><div class="form-grid">${input("VIP price", "priceVip", `type="number" value="${config.priceVip}"`)}${input("VVIP price", "priceVvip", `type="number" value="${config.priceVvip}"`)}</div>${input("Bank info", "bankInfo", `value="${config.bankInfo}"`)}<div class="inline-actions"><button class="btn btn-primary" type="submit">Save VIP config</button></div></form>`)}
    ${panel("Pending VIP", "Approvals", `<div class="admin-list">${state.vipRequests.filter((item) => item.status === "pending").map((request) => `<div class="admin-list__item"><div><strong>${v(request.username)}</strong><div class="muted">${v(request.requestedTier).toUpperCase()} · ${v(request.note)}</div></div><button class="btn btn-primary" type="button" data-approve-request="${request.id}">Approve</button></div>`).join("") || empty("No pending VIP request.")}</div>`)}
  </section>`;
}

function broadcast(state) {
  const announcement = state.settings.global.announcement;
  return `<section class="split-panel">
    ${panel("Server announcement", "Global broadcast", `<form id="announcement-form" class="stack">${input("Title", "title", `value="${announcement.title || ""}"`)}${textarea("Message", "msg", announcement.msg || "")}<div class="form-grid">${input("Starts", "startsAt", 'type="datetime-local"')}${input("Ends", "endsAt", 'type="datetime-local"')}</div><label class="chip chip-cyan"><input type="checkbox" name="enabled" ${announcement.enabled ? "checked" : ""} style="margin-right:.4rem;">Enable announcement</label><div class="inline-actions"><button class="btn btn-primary" type="submit">Push broadcast</button></div></form>`)}
    ${panel("Send inbox alert", "Notification center", `<form id="notification-form" class="stack"><div class="form-grid"><div class="field"><label>Target scope</label><select name="targetScope"><option value="all">All users</option><option value="role">By role</option><option value="user">By user</option></select></div>${input("Target value", "targetValue", 'placeholder="role or username"')}</div>${input("Title", "title")}${textarea("Message", "msg")}<div class="inline-actions"><button class="btn btn-primary" type="submit">Send notification</button></div></form>`)}
  </section>`;
}

function settings(state) {
  const storedConfig = getStoredFirebaseConfig();
  return `<section class="content-grid-2">
    ${panel("Deployment Notes", "Runtime", `<div class="admin-list">${[["Frontend mode", state.meta.mode], ["Announcement", state.settings.global.announcement.enabled ? "Enabled" : "Off"], ["Min bet", state.settings.global.minigameConfig.minBet], ["Max bet", state.settings.global.minigameConfig.maxBet]].map(([label, value]) => `<div class="admin-list__item"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div>`)}
    ${panel("Operational Guardrails", "Security checklist", `<div class="admin-list">${["Firebase Auth", "Rules + Functions", "DOMPurify sanitize", "Audit logged"].map((item) => `<div class="admin-list__item"><span>${item}</span><strong>Required</strong></div>`).join("")}</div>`)}
    ${panel("Attach production project", "Firebase public config", `<p class="section-copy">Paste Firebase public config JSON. It is public metadata, not a secret, but rules must be locked down.</p><form id="firebase-config-form" class="stack" style="margin-top:1rem;">${textarea("Firebase JSON", "firebaseJson", storedConfig ? JSON.stringify(storedConfig, null, 2) : "", `placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'`)}<div class="inline-actions"><button class="btn btn-primary" type="submit">Save Config</button><button class="btn btn-secondary" type="button" id="reload-firebase-config">Reload App</button><button class="btn btn-danger" type="button" id="clear-firebase-config">Clear Config</button></div></form>`)}
    ${panel("Before live", "Production checklist", `<div class="admin-list">${["Enable Email/Password auth", "Deploy Firestore rules", "Deploy callable functions", "Enable Storage CORS", "Host GitHub Pages from main"].map((item) => `<div class="admin-list__item"><span>${item}</span><strong>Check</strong></div>`).join("")}</div>`)}
  </section>`;
}

function audit(state) {
  return panel("Admin trail", "Audit timeline", `<div class="table-shell"><table class="table"><thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Reason</th><th>Time</th></tr></thead><tbody>${state.auditLogs.map((log) => `<tr><td>${v(log.action)}</td><td>${v(log.actorRole)}</td><td>${v(log.targetType)}:${v(log.targetId)}</td><td>${v(log.reason, "-")}</td><td>${formatDate(log.createdAt)}</td></tr>`).join("")}</tbody></table></div>`);
}

export function renderAdminPage({ state, currentUser, route }) {
  if (!currentUser || !hasPermission(currentUser, "canViewAdminPanel")) {
    return `<section class="glass-panel feature-panel"><div class="eyebrow">Restricted zone</div><h1 class="section-title">You do not have admin dashboard access</h1><p class="section-copy">This area only appears for accounts with admin capability.</p></section>`;
  }
  const tabs = getAdminTabs(currentUser);
  const activeTab = tabs.find((tab) => tab.id === route.query.tab)?.id || tabs[0]?.id || "overview";
  const content = { overview: overview(state), games: games(state), users: users(state, currentUser), vip: vip(state), broadcast: broadcast(state), settings: settings(state), audit: audit(state) };
  return `<section class="admin-layout"><aside class="admin-sidebar glass-panel"><div class="stack"><div><div class="eyebrow">Admin workspace</div><h1 class="section-title">God Mode</h1><p class="section-copy">${currentUser.username} · ${formatRoleLabel(currentUser.role)}</p></div>${tabs.map((tab) => `<button class="admin-tab ${activeTab === tab.id ? "is-active" : ""}" type="button" data-admin-tab="${tab.id}"><span><i class="fa-solid ${tab.icon}"></i> ${tab.label}</span><i class="fa-solid fa-chevron-right"></i></button>`).join("")}</div></aside><div class="admin-content">${content[activeTab] || overview(state)}</div></section>`;
}

export function mountAdminPage({ state, currentUser, navigate, showToast }) {
  if (!currentUser || !hasPermission(currentUser, "canViewAdminPanel")) return () => {};
  const toastError = (title, error) => showToast({ title, message: error.message, tone: "error" });
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => navigate("/admin", { tab: button.dataset.adminTab })));

  const gameForm = document.getElementById("game-form");
  gameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = new FormData(gameForm);
    try {
      const linksJson = String(f.get("linksJson") || "").trim();
      await upsertGame({ id: v(f.get("id")), title: v(f.get("title")), slug: v(f.get("slug")), author: v(f.get("author")), version: v(f.get("version")), progress: v(f.get("progress")), platform: v(f.get("platform")), transType: v(f.get("transType")), size: v(f.get("size")), genre: v(f.get("genre")), team: v(f.get("team")), coverUrl: v(f.get("coverUrl")), coverFile: f.get("coverFile"), desc: v(f.get("desc")), adminMsg: v(f.get("adminMsg")), is18: f.get("is18") === "on", isFreeLink: f.get("isFreeLink") === "on", tags: v(f.get("tags")).split(",").map((tag) => tag.trim()).filter(Boolean), links: linksJson ? JSON.parse(linksJson) : {} });
      gameForm.reset();
      showToast({ title: "Game saved", message: "Game metadata has been updated.", tone: "success" });
    } catch (error) {
      toastError("Could not save game", error);
    }
  });

  document.querySelectorAll("[data-load-game]").forEach((button) => button.addEventListener("click", () => {
    const game = state.games.find((item) => item.id === button.dataset.loadGame);
    if (!game || !gameForm) return;
    ["id", "title", "slug", "author", "version", "progress", "platform", "transType", "size", "genre", "team", "coverUrl", "desc", "adminMsg"].forEach((key) => {
      gameForm.elements[key].value = game[key] || "";
    });
    gameForm.elements.tags.value = (game.tags || []).join(", ");
    gameForm.elements.linksJson.value = JSON.stringify(game.links || {}, null, 2);
    gameForm.elements.is18.checked = Boolean(game.is18);
    gameForm.elements.isFreeLink.checked = Boolean(game.isFreeLink);
    showToast({ title: "Loaded game", message: `Editing ${game.title}.`, tone: "info" });
  }));

  const adjustCoinForm = document.getElementById("adjust-coin-form");
  adjustCoinForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = new FormData(adjustCoinForm);
    try {
      await adjustCoin({ target: v(f.get("target")), amount: Number(f.get("amount") || 0), reason: v(f.get("reason")) });
      adjustCoinForm.reset();
      showToast({ title: "Coin adjusted", message: "Wallet update was recorded.", tone: "success" });
    } catch (error) {
      toastError("Could not adjust coin", error);
    }
  });

  document.querySelectorAll("[data-user-status]").forEach((button) => button.addEventListener("click", async () => {
    const reason = window.prompt("Reason for this status change:", button.dataset.status === "banned" ? "Policy violation" : "Admin moderation");
    if (reason === null) return;
    try {
      await setUserStatus({ uid: button.dataset.userStatus, status: button.dataset.status, reason });
      showToast({ title: "Status updated", message: "User state has been changed.", tone: "success" });
    } catch (error) {
      toastError("Could not update status", error);
    }
  }));

  document.querySelectorAll("[data-role-select]").forEach((select) => select.addEventListener("change", async () => {
    try {
      await setUserRole({ uid: select.dataset.roleSelect, role: select.value });
      showToast({ title: "Role updated", message: "User permissions were refreshed.", tone: "success" });
    } catch (error) {
      toastError("Could not update role", error);
    }
  }));

  const vipConfigForm = document.getElementById("vip-config-form");
  vipConfigForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = new FormData(vipConfigForm);
    try {
      await saveVipConfig({ priceVip: Number(f.get("priceVip") || 0), priceVvip: Number(f.get("priceVvip") || 0), bankInfo: v(f.get("bankInfo")) });
      showToast({ title: "VIP config saved", message: "Pricing and bank info have been updated.", tone: "success" });
    } catch (error) {
      toastError("Could not save VIP config", error);
    }
  });

  document.querySelectorAll("[data-approve-request]").forEach((button) => button.addEventListener("click", async () => {
    const days = window.prompt("VIP duration in days:", "30");
    if (days === null) return;
    try {
      await reviewVipRequest({ requestId: button.dataset.approveRequest, days: Number(days) });
      showToast({ title: "VIP approved", message: "The request has been approved.", tone: "success" });
    } catch (error) {
      toastError("Could not approve VIP", error);
    }
  }));

  const announcementForm = document.getElementById("announcement-form");
  announcementForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = new FormData(announcementForm);
    try {
      await publishAnnouncement({ enabled: f.get("enabled") === "on", title: v(f.get("title")), msg: v(f.get("msg")), startsAt: v(f.get("startsAt")), endsAt: v(f.get("endsAt")) });
      showToast({ title: "Broadcast pushed", message: "Global announcement has been updated.", tone: "success" });
    } catch (error) {
      toastError("Could not push broadcast", error);
    }
  });

  const notificationForm = document.getElementById("notification-form");
  notificationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const f = new FormData(notificationForm);
    try {
      await sendNotification({ targetScope: v(f.get("targetScope"), "all"), targetValue: v(f.get("targetValue")), title: v(f.get("title")), msg: v(f.get("msg")) });
      notificationForm.reset();
      showToast({ title: "Notification sent", message: "Inbox message has been delivered.", tone: "success" });
    } catch (error) {
      toastError("Could not send notification", error);
    }
  });

  const firebaseConfigForm = document.getElementById("firebase-config-form");
  firebaseConfigForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const parsed = JSON.parse(v(new FormData(firebaseConfigForm).get("firebaseJson")).trim());
      saveFirebaseConfig(parsed);
      showToast({ title: "Firebase config saved", message: `Project ${parsed.projectId || "unknown"} saved to localStorage.`, tone: "success" });
    } catch (error) {
      toastError("Invalid JSON", error);
    }
  });

  document.getElementById("reload-firebase-config")?.addEventListener("click", () => window.location.reload());
  document.getElementById("clear-firebase-config")?.addEventListener("click", () => {
    clearFirebaseConfig();
    showToast({ title: "Firebase config cleared", message: "The app will use demo mode after reload.", tone: "info" });
  });
  return () => {};
}
