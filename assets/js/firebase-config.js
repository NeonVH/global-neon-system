const LOCAL_CONFIG_KEY = "neonvh.firebase.config";

let services = {
  ready: false,
  app: null,
  auth: null,
  db: null,
  storage: null,
  functions: null
};

function readConfig() {
  if (window.__NEONVH_FIREBASE_CONFIG__) {
    return window.__NEONVH_FIREBASE_CONFIG__;
  }
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredFirebaseConfig() {
  return readConfig();
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(LOCAL_CONFIG_KEY);
}

export function initFirebase() {
  const config = readConfig();
  if (!config?.apiKey || !window.firebase) {
    return services;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  const app = firebase.app();
  services = {
    ready: true,
    app,
    auth: firebase.auth(),
    db: firebase.firestore(),
    storage: firebase.storage(),
    functions: firebase.functions()
  };
  return services;
}

export function getFirebaseServices() {
  return services;
}

export function isFirebaseReady() {
  return services.ready;
}
