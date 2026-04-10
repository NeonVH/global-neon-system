import { renderGameCard } from "../components/game-card.js";
import { filterGames } from "../services/game-service.js";

export function renderLibraryPage({ state, route }) {
  const filters = {
    query: route.query.q || "",
    genre: route.query.genre || "all",
    platform: route.query.platform || "all",
    access: route.query.access || "all",
    mature: route.query.mature || "all",
    sort: route.query.sort || "newest"
  };
  const genres = [...new Set(state.games.map((game) => game.genre))];
  const games = filterGames(filters, state);
  return `
    <section class="feature-panel glass-panel animate-rise">
      <div class="section-head">
        <div>
          <div class="eyebrow">Library explorer</div>
          <h1 class="section-title">Kho Game NeonVH</h1>
          <p class="section-copy">Tìm kiếm realtime, lọc theo tag và sắp xếp theo cách bạn muốn.</p>
        </div>
        <span class="chip chip-cyan">${games.length} kết quả</span>
      </div>
      <form id="library-filters" class="filters-bar">
        <div class="field">
          <label for="lib-q">Tìm kiếm</label>
          <input id="lib-q" name="q" value="${filters.query}" placeholder="Tên game, tác giả, tag...">
        </div>
        <div class="field">
          <label for="lib-genre">Thể loại</label>
          <select id="lib-genre" name="genre">
            <option value="all">Tất cả</option>
            ${genres.map((genre) => `<option value="${genre}" ${filters.genre === genre ? "selected" : ""}>${genre}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="lib-platform">Nền tảng</label>
          <select id="lib-platform" name="platform">
            <option value="all" ${filters.platform === "all" ? "selected" : ""}>Tất cả</option>
            <option value="Windows" ${filters.platform === "Windows" ? "selected" : ""}>Windows</option>
            <option value="Android" ${filters.platform === "Android" ? "selected" : ""}>Android</option>
          </select>
        </div>
        <div class="field">
          <label for="lib-access">Phân quyền</label>
          <select id="lib-access" name="access">
            <option value="all">Tất cả</option>
            <option value="free" ${filters.access === "free" ? "selected" : ""}>Free Link</option>
            <option value="vip" ${filters.access === "vip" ? "selected" : ""}>VIP Gate</option>
          </select>
        </div>
        <div class="field">
          <label for="lib-mature">18+</label>
          <select id="lib-mature" name="mature">
            <option value="all">Hiện tất cả</option>
            <option value="hide" ${filters.mature === "hide" ? "selected" : ""}>Ẩn 18+</option>
          </select>
        </div>
        <div class="field">
          <label for="lib-sort">Sắp xếp</label>
          <select id="lib-sort" name="sort">
            <option value="newest" ${filters.sort === "newest" ? "selected" : ""}>Mới nhất</option>
            <option value="views" ${filters.sort === "views" ? "selected" : ""}>Nhiều view</option>
            <option value="name" ${filters.sort === "name" ? "selected" : ""}>Tên A-Z</option>
          </select>
        </div>
      </form>
    </section>

    <section class="grid-cards">
      ${games.length ? games.map((game) => renderGameCard(game)).join("") : `
        <article class="glass-panel feature-panel">
          <h2 class="section-title">Không tìm thấy game phù hợp</h2>
          <p class="section-copy">Hãy đổi bộ lọc hoặc nhập từ khóa khác để mở rộng thư viện.</p>
        </article>
      `}
    </section>
  `;
}

export function mountLibraryPage({ navigate }) {
  const form = document.getElementById("library-filters");
  if (!form) {
    return () => {};
  }
  const syncRoute = () => {
    const formData = new FormData(form);
    navigate("/library", {
      q: formData.get("q"),
      genre: formData.get("genre"),
      platform: formData.get("platform"),
      access: formData.get("access"),
      mature: formData.get("mature"),
      sort: formData.get("sort")
    });
  };
  form.addEventListener("change", syncRoute);
  form.addEventListener("input", () => {
    window.clearTimeout(form._filterTimer);
    form._filterTimer = window.setTimeout(syncRoute, 220);
  });
  return () => {
    form.removeEventListener("change", syncRoute);
  };
}
