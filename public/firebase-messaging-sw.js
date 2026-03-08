/* eslint-disable no-undef */
// Firebase Messaging Service Worker (Web Push)
// NOTE: This file must be served from the origin root scope.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBwnlFFuhmgrgQxPfp-bkh2pBhCVp5AIio",
  authDomain: "smartcanteen-dd643.firebaseapp.com",
  projectId: "smartcanteen-dd643",
  storageBucket: "smartcanteen-dd643.firebasestorage.app",
  messagingSenderId: "238831915828",
  appId: "1:238831915828:web:2711c93589e8aacf5f8b61",
  measurementId: "G-0CQ79ZNHSN",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "SmartCanteen";
  const body = payload?.notification?.body || "";

  const link = payload?.data?.link || "/";

  self.registration.showNotification(title, {
    body,
    data: { link, ...payload?.data },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event?.notification?.data?.link || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = allClients.find((c) => "focus" in c);

      if (existing) {
        await existing.focus();
        try {
          existing.navigate(link);
        } catch {
          // ignore
        }
        return;
      }

      await clients.openWindow(link);
    })()
  );
});
