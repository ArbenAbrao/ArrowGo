// src/Components/Visitors/ArchivedRequestsModal.jsx
//
// Holds appointment requests whose visit date has passed. Each one can be
// restored (with a new visit date, otherwise it would just expire again) or
// deleted permanently.
//
// Backend contract this expects (see visitors.jsx for the calls):
//   GET    /api/appointment-requests/archived      (?branch=)  -> archived rows
//   PUT    /api/appointment-requests/:id/archive               -> archived = 1
//   PUT    /api/appointment-requests/:id/restore   { <dateField>: "YYYY-MM-DD" }
//                                                   -> archived = 0, new date saved
//   DELETE /api/appointment-requests/:id                        -> hard delete
//   and GET /api/appointment-requests/approved must skip archived rows.
//
// Wiring in VisitorsHeader — drop this next to your Appointment Requests button:
//   import { ArchiveButton } from "./ArchivedRequestsModal";
//   <ArchiveButton
//     count={archivedCount}
//     onClick={() => setIsArchiveModalOpen(true)}
//     darkMode={darkMode}
//   />

import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatDate,
  formatTime,
  getAppointmentDate,
  getAppointmentDateTime,
  getScheduleTime,
  msSinceExpiry,
  toInputDate,
} from "./appointmentUtils";

// Appointment rows use snake_case columns (visitor_name, person_to_visit, ...);
// the camelCase fallbacks are just in case. One place to adjust if that changes.
const describe = (a) => ({
  name: a.visitor_name || a.visitorName || a.name || "Unnamed visitor",
  personToVisit: a.person_to_visit || a.personToVisit || "",
  company: a.company || "",
  purpose: a.purpose || "",
  branch: a.branch || "",
});

/* ------------------------------------------------------------------ */
/* Header button                                                       */
/* ------------------------------------------------------------------ */
export function ArchiveButton({ count = 0, onClick, darkMode = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition ${
        darkMode
          ? "border-slate-700 text-slate-100 hover:bg-slate-800"
          : "border-slate-300 text-slate-700 hover:bg-slate-100"
      }`}
    >
      <ArchiveBoxIcon className="w-4 h-4" />
      Archive
      {count > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */
export default function ArchivedRequestsModal({
  isOpen,
  onClose,
  archivedRequests = [],
  onRestore, // async (request, newDate) => void — throw to signal failure
  onDelete, // async (id) => void
  onDeleteAll, // async () => void
  darkMode = true,
}) {
  const [search, setSearch] = useState("");
  const [restoreId, setRestoreId] = useState(null); // row with reschedule panel open
  const [restoreDate, setRestoreDate] = useState("");
  const [deleteId, setDeleteId] = useState(null); // row awaiting delete confirmation
  const [confirmClear, setConfirmClear] = useState(false);
  const [busyId, setBusyId] = useState(null); // a request id, or "all"
  const [error, setError] = useState("");

  const theme = darkMode
    ? {
        modalBg: "bg-slate-950 text-slate-100",
        headerBg: "bg-slate-900/70 backdrop-blur-xl border-slate-800",
        iconBadge:
          "bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_18px_-4px_rgba(245,158,11,0.4)]",
        cardBg: "bg-white/[0.02] border-slate-800/80",
        inputBg: "bg-slate-900/60 text-slate-100 border-slate-800 [color-scheme:dark]",
        textColor: "text-slate-100",
        bodyText: "text-slate-300",
        mutedText: "text-slate-500",
        borderColor: "border-slate-800",
        btnSecondary: "border border-slate-700 text-slate-100 hover:bg-slate-800",
        btnRestore: "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnDanger: "bg-rose-500 text-white hover:bg-rose-600",
        btnTrash: "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10",
        btnGhostDanger: "text-rose-400 hover:bg-rose-500/10",
        expiredChip: "bg-amber-500/10 text-amber-400 border-amber-500/25",
        dangerPanel: "bg-rose-500/5 border-rose-500/25 text-rose-200",
        errorBar: "bg-rose-500/10 border-rose-500/25 text-rose-300",
        dangerText: "text-rose-300",
      }
    : {
        modalBg: "bg-white text-slate-900",
        headerBg: "bg-white/80 backdrop-blur-xl border-slate-200",
        iconBadge:
          "bg-amber-50 border-amber-200 text-amber-600 shadow-[0_0_14px_-6px_rgba(245,158,11,0.35)]",
        cardBg: "bg-slate-50/60 border-slate-200",
        inputBg: "bg-slate-50 text-slate-900 border-slate-200",
        textColor: "text-slate-900",
        bodyText: "text-slate-600",
        mutedText: "text-slate-500",
        borderColor: "border-slate-200",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        btnRestore: "border border-emerald-500/50 text-emerald-700 hover:bg-emerald-50",
        btnPrimary: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600",
        btnDanger: "bg-rose-500 text-white hover:bg-rose-600",
        btnTrash: "text-slate-400 hover:text-rose-600 hover:bg-rose-50",
        btnGhostDanger: "text-rose-600 hover:bg-rose-50",
        expiredChip: "bg-amber-50 text-amber-700 border-amber-200",
        dangerPanel: "bg-rose-50 border-rose-200 text-rose-800",
        errorBar: "bg-rose-50 border-rose-200 text-rose-700",
        dangerText: "text-rose-700",
      };

  const scrollThumb = darkMode ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.4)";

  const resetTransient = () => {
    setSearch("");
    setRestoreId(null);
    setDeleteId(null);
    setConfirmClear(false);
    setError("");
  };

  const handleClose = () => {
    resetTransient();
    onClose();
  };

  // Most recently expired first.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const time = (a) => getAppointmentDateTime(a)?.getTime() ?? 0;
    return archivedRequests
      .filter((a) => {
        if (!term) return true;
        const v = describe(a);
        return [v.name, v.company, v.personToVisit, v.purpose].some((x) =>
          x.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => time(b) - time(a));
  }, [archivedRequests, search]);

  // Runs an async action with the shared busy/error handling.
  const run = async (id, action, failMessage) => {
    setBusyId(id);
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      console.error(failMessage, err);
      setError(failMessage);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const openRestore = (a) => {
    setDeleteId(null);
    setError("");
    setRestoreId(a.id);
    setRestoreDate(toInputDate());
  };

  const openDelete = (a) => {
    setRestoreId(null);
    setError("");
    setDeleteId(a.id);
  };

  const confirmRestore = async (a) => {
    if (!restoreDate) return;
    const ok = await run(
      a.id,
      () => onRestore(a, restoreDate),
      "Couldn't restore that request. Try again."
    );
    if (ok) setRestoreId(null);
  };

  const confirmDelete = async (a) => {
    const ok = await run(
      a.id,
      () => onDelete(a.id),
      "Couldn't delete that request. Try again."
    );
    if (ok) setDeleteId(null);
  };

  const clearAll = async () => {
    const ok = await run(
      "all",
      () => onDeleteAll(),
      "Some requests couldn't be deleted. Try again."
    );
    if (ok) setConfirmClear(false);
  };

  const expiredLabel = (a) => {
    const ms = msSinceExpiry(a);
    if (ms === null || ms < 0) return "Archived";
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return "Expired just now";
    if (hours < 24) return `Expired ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
  };

  const focusRing =
    "focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .archive-title { font-family: 'Space Grotesk', sans-serif; }
        .archive-scroll { scrollbar-width: thin; scrollbar-color: ${scrollThumb} transparent; }
        .archive-scroll::-webkit-scrollbar { width: 8px; }
        .archive-scroll::-webkit-scrollbar-track { background: transparent; }
        .archive-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          {/* Overlay */}
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

          <div className="fixed inset-0 flex items-center justify-center p-4">
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
                className={`w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.modalBg} ${theme.borderColor}`}
              >
                {/* hairline accent */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/70 to-transparent shrink-0" />

                {/* Header */}
                <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${theme.headerBg}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                    <ArchiveBoxIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="archive-title text-[15px] font-semibold leading-tight">
                      Archived requests
                    </Dialog.Title>
                    <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                      Expired appointments. Restore with a new date, or delete for good.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close"
                    className={`ml-auto flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.borderColor} ${theme.mutedText}`}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                {archivedRequests.length > 0 && (
                  <div className="p-4 pb-0 shrink-0">
                    <div className="relative">
                      <MagnifyingGlassIcon
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.mutedText}`}
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, company, or who they were visiting"
                        className={`border p-2.5 pl-9 w-full rounded-lg text-sm ${theme.inputBg} ${focusRing} transition`}
                      />
                    </div>
                  </div>
                )}

                {/* List */}
                <div className="archive-scroll flex-1 overflow-y-auto p-4">
                  {archivedRequests.length === 0 ? (
                    <div className="py-14 flex flex-col items-center text-center">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border mb-4 ${theme.borderColor} ${theme.mutedText}`}>
                        <ArchiveBoxIcon className="w-6 h-6" />
                      </span>
                      <p className="archive-title text-sm font-semibold">Nothing archived</p>
                      <p className={`text-xs mt-1 max-w-xs ${theme.mutedText}`}>
                        Approved requests that never timed in move here automatically, 24 hours after their scheduled time.
                      </p>
                    </div>
                  ) : visible.length === 0 ? (
                    <p className={`py-10 text-center text-sm ${theme.mutedText}`}>
                      No archived requests match “{search}”.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      <AnimatePresence initial={false}>
                        {visible.map((a) => {
                          const date = getAppointmentDate(a);
                          const busy = busyId === a.id || busyId === "all";
                          const v = describe(a);
                          const name = v.name;
                          const time = formatTime(getScheduleTime(a));

                          return (
                            <motion.li
                              key={a.id}
                              layout="position"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, x: -24 }}
                              transition={{ duration: 0.2 }}
                              className={`rounded-xl border p-4 ${theme.cardBg}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="archive-title text-[15px] font-semibold truncate">{name}</p>
                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${theme.expiredChip}`}>
                                      {expiredLabel(a)}
                                    </span>
                                  </div>

                                  <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs ${theme.bodyText}`}>
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarDaysIcon className={`w-3.5 h-3.5 ${theme.mutedText}`} />
                                      {formatDate(date)}
                                    </span>
                                    {time && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <ClockIcon className={`w-3.5 h-3.5 ${theme.mutedText}`} />
                                        {time}
                                      </span>
                                    )}
                                    {v.company && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <BuildingOfficeIcon className={`w-3.5 h-3.5 ${theme.mutedText}`} />
                                        {v.company}
                                      </span>
                                    )}
                                    {v.personToVisit && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <UserGroupIcon className={`w-3.5 h-3.5 ${theme.mutedText}`} />
                                        {v.personToVisit}
                                      </span>
                                    )}
                                    {v.branch && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPinIcon className={`w-3.5 h-3.5 ${theme.mutedText}`} />
                                        {v.branch}
                                      </span>
                                    )}
                                  </div>

                                  {v.purpose && (
                                    <p className={`mt-1.5 text-xs truncate ${theme.mutedText}`}>{v.purpose}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openRestore(a)}
                                    disabled={busy}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${theme.btnRestore}`}
                                  >
                                    <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDelete(a)}
                                    disabled={busy}
                                    aria-label={`Delete ${name} permanently`}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50 ${theme.btnTrash}`}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Restore: pick a new visit date */}
                              <AnimatePresence initial={false}>
                                {restoreId === a.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`mt-3 pt-3 border-t flex flex-wrap items-end gap-3 ${theme.borderColor}`}>
                                      <div>
                                        <label
                                          htmlFor={`restore-date-${a.id}`}
                                          className={`block text-xs mb-1.5 ${theme.mutedText}`}
                                        >
                                          New visit date
                                        </label>
                                        <input
                                          id={`restore-date-${a.id}`}
                                          type="date"
                                          min={toInputDate()}
                                          value={restoreDate}
                                          onChange={(e) => setRestoreDate(e.target.value)}
                                          className={`border px-2.5 py-2 rounded-lg text-sm ${theme.inputBg} ${focusRing} transition`}
                                        />
                                      </div>
                                      <div className="flex gap-2 ml-auto">
                                        <button
                                          type="button"
                                          onClick={() => setRestoreId(null)}
                                          disabled={busy}
                                          className={`px-3 py-2 rounded-lg text-xs font-semibold ${theme.btnSecondary}`}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => confirmRestore(a)}
                                          disabled={busy || !restoreDate}
                                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${theme.btnPrimary}`}
                                        >
                                          {busy ? "Restoring…" : "Restore request"}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Delete: confirm */}
                              <AnimatePresence initial={false}>
                                {deleteId === a.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`mt-3 rounded-lg border px-3 py-2.5 flex flex-wrap items-center gap-3 ${theme.dangerPanel}`}>
                                      <p className="text-xs">Delete this request permanently? This can’t be undone.</p>
                                      <div className="flex gap-2 ml-auto">
                                        <button
                                          type="button"
                                          onClick={() => setDeleteId(null)}
                                          disabled={busy}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.btnSecondary}`}
                                        >
                                          Keep it
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => confirmDelete(a)}
                                          disabled={busy}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${theme.btnDanger}`}
                                        >
                                          {busy ? "Deleting…" : "Delete permanently"}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className={`mx-4 mb-3 rounded-lg border px-3 py-2 text-xs shrink-0 ${theme.errorBar}`} role="alert">
                    {error}
                  </div>
                )}

                {/* Footer */}
                <div className={`flex flex-wrap items-center gap-3 p-4 border-t shrink-0 ${theme.headerBg}`}>
                  <p className={`text-xs ${theme.mutedText}`}>
                    {archivedRequests.length} archived
                  </p>

                  <div className="ml-auto flex items-center gap-2">
                    {confirmClear ? (
                      <>
                        <span className={`text-xs ${theme.dangerText}`}>
                          Delete all {archivedRequests.length} permanently?
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          disabled={busyId === "all"}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold ${theme.btnSecondary}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={clearAll}
                          disabled={busyId === "all"}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${theme.btnDanger}`}
                        >
                          {busyId === "all" ? "Deleting…" : "Delete all"}
                        </button>
                      </>
                    ) : (
                      <>
                        {archivedRequests.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRestoreId(null);
                              setDeleteId(null);
                              setError("");
                              setConfirmClear(true);
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${theme.btnGhostDanger}`}
                          >
                            Delete all
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleClose}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold ${theme.btnSecondary}`}
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}