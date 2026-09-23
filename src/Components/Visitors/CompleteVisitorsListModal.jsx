// src/Components/Visitors/CompleteVisitorsListModal.jsx
import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   HELPERS
   ============================================================ */

// timeIn/timeOut are written elsewhere via toLocaleTimeString, so they're
// already well-formed "H:MM AM/PM" — this just extracts minutes-since-midnight
// so a visit duration can be shown, tolerating a same-day rollover.
function parseClockTime(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

function formatDuration(timeIn, timeOut) {
  const start = parseClockTime(timeIn);
  const end = parseClockTime(timeOut);
  if (start === null || end === null) return "—";
  let diff = end - start;
  if (diff < 0) diff += 24 * 60; // visit crossed midnight
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/* ============================================================
   SMALL PIECES — hoisted to module scope so they keep a stable function
   identity across renders (same reasoning as the fix applied to
   AppointmentRequestsModal: a component defined inside the render body gets
   remounted, not updated, on every keystroke/state change).
   ============================================================ */
function CompletedBadge({ theme }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${theme.badgeBg}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      Completed
    </span>
  );
}

function EmptyState({ theme, hasFilters }) {
  return (
    <div className={`flex flex-col items-center text-center py-16 gap-3 ${theme.mutedText}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full border ${theme.borderColor}`}>
        <InboxIcon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-sm font-medium">No completed visits found</p>
        <p className="text-xs mt-1 max-w-xs">
          {hasFilters
            ? "Try a different date range or clear your search."
            : "Visits will show up here once a visitor has timed out."}
        </p>
      </div>
    </div>
  );
}

export default function CompleteVisitorsListModal({ isOpen, onClose, visitors, darkMode = true }) {
  const completedVisitors = useMemo(() => visitors.filter((v) => v.timeOut), [visitors]);

  const [dateRange, setDateRange] = useState([null, null]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [startDate, endDate] = dateRange;

  const isInRange = (visitorDate) => {
    if (!startDate || !endDate) return false;
    const date = new Date(visitorDate);
    return date >= startDate && date <= endDate;
  };

  const filteredVisitors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return completedVisitors.filter((v) => {
      const matchDate =
        startDate && endDate ? (() => {
          const d = new Date(v.date);
          return d >= startDate && d <= endDate;
        })() : true;

      const matchSearch = q
        ? (v.visitorName || "").toLowerCase().includes(q) ||
          (v.personToVisit || "").toLowerCase().includes(q)
        : true;

      return matchDate && matchSearch;
    });
  }, [completedVisitors, startDate, endDate, search]);

  const hasFilters = Boolean((startDate && endDate) || search);

  /* ================= THEME ================= */
  // Same token shape as AddVisitorModal / AppointmentRequestsModal.
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
        tableWrap: "bg-white/[0.02] border-slate-800/80",
        theadBg: "bg-slate-950",
        rowBorder: "border-slate-800/60",
        rowHover: "hover:bg-white/[0.03]",
        rowHighlight: "bg-emerald-500/[0.04]",
        badgeBg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        textColor: "text-slate-100",
        mutedText: "text-slate-500",
        borderColor: "border-slate-800",
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
        tableWrap: "bg-slate-50/60 border-slate-200",
        theadBg: "bg-white",
        rowBorder: "border-slate-200",
        rowHover: "hover:bg-slate-50",
        rowHighlight: "bg-emerald-50/70",
        badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        textColor: "text-slate-900",
        mutedText: "text-slate-500",
        borderColor: "border-slate-200",
        toastBg: "bg-white/95 backdrop-blur-xl border border-emerald-200 text-slate-900",
        rowHairline: "via-emerald-400/70",
      };

  const scrollThumb = darkMode ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.4)";
  const scrollThumbHover = darkMode ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.65)";

  const rd = darkMode
    ? { bg: "#0c1526", border: "#1e293b", text: "#f1f5f9", muted: "#64748b", hover: "rgba(16,185,129,0.12)", accent: "#10b981", accentText: "#022c22" }
    : { bg: "#ffffff", border: "#e2e8f0", text: "#0f172a", muted: "#64748b", hover: "rgba(16,185,129,0.1)", accent: "#10b981", accentText: "#ffffff" };

  /* ================= EXPORT ================= */
  const handleExport = () => {
    if (filteredVisitors.length === 0) return;

    const header = ["Name", "Person To Visit", "Purpose", "Branch", "Date", "Time In", "Time Out", "Duration"];
    const rows = filteredVisitors.map((v) => [
      v.visitorName,
      v.personToVisit,
      v.purpose,
      v.branch || "",
      new Date(v.date).toLocaleDateString(),
      v.timeIn,
      v.timeOut,
      formatDuration(v.timeIn, v.timeOut),
    ]);

    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completed_visitors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToast(`Exported ${filteredVisitors.length} record${filteredVisitors.length === 1 ? "" : "s"}`);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .form-title { font-family: 'Space Grotesk', sans-serif; }
        .mono-badge { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }

        .cvl-scroll { scrollbar-width: thin; scrollbar-color: ${scrollThumb} transparent; }
        .cvl-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .cvl-scroll::-webkit-scrollbar-track { background: transparent; }
        .cvl-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .cvl-scroll::-webkit-scrollbar-thumb:hover { background-color: ${scrollThumbHover}; }

        /* ---- react-datepicker theming to match the modal chrome ---- */
        .cvl-datepicker-popper { z-index: 60; font-family: inherit; }
        .cvl-datepicker-popper .react-datepicker {
          background: ${rd.bg};
          border: 1px solid ${rd.border};
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 45px -15px rgba(0,0,0,0.45);
          color: ${rd.text};
          display: flex;
        }
        .cvl-datepicker-popper .react-datepicker__triangle { display: none; }
        .cvl-datepicker-popper .react-datepicker__header {
          background: transparent;
          border-bottom: 1px solid ${rd.border};
          padding-top: 0.75rem;
        }
        .cvl-datepicker-popper .react-datepicker__current-month {
          color: ${rd.text}; font-weight: 600; font-size: 0.8rem;
        }
        .cvl-datepicker-popper .react-datepicker__day-name { color: ${rd.muted}; font-size: 0.7rem; }
        .cvl-datepicker-popper .react-datepicker__day { color: ${rd.text}; border-radius: 0.5rem; }
        .cvl-datepicker-popper .react-datepicker__day:hover { background: ${rd.hover}; }
        .cvl-datepicker-popper .react-datepicker__day--outside-month { color: ${rd.muted}; opacity: 0.5; }
        .cvl-datepicker-popper .react-datepicker__day--in-range,
        .cvl-datepicker-popper .react-datepicker__day--in-selecting-range {
          background: ${rd.hover}; color: ${rd.text};
        }
        .cvl-datepicker-popper .react-datepicker__day--selected,
        .cvl-datepicker-popper .react-datepicker__day--range-start,
        .cvl-datepicker-popper .react-datepicker__day--range-end,
        .cvl-datepicker-popper .react-datepicker__day--keyboard-selected {
          background: ${rd.accent}; color: ${rd.accentText}; font-weight: 600;
        }
        .cvl-datepicker-popper .react-datepicker__navigation-icon::before { border-color: ${rd.muted}; }
        .cvl-datepicker-popper .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: ${rd.accent};
        }
      `}</style>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                className={`w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.modalBg} ${theme.borderColor}`}
              >
                {/* hairline accent */}
                <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${theme.rowHairline} to-transparent shrink-0`} />

                {/* HEADER */}
                <div className={`shrink-0 border-b ${theme.headerBg}`}>
                  <div className="flex items-center gap-3 p-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="form-title text-[15px] font-semibold leading-tight">
                        Completed Visitors
                      </Dialog.Title>
                      <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                        {filteredVisitors.length} completed visit{filteredVisitors.length === 1 ? "" : "s"}
                        {hasFilters ? " matching your filters" : " logged"}
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
                  <div className="px-4 pb-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 min-w-0">
                      <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.fieldIcon}`} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search visitor or person"
                        className={`w-full pl-9 py-2 text-sm rounded-lg border ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      />
                    </div>

                    <div className="relative sm:w-64">
                      <CalendarDaysIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${theme.fieldIcon}`} />
                      <DatePicker
                        selectsRange
                        startDate={startDate}
                        endDate={endDate}
                        onChange={setDateRange}
                        isClearable
                        placeholderText="Filter by date range"
                        popperClassName="cvl-datepicker-popper"
                        className={`w-full pl-9 py-2 text-sm rounded-lg border ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      />
                    </div>

                    <motion.button
                      onClick={handleExport}
                      disabled={filteredVisitors.length === 0}
                      whileHover={filteredVisitors.length ? { scale: 1.02 } : {}}
                      whileTap={filteredVisitors.length ? { scale: 0.98 } : {}}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${theme.btnPrimary}`}
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Export CSV
                    </motion.button>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-4 sm:p-6 flex-1 min-h-0 flex flex-col">
                  {filteredVisitors.length === 0 ? (
                    <EmptyState theme={theme} hasFilters={hasFilters} />
                  ) : (
                    <div className={`cvl-scroll rounded-xl border overflow-auto flex-1 ${theme.tableWrap}`}>
                      <table className="w-full min-w-[860px] border-collapse text-sm">
                        <thead className={`sticky top-0 z-10 ${theme.theadBg}`}>
                          <tr className={`border-b ${theme.rowBorder}`}>
                            {["Visitor", "Visiting", "Branch", "Date", "Time In", "Time Out", "Duration", "Status"].map((col) => (
                              <th
                                key={col}
                                className={`text-left font-semibold text-[11px] uppercase tracking-wider px-4 py-3 whitespace-nowrap ${theme.mutedText}`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVisitors.map((visitor) => {
                            const highlighted = isInRange(visitor.date);
                            return (
                              <tr
                                key={visitor.id}
                                className={`border-b last:border-b-0 transition-colors ${theme.rowBorder} ${
                                  highlighted ? theme.rowHighlight : theme.rowHover
                                }`}
                              >
                                <td className="px-4 py-3 font-medium whitespace-nowrap">{visitor.visitorName}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${theme.mutedText}`}>{visitor.personToVisit}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${theme.mutedText}`}>{visitor.branch || "—"}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${theme.mutedText}`}>
                                  {new Date(visitor.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap mono-badge">{visitor.timeIn}</td>
                                <td className="px-4 py-3 whitespace-nowrap mono-badge">{visitor.timeOut}</td>
                                <td className={`px-4 py-3 whitespace-nowrap mono-badge ${theme.mutedText}`}>
                                  {formatDuration(visitor.timeIn, visitor.timeOut)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <CompletedBadge theme={theme} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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