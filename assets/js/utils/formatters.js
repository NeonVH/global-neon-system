import { ROLE_ORDER } from "../state.js";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short"
});

const compactNumber = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1
});

const relativeFormatter = new Intl.RelativeTimeFormat("vi-VN", {
  numeric: "auto"
});

export function formatDate(value) {
  if (!value) {
    return "Chưa có";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không hợp lệ";
  }
  return dateFormatter.format(date);
}

export function formatRelative(value) {
  if (!value) {
    return "Chưa có";
  }
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(hours, "hour");
  }
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return relativeFormatter.format(days, "day");
  }
  const months = Math.round(days / 30);
  return relativeFormatter.format(months, "month");
}

export function formatCoin(value = 0) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} Coin`;
}

export function formatCompact(value = 0) {
  return compactNumber.format(value);
}

export function formatRoleLabel(role = "member") {
  const labels = {
    member: "Member",
    support: "Support",
    editor: "Editor",
    moderator: "Moderator",
    finance: "Finance",
    admin: "Admin",
    superadmin: "Superadmin"
  };
  return labels[role] || role;
}

export function formatVipLabel(level = "none") {
  const labels = {
    none: "Free",
    vip: "VIP",
    vvip: "VVIP"
  };
  return labels[level] || "Free";
}

export function formatStatusLabel(status = "active") {
  const labels = {
    active: "Hoạt động",
    suspended: "Tạm khóa",
    banned: "Cấm"
  };
  return labels[status] || status;
}

export function truncate(text = "", maxLength = 132) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function formatPermissionLabel(permission = "") {
  return permission
    .replace(/^can/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

export function getRoleTone(role = "member") {
  if (role === "superadmin" || role === "admin") {
    return "gold";
  }
  if (role === "finance" || role === "moderator") {
    return "cyan";
  }
  if (role === "editor" || role === "support") {
    return "violet";
  }
  return "default";
}

export function getVipTone(level = "none") {
  if (level === "vvip") {
    return "gold";
  }
  if (level === "vip") {
    return "violet";
  }
  return "default";
}

export function formatRoleOrder(role = "member") {
  return ROLE_ORDER[role] ?? 0;
}
