import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { usersApi } from "@/lib/api";
import { FCM_VAPID_KEY, getFirebaseMessaging } from "@/lib/firebase";

const LS_FCM_TOKEN = "fcmRegistrationToken";
let foregroundListening = false;

function canUseNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function canUseServiceWorker(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

function canUsePushApi(): boolean {
  return typeof window !== "undefined" && "PushManager" in window;
}

function isSecureContextForPush(): boolean {
  // Push API requires secure contexts (HTTPS) except localhost/127.0.0.1.
  return typeof window !== "undefined" && !!window.isSecureContext;
}

async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  // Must be at root scope to receive pushes on the whole origin.
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
}

async function getOrRegisterMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  // Prefer existing registration (avoids duplicates)
  const existing = await navigator.serviceWorker.getRegistration("/").catch(() => null);
  const reg = existing ?? (await registerMessagingServiceWorker());
  // Ensure SW is active before Firebase tries to use PushManager.
  await navigator.serviceWorker.ready;
  return reg;
}

async function showForegroundNotification(payload: MessagePayload) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = payload?.notification?.title || "SmartCanteen";
  const body = payload?.notification?.body || "";
  const link = payload?.data?.link || "/";

  try {
    // Prefer SW notification API; it's more consistent with Web Push behavior.
    if ("serviceWorker" in navigator) {
      const reg = (await navigator.serviceWorker.getRegistration("/").catch(() => null))
        ?? (await navigator.serviceWorker.ready.catch(() => null));

      if (reg?.showNotification) {
        await reg.showNotification(title, {
          body,
          data: { link, ...payload?.data },
        });
        return;
      }
    }

    // Fallback (may be suppressed on some setups)
    const n = new Notification(title, { body, data: { link, ...payload?.data } });
    n.onclick = () => {
      try {
        window.focus();
        window.location.assign(link);
      } catch {
        // ignore
      }
    };
  } catch {
    try {
      console.warn("[FCM] Unable to show foreground notification");
    } catch {
      // ignore
    }
  }
}

export async function startFcmForegroundNotifications(): Promise<void> {
  if (foregroundListening) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  foregroundListening = true;
  onMessage(messaging, (payload) => {
    try {
      console.log("[FCM] onMessage", payload);
    } catch {
      // ignore
    }
    void showForegroundNotification(payload);
  });
}

export async function ensureOrderReadyWebPushRegistered(): Promise<void> {
  if (!canUseNotifications() || !canUseServiceWorker()) {
    throw new Error("Thiết bị/trình duyệt không hỗ trợ Web Push Notification.");
  }

  if (!canUsePushApi()) {
    throw new Error("Trình duyệt không hỗ trợ Push API.");
  }

  if (!isSecureContextForPush()) {
    throw new Error("Web Push yêu cầu HTTPS (hoặc localhost). Vui lòng chạy bằng https hoặc localhost.");
  }

  if (Notification.permission === "denied") {
    throw new Error("Trình duyệt đang chặn thông báo cho trang web này.");
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Hãy cho phép thông báo trên trình duyệt để nhận push.");
    }
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    throw new Error("Firebase Messaging chưa được hỗ trợ trên trình duyệt này.");
  }

  const swReg = await getOrRegisterMessagingServiceWorker();

  // On insecure context or unsupported Push API, this is undefined and Firebase will crash.
  if (!(swReg as unknown as { pushManager?: unknown })?.pushManager) {
    throw new Error("PushManager không khả dụng. Hãy đảm bảo bạn đang chạy trên HTTPS/localhost và bật thông báo.");
  }

  const token = await getToken(messaging, {
    vapidKey: FCM_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });

  if (!token) {
    throw new Error("Không thể lấy FCM token. Vui lòng thử lại.");
  }

  const prev = (() => {
    try {
      return localStorage.getItem(LS_FCM_TOKEN);
    } catch {
      return null;
    }
  })();

  // Always register at least once per session; BE will de-dup.
  if (prev !== token) {
    try {
      localStorage.setItem(LS_FCM_TOKEN, token);
    } catch {
      // ignore
    }
  }

  await usersApi.registerFcmToken(token);

  // Also enable in-foreground notifications.
  await startFcmForegroundNotifications();
}
