import { createId, createPermissionSet, getCurrentUser, setSessionUid, store, upsertRecord } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";
import { validateEmail, validatePassword, validateUsername } from "../utils/validators.js";

const DEMO_ACCOUNTS = {
  "superadmin@neonvh.demo": {
    uid: "u-admin",
    password: "NeonVH!2026"
  },
  "finance@neonvh.demo": {
    uid: "u-finance",
    password: "NeonVH!2026"
  },
  "editor@neonvh.demo": {
    uid: "u-editor",
    password: "NeonVH!2026"
  },
  "member@neonvh.demo": {
    uid: "u-member",
    password: "NeonVH!2026"
  }
};

let authReady = false;

export function getDemoCredentials() {
  return {
    superadmin: {
      email: "superadmin@neonvh.demo",
      password: "NeonVH!2026"
    },
    finance: {
      email: "finance@neonvh.demo",
      password: "NeonVH!2026"
    },
    editor: {
      email: "editor@neonvh.demo",
      password: "NeonVH!2026"
    }
  };
}

export function getAuthModeLabel(mode) {
  return mode === "register" ? "Đăng ký" : "Đăng nhập";
}

async function ensureFirebaseProfile(firebaseUser) {
  const { db } = getFirebaseServices();
  const docRef = db.collection("users").doc(firebaseUser.uid);
  const doc = await docRef.get();
  if (!doc.exists) {
    const username = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "member";
    await docRef.set({
      username,
      email: firebaseUser.email,
      avatarUrl: "",
      role: "member",
      permissions: createPermissionSet("member"),
      vipLevel: "none",
      vipExpiry: null,
      coin: 500,
      accountStatus: "active",
      bio: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
  }
  const freshDoc = await docRef.get();
  if (freshDoc.exists) {
    upsertRecord("users", {
      id: freshDoc.id,
      ...freshDoc.data()
    });
  }
}

export async function initAuth() {
  if (!isFirebaseReady()) {
    authReady = true;
    return;
  }
  if (authReady) {
    return;
  }
  const { auth } = getFirebaseServices();
  await new Promise((resolve) => {
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await ensureFirebaseProfile(firebaseUser);
        setSessionUid(firebaseUser.uid);
      } else {
        setSessionUid(null);
      }
      authReady = true;
      resolve();
    }, () => {
      authReady = true;
      resolve();
    });
  });
}

export async function loginWithEmail({ email, password }) {
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    throw new Error(emailCheck.message);
  }
  if (!password) {
    throw new Error("Bạn cần nhập mật khẩu.");
  }
  if (isFirebaseReady()) {
    const { auth, db } = getFirebaseServices();
    const credential = await auth.signInWithEmailAndPassword(emailCheck.value, password);
    await db.collection("users").doc(credential.user.uid).set({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return credential.user;
  }
  const demoAccount = DEMO_ACCOUNTS[emailCheck.value];
  if (!demoAccount || demoAccount.password !== password) {
    throw new Error("Thông tin đăng nhập chưa đúng trong demo mode.");
  }
  setSessionUid(demoAccount.uid);
  return getCurrentUser();
}

export async function registerWithEmail({ username, email, password }) {
  const usernameCheck = validateUsername(username);
  const emailCheck = validateEmail(email);
  const passwordCheck = validatePassword(password);
  if (!usernameCheck.valid) {
    throw new Error(usernameCheck.message);
  }
  if (!emailCheck.valid) {
    throw new Error(emailCheck.message);
  }
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.message);
  }
  if (isFirebaseReady()) {
    const { auth, db } = getFirebaseServices();
    const credential = await auth.createUserWithEmailAndPassword(emailCheck.value, passwordCheck.value);
    await credential.user.updateProfile({
      displayName: usernameCheck.value
    });
    await db.collection("users").doc(credential.user.uid).set({
      username: usernameCheck.value,
      email: emailCheck.value,
      avatarUrl: "",
      role: "member",
      permissions: createPermissionSet("member"),
      vipLevel: "none",
      vipExpiry: null,
      coin: 500,
      accountStatus: "active",
      bio: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    if (credential.user.emailVerified === false) {
      await credential.user.sendEmailVerification();
    }
    return credential.user;
  }
  const state = store.getState();
  if (state.users.some((user) => user.email === emailCheck.value)) {
    throw new Error("Email này đã tồn tại.");
  }
  if (state.users.some((user) => user.username.toLowerCase() === usernameCheck.value.toLowerCase())) {
    throw new Error("Username này đã tồn tại.");
  }
  const userId = createId("u");
  const user = {
    id: userId,
    username: usernameCheck.value,
    email: emailCheck.value,
    avatarUrl: "",
    role: "member",
    permissions: createPermissionSet("member"),
    vipLevel: "none",
    vipExpiry: null,
    coin: 500,
    accountStatus: "active",
    bio: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  upsertRecord("users", user);
  setSessionUid(userId);
  return user;
}

export async function logout() {
  if (isFirebaseReady()) {
    const { auth } = getFirebaseServices();
    await auth.signOut();
    return;
  }
  setSessionUid(null);
}
