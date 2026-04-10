import { initFirebase } from "./firebase-config.js";
import { parseRoute, resolveRoute, navigate } from "./router.js";
import { store, getCurrentUser, setUiState } from "./state.js";
import { safeInject } from "./utils/security.js";
import { renderHeader } from "./components/header.js";
import { renderMobileDrawer } from "./components/mobile-drawer.js";
import { initToastRoot, showToast } from "./components/toast.js";
import { initModal, openModal, closeModal } from "./components/modal.js";
import { initAuth, loginWithEmail, registerWithEmail, logout, getAuthModeLabel, getDemoCredentials } from "./services/auth-service.js";
import { startNotificationStream } from "./services/notification-service.js";
import { startGamesStream } from "./services/game-service.js";
import { startUserStream } from "./services/user-service.js";
import { startAdminStreams } from "./services/admin-service.js";
import { startVipRequestStream } from "./services/vip-service.js";
import { renderHomePage, mountHomePage } from "./pages/home-page.js";
import { renderLibraryPage, mountLibraryPage } from "./pages/library-page.js";
import { renderGameDetailPage, mountGameDetailPage } from "./pages/game-detail-page.js";
import { renderProfilePage, mountProfilePage } from "./pages/profile-page.js";
import { renderVipPage, mountVipPage } from "./pages/vip-page.js";
import { renderNotificationsPage, mountNotificationsPage } from "./pages/notifications-page.js";
import { renderAdminPage, mountAdminPage } from "./pages/admin-page.js";

const app = document.getElementById("app");
let pageCleanup = null;
let scheduled = false;

const pages = {
  home: {
    render: renderHomePage,
    mount: mountHomePage
  },
  library: {
    render: renderLibraryPage,
    mount: mountLibraryPage
  },
  gameDetail: {
    render: renderGameDetailPage,
    mount: mountGameDetailPage
  },
  profile: {
    render: renderProfilePage,
    mount: mountProfilePage
  },
  vip: {
    render: renderVipPage,
    mount: mountVipPage
  },
  notifications: {
    render: renderNotificationsPage,
    mount: mountNotificationsPage
  },
  admin: {
    render: renderAdminPage,
    mount: mountAdminPage
  }
};

function renderApp() {
  scheduled = false;
  const state = store.getState();
  const currentUser = getCurrentUser(state);
  const route = resolveRoute(parseRoute());
  const unreadCount = currentUser ? state.notifications.filter((item) => item.toUid === currentUser.id && !item.read).length : 0;
  const page = pages[route.name] || pages.home;
  const content = page.render({
    state,
    currentUser,
    route,
    navigate
  });

  safeInject(app, `
    <div class="page-shell">
      <div class="page-frame">
        ${renderHeader({ currentPath: route.path, currentUser, unreadCount })}
        ${renderMobileDrawer({ open: state.ui.mobileDrawerOpen, currentUser })}
        <main id="page-content" class="page-grid">${content}</main>
        <footer class="footer-shell glass-panel">
          <div>Frontend static for GitHub Pages. Quyền hạn thực thi phải đi qua Firebase Rules và Cloud Functions.</div>
          <div>Copyright © 2026 by NEONVH.</div>
        </footer>
      </div>
    </div>
  `);

  bindShellActions();
  if (pageCleanup) {
    pageCleanup();
  }
  pageCleanup = page.mount({
    state,
    currentUser,
    route,
    navigate,
    showToast,
    openAuthModal
  });
}

function scheduleRender() {
  if (scheduled) {
    return;
  }
  scheduled = true;
  window.requestAnimationFrame(renderApp);
}

function bindShellActions() {
  document.querySelectorAll("[data-action='toggle-drawer']").forEach((button) => {
    button.addEventListener("click", () => setUiState({ mobileDrawerOpen: true }));
  });
  document.querySelectorAll("[data-action='close-drawer']").forEach((node) => {
    node.addEventListener("click", () => setUiState({ mobileDrawerOpen: false }));
  });
  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", async () => {
      await logout();
      showToast({
        title: "Đã đăng xuất",
        message: "Phiên của bạn đã được đóng.",
        tone: "info"
      });
      navigate("/");
    });
  });
  document.querySelectorAll("[data-action='open-auth']").forEach((button) => {
    button.addEventListener("click", openAuthModal);
  });
}

function authFormMarkup(mode = store.getState().ui.authMode || "login") {
  const demoCredentials = getDemoCredentials();
  const isLogin = mode === "login";
  return `
    <div class="stack">
      <div class="inline-actions">
        <button class="btn ${isLogin ? "btn-primary" : "btn-secondary"}" type="button" data-auth-switch="login">${getAuthModeLabel("login")}</button>
        <button class="btn ${!isLogin ? "btn-primary" : "btn-secondary"}" type="button" data-auth-switch="register">${getAuthModeLabel("register")}</button>
      </div>
      <form id="auth-form" class="stack">
        <div class="form-grid">
          <div class="field ${isLogin ? "hidden" : ""}">
            <label for="auth-username">Username</label>
            <input id="auth-username" name="username" placeholder="SkyReader">
          </div>
          <div class="field">
            <label for="auth-email">Email</label>
            <input id="auth-email" type="email" name="email" placeholder="you@example.com" required>
          </div>
          <div class="field">
            <label for="auth-password">Mật khẩu</label>
            <input id="auth-password" type="password" name="password" placeholder="Ít nhất 8 ký tự" required>
          </div>
        </div>
        <div class="inline-actions">
          <button class="btn btn-primary" type="submit">${isLogin ? "Vào hệ thống" : "Tạo tài khoản"}</button>
          <button class="btn btn-ghost" type="button" data-modal-close="true">Đóng</button>
        </div>
      </form>
      <div class="announcement-card glass-panel">
        <div class="eyebrow">Demo mode</div>
        <strong>Credential xem nhanh quyền admin</strong>
        <div class="muted" style="margin-top:0.5rem;">Superadmin: ${demoCredentials.superadmin.email} / ${demoCredentials.superadmin.password}</div>
        <div class="muted">Finance: ${demoCredentials.finance.email} / ${demoCredentials.finance.password}</div>
        <div class="muted">Editor: ${demoCredentials.editor.email} / ${demoCredentials.editor.password}</div>
      </div>
    </div>
  `;
}

function bindAuthModal(mode) {
  document.querySelectorAll("[data-auth-switch]").forEach((button) => {
    button.addEventListener("click", () => openAuthModal(button.dataset.authSwitch));
  });
  const form = document.getElementById("auth-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      if (mode === "login") {
        await loginWithEmail({
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || "")
        });
        closeModal();
        showToast({
          title: "Đăng nhập thành công",
          message: "Phiên của bạn đã được kích hoạt.",
          tone: "success"
        });
      } else {
        await registerWithEmail({
          username: String(formData.get("username") || ""),
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || "")
        });
        closeModal();
        showToast({
          title: "Tạo tài khoản thành công",
          message: "Bạn đã nhận 500 Coin khởi đầu.",
          tone: "success"
        });
      }
    } catch (error) {
      showToast({
        title: "Không thể xử lý",
        message: error.message,
        tone: "error"
      });
    }
  });
}

function openAuthModal(mode = store.getState().ui.authMode || "login") {
  setUiState({ authMode: mode, mobileDrawerOpen: false });
  openModal({
    title: mode === "login" ? "Đăng nhập hệ sinh thái" : "Tạo tài khoản NeonVH",
    content: authFormMarkup(mode)
  });
  bindAuthModal(mode);
}

function initBackgroundFx() {
  const canvas = document.getElementById("fx-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const points = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2.4 + 0.4,
    s: Math.random() * 0.0008 + 0.0005
  }));
  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }
  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach((point, index) => {
      point.y -= point.s;
      if (point.y < -0.05) {
        point.y = 1.05;
        point.x = Math.random();
      }
      const gradient = context.createRadialGradient(point.x * window.innerWidth, point.y * window.innerHeight, 0, point.x * window.innerWidth, point.y * window.innerHeight, point.r * 10);
      gradient.addColorStop(0, index % 2 === 0 ? "rgba(188,19,254,0.55)" : "rgba(0,240,255,0.55)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x * window.innerWidth, point.y * window.innerHeight, point.r * 5, 0, Math.PI * 2);
      context.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener("resize", resize);
  draw();
}

async function bootstrap() {
  initFirebase();
  initToastRoot();
  initModal();
  initBackgroundFx();
  await initAuth();
  startUserStream();
  startGamesStream();
  startVipRequestStream();
  startAdminStreams();
  startNotificationStream(showToast);
  renderApp();
  store.subscribe(scheduleRender);
  window.addEventListener("hashchange", renderApp);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setUiState({ mobileDrawerOpen: false });
      closeModal();
    }
  });
}

bootstrap().catch((error) => {
  app.innerHTML = `
    <div class="page-shell">
      <div class="glass-panel" style="padding:2rem;">
        <h1 class="section-title">Khởi tạo thất bại</h1>
        <p>${error.message}</p>
      </div>
    </div>
  `;
});
