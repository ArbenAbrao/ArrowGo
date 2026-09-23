// src/Components/Visitors/appointmentUtils.js
//
// Date/time helpers shared by visitors.jsx and ArchivedRequestsModal.jsx.
//
// "Expired" here follows the same rule AppointmentRequestsModal already uses to
// hide no-shows: a request is expired once its scheduled date + time is more
// than EXPIRY_GRACE_MS in the past. Keep this in sync with LATE_GRACE_PERIOD_MS
// in AppointmentRequestsModal.jsx.
export const EXPIRY_GRACE_MS = 24 * 60 * 60 * 1000; // 1 day

// Column names for the visit date / time. The first one present on a record wins.
const DATE_FIELDS = ["date", "appointmentDate", "visitDate", "visit_date"];
const TIME_FIELDS = ["schedule_time", "scheduleTime", "time"];

export const getDateField = (a) => DATE_FIELDS.find((k) => a && a[k]) || "date";

// Plain "YYYY-MM-DD" strings are parsed as LOCAL dates on purpose.
// `new Date("2026-09-18")` is read as UTC midnight, which can land on the
// previous day in some timezones. Full ISO timestamps go through the normal
// parser (same as AppointmentRequestsModal's combineDateTime).
export const parseDate = (value) => {
  if (!value) return null;
  const s = String(value);
  const plain = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = plain ? new Date(+plain[1], +plain[2] - 1, +plain[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getAppointmentDate = (a) => parseDate(a?.[getDateField(a)]);

export const getScheduleTime = (a) => TIME_FIELDS.map((k) => a?.[k]).find((v) => v);

// Accepts "18:00", "18:00:00", and unpadded 12-hour strings like "6:0 PM"
// (the same shapes AppointmentRequestsModal handles). Returns 24-hour parts.
export function parseTimeParts(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const str = String(raw).trim();

  let m = str.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (m) {
    const hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    if (hours <= 23 && minutes <= 59) return { hours, minutes };
  }

  m = str.match(/^(\d{1,2}):(\d{1,2})\s*([AaPp][Mm])$/);
  if (m) {
    let hours = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hours += 12;
    return { hours, minutes: parseInt(m[2], 10) };
  }

  return null;
}

// Always "H:MM AM/PM". Falls back to the raw value if it can't be parsed.
export function formatTime(raw) {
  const parts = parseTimeParts(raw);
  if (!parts) return raw || "";
  const { hours, minutes } = parts;
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

// Scheduled date + time as one local Date (midnight if there's no time).
export const getAppointmentDateTime = (a) => {
  const d = getAppointmentDate(a);
  if (!d) return null;
  const t = parseTimeParts(getScheduleTime(a)) || { hours: 0, minutes: 0 };
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.hours, t.minutes, 0, 0);
};

// Milliseconds since the request expired (negative = not expired yet,
// null = no usable date).
//
// NOTE: deliberately takes ONE argument. It's used as `array.filter(fn)`, which
// would otherwise pass the array index as a second parameter.
export const msSinceExpiry = (a) => {
  const dt = getAppointmentDateTime(a);
  return dt ? Date.now() - (dt.getTime() + EXPIRY_GRACE_MS) : null;
};

export const isAppointmentExpired = (a) => {
  const ms = msSinceExpiry(a);
  return ms !== null && ms > 0;
};

// "YYYY-MM-DD" in local time, for <input type="date"> values and `min`.
export const toInputDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const formatDate = (d) =>
  d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "No date";