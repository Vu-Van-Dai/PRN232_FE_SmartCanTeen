import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare let self: ServiceWorkerGlobalScope;

// Auto update behavior (vite-plugin-pwa: registerType=autoUpdate)
self.skipWaiting();
clientsClaim();

// PWA precache (assets injected at build time)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Firebase Messaging (background push)
const firebaseApp = initializeApp({
  apiKey: "AIzaSyBwnlFFuhmgrgQxPfp-bkh2pBhCVp5AIio",
  authDomain: "smartcanteen-dd643.firebaseapp.com",
  projectId: "smartcanteen-dd643",
  storageBucket: "smartcanteen-dd643.firebasestorage.app",
  messagingSenderId: "238831915828",
  appId: "1:238831915828:web:2711c93589e8aacf5f8b61",
  measurementId: "G-0CQ79ZNHSN",
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  const title = payload?.notification?.title || "SmartCanteen";
  const body = payload?.notification?.body || "";
  const link = (payload?.data as Record<string, string> | undefined)?.link || "/";

  void self.registration.showNotification(title, {
    body,
    data: {
      link,
      ...(payload?.data || {}),
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = (event.notification?.data as { link?: string } | undefined)?.link || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = allClients.find((c) => "focus" in c);

      if (existing) {
        await existing.focus();
        try {
          await existing.navigate(link);
        } catch {
          // ignore
        }
        return;
      }

      await self.clients.openWindow(link);
    })()
  );
});
