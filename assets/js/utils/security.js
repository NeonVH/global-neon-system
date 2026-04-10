import { getRoleRank } from "../state.js";

export function sanitize(value = "") {
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(value);
  }
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeInject(target, markup) {
  target.innerHTML = sanitize(markup);
}

export function escapeHtml(value = "") {
  return sanitize(String(value));
}

export function hasPermission(user, permission) {
  if (!user) {
    return false;
  }
  if (user.role === "superadmin") {
    return true;
  }
  return Boolean(user.permissions?.[permission]);
}

export function hasRoleAtLeast(user, role) {
  if (!user) {
    return false;
  }
  return getRoleRank(user.role) >= getRoleRank(role);
}

export function canAccessPremiumLinks(user, game) {
  if (!game) {
    return false;
  }
  if (game.isFreeLink) {
    return true;
  }
  if (!user) {
    return false;
  }
  return ["vip", "vvip"].includes(user.vipLevel) || hasRoleAtLeast(user, "admin");
}

export function getInitials(value = "") {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "NV";
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc file."));
    reader.readAsDataURL(file);
  });
}

export function cryptoRandomInt(maxExclusive) {
  if (maxExclusive <= 0) {
    return 0;
  }
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % maxExclusive;
}
