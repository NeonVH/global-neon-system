import { formatCompact, truncate } from "../utils/formatters.js";

function badge(label, tone = "violet") {
  return `<span class="chip chip-${tone}">${label}</span>`;
}

export function renderGameCard(game) {
  return `
    <article class="game-card glass-panel animate-rise">
      <div class="game-card__media">
        <img src="${game.coverUrl}" alt="${game.title}">
        <div class="game-card__badges">
          ${game.is18 ? badge("18+", "gold") : ""}
          ${game.isFreeLink ? badge("Free Link", "cyan") : badge("VIP Gate", "violet")}
        </div>
      </div>
      <div class="eyebrow">${game.genre} · ${game.platform}</div>
      <h3 class="game-card__title">${game.title}</h3>
      <div class="game-card__meta">
        <span><i class="fa-solid fa-code-branch"></i> ${game.version}</span>
        <span><i class="fa-solid fa-eye"></i> ${formatCompact(game.views)}</span>
        <span><i class="fa-solid fa-hard-drive"></i> ${game.size}</span>
      </div>
      <p class="game-card__desc">${truncate(game.desc, 118)}</p>
      <div class="game-card__footer">
        <div class="muted">${game.progress}</div>
        <a class="btn btn-secondary" href="#/game/${game.slug}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>Xem Chi Tiết</span>
        </a>
      </div>
    </article>
  `;
}
