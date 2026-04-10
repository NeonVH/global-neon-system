import { formatCoin, formatRelative, formatRoleLabel, formatVipLabel } from "../utils/formatters.js";
import { getInitials } from "../utils/security.js";

export function renderLeaderboard(title, subtitle, items, kind = "staff") {
  const rows = items.length
    ? items.map((item, index) => `
      <div class="leaderboard-item">
        <div style="display:flex;align-items:center;gap:0.85rem;">
          <div class="avatar-badge">${item.avatarUrl ? `<img src="${item.avatarUrl}" alt="${item.username || item.title}">` : getInitials(item.username || item.title)}</div>
          <div>
            <strong>${index + 1}. ${item.username || item.title}</strong>
            <div class="muted">
              ${kind === "game" ? `${item.genre} · ${formatRelative(item.updatedAt || item.createdAt)}` : `${formatRoleLabel(item.role)} · ${formatVipLabel(item.vipLevel)}`}
            </div>
          </div>
        </div>
        <div class="muted">
          ${kind === "coin" ? formatCoin(item.coin) : kind === "game" ? `${item.views} views` : formatRelative(item.lastLoginAt)}
        </div>
      </div>
    `).join("")
    : `<div class="leaderboard-item"><span>Chưa có dữ liệu.</span></div>`;

  return `
    <section class="leaderboard-card glass-panel">
      <div class="section-head">
        <div>
          <h3 class="section-title">${title}</h3>
          <p class="section-copy">${subtitle}</p>
        </div>
      </div>
      <div class="leaderboard-list">
        ${rows}
      </div>
    </section>
  `;
}
