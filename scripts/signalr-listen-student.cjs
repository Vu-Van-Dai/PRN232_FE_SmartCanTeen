/*
  Simple local tester for student notifications via SignalR.
  Usage: node scripts/signalr-listen-student.cjs
*/

const signalr = require("@microsoft/signalr");

const API_BASE = process.env.API_BASE ?? "http://localhost:5000";
const STUDENT_EMAIL = process.env.STUDENT_EMAIL ?? "student@smartcanteen.local";
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD ?? "Test@123";

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Login failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  if (!json?.accessToken) throw new Error("Login response missing accessToken");

  return json.accessToken;
}

async function ensureNotificationsEnabled(token) {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderReadyNotificationsEnabled: true }),
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PATCH /api/users/me failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}

async function main() {
  const token = await login();
  await ensureNotificationsEnabled(token);

  const connection = new signalr.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/order`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalr.LogLevel.Information)
    .build();

  connection.on("OrderReady", (payload) => {
    console.log("[SignalR] OrderReady:", JSON.stringify(payload));
  });

  connection.on("OrderCompleted", (payload) => {
    console.log("[SignalR] OrderCompleted:", JSON.stringify(payload));
  });

  connection.onreconnecting((err) => {
    console.log("[SignalR] reconnecting...", err?.message ?? err);
  });

  connection.onreconnected((connectionId) => {
    console.log("[SignalR] reconnected:", connectionId);
  });

  connection.onclose((err) => {
    console.log("[SignalR] closed:", err?.message ?? err);
    process.exit(1);
  });

  await connection.start();
  console.log("[SignalR] connected.");

  // Keep process alive
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
