import { createId, getCurrentUser, patchRecord, store, upsertRecord } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";

let stateUnsubscribe = null;
let firebaseUnsubscribe = null;
let activeUid = null;
const seenToasts = new Set();

function mergeNotificationsForUser(uid, notifications) {
  store.update((current) => {
    const otherItems = current.notifications.filter((item) => item.toUid !== uid);
    return {
      ...current,
      notifications: [...notifications, ...otherItems]
    };
  });
}

export function startNotificationStream(showToast) {
  if (stateUnsubscribe) {
    return;
  }
  const handleState = (state) => {
    const currentUser = getCurrentUser(state);
    const uid = currentUser?.id || null;
    if (isFirebaseReady() && uid && uid !== activeUid) {
      activeUid = uid;
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
      const { db } = getFirebaseServices();
      firebaseUnsubscribe = db.collection("notifications")
        .where("toUid", "==", uid)
        .onSnapshot((snapshot) => {
          const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          mergeNotificationsForUser(uid, notifications);
        });
    }
    const unread = uid ? state.notifications.filter((item) => item.toUid === uid && !item.read) : [];
    unread.forEach((item) => {
      if (seenToasts.has(item.id)) {
        return;
      }
      seenToasts.add(item.id);
      showToast({
        title: item.title || "Tin nhắn từ admin",
        message: item.msg,
        tone: "info",
        timeout: 4200
      });
      markNotificationRead(item.id).catch(() => {});
    });
  };
  stateUnsubscribe = store.subscribe(handleState);
  handleState(store.getState());
}

export async function markNotificationRead(notificationId) {
  if (isFirebaseReady()) {
    const { db } = getFirebaseServices();
    await db.collection("notifications").doc(notificationId).set({
      read: true
    }, { merge: true });
    return;
  }
  patchRecord("notifications", notificationId, {
    read: true
  });
}

export async function markAllNotificationsRead(uid) {
  const items = store.getState().notifications.filter((item) => item.toUid === uid && !item.read);
  await Promise.all(items.map((item) => markNotificationRead(item.id)));
}

export async function createLocalNotification(payload) {
  upsertRecord("notifications", {
    id: payload.id || createId("noti"),
    read: false,
    createdAt: new Date().toISOString(),
    ...payload
  });
}
