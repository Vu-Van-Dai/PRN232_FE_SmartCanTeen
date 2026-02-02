/*
  End-to-end local test: SignalR notifications to student.

  Preconditions:
  - Backend running at http://localhost:5000

  Run:
  - node scripts/signalr-e2e-notification.cjs
*/

const signalr = require("@microsoft/signalr");

const API_BASE = process.env.API_BASE ?? "http://localhost:5000";

const ACCOUNTS = {
  student: { email: "student@smartcanteen.local", password: "Test@123" },
  kitchen: { email: "kitchen@smartcanteen.local", password: "Test@123" },
  coordination: { email: "coordination@smartcanteen.local", password: "Test@123" },
  pos: { email: "pos@smartcanteen.local", password: "Test@123" },
};

async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Login failed (${email}): ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  if (!json?.accessToken) throw new Error(`Login response missing accessToken (${email})`);
  return json.accessToken;
}

async function apiJson(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(
      `HTTP ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`
    );
  }

  if (!text) return null;
  if (contentType.includes("application/json")) return JSON.parse(text);
  return text;
}

async function tryPayWithShiftFallback({ studentToken, orderId }) {
  try {
    await apiJson(`/api/wallet/pay/${orderId}`, {
      token: studentToken,
      method: "POST",
    });
    return;
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes("No active shift")) throw e;

    // Open a shift as POS, then retry.
    const posToken = await login(ACCOUNTS.pos);
    await apiJson(`/api/shifts/open`, { token: posToken, method: "POST" });

    await apiJson(`/api/wallet/pay/${orderId}`, {
      token: studentToken,
      method: "POST",
    });
  }
}

async function main() {
  const studentToken = await login(ACCOUNTS.student);

  // Ensure notifications toggle is ON.
  await apiJson(`/api/users/me`, {
    token: studentToken,
    method: "PATCH",
    body: { orderReadyNotificationsEnabled: true },
  });

  let gotReady = false;
  let gotCompleted = false;

  const connection = new signalr.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/order`, {
      accessTokenFactory: () => studentToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalr.LogLevel.Information)
    .build();

  connection.on("OrderReady", (payload) => {
    gotReady = true;
    console.log("[SignalR] OrderReady:", JSON.stringify(payload));
  });

  connection.on("OrderCompleted", (payload) => {
    gotCompleted = true;
    console.log("[SignalR] OrderCompleted:", JSON.stringify(payload));
  });

  await connection.start();
  console.log("[SignalR] connected.");

  const menuItems = await apiJson(`/api/menu-items`, { token: studentToken });
  if (!Array.isArray(menuItems) || menuItems.length === 0) {
    throw new Error("No menu-items returned; cannot create order");
  }

  const itemId = menuItems[0].id;
  const orderRes = await apiJson(`/api/online/orders`, {
    token: studentToken,
    method: "POST",
    body: {
      items: [{ itemId, quantity: 1 }],
      pickupTime: null,
    },
  });

  const orderId = orderRes?.orderId;
  if (!orderId) throw new Error("Create order response missing orderId");
  console.log("Created order:", orderId);

  await tryPayWithShiftFallback({ studentToken, orderId });
  console.log("Paid order:", orderId);

  const kitchenToken = await login(ACCOUNTS.kitchen);
  await apiJson(`/api/kitchen/${orderId}/ready`, { token: kitchenToken, method: "POST" });
  console.log("Kitchen marked Ready:", orderId);

  const coordinationToken = await login(ACCOUNTS.coordination);
  await apiJson(`/api/kitchen/${orderId}/complete`, {
    token: coordinationToken,
    method: "POST",
  });
  console.log("Coordination marked Completed:", orderId);

  // Wait for events (up to 10s)
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (gotReady && gotCompleted) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  await connection.stop();

  if (!gotReady || !gotCompleted) {
    throw new Error(
      `Did not receive expected events. gotReady=${gotReady} gotCompleted=${gotCompleted}`
    );
  }

  console.log("SUCCESS: received OrderReady + OrderCompleted.");
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
