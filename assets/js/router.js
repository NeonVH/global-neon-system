export function parseRoute(hash = window.location.hash) {
  const clean = hash.replace(/^#/, "") || "/";
  const [rawPath, rawQuery = ""] = clean.split("?");
  const path = rawPath || "/";
  const query = Object.fromEntries(new URLSearchParams(rawQuery).entries());
  return {
    path,
    query
  };
}

export function resolveRoute(parsed = parseRoute()) {
  const path = parsed.path.replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);
  if (path === "/") {
    return {
      name: "home",
      params: {},
      query: parsed.query,
      path
    };
  }
  if (path === "/library") {
    return {
      name: "library",
      params: {},
      query: parsed.query,
      path
    };
  }
  if (segments[0] === "game" && segments[1]) {
    return {
      name: "gameDetail",
      params: {
        slug: segments[1]
      },
      query: parsed.query,
      path
    };
  }
  if (path === "/profile") {
    return {
      name: "profile",
      params: {},
      query: parsed.query,
      path
    };
  }
  if (path === "/vip") {
    return {
      name: "vip",
      params: {},
      query: parsed.query,
      path
    };
  }
  if (path === "/notifications") {
    return {
      name: "notifications",
      params: {},
      query: parsed.query,
      path
    };
  }
  if (path === "/admin") {
    return {
      name: "admin",
      params: {},
      query: parsed.query,
      path
    };
  }
  return {
    name: "home",
    params: {},
    query: parsed.query,
    path: "/"
  };
}

export function buildHash(path, query = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return `#${path}${params ? `?${params}` : ""}`;
}

export function navigate(path, query = {}) {
  const nextHash = buildHash(path, query);
  if (window.location.hash === nextHash) {
    window.dispatchEvent(new Event("hashchange"));
    return;
  }
  window.location.hash = nextHash;
}
