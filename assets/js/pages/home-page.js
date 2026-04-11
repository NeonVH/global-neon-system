import { renderGameCard } from "../components/game-card.js";
import { renderLeaderboard } from "../components/leaderboard.js";
import { getHomeGameSlices } from "../services/game-service.js";
import { playTaixiu, getMinigameHistory } from "../services/minigame-service.js";
import { getCoinLeaders, getTopServerUsers } from "../services/user-service.js";
import { formatCoin, formatCompact } from "../utils/formatters.js";

function renderAnnouncement(announcement) {
  if (!announcement?.enabled) {
    return "";
  }
  return `
    <section class="announcement-card glass-panel animate-rise">
      <div class="section-head">
        <div>
          <div class="eyebrow">Global announcement</div>
          <h2 class="section-title">${announcement.title}</h2>
        </div>
        <span class="chip chip-cyan">Realtime Banner</span>
      </div>
      <p class="section-copy">${announcement.msg}</p>
    </section>
  `;
}

export function renderHomePage({ state, currentUser }) {
  const stats = {
    games: state.games.length,
    members: state.users.length,
    views: state.games.reduce((sum, game) => sum + Number(game.views || 0), 0)
  };
  const { newest, hottest } = getHomeGameSlices(state);
  const serverLeaders = getTopServerUsers(state);
  const coinLeaders = getCoinLeaders(state);
  const history = getMinigameHistory(state);
  const minigameConfig = state.settings.global.minigameConfig;

  return `
    ${renderAnnouncement(state.settings.global.announcement)}
    <section class="premium-band glass-panel animate-rise">
      <div class="premium-marquee">
        <span><i class="fa-solid fa-sparkles"></i> premium interface pass active</span>
        <span><i class="fa-solid fa-shield-halved"></i> role-based admin controls</span>
        <span><i class="fa-solid fa-cloud-bolt"></i> firebase-ready runtime</span>
        <span><i class="fa-solid fa-gem"></i> vip gate with clear link tiers</span>
        <span><i class="fa-solid fa-chart-line"></i> audit-first operations flow</span>
        <span><i class="fa-solid fa-sparkles"></i> premium interface pass active</span>
        <span><i class="fa-solid fa-shield-halved"></i> role-based admin controls</span>
        <span><i class="fa-solid fa-cloud-bolt"></i> firebase-ready runtime</span>
      </div>
    </section>
    <section class="hero-grid">
      <article class="hero-card glass-panel animate-rise">
        <div class="hero-stack">
          <div class="hero-card__eyebrow">
            <i class="fa-solid fa-sparkles"></i>
            <span>Dark Glass Interface</span>
          </div>
          <div class="hero-crest">
            <span class="hero-crest__dot"></span>
            <span>Premium Build · Neon Operations</span>
          </div>
          <h1>NEONVH<br>Signal Beyond The Route.</h1>
          <p>Thư viện Visual Novel mang hơi thở cyberpunk, phân quyền VIP mềm mượt, notification realtime và dashboard admin tách lớp theo role, permission, audit log.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#/library">
              <i class="fa-solid fa-book-open"></i>
              <span>Khám Phá Thư Viện</span>
            </a>
            <a class="btn btn-secondary" href="#/vip">
              <i class="fa-solid fa-gem"></i>
              <span>Mở Khóa VIP</span>
            </a>
            ${currentUser ? `
              <a class="btn btn-secondary" href="#/profile">
                <i class="fa-solid fa-user-astronaut"></i>
                <span>Hồ Sơ Của Tôi</span>
              </a>
            ` : `
              <button class="btn btn-secondary" type="button" data-home-auth="true">
                <i class="fa-solid fa-right-to-bracket"></i>
                <span>Đăng Nhập</span>
              </button>
            `}
          </div>
          <div class="stats-strip">
            <div class="stat-card">
              <div class="stat-card__value">${stats.games}</div>
              <div class="stat-card__label">Game đang online</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${stats.members}</div>
              <div class="stat-card__label">Thành viên trong mạng lưới</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${formatCompact(stats.views)}</div>
              <div class="stat-card__label">Tổng lượt xem thư viện</div>
            </div>
          </div>
        </div>
      </article>
      <aside class="showcase-card glass-panel animate-rise">
        <div class="panel-ribbon">premium ops</div>
        <div class="section-head">
          <div>
            <div class="eyebrow">Operations pulse</div>
            <h2 class="section-title">Core Status</h2>
          </div>
          <span class="chip chip-violet">Secure by Rules</span>
        </div>
        <div class="showcase-grid">
          <div class="spotlight-panel animate-float">
            <strong>Admin quyền theo capability</strong>
            <p>UI chỉ là lớp hiển thị. Mọi thao tác coin, VIP, role, broadcast đều được thiết kế để chuyển qua rules và Cloud Functions.</p>
          </div>
          <div class="spotlight-panel">
            <strong>Signal Graph</strong>
            <div class="signal-chart">
              <div class="signal-bar" style="height:28%;"></div>
              <div class="signal-bar" style="height:48%;"></div>
              <div class="signal-bar" style="height:64%;"></div>
              <div class="signal-bar" style="height:38%;"></div>
              <div class="signal-bar" style="height:82%;"></div>
              <div class="signal-bar" style="height:58%;"></div>
              <div class="signal-bar" style="height:74%;"></div>
              <div class="signal-bar" style="height:92%;"></div>
            </div>
          </div>
          <div class="spotlight-panel">
            <div class="metric-row">
              <span>Game data health</span>
              <strong>92%</strong>
            </div>
            <div class="metric-progress"><span style="width:92%;"></span></div>
          </div>
          <div class="spotlight-panel">
            <div class="metric-row">
              <span>VIP request flow</span>
              <strong>${state.vipRequests.filter((item) => item.status === "pending").length} pending</strong>
            </div>
            <div class="metric-progress"><span style="width:68%;"></span></div>
          </div>
          <div class="spotlight-panel">
            <div class="metric-row">
              <span>Current user balance</span>
              <strong>${currentUser ? formatCoin(currentUser.coin) : "Chưa đăng nhập"}</strong>
            </div>
            <p>${currentUser ? `${currentUser.username} · ${currentUser.role}` : "Đăng nhập để mở hồ sơ và minigame."}</p>
          </div>
        </div>
      </aside>
    </section>

    <section class="content-grid-3">
      ${renderLeaderboard("Top Server", "Ưu tiên role cao và hoạt động gần đây.", serverLeaders, "staff")}
      ${renderLeaderboard("Các Con Bạc", "Top coin, loại trừ staff đặc quyền.", coinLeaders, "coin")}
      ${renderLeaderboard("Game Mới Update", "Những bản vừa được cập nhật gần đây.", newest, "game")}
    </section>

    <section class="stack">
      <div class="section-head">
        <div>
          <h2 class="section-title">Hot Library</h2>
          <p class="section-copy">Card 3D, badge VIP/FREE/18+ và luồng truy cập chia quyền theo từng gói user.</p>
        </div>
        <a class="btn btn-secondary" href="#/library">Xem toàn bộ</a>
      </div>
      <div class="grid-cards">
        ${hottest.map((game) => renderGameCard(game)).join("")}
      </div>
    </section>

    <section class="split-panel">
      <article class="feature-panel glass-panel">
        <div class="section-head">
          <div>
            <div class="eyebrow">Mini-game</div>
            <h2 class="section-title">Tài Xỉu Coin Ảo</h2>
          </div>
          <span class="chip chip-gold">Fair Roll</span>
        </div>
        <p class="section-copy">Kết quả dùng random phía client cho demo mode, min ${minigameConfig.minBet} Coin, max ${minigameConfig.maxBet} Coin, payout ${minigameConfig.payout}x.</p>
        <form id="minigame-form" class="stack" style="margin-top:1rem;">
          <div class="form-grid">
            <div class="field">
              <label for="choice">Cửa cược</label>
              <select id="choice" name="choice">
                <option value="tai">Tài (11-18)</option>
                <option value="xiu">Xỉu (3-10)</option>
              </select>
            </div>
            <div class="field">
              <label for="betAmount">Coin cược</label>
              <input id="betAmount" name="betAmount" type="number" min="${minigameConfig.minBet}" max="${minigameConfig.maxBet}" value="${minigameConfig.minBet}">
            </div>
          </div>
          <div class="inline-actions">
            <button class="btn btn-primary" type="submit">Roll Dice</button>
            ${currentUser ? `<span class="chip chip-cyan">${formatCoin(currentUser.coin)}</span>` : `<button class="btn btn-secondary" type="button" data-home-auth="true">Đăng nhập để chơi</button>`}
          </div>
        </form>
      </article>

      <article class="feature-panel glass-panel">
        <div class="section-head">
          <div>
            <div class="eyebrow">Recent rolls</div>
            <h2 class="section-title">10 Ván Gần Nhất</h2>
          </div>
        </div>
        <div class="notification-list">
          ${history.length ? history.map((entry) => `
            <div class="notification-item">
              <div>
                <strong>${entry.username}</strong>
                <div class="muted">${entry.choice.toUpperCase()} · Xúc xắc ${entry.dice.join(" - ")} · Tổng ${entry.total}</div>
              </div>
              <div class="${entry.delta >= 0 ? "accent-cyan" : "accent-gold"}">${entry.delta >= 0 ? "+" : ""}${entry.delta} Coin</div>
            </div>
          `).join("") : `<div class="notification-item"><span class="muted">Chưa có lượt chơi nào trong phiên này.</span></div>`}
        </div>
      </article>
    </section>

    <section class="content-grid-2">
      <article class="feature-panel glass-panel">
        <div class="section-head">
          <div>
            <div class="eyebrow">Editorial signals</div>
            <h2 class="section-title">Vì sao bản này premium hơn</h2>
          </div>
        </div>
        <div class="story-rail">
          <div class="story-rail__item">
            <strong>Visual language rõ hơn</strong>
            <div class="muted">Hero có lớp crest, marquee, signal chart và vật liệu glass sâu hơn, giúp trang chủ bớt cảm giác scaffold.</div>
          </div>
          <div class="story-rail__item">
            <strong>Admin không còn là khu phụ</strong>
            <div class="muted">Toàn bộ dashboard đi theo capability thực tế: games, users, VIP, broadcast, settings, audit.</div>
          </div>
          <div class="story-rail__item">
            <strong>Đường lên production thẳng hơn</strong>
            <div class="muted">Có sẵn khu dán Firebase public config, rules, functions và demo mode fallback để build liên tục.</div>
          </div>
        </div>
      </article>
      <article class="feature-panel glass-panel">
        <div class="section-head">
          <div>
            <div class="eyebrow">Collector lane</div>
            <h2 class="section-title">Premium perks snapshot</h2>
          </div>
        </div>
        <div class="story-rail">
          <div class="story-rail__item">
            <strong>Free</strong>
            <div class="muted">Terabox, thư viện cơ bản, minigame coin ảo.</div>
          </div>
          <div class="story-rail__item">
            <strong>VIP</strong>
            <div class="muted">Mở mirror tốc độ cao, ưu tiên route và bản update nóng.</div>
          </div>
          <div class="story-rail__item">
            <strong>VVIP</strong>
            <div class="muted">Toàn bộ mirror, badge cao cấp và luồng cập nhật sớm nhất.</div>
          </div>
        </div>
      </article>
    </section>
  `;
}

export function mountHomePage({ showToast, openAuthModal }) {
  const authButtons = document.querySelectorAll("[data-home-auth='true']");
  authButtons.forEach((button) => button.addEventListener("click", () => openAuthModal("login")));
  const form = document.getElementById("minigame-form");
  if (!form) {
    return () => {};
  }
  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      const result = await playTaixiu({
        choice: String(formData.get("choice") || ""),
        betAmount: Number(formData.get("betAmount") || 0)
      });
      showToast({
        title: result.play.delta >= 0 ? "Bạn vừa thắng" : "Ván này chưa thuận",
        message: `${result.play.dice.join(" - ")} | Tổng ${result.play.total} | ${result.play.delta >= 0 ? "+" : ""}${result.play.delta} Coin`,
        tone: result.play.delta >= 0 ? "success" : "error"
      });
    } catch (error) {
      showToast({
        title: "Không thể quay",
        message: error.message,
        tone: "error"
      });
    }
  };
  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
