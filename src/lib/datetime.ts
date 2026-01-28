export const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateInput = string | number | Date | null | undefined;

function toDate(input: DateInput): Date | null {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatVnTime(input: DateInput) {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: VN_TIME_ZONE,
  });
}

export function formatVnDate(input: DateInput) {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: VN_TIME_ZONE,
  });
}

export function formatVnDateTime(input: DateInput) {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: VN_TIME_ZONE,
  });
}

export function getVnHour(input: DateInput = new Date()) {
  const d = toDate(input);
  if (!d) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: VN_TIME_ZONE,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour")?.value;
  const hour = hourPart != null ? Number(hourPart) : NaN;
  return Number.isFinite(hour) ? hour : null;
}
