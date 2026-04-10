const STORAGE_KEY = "neonvh.demo.state.v1";

export const PERMISSIONS = [
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

export const ROLE_ORDER = {
  member: 0,
  support: 1,
  editor: 2,
  moderator: 3,
  finance: 4,
  admin: 5,
  superadmin: 6
};

const ROLE_PERMISSION_MAP = {
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
  superadmin: Object.fromEntries(PERMISSIONS.map((permission) => [permission, true]))
};

export function createPermissionSet(role = "member", overrides = {}) {
  const base = Object.fromEntries(PERMISSIONS.map((permission) => [permission, false]));
  return {
    ...base,
    ...(ROLE_PERMISSION_MAP[role] || {}),
    ...overrides
  };
}

export function getRoleRank(role = "member") {
  return ROLE_ORDER[role] ?? 0;
}

function nowMinusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function nowPlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const seedState = {
  meta: {
    mode: "mock",
    version: 1
  },
  session: {
    uid: null
  },
  ui: {
    mobileDrawerOpen: false,
    authMode: "login",
    adminTab: "overview"
  },
  users: [
    {
      id: "u-admin",
      username: "NeonOverseer",
      email: "superadmin@neonvh.demo",
      avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80",
      role: "superadmin",
      permissions: createPermissionSet("superadmin"),
      vipLevel: "vvip",
      vipExpiry: nowPlusDays(365),
      coin: 520000,
      accountStatus: "active",
      bio: "Kiểm soát quyền hạn, tín hiệu và toàn bộ giao diện của hệ sinh thái.",
      createdAt: nowMinusDays(180),
      updatedAt: nowMinusDays(1),
      lastLoginAt: nowMinusDays(0)
    },
    {
      id: "u-finance",
      username: "CipherMint",
      email: "finance@neonvh.demo",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
      role: "finance",
      permissions: createPermissionSet("finance"),
      vipLevel: "vip",
      vipExpiry: nowPlusDays(60),
      coin: 235000,
      accountStatus: "active",
      bio: "Theo dõi coin, VIP requests và luồng giao dịch nội bộ.",
      createdAt: nowMinusDays(120),
      updatedAt: nowMinusDays(2),
      lastLoginAt: nowMinusDays(2)
    },
    {
      id: "u-editor",
      username: "GlassEditor",
      email: "editor@neonvh.demo",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
      role: "editor",
      permissions: createPermissionSet("editor"),
      vipLevel: "vip",
      vipExpiry: nowPlusDays(45),
      coin: 12450,
      accountStatus: "active",
      bio: "Biên tập metadata, mô tả và cập nhật thư viện game.",
      createdAt: nowMinusDays(90),
      updatedAt: nowMinusDays(1),
      lastLoginAt: nowMinusDays(1)
    },
    {
      id: "u-vvip",
      username: "LunaArchive",
      email: "luna@neonvh.demo",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
      role: "member",
      permissions: createPermissionSet("member"),
      vipLevel: "vvip",
      vipExpiry: nowPlusDays(32),
      coin: 92500,
      accountStatus: "active",
      bio: "Collector của các bản dịch hiếm và route ẩn.",
      createdAt: nowMinusDays(60),
      updatedAt: nowMinusDays(1),
      lastLoginAt: nowMinusDays(1)
    },
    {
      id: "u-member",
      username: "SkyReader",
      email: "member@neonvh.demo",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
      role: "member",
      permissions: createPermissionSet("member"),
      vipLevel: "none",
      vipExpiry: null,
      coin: 780,
      accountStatus: "active",
      bio: "Mới vào hệ sinh thái, ưu tiên game miễn phí và route ngắn.",
      createdAt: nowMinusDays(9),
      updatedAt: nowMinusDays(1),
      lastLoginAt: nowMinusDays(4)
    }
  ],
  games: [
    {
      id: "game-01",
      slug: "abyss-contract",
      title: "Abyss Contract",
      author: "Neon Archive Team",
      version: "1.4.2",
      progress: "Hoàn thành",
      platform: "Windows, Android",
      transType: "Patch Việt Hóa",
      size: "4.2 GB",
      genre: "Mystery, Romance",
      tags: ["Mature", "Psychological", "VIP"],
      team: "NOVA / VN Cell",
      coverUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      screenshotUrls: [
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
      ],
      desc: "Một visual novel đậm không khí neon-noir, nơi mọi route đều có hệ quả kéo dài sang các chương sau.",
      adminMsg: "Bản patch mới đã vá crash trên Android 13 và cập nhật gallery bonus.",
      is18: true,
      isFreeLink: false,
      views: 2891,
      links: {
        android: {
          terabox: "https://example.com/terabox-abyss-android",
          drive: "https://example.com/drive-abyss-android",
          mediafire: "https://example.com/mediafire-abyss-android"
        },
        pc: {
          terabox: "https://example.com/terabox-abyss-pc",
          drive: "https://example.com/drive-abyss-pc",
          mega: "https://example.com/mega-abyss-pc"
        }
      },
      createdAt: nowMinusDays(2),
      updatedAt: nowMinusDays(1),
      publishedAt: nowMinusDays(2),
      createdBy: "u-editor",
      updatedBy: "u-admin"
    },
    {
      id: "game-02",
      slug: "skyline-requiem",
      title: "Skyline Requiem",
      author: "Glass Pulse",
      version: "0.9.8",
      progress: "Route 2/4",
      platform: "Windows",
      transType: "Bản Dịch Nội Bộ",
      size: "2.8 GB",
      genre: "Sci-Fi, Drama",
      tags: ["Free", "Drama"],
      team: "Project Helix",
      coverUrl: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=1200&q=80",
      screenshotUrls: [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=800&q=80"
      ],
      desc: "Hệ thống route nhiều nhánh với nhịp kể chậm, nhấn mạnh vào lựa chọn và tổn thương của nhân vật.",
      adminMsg: "",
      is18: false,
      isFreeLink: true,
      views: 1542,
      links: {
        pc: {
          terabox: "https://example.com/terabox-skyline-pc",
          drive: "https://example.com/drive-skyline-pc",
          pixeldrain: "https://example.com/pixeldrain-skyline-pc"
        }
      },
      createdAt: nowMinusDays(7),
      updatedAt: nowMinusDays(4),
      publishedAt: nowMinusDays(7),
      createdBy: "u-editor",
      updatedBy: "u-editor"
    },
    {
      id: "game-03",
      slug: "ember-protocol",
      title: "Ember Protocol",
      author: "Circuit Ink",
      version: "2.0.0",
      progress: "Hoàn thành",
      platform: "Android",
      transType: "Patch Việt Hóa",
      size: "1.9 GB",
      genre: "Action, Mystery",
      tags: ["Action", "VIP"],
      team: "Flux Factory",
      coverUrl: "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80",
      screenshotUrls: [
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80"
      ],
      desc: "Nhịp hành động dồn dập, xen giữa là những phân đoạn đối thoại nặng quyết định và nhánh bí mật.",
      adminMsg: "Link Drive đang được mirror lại trong đêm nay.",
      is18: false,
      isFreeLink: false,
      views: 3320,
      links: {
        android: {
          terabox: "https://example.com/terabox-ember-android",
          drive: "https://example.com/drive-ember-android",
          mediafire: "https://example.com/mediafire-ember-android",
          mega: "https://example.com/mega-ember-android"
        }
      },
      createdAt: nowMinusDays(12),
      updatedAt: nowMinusDays(3),
      publishedAt: nowMinusDays(12),
      createdBy: "u-admin",
      updatedBy: "u-admin"
    },
    {
      id: "game-04",
      slug: "velvet-signal",
      title: "Velvet Signal",
      author: "Noctis Memo",
      version: "0.6.4",
      progress: "Route 1/3",
      platform: "Windows, Android",
      transType: "Alpha Access",
      size: "3.1 GB",
      genre: "Romance, Thriller",
      tags: ["New", "Mature"],
      team: "Rose Sector",
      coverUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80",
      screenshotUrls: [
        "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1516321310764-8d4e7e7f5fd0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
      ],
      desc: "Bản truy cập sớm với phong vị romance thriller và hệ màu cực kỳ điện ảnh.",
      adminMsg: "Alpha build có thể còn thiếu một số voice line ở Chapter 2.",
      is18: true,
      isFreeLink: false,
      views: 905,
      links: {
        android: {
          terabox: "https://example.com/terabox-velvet-android",
          drive: "https://example.com/drive-velvet-android"
        },
        pc: {
          terabox: "https://example.com/terabox-velvet-pc",
          drive: "https://example.com/drive-velvet-pc"
        }
      },
      createdAt: nowMinusDays(1),
      updatedAt: nowMinusDays(1),
      publishedAt: nowMinusDays(1),
      createdBy: "u-editor",
      updatedBy: "u-editor"
    }
  ],
  settings: {
    global: {
      announcement: {
        enabled: true,
        title: "Neon Broadcast",
        msg: "Bản giao diện cyberpunk mới đã online. Staff dashboard hiện chạy theo role và permission thay vì một cờ admin duy nhất.",
        startsAt: nowMinusDays(1),
        endsAt: nowPlusDays(7)
      },
      vipConfig: {
        priceVip: 199000,
        priceVvip: 399000,
        bankInfo: "ACB - 0909999999 - NEONVH NETWORK"
      },
      minigameConfig: {
        minBet: 10,
        maxBet: 5000,
        payout: 1.95,
        cooldownMs: 2500
      },
      uiConfig: {
        accent: "violet"
      }
    }
  },
  vipRequests: [
    {
      id: "vip-01",
      uid: "u-member",
      username: "SkyReader",
      requestedTier: "vip",
      note: "Muốn mở toàn bộ link tốc độ cao cho thư viện Android.",
      proofImageUrl: "",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: nowMinusDays(1)
    }
  ],
  notifications: [
    {
      id: "noti-01",
      toUid: "u-vvip",
      title: "Tin nhắn từ admin",
      msg: "Abyss Contract đã được cập nhật bản vá Android mới.",
      type: "announcement",
      read: false,
      createdAt: nowMinusDays(0.2),
      createdBy: "u-admin"
    },
    {
      id: "noti-02",
      toUid: "u-member",
      title: "Gợi ý nâng cấp VIP",
      msg: "Bạn có thể gửi yêu cầu VIP trực tiếp từ khu VIP mới.",
      type: "vip",
      read: true,
      createdAt: nowMinusDays(2),
      createdBy: "u-finance"
    }
  ],
  auditLogs: [
    {
      id: "audit-01",
      actorUid: "u-admin",
      actorRole: "superadmin",
      action: "publishAnnouncement",
      targetType: "settings",
      targetId: "global",
      reason: "Khởi chạy giao diện mới",
      ipHash: "demo-local",
      userAgent: "mock-client",
      createdAt: nowMinusDays(1)
    },
    {
      id: "audit-02",
      actorUid: "u-finance",
      actorRole: "finance",
      action: "reviewVipRequest",
      targetType: "vip_request",
      targetId: "vip-01",
      reason: "Đang chờ đối soát",
      ipHash: "demo-local",
      userAgent: "mock-client",
      createdAt: nowMinusDays(0.5)
    }
  ],
  minigame: {
    history: [],
    cooldowns: {}
  }
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedState));
}

function loadState() {
  const fallback = cloneSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      meta: {
        ...fallback.meta,
        ...(parsed.meta || {})
      },
      session: {
        ...fallback.session,
        ...(parsed.session || {})
      },
      ui: {
        ...fallback.ui,
        ...(parsed.ui || {})
      },
      settings: {
        ...fallback.settings,
        ...(parsed.settings || {}),
        global: {
          ...fallback.settings.global,
          ...((parsed.settings || {}).global || {})
        }
      }
    };
  } catch {
    return fallback;
  }
}

let state = loadState();
const subscribers = new Set();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
  persist();
  subscribers.forEach((subscriber) => subscriber(state));
}

export const store = {
  getState() {
    return state;
  },
  setState(nextState) {
    state = nextState;
    notify();
  },
  update(updater) {
    state = updater(state);
    notify();
  },
  subscribe(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  },
  reset() {
    state = cloneSeed();
    notify();
  }
};

export function getCurrentUser(source = state) {
  if (!source.session.uid) {
    return null;
  }
  return source.users.find((user) => user.id === source.session.uid) || null;
}

export function getUserById(uid, source = state) {
  return source.users.find((user) => user.id === uid) || null;
}

export function setSessionUid(uid) {
  store.update((current) => ({
    ...current,
    session: {
      ...current.session,
      uid
    }
  }));
}

export function setUiState(patch) {
  store.update((current) => ({
    ...current,
    ui: {
      ...current.ui,
      ...patch
    }
  }));
}

export function upsertRecord(collection, record) {
  store.update((current) => {
    const existing = current[collection] || [];
    const index = existing.findIndex((item) => item.id === record.id);
    const nextItems = [...existing];
    if (index >= 0) {
      nextItems[index] = {
        ...nextItems[index],
        ...record
      };
    } else {
      nextItems.unshift(record);
    }
    return {
      ...current,
      [collection]: nextItems
    };
  });
}

export function patchRecord(collection, id, patch) {
  store.update((current) => ({
    ...current,
    [collection]: (current[collection] || []).map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        ...patch
      };
    })
  }));
}

export function removeRecord(collection, id) {
  store.update((current) => ({
    ...current,
    [collection]: (current[collection] || []).filter((item) => item.id !== id)
  }));
}

export function addAuditLog(entry) {
  upsertRecord("auditLogs", {
    id: entry.id || `audit-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...entry
  });
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function getSeedSnapshot() {
  return cloneSeed();
}
