// src/Components/Appointments/AppointmentRequestsModal.jsx
import React, { Fragment, useMemo, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BellIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// How long a "late" appointment (scheduled time already passed, visitor never
// timed in) stays visible before it's treated as stale and dropped from the
// list entirely. Named here so it's a one-line change if the grace period
// should differ.
// ---------------------------------------------------------------------------
const LATE_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 1 day
const CLOCK_TICK_MS = 60 * 1000; // re-evaluate late/expired state every minute

/* ============================================================
   DATE / TIME HELPERS
   ============================================================ */

// Builds a Y-M-D key from LOCAL calendar getters (not toISOString, which is
// UTC-based and — for a bare "YYYY-MM-DD" value — can silently shift the
// grouped date away from the date readableDate() shows for the same value
// depending on the browser's timezone offset). Using the same local-getter
// approach everywhere keeps the group header and each card's date in sync.
function toLocalDateKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const readableDate = (v) =>
  new Date(v).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// Accepts whatever shape schedule_time happens to be in — "18:00:00",
// "18:00", or an already-12-hour-but-unpadded string like "6:0 PM" (the
// source of the "6:0 PM" display bug) — and returns { hours, minutes } in
// 24-hour form, or null if it can't be parsed.
function parseTimeParts(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const str = String(raw).trim();

  // 24-hour: "18:00", "18:00:00"
  let m = str.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if (m) {
    const hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    if (hours <= 23 && minutes <= 59) return { hours, minutes };
  }

  // 12-hour, tolerant of missing padding/spacing: "6:0 PM", "6:00PM"
  m = str.match(/^(\d{1,2}):(\d{1,2})\s*([AaPp][Mm])$/);
  if (m) {
    let hours = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hours += 12;
    const minutes = parseInt(m[2], 10);
    return { hours, minutes };
  }

  return null;
}

// Always renders as "H:MM AM/PM" — fixes the "6:0 PM" / "12:0 AM" bug, which
// was an unpadded-minute string already sitting in the schedule_time column
// being rendered verbatim. Falls back to the raw value if it's unparseable,
// so nothing silently disappears.
function formatTime(raw) {
  const parts = parseTimeParts(raw);
  if (!parts) return raw || "—";
  const { hours, minutes } = parts;
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Combines the appointment's date with its schedule_time into one Date, in
// local time, so it can be compared against "now" for late/expiry checks.
function combineDateTime(dateVal, timeVal) {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return null;
  const parts = parseTimeParts(timeVal) || { hours: 0, minutes: 0 };
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), parts.hours, parts.minutes, 0, 0);
}

function formatLateDuration(ms) {
  const totalMinutes = Math.max(1, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) return `Late ${hours}h${minutes ? ` ${minutes}m` : ""}`;
  return `Late ${minutes}m`;
}

// "Today" / "Tomorrow" / "Yesterday" tag for a group's date — lets staff spot
// the urgent group at a glance instead of reading full dates.
function relativeDayTag(dateKey, now) {
  const target = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return null;
}

/* ============================================================
   PILL / CARD — hoisted to module scope (stable function identity across
   renders). Defining these inside the modal body was the cause of the
   flicker fixed earlier: a new function per render makes React treat each
   card as a brand-new component type and remount it. Theme/data are passed
   in as explicit props instead of via closure.
   ============================================================ */
function Pill({ icon: Icon, theme, tone = "default", children }) {
  const toneClasses = tone === "warning" ? theme.pillWarnBg : theme.pillBg;
  const iconClasses = tone === "warning" ? theme.pillWarnIcon : theme.pillIcon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${toneClasses}`}
    >
      <Icon className={`w-3.5 h-3.5 ${iconClasses}`} />
      {children}
    </span>
  );
}

function AppointmentCard({ raw, theme, processingId, onAccept, now }) {
  const isProcessing = processingId === raw.id;

  const apptDateTime = combineDateTime(raw.date, raw.schedule_time);
  const lateMs = apptDateTime ? now.getTime() - apptDateTime.getTime() : 0;
  const isLate = lateMs > 0;

  return (
    <div className={`relative rounded-xl border overflow-hidden ${theme.cardBg}`}>
      {/* top accent stripe — emerald normally, amber once the visitor is late */}
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${
          isLate ? "from-amber-400 to-orange-500" : "from-emerald-400/70 to-teal-500/70"
        }`}
      />

      <div className="p-5">
        <h4 className="form-title font-semibold text-base leading-tight truncate">
          {raw.visitor_name}
        </h4>
        <p className={`text-sm mt-0.5 truncate ${theme.mutedText}`}>
          Visiting {raw.person_to_visit}
        </p>

        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          <Pill icon={ClockIcon} theme={theme}>
            <span className="mono-badge">{formatTime(raw.schedule_time)}</span>
          </Pill>
          <Pill icon={MapPinIcon} theme={theme}>
            {raw.branch || "Unknown Branch"}
          </Pill>
          {isLate && (
            <Pill icon={ExclamationTriangleIcon} theme={theme} tone="warning">
              {formatLateDuration(lateMs)}
            </Pill>
          )}
        </div>

        <motion.button
          onClick={() => onAccept(raw)}
          disabled={isProcessing}
          whileHover={!isProcessing ? { scale: 1.02 } : {}}
          whileTap={!isProcessing ? { scale: 0.98 } : {}}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${theme.btnPrimary}`}
        >
          {isProcessing ? "Recording…" : "Time In"}
        </motion.button>
      </div>
    </div>
  );
}

export default function AppointmentRequestsModal({
  isOpen,
  onClose,
  appointmentRequests = [],
  acceptAppointment,
  processingId,
  darkMode = true,
}) {
  /* ================= LOCAL STATE ================= */
  const [filterDate, setFilterDate] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [toast, setToast] = useState(null);
  const [openDates, setOpenDates] = useState({});
  const [openBranches, setOpenBranches] = useState({});
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 640
  );
  // Ticks once a minute so "late" badges and the 24h auto-hide re-evaluate
  // live, without needing the appointment list itself to change.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  /* ================= BRANCH OPTIONS ================= */
  const branchOptions = useMemo(() => {
    return [...new Set(appointmentRequests.map((a) => a.branch).filter(Boolean))];
  }, [appointmentRequests]);

  /* ================= FILTER + GROUP ================= */
  const groupedAppointments = useMemo(() => {
    const approved = appointmentRequests.filter(
      (a) => String(a.status).toLowerCase() === "approved"
    );

    const filtered = approved.filter((a) => {
      // Auto-hide: once a no-show has been late for more than the grace
      // period, drop it from the list entirely instead of leaving stale
      // cards around indefinitely.
      const apptDateTime = combineDateTime(a.date, a.schedule_time);
      if (apptDateTime && now.getTime() - apptDateTime.getTime() > LATE_GRACE_PERIOD_MS) {
        return false;
      }

      const matchDate = filterDate
        ? toLocalDateKey(a.date) === toLocalDateKey(filterDate)
        : true;

      const q = search.toLowerCase();
      const matchSearch =
        a.visitor_name.toLowerCase().includes(q) ||
        a.person_to_visit.toLowerCase().includes(q);

      const matchBranch = selectedBranch ? a.branch === selectedBranch : true;

      return matchDate && matchSearch && matchBranch;
    });

    const grouped = filtered.reduce((acc, item) => {
      const key = toLocalDateKey(item.date);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  }, [appointmentRequests, filterDate, search, selectedBranch, now]);

  const totalCount = useMemo(
    () => Object.values(groupedAppointments).reduce((n, arr) => n + arr.length, 0),
    [groupedAppointments]
  );

  /* ================= ACTION ================= */
  const handleAccept = (raw) => {
    acceptAppointment({
      ...raw,
      visitorName: raw.visitor_name,
      personToVisit: raw.person_to_visit,
      timeIn: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeOut: "",
    });

    setToast("Time-in recorded");
    setTimeout(() => setToast(null), 2200);
  };

  /* ================= ACCORDION ================= */
  const toggleDate = (key) => {
    if (isDesktop) return;
    setOpenDates((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleBranch = (key) => {
    setOpenBranches((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ================= THEME ================= */
  // Same token shape as AddVisitorModal.jsx, extended with a warning
  // (amber) tone for the "late" pill.
  const theme = darkMode
    ? {
        modalBg: "bg-slate-950 text-slate-100",
        headerBg: "bg-slate-900/70 backdrop-blur-xl border-slate-800",
        iconBadge:
          "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_18px_-4px_rgba(16,185,129,0.45)]",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110",
        inputBg: "bg-slate-900/60 text-slate-100 border-slate-800",
        fieldIcon: "text-slate-600",
        cardBg: "bg-white/[0.02] border-slate-800/80",
        pillBg: "bg-white/[0.03] border-slate-800 text-slate-300",
        pillIcon: "text-emerald-400",
        pillWarnBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        pillWarnIcon: "text-amber-400",
        optionBg: "bg-slate-800/80 text-slate-100",
        chipHover: "hover:bg-emerald-500/10",
        textColor: "text-slate-100",
        mutedText: "text-slate-500",
        borderColor: "border-slate-800",
        divider: "bg-slate-800/70",
        toastBg: "bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 text-slate-100",
        rowHairline: "via-emerald-400/70",
      }
    : {
        modalBg: "bg-white text-slate-900",
        headerBg: "bg-white/80 backdrop-blur-xl border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_0_14px_-6px_rgba(16,185,129,0.35)]",
        btnPrimary:
          "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
        inputBg: "bg-slate-50 text-slate-900 border-slate-200",
        fieldIcon: "text-slate-400",
        cardBg: "bg-slate-50/60 border-slate-200",
        pillBg: "bg-slate-50 border-slate-200 text-slate-600",
        pillIcon: "text-emerald-600",
        pillWarnBg: "bg-amber-50 border-amber-200 text-amber-700",
        pillWarnIcon: "text-amber-600",
        optionBg: "bg-slate-100 text-slate-900",
        chipHover: "hover:bg-emerald-50",
        textColor: "text-slate-900",
        mutedText: "text-slate-500",
        borderColor: "border-slate-200",
        divider: "bg-slate-200",
        toastBg: "bg-white/95 backdrop-blur-xl border border-emerald-200 text-slate-900",
        rowHairline: "via-emerald-400/70",
      };

  const scrollThumb = darkMode ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.4)";
  const scrollThumbHover = darkMode ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.65)";

  const rd = darkMode
    ? {
        bg: "#0c1526",
        border: "#1e293b",
        text: "#f1f5f9",
        muted: "#64748b",
        hover: "rgba(16,185,129,0.12)",
        accent: "#10b981",
        accentText: "#022c22",
      }
    : {
        bg: "#ffffff",
        border: "#e2e8f0",
        text: "#0f172a",
        muted: "#64748b",
        hover: "rgba(16,185,129,0.1)",
        accent: "#10b981",
        accentText: "#ffffff",
      };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .form-title { font-family: 'Space Grotesk', sans-serif; }
        .mono-badge { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }

        .appt-scroll { scrollbar-width: thin; scrollbar-color: ${scrollThumb} transparent; }
        .appt-scroll::-webkit-scrollbar { width: 8px; }
        .appt-scroll::-webkit-scrollbar-track { background: transparent; }
        .appt-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .appt-scroll::-webkit-scrollbar-thumb:hover { background-color: ${scrollThumbHover}; }

        /* ---- react-datepicker theming to match the modal chrome ---- */
        .appt-datepicker-popper { z-index: 60; font-family: inherit; }
        .appt-datepicker-popper .react-datepicker {
          background: ${rd.bg};
          border: 1px solid ${rd.border};
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 45px -15px rgba(0,0,0,0.45);
          color: ${rd.text};
        }
        .appt-datepicker-popper .react-datepicker__triangle { display: none; }
        .appt-datepicker-popper .react-datepicker__header {
          background: transparent;
          border-bottom: 1px solid ${rd.border};
          padding-top: 0.75rem;
        }
        .appt-datepicker-popper .react-datepicker__current-month,
        .appt-datepicker-popper .react-datepicker-time__header {
          color: ${rd.text};
          font-weight: 600;
          font-size: 0.8rem;
        }
        .appt-datepicker-popper .react-datepicker__day-name { color: ${rd.muted}; font-size: 0.7rem; }
        .appt-datepicker-popper .react-datepicker__day { color: ${rd.text}; border-radius: 0.5rem; }
        .appt-datepicker-popper .react-datepicker__day:hover { background: ${rd.hover}; }
        .appt-datepicker-popper .react-datepicker__day--outside-month { color: ${rd.muted}; opacity: 0.5; }
        .appt-datepicker-popper .react-datepicker__day--selected,
        .appt-datepicker-popper .react-datepicker__day--keyboard-selected {
          background: ${rd.accent};
          color: ${rd.accentText};
          font-weight: 600;
        }
        .appt-datepicker-popper .react-datepicker__navigation-icon::before { border-color: ${rd.muted}; }
        .appt-datepicker-popper .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: ${rd.accent};
        }
      `}</style>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 flex justify-center items-start sm:items-center p-4 sm:pt-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-200"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel
                className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.modalBg} ${theme.borderColor}`}
              >
                {/* hairline accent */}
                <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${theme.rowHairline} to-transparent shrink-0`} />

                {/* HEADER */}
                <div className={`shrink-0 border-b ${theme.headerBg}`}>
                  <div className="flex items-center gap-3 p-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                      <BellIcon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="form-title text-[15px] font-semibold leading-tight">
                        Approved Appointments
                      </Dialog.Title>
                      <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                        {totalCount > 0
                          ? `${totalCount} approved appointment${totalCount === 1 ? "" : "s"} awaiting time-in`
                          : "Record time-in for approved visitors"}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className={`ml-auto flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.borderColor} ${theme.mutedText}`}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* FILTERS */}
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr_auto] gap-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.fieldIcon}`} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search visitor or person"
                        className={`w-full pl-9 py-2 text-sm rounded-lg border ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      />
                    </div>

                    <div className="relative">
                      <CalendarIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${theme.fieldIcon}`} />
                      <DatePicker
                        selected={filterDate}
                        onChange={setFilterDate}
                        placeholderText="Filter date"
                        popperClassName="appt-datepicker-popper"
                        className={`w-full pl-9 py-2 text-sm rounded-lg border ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      />
                    </div>

                    <div className="relative">
                      <MapPinIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${theme.fieldIcon}`} />
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border appearance-none ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      >
                        <option value="">All Branches</option>
                        {branchOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.fieldIcon}`} />
                    </div>

                    {(filterDate || selectedBranch) && (
                      <button
                        onClick={() => {
                          setFilterDate(null);
                          setSelectedBranch("");
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${theme.borderColor} ${theme.mutedText} ${theme.chipHover}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* BODY */}
                <div className="appt-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {Object.keys(groupedAppointments).length === 0 && (
                    <div className={`flex flex-col items-center text-center py-16 gap-3 ${theme.mutedText}`}>
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border ${theme.borderColor}`}>
                        <InboxIcon className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">No approved appointments right now</p>
                        <p className="text-xs mt-1 max-w-xs">
                          Adjust your filters, or check back later — no-shows are hidden automatically after 24 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  {Object.entries(groupedAppointments).map(([dateKey, items]) => {
                    const isOpen = openDates[dateKey];
                    const dayTag = relativeDayTag(dateKey, now);

                    const branches = items.reduce((acc, i) => {
                      const b = i.branch || "Unknown Branch";
                      acc[b] = acc[b] || [];
                      acc[b].push(i);
                      return acc;
                    }, {});

                    return (
                      <div key={dateKey} className="space-y-4">
                        {/* DATE HEADER */}
                        <button
                          onClick={() => toggleDate(dateKey)}
                          className="w-full flex justify-between items-center gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <h3 className={`text-xs uppercase tracking-wider font-semibold whitespace-nowrap ${theme.mutedText}`}>
                              {readableDate(dateKey)}
                            </h3>

                            {dayTag && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${theme.pillBg} border`}>
                                {dayTag}
                              </span>
                            )}

                            {!isDesktop && (
                              <Pill icon={UserGroupIcon} theme={theme}>
                                {Object.keys(branches).length} Branch
                                {Object.keys(branches).length > 1 && "es"}
                              </Pill>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {isDesktop && (
                              <span className={`text-xs ${theme.mutedText}`}>
                                {items.length} visitor{items.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {!isDesktop && (
                              <ChevronDownIcon
                                className={`w-5 h-5 shrink-0 transition-transform ${theme.mutedText} ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </div>
                        </button>

                        {/* DESKTOP GRID */}
                        {isDesktop && (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {items.map((raw) => (
                              <AppointmentCard
                                key={raw.id}
                                raw={raw}
                                theme={theme}
                                processingId={processingId}
                                onAccept={handleAccept}
                                now={now}
                              />
                            ))}
                          </div>
                        )}

                        {/* MOBILE → BRANCH ACCORDION */}
                        {!isDesktop && (
                          <AnimatePresence>
                            {isOpen &&
                              Object.entries(branches).map(([branch, list]) => {
                                const key = `${dateKey}-${branch}`;
                                const open = openBranches[key];

                                return (
                                  <motion.div
                                    key={key}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="ml-3"
                                  >
                                    <button
                                      onClick={() => toggleBranch(key)}
                                      className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border ${theme.cardBg}`}
                                    >
                                      <span className="text-sm flex items-center gap-2">
                                        <MapPinIcon className={`w-4 h-4 ${theme.pillIcon}`} />
                                        {branch}
                                      </span>
                                      <ChevronDownIcon
                                        className={`w-4 h-4 shrink-0 transition-transform ${theme.mutedText} ${
                                          open ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {open && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -8 }}
                                          className="grid gap-4 mt-3"
                                        >
                                          {list.map((raw) => (
                                            <AppointmentCard
                                              key={raw.id}
                                              raw={raw}
                                              theme={theme}
                                              processingId={processingId}
                                              onAccept={handleAccept}
                                              now={now}
                                            />
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })}
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-5 right-5 px-4 py-3 rounded-xl shadow-2xl z-[60] flex items-center gap-2 ${theme.toastBg}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}