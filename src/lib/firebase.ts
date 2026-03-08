import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBwnlFFuhmgrgQxPfp-bkh2pBhCVp5AIio",
  authDomain: "smartcanteen-dd643.firebaseapp.com",
  projectId: "smartcanteen-dd643",
  storageBucket: "smartcanteen-dd643.firebasestorage.app",
  messagingSenderId: "238831915828",
  appId: "1:238831915828:web:2711c93589e8aacf5f8b61",
  measurementId: "G-0CQ79ZNHSN",
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  // Some browsers/environments (e.g., SSR, older Safari) don't support FCM Web.
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (!messaging) messaging = getMessaging(getFirebaseApp());
  return messaging;
}

export const FCM_VAPID_KEY =
  "BMt0I_36W3BDMAw1RlfpgXgmBluKXibGo0UZIiqHa7sh3tn7oN4a-UWIEL2Y21rvNoxLO9CS1TGnwOCL15-u3Fo";
