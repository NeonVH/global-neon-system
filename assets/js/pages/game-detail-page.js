import { getGameBySlug, incrementGameView } from "../services/game-service.js";
import { canAccessPremiumLinks } from "../utils/security.js";
import { formatDate, formatVipLabel } from "../utils/formatters.js";

function renderLinkGroup(title, entries, isUnlocked) {
  const tiles = Object.entries(entries || {}).map(([name, url]) => {
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    return isUnlocked || name === "terabox"
      ? `
        <a class="link-tile" href="${url}" target="_blank" rel="noreferrer">
          <div class="link-tile__meta">
            <strong>${label}</strong>
            <span class="muted">High-speed mirror</span>
          </div>
          <i class="fa-solid fa-download"></i>
        </a>
      `
      : `
        <button class="link-tile is-locked" type="button" data-locked-link="true">
          <div class="link-tile__meta">
            <strong>${label} (Khóa VIP)</strong>
            <span class="muted">Nâng cấp VIP để mở khóa.</span>
          </div>
          <i class="fa-solid fa-lock"></i>
        </button>
      `;
  }).join("");
  return `
    <div class="detail-card glass-panel">
      <div class="section-head">
        <div>
          <div class="eyebrow">${title}</div>
          <h3 class="section-title" style="font-size:1rem;">Link tải</h3>
        </div>
      </div>
      <div class="links-grid">${tiles || `<div class="muted">Chưa có link.</div>`}</div>
    </div>
  `;
}

export function renderGameDetailPage({ state, currentUser, route }) {
  const game = getGameBySlug(route.params.slug, state);
  if (!game) {
    return `
      <section class="glass-panel feature-panel">
        <h1 class="section-title">Không tìm thấy game</h1>
        <p class="section-copy">Slug không tồn tại trong thư viện hiện tại.</p>
        <a class="btn btn-secondary" href="#/library">Quay lại thư viện</a>
      </section>
    `;
  }
  const premiumUnlocked = canAccessPremiumLinks(currentUser, game);
  return `
    <section class="details-hero">
      <div class="detail-cover glass-panel animate-rise">
        <img src="${game.coverUrl}" alt="${game.title}">
      </div>
      <article class="detail-card glass-panel animate-rise">
        <div class="inline-actions" style="justify-content:space-between;">
          <span class="chip ${game.is18 ? "chip-gold" : "chip-cyan"}">${game.is18 ? "18+" : "General"}</span>
          <span class="chip ${premiumUnlocked ? "chip-cyan" : "chip-violet"}">${premiumUnlocked ? "Full Access" : "Terabox Only"}</span>
        </div>
        <div style="margin-top:1rem;">
          <div class="eyebrow">${game.genre} · ${game.platform}</div>
          <h1 class="section-title" style="font-size:2rem;margin-top:0.45rem;">${game.title}</h1>
          <p class="section-copy">${game.desc}</p>
        </div>
        <div class="stack" style="margin-top:1.1rem;">
          <div class="info-row"><span>Version</span><strong>${game.version}</strong></div>
          <div class="info-row"><span>Progress</span><strong>${game.progress}</strong></div>
          <div class="info-row"><span>Team</span><strong>${game.team}</strong></div>
          <div class="info-row"><span>Kích thước</span><strong>${game.size}</strong></div>
          <div class="info-row"><span>Link tier của bạn</span><strong>${currentUser ? formatVipLabel(currentUser.vipLevel) : "Guest"}</strong></div>
          <div class="info-row"><span>Ngày cập nhật</span><strong>${formatDate(game.updatedAt)}</strong></div>
        </div>
        ${game.adminMsg ? `
          <div class="announcement-card glass-panel" style="margin-top:1rem;">
            <div class="eyebrow">Admin note</div>
            <strong>${game.adminMsg}</strong>
          </div>
        ` : ""}
      </article>
    </section>

    <section class="details-grid">
      <article class="detail-card glass-panel">
        <div class="section-head">
          <div>
            <div class="eyebrow">Gallery</div>
            <h2 class="section-title">Screenshots</h2>
          </div>
        </div>
        <div class="gallery-grid">
          ${game.screenshotUrls.map((url) => `<img src="${url}" alt="${game.title} screenshot">`).join("")}
        </div>
      </article>
      <div class="stack">
        ${renderLinkGroup("Android", game.links.android, premiumUnlocked)}
        ${renderLinkGroup("PC", game.links.pc, premiumUnlocked)}
      </div>
    </section>
  `;
}

export function mountGameDetailPage({ state, route, showToast, openAuthModal }) {
  const game = getGameBySlug(route.params.slug, state);
  if (!game) {
    return () => {};
  }
  const viewedKey = `neonvh-viewed-${game.id}`;
  if (!sessionStorage.getItem(viewedKey)) {
    sessionStorage.setItem(viewedKey, "1");
    incrementGameView(game.id).catch(() => {});
  }
  document.querySelectorAll("[data-locked-link='true']").forEach((button) => {
    button.addEventListener("click", () => {
      showToast({
        title: "Link đang khóa",
        message: "Terabox vẫn mở, còn link tốc độ cao dành cho VIP/VVIP hoặc admin.",
        tone: "info"
      });
    });
  });
  if (!document.querySelector("[data-locked-link='true']")) {
    return () => {};
  }
  const maybePrompt = window.setTimeout(() => {
    if (!state.session.uid) {
      openAuthModal("login");
    }
  }, 0);
  return () => window.clearTimeout(maybePrompt);
}
