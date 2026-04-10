import { getCurrentUser, getRoleRank, patchRecord, store } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";
import { readFileAsDataUrl } from "../utils/security.js";
import { validateFile, validateOptionalUrl, validateText } from "../utils/validators.js";

let usersUnsubscribe = null;

function replaceUsers(users) {
  store.update((current) => ({
    ...current,
    users
  }));
}

async function uploadAvatar(uid, file) {
  const fileCheck = validateFile(file, { maxSizeMb: 1.2 });
  if (!fileCheck.valid) {
    throw new Error(fileCheck.message);
  }
  if (!isFirebaseReady()) {
    return readFileAsDataUrl(file);
  }
  const { storage } = getFirebaseServices();
  const ref = storage.ref().child(`avatars/${uid}/${Date.now()}-${file.name}`);
  await ref.put(file);
  return ref.getDownloadURL();
}

export function startUserStream() {
  if (!isFirebaseReady() || usersUnsubscribe) {
    return;
  }
  const { db } = getFirebaseServices();
  usersUnsubscribe = db.collection("users").onSnapshot((snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    replaceUsers(users);
  }, () => {});
}

export function getTopServerUsers(source = store.getState()) {
  return [...source.users]
    .filter((user) => user.accountStatus === "active")
    .sort((a, b) => {
      const scoreA = getRoleRank(a.role) * 100 + (a.vipLevel === "vvip" ? 20 : a.vipLevel === "vip" ? 10 : 0);
      const scoreB = getRoleRank(b.role) * 100 + (b.vipLevel === "vvip" ? 20 : b.vipLevel === "vip" ? 10 : 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
    })
    .slice(0, 3);
}

export function getCoinLeaders(source = store.getState()) {
  return [...source.users]
    .filter((user) => user.accountStatus === "active" && getRoleRank(user.role) < getRoleRank("support"))
    .sort((a, b) => b.coin - a.coin)
    .slice(0, 3);
}

export function getAllUsers(source = store.getState()) {
  return [...source.users].sort((a, b) => a.username.localeCompare(b.username));
}

export async function updateProfile({ bio, avatarUrl, avatarFile }) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Bạn cần đăng nhập trước.");
  }
  const bioCheck = validateText(bio || ".", 2400);
  if (!bioCheck.valid) {
    throw new Error(bioCheck.message);
  }
  let nextAvatar = currentUser.avatarUrl || "";
  if (avatarFile instanceof File && avatarFile.size > 0) {
    nextAvatar = await uploadAvatar(currentUser.id, avatarFile);
  } else if (avatarUrl) {
    const avatarCheck = validateOptionalUrl(avatarUrl);
    if (!avatarCheck.valid) {
      throw new Error(avatarCheck.message);
    }
    nextAvatar = avatarCheck.value;
  }
  if (isFirebaseReady()) {
    const { db } = getFirebaseServices();
    await db.collection("users").doc(currentUser.id).set({
      bio: bioCheck.value === "." ? "" : bioCheck.value,
      avatarUrl: nextAvatar,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return;
  }
  patchRecord("users", currentUser.id, {
    bio: bioCheck.value === "." ? "" : bioCheck.value,
    avatarUrl: nextAvatar,
    updatedAt: new Date().toISOString()
  });
}
