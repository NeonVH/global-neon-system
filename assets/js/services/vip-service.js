import { createId, getCurrentUser, store, upsertRecord } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";
import { readFileAsDataUrl } from "../utils/security.js";
import { validateFile, validateText } from "../utils/validators.js";

let vipRequestsUnsubscribe = null;

function replaceVipRequests(vipRequests) {
  store.update((current) => ({
    ...current,
    vipRequests
  }));
}

async function uploadProof(uid, file) {
  const fileCheck = validateFile(file, { maxSizeMb: 2.5 });
  if (!fileCheck.valid) {
    throw new Error(fileCheck.message);
  }
  if (!isFirebaseReady()) {
    return readFileAsDataUrl(file);
  }
  const { storage } = getFirebaseServices();
  const ref = storage.ref().child(`vip-proofs/${uid}/${Date.now()}-${file.name}`);
  await ref.put(file);
  return ref.getDownloadURL();
}

export function startVipRequestStream() {
  if (!isFirebaseReady() || vipRequestsUnsubscribe) {
    return;
  }
  const { db } = getFirebaseServices();
  vipRequestsUnsubscribe = db.collection("vip_requests").onSnapshot((snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    replaceVipRequests(requests);
  });
}

export async function requestVipUpgrade({ requestedTier, note, proofFile }) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Bạn cần đăng nhập để gửi yêu cầu VIP.");
  }
  const noteCheck = validateText(note || "Yêu cầu VIP", 1200);
  if (!noteCheck.valid) {
    throw new Error(noteCheck.message);
  }
  let proofImageUrl = "";
  if (proofFile instanceof File && proofFile.size > 0) {
    proofImageUrl = await uploadProof(currentUser.id, proofFile);
  }
  const payload = {
    uid: currentUser.id,
    username: currentUser.username,
    requestedTier,
    note: noteCheck.value,
    proofImageUrl,
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };
  if (isFirebaseReady()) {
    const { db } = getFirebaseServices();
    await db.collection("vip_requests").add(payload);
    return;
  }
  upsertRecord("vipRequests", {
    id: createId("vip"),
    ...payload
  });
}
