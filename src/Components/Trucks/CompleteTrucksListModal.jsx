// src/Components/Trucks/CompleteTrucksListModal.jsx
import { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import {
  TruckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  ClockIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const rowVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

/* ====================================================================
   MULTI-LEG HELPERS
   ====================================================================
   Mirrors the same rule used in Trucks.jsx / TruckGrid.jsx. An OUT_IN
   entry moves through 4 timestamped moments (2 branches, in and out
   each) instead of the single Time In / Time Out pair that IN_OUT
   entries use — so "completed" and "what do we show" both need to
   branch on flowType here too.
==================================================================== */

// Defensive normalizer: string fields coming from the backend (flowType,
// currentStage) are compared with strict === elsewhere in the app. If the
// backend ever sends a slightly different case or stray whitespace ("out_in",
// " OUT_IN", "completed"), that strict check silently fails — which either
// hides a genuinely finished trip, or worse, lets a trip that ISN'T actually
// finished slip through as "complete" because isJourneyComplete falls back
// to the looser !!(timeIn && timeOut) check for anything it doesn't
// recognize as multi-leg. Normalizing here closes that gap so the "is it
// complete / which flow is it" logic can't misclassify an entry.
const normalize = (v) => (typeof v === "string" ? v.trim().toUpperCase() : v);

const isMultiLeg = (t) => normalize(t.flowType) === "OUT_IN";

// The moment this entry actually finished, for display + default sort.
// IN_OUT's last action is its Time Out; OUT_IN's last action is Leg 3's
// Time In (the truck arriving back home).
function getCompletedAt(t) {
  if (isMultiLeg(t)) {
    return { time: t.leg3TimeIn, date: t.leg3TimeInDate };
  }
  return { time: t.timeOut, date: t.timeOutDate || t.date };
}

// The 4 timestamped legs of an OUT_IN trip, in order, each tagged with
// which branch performed it — this is the "show all the info" data
// that never had anywhere to live in the old single Time In/Time Out
// table.
function getLegs(t) {
  return [
    { key: "leg1", label: "Time Out", branch: t.branchRegistered, time: t.leg1TimeOut, date: t.leg1TimeOutDate },
    { key: "leg2in", label: "Time In", branch: t.destinationBranch, time: t.leg2TimeIn, date: t.leg2TimeInDate },
    { key: "leg2out", label: "Time Out", branch: t.destinationBranch, time: t.leg2TimeOut, date: t.leg2TimeOutDate },
    { key: "leg3", label: "Time In", branch: t.branchRegistered, time: t.leg3TimeIn, date: t.leg3TimeInDate },
  ];
}

// A row belongs in this list once its full journey is done. For IN_OUT
// that's still just "both timestamps present". For OUT_IN it needs BOTH
// currentStage === COMPLETED *and* every one of the 4 leg timestamps to
// actually be filled in — relying on currentStage alone let backend
// records through where the stage got advanced to COMPLETED but a leg's
// time (usually Leg 2 or Leg 3) never actually got saved, which showed
// up as "completed" rows with dashes instead of real times. This is the
// stricter, trustworthy check.
const isJourneyComplete = (t) =>
  isMultiLeg(t)
    ? normalize(t.currentStage) === "COMPLETED" && getLegs(t).every((leg) => !!leg.time)
    : !!(t.timeIn && t.timeOut);

// Total time the truck spent away from its home branch, home-out to
// home-in. Real information the old table had no way to surface at
// all — every leg was invisible outside its own branch's view.
function getTripDuration(t) {
  if (!isMultiLeg(t)) return null;
  const legs = getLegs(t);
  const start = legs[0];
  const end = legs[3];
  if (!start.time || !start.date || !end.time || !end.date) return null;

  const startDt = new Date(`${start.date} ${start.time}`);
  const endDt = new Date(`${end.date} ${end.time}`);
  if (isNaN(startDt) || isNaN(endDt) || endDt < startDt) return null;

  const diffMs = endDt - startDt;
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.round((diffMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Human-readable label for the selected date range, e.g. "Aug 1 – Aug 28, 2026"
// or "From Aug 1, 2026" / "Through Aug 28, 2026" if only one end is set.
function formatDateRange(start, end) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  if (start && end) {
    const sameYear = start.getFullYear() === end.getFullYear();
    const startLabel = start.toLocaleDateString(
      "en-US",
      sameYear ? { month: "short", day: "numeric" } : opts
    );
    const endLabel = end.toLocaleDateString("en-US", opts);
    return `${startLabel} – ${endLabel}`;
  }
  if (start) return `From ${start.toLocaleDateString("en-US", opts)}`;
  if (end) return `Through ${end.toLocaleDateString("en-US", opts)}`;
  return "";
}

function getHelpersArray(t) {
  if (Array.isArray(t.helpers)) return t.helpers.filter(Boolean);
  const raw = t.helper ?? t.helpers;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Header label -> sort key. Trimmed to the columns that stay visible in
// the collapsed row — everything else lives in the detail modal now, so
// it doesn't need a sortable header.
const COLUMN_KEY = {
  Client: "clientName",
  Vehicle: "plateNumber",
  Route: "branchRegistered",
  Driver: "driver",
  Flow: "flowType",
  Completed: "date",
};

const COLUMNS = ["Client", "Vehicle", "Route", "Driver", "Flow", "Completed"];

export default function CompleteTrucksListModal({
  open,
  onClose,
  trucks: initialTrucks,
  selectedClient,
  setSelectedClient,
  onExport,
  darkMode = true,
  mode, // optional back-compat: "IN_OUT" | "OUT_IN" seeds the Flow filter below
}) {
  const [trucks, setTrucks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc", // newest first
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // ---------------------------------------------------------------------
  // Detail view.
  //
  // Deliberately a single value, not a Set/array of "expanded" ids. That
  // is what makes "only one can be open at a time" a structural
  // guarantee rather than something we have to remember to enforce:
  // clicking any row simply overwrites whatever truck was being viewed,
  // there is no code path that can end up with two detail views active
  // at once. Closing the list modal also clears it, so a stale detail
  // panel can never survive a re-open of the parent modal.
  // ---------------------------------------------------------------------
  const [viewingTruck, setViewingTruck] = useState(null);

  // Flow is a filter, not a separate modal instance — OUT_IN entries
  // live in the same list as IN_OUT ones, just tagged differently.
  const [flowFilter, setFlowFilter] = useState(mode === "OUT_IN" ? "OUT_IN" : mode === "IN_OUT" ? "IN_OUT" : "ALL");

  const ITEMS_PER_PAGE = 8;

  useEffect(() => setTrucks(initialTrucks), [initialTrucks]);
  useEffect(() => setCurrentPage(1), [selectedClient, dateRange, searchTerm, flowFilter]);

  // Parent modal closed -> make sure no detail view can linger open
  // underneath / after it, and don't reopen stale data next time.
  useEffect(() => {
    if (!open) setViewingTruck(null);
  }, [open]);

  const getFlow = (t) => (isMultiLeg(t) ? "OUT_IN" : "IN_OUT");

  const filtered = useMemo(() => {
    let data = [...trucks];

    data = data.filter(isJourneyComplete);

    if (flowFilter !== "ALL") {
      data = data.filter((t) => getFlow(t) === flowFilter);
    }

    if (selectedClient) {
      const clientNormalized = selectedClient.trim().toLowerCase();
      data = data.filter(
        (t) => (t.clientName || "").trim().toLowerCase() === clientNormalized
      );
    }

    if (startDate || endDate) {
      data = data.filter((t) => {
        // Filter against the date this entry actually *completed* on
        // (same value the Completed column shows), not its original
        // registration date — for OUT_IN entries those can be different
        // days entirely, which is what made the date filter look broken.
        const completedDate = getCompletedAt(t).date;
        if (!completedDate) return false;

        const truckDate = new Date(completedDate);
        if (isNaN(truckDate)) return false;
        truckDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (truckDate < start) return false;
        }
        if (endDate) {
          // Inclusive of the whole end day.
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (truckDate > end) return false;
        }
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((t) =>
        `${t.clientName || ""}
         ${t.branchRegistered || ""}
         ${t.destinationBranch || ""}
         ${t.truckType || ""}
         ${t.plateNumber || ""}
         ${t.bay || ""}
         ${t.driver || ""}
         ${t.purpose || ""}
         ${t.vehicleId || ""}
         ${getHelpersArray(t).join(" ")}`
          .toLowerCase()
          .includes(term)
      );
    }

    // Keep only the most-recently-completed entry per plate number, so a
    // truck that's been used across multiple separate completed trips
    // doesn't show up as several rows — only its latest trip does.
    const latestByPlate = new Map();
    data.forEach((t) => {
      const plateKey = (t.plateNumber || "").trim().toLowerCase();
      if (!plateKey) return;
      const existing = latestByPlate.get(plateKey);
      if (!existing) {
        latestByPlate.set(plateKey, t);
        return;
      }
      const existingC = getCompletedAt(existing);
      const currentC = getCompletedAt(t);
      const existingDt = new Date(`${existingC.date || ""} ${existingC.time || ""}`);
      const currentDt = new Date(`${currentC.date || ""} ${currentC.time || ""}`);
      if (currentDt > existingDt) latestByPlate.set(plateKey, t);
    });
    data = [...latestByPlate.values()];

    if (sortConfig.key) {
      data.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Sort by each entry's actual completion moment — same value
        // getCompletedAt() and the date-range filter above use — so
        // sorting, filtering, and what's on screen always agree.
        if (sortConfig.key === "date") {
          const aC = getCompletedAt(a);
          const bC = getCompletedAt(b);
          valA = new Date(`${aC.date || ""} ${aC.time || ""}`);
          valB = new Date(`${bC.date || ""} ${bC.time || ""}`);
        }

        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";

        if (valA instanceof Date || valB instanceof Date) {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }

        return sortConfig.direction === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return data;
  }, [trucks, selectedClient, startDate, endDate, searchTerm, sortConfig, flowFilter]);

  // Only list clients that actually have at least one completed entry —
  // pulling from the full `trucks` list meant the dropdown could offer
  // clients with zero completed trips, which just produced a confusing
  // "no results" every time they were picked.
  const clientOptions = useMemo(
    () => [...new Set(trucks.filter(isJourneyComplete).map((t) => t.clientName).filter(Boolean))].sort(),
    [trucks]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // If a re-filter / page change makes the currently-viewed truck fall
  // out of the visible set, drop the detail view instead of leaving it
  // pointing at a row the user can no longer see behind it.
  useEffect(() => {
    if (!viewingTruck) return;
    const stillThere = filtered.some((t) => (t.id ?? t) === (viewingTruck.id ?? viewingTruck));
    if (!stillThere) setViewingTruck(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const handleSort = (header) => {
    const key = COLUMN_KEY[header] || "date";
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((t) => t.id));
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected trucks?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => axios.delete(`${API_URL}/api/trucks/${id}`)));
      setTrucks((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      // If the truck currently open in the detail modal just got deleted,
      // close the detail modal too instead of leaving it showing a row
      // that no longer exists.
      setViewingTruck((prev) => (prev && selectedIds.includes(prev.id) ? null : prev));
      setSelectedIds([]);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert("Some trucks could not be deleted.");
    }
  };

  const highlight = (text) => {
    if (!searchTerm || !text) return text;
    return text
      .toString()
      .split(new RegExp(`(${searchTerm})`, "gi"))
      .map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={i} className="bg-amber-400/30 text-amber-300 rounded px-0.5 font-semibold">
            {part}
          </span>
        ) : (
          part
        )
      );
  };

  // ================= THEME =================
  // Same tokens as AddTruckModal / TruckGrid: slate-950/900 surfaces,
  // emerald as the primary accent, sky reserved for the Out→In flow
  // identity (badge + the multi-leg trip stepper below use the same
  // sky so the two read as one deliberate pairing, not two competing
  // accents).
  const theme = darkMode
    ? {
        modalBg: "bg-slate-950 text-slate-100 border-slate-800",
        headerBg: "bg-slate-900 border-slate-800",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        filterBg: "bg-slate-900 border-slate-800",
        tableHeader: "bg-slate-900 text-slate-400 border-slate-800",
        tableRowEven: "bg-slate-950",
        tableRowOdd: "bg-slate-900/40",
        rowHover: "hover:bg-emerald-500/[0.04]",
        rowActive: "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/30",
        border: "border-slate-800",
        filterInput:
          "bg-slate-800/70 text-slate-100 border-slate-700 placeholder-slate-500 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        chipActive: "bg-emerald-400 text-slate-950 border-emerald-400",
        chipInactive: "border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200",
        paginationActive: "bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]",
        paginationInactive: "border-slate-700 text-slate-300 hover:bg-slate-800",
        mutedText: "text-slate-500",
        internalBadge: "bg-emerald-500/15 text-emerald-400",
        flowInOut: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/25",
        flowOutIn: "bg-sky-500/12 text-sky-400 border border-sky-500/25",
        footerBg: "bg-slate-950/90",
        deleteBtn: "bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25",
        exportBtn: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        detailBg: "bg-slate-900/60",
        statCard: "bg-white/[0.03] border-slate-800",
        stepperDot: "bg-sky-400",
        stepperLine: "bg-sky-400/30",
        legTime: "text-sky-300",
        detailModalBg: "bg-slate-950 text-slate-100 border-slate-800",
      }
    : {
        modalBg: "bg-white text-slate-900 border-slate-200",
        headerBg: "bg-white border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        filterBg: "bg-slate-50 border-slate-200",
        tableHeader: "bg-slate-50 text-slate-500 border-slate-200",
        tableRowEven: "bg-white",
        tableRowOdd: "bg-slate-50/60",
        rowHover: "hover:bg-emerald-50/60",
        rowActive: "bg-emerald-50 ring-1 ring-inset ring-emerald-300",
        border: "border-slate-200",
        filterInput:
          "bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:ring-emerald-400 focus:border-emerald-400",
        chipActive: "bg-emerald-500 text-white border-emerald-500",
        chipInactive: "border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-slate-800",
        paginationActive: "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
        paginationInactive: "border-slate-300 text-slate-600 hover:bg-slate-100",
        mutedText: "text-slate-500",
        internalBadge: "bg-emerald-50 text-emerald-600",
        flowInOut: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        flowOutIn: "bg-sky-50 text-sky-600 border border-sky-200",
        footerBg: "bg-white/90",
        deleteBtn: "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100",
        exportBtn: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        detailBg: "bg-slate-50/80",
        statCard: "bg-white border-slate-200",
        stepperDot: "bg-sky-500",
        stepperLine: "bg-sky-500/25",
        legTime: "text-sky-600",
        detailModalBg: "bg-white text-slate-900 border-slate-200",
      };

  const FLOW_TABS = [
    { key: "ALL", label: "All" },
    { key: "IN_OUT", label: "In → Out" },
    { key: "OUT_IN", label: "Out → In" },
  ];

  // Compact 4-dot trip stepper for the Flow cell — a glanceable readout
  // of an OUT_IN entry's full journey without needing to open the detail
  // modal. Every dot is filled here since this modal only ever shows
  // completed trips, so all 4 legs are guaranteed to have a timestamp;
  // the tooltip spells out exactly when + where each one happened.
  const TripStepper = ({ truck }) => {
    const legs = getLegs(truck);
    const tooltip = legs
      .map((l) => `${l.branch || "—"} ${l.label}: ${l.time || "—"}`)
      .join("  →  ");

    return (
      <div className="flex items-center gap-0.5 mt-1.5" title={tooltip}>
        {legs.map((leg, i) => (
          <Fragment key={leg.key}>
            {i > 0 && <span className={`w-2.5 h-[1.5px] ${theme.stepperLine}`} />}
            <span className={`h-1.5 w-1.5 rounded-full ${leg.time ? theme.stepperDot : "bg-slate-700"}`} />
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Dark-mode override for react-datepicker's popup, which otherwise
              stays hard-coded light and clashes badly against the slate-950
              modal it now opens from. */}
          {darkMode && (
            <style>{`
              .react-datepicker { background:#0f172a; border-color:#1e293b; font-family:inherit; }
              .react-datepicker__header { background:#0b1424; border-color:#1e293b; }
              .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { color:#cbd5e1; }
              .react-datepicker__day { color:#e2e8f0; }
              .react-datepicker__day:hover { background:rgba(52,211,153,0.15); }
              .react-datepicker__day--selected, .react-datepicker__day--in-range, .react-datepicker__day--keyboard-selected { background:#34d399; color:#04130d; }
              .react-datepicker__day--disabled { color:#475569; }
              .react-datepicker__triangle::before, .react-datepicker__triangle::after { border-bottom-color:#0b1424 !important; }
            `}</style>
          )}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
            .ctl-title { font-family: 'Space Grotesk', sans-serif; }
            .ctl-tabular { font-variant-numeric: tabular-nums; }
          `}</style>

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

          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.modalBg}`}
              >
                {/* HEADER */}
                <div className={`flex justify-between items-center px-5 sm:px-6 py-4 border-b ${theme.headerBg}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                      <TruckIcon className="w-5 h-5" />
                    </span>
                    <div>
                      <Dialog.Title className="ctl-title text-[15px] font-semibold leading-tight">
                        Completed Vehicle List
                      </Dialog.Title>
                      <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                        {filtered.length} completed {filtered.length === 1 ? "entry" : "entries"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.border} ${theme.mutedText}`}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* FLOW TABS */}
                <div className={`flex items-center gap-2 px-5 sm:px-6 pt-4 pb-1 ${theme.headerBg}`}>
                  {FLOW_TABS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFlowFilter(f.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition
                        ${flowFilter === f.key ? theme.chipActive : theme.chipInactive}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* FILTERS */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className={`flex flex-wrap gap-3 px-5 sm:px-6 py-4 border-b ${theme.filterBg} ${theme.border}`}
                >
                  <select
                    value={selectedClient || ""}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className={`h-10 border px-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition ${theme.filterInput}`}
                  >
                    <option value="">All Clients</option>
                    {clientOptions.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    isClearable
                    placeholderText="Select date range"
                    dateFormat="MM/dd/yyyy"
                    popperPlacement="bottom-start"
                    popperClassName="z-[9999]"
                    className={`h-10 border px-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition ${theme.filterInput}`}
                  />

                  <input
                    className={`h-10 border px-3 rounded-lg min-w-[240px] text-sm focus:outline-none focus:ring-2 transition ${theme.filterInput}`}
                    placeholder="Search client, plate, driver, helper..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="ml-auto flex gap-2">
                    {selectedIds.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={bulkDelete}
                        className={`h-10 px-4 rounded-lg text-sm font-semibold transition ${theme.deleteBtn}`}
                      >
                        Delete ({selectedIds.length})
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onExport}
                      className={`h-10 px-4 rounded-lg text-sm font-semibold transition ${theme.exportBtn}`}
                    >
                      Export CSV
                    </motion.button>
                  </div>
                </motion.div>

                {/* ACTIVE FILTERS — makes the current filter state (especially
                    the picked date range) visible at a glance instead of only
                    living inside the date picker's own closed input. */}
                {(startDate || endDate || selectedClient || searchTerm || flowFilter !== "ALL") && (
                  <div className={`flex flex-wrap items-center gap-2 px-5 sm:px-6 py-2.5 border-b ${theme.filterBg} ${theme.border}`}>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${theme.mutedText}`}>
                      Filters:
                    </span>

                    {(startDate || endDate) && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${theme.flowInOut}`}
                      >
                        {formatDateRange(startDate, endDate)}
                        <button
                          type="button"
                          onClick={() => setDateRange([null, null])}
                          className="hover:opacity-70"
                          aria-label="Clear date range"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedClient && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${theme.flowInOut}`}
                      >
                        {selectedClient}
                        <button
                          type="button"
                          onClick={() => setSelectedClient("")}
                          className="hover:opacity-70"
                          aria-label="Clear client filter"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {searchTerm && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${theme.flowInOut}`}
                      >
                        "{searchTerm}"
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="hover:opacity-70"
                          aria-label="Clear search"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {flowFilter !== "ALL" && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${theme.flowOutIn}`}
                      >
                        {FLOW_TABS.find((f) => f.key === flowFilter)?.label}
                        <button
                          type="button"
                          onClick={() => setFlowFilter("ALL")}
                          className="hover:opacity-70"
                          aria-label="Clear flow filter"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDateRange([null, null]);
                        setSelectedClient("");
                        setSearchTerm("");
                        setFlowFilter("ALL");
                      }}
                      className={`ml-auto text-xs font-semibold underline underline-offset-2 ${theme.mutedText} hover:opacity-80`}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* TABLE */}
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full min-w-[880px] text-sm border-collapse">
                    <thead className={`sticky top-0 z-10 border-b ${theme.tableHeader}`}>
                      <tr>
                        <th className={`px-4 py-3 border-b text-center w-10 ${theme.border}`}>
                          <input
                            type="checkbox"
                            className="accent-emerald-500"
                            onChange={toggleSelectAll}
                            checked={selectedIds.length === data.length && data.length > 0}
                          />
                        </th>
                        {COLUMNS.map((h) => (
                          <th
                            key={h}
                            onClick={() => handleSort(h)}
                            className={`px-4 py-3 border-b cursor-pointer whitespace-nowrap select-none
                              transition-colors duration-150 hover:text-emerald-400 ${theme.border}`}
                          >
                            <div className="flex items-center gap-1">
                              {h}
                              {sortConfig.key === COLUMN_KEY[h] &&
                                (sortConfig.direction === "asc" ? (
                                  <ArrowUpIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownIcon className="w-3.5 h-3.5" />
                                ))}
                            </div>
                          </th>
                        ))}
                        <th className={`px-4 py-3 border-b text-center w-10 ${theme.border}`}>
                          <span className="sr-only">Details</span>
                        </th>
                      </tr>
                    </thead>
                    <AnimatePresence>
                      <tbody>
                        {data.map((t, i) => {
                          const rowKey = t.id ?? i;
                          const multiLeg = isMultiLeg(t);
                          const isInternal =
                            t.branchRegistered &&
                            t.destinationBranch &&
                            t.branchRegistered === t.destinationBranch;
                          const completedAt = getCompletedAt(t);
                          const isActive = viewingTruck && (viewingTruck.id ?? viewingTruck) === (t.id ?? rowKey);

                          return (
                            <motion.tr
                              key={rowKey}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              onClick={() => setViewingTruck(t)}
                              className={`cursor-pointer transition-colors
                                ${isActive ? theme.rowActive : i % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd}
                                ${isActive ? "" : theme.rowHover}`}
                            >
                              <td
                                className={`p-3 border-b text-center ${theme.border}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="accent-emerald-500"
                                  checked={selectedIds.includes(t.id)}
                                  onChange={() => toggleSelect(t.id)}
                                />
                              </td>

                              {/* CLIENT */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>
                                <div className="font-medium">{highlight(t.clientName)}</div>
                                {(t.vehicleId) && (
                                  <div className={`text-[11px] font-mono mt-0.5 ${theme.mutedText}`}>
                                    {t.vehicleId}
                                  </div>
                                )}
                              </td>

                              {/* VEHICLE */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>
                                <div className="font-medium">{highlight(t.plateNumber)}</div>
                                <div className={`text-[11px] mt-0.5 ${theme.mutedText}`}>{t.truckType || "—"}</div>
                              </td>

                              {/* ROUTE */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>
                                {isInternal ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    {highlight(t.branchRegistered)}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${theme.internalBadge}`}>
                                      Internal
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                                    {highlight(t.branchRegistered)}
                                    <ArrowRightIcon className="w-3 h-3 opacity-50 shrink-0" />
                                    {highlight(t.destinationBranch)}
                                  </div>
                                )}
                              </td>

                              {/* DRIVER */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>{highlight(t.driver)}</td>

                              {/* FLOW */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
                                    ${multiLeg ? theme.flowOutIn : theme.flowInOut}`}
                                >
                                  {multiLeg ? "Out" : "In"}
                                  <ArrowRightIcon className="w-3 h-3" />
                                  {multiLeg ? "In" : "Out"}
                                </span>
                                {multiLeg && <TripStepper truck={t} />}
                              </td>

                              {/* COMPLETED */}
                              <td className={`p-3 border-b align-top ${theme.border}`}>
                                <div className="ctl-tabular font-medium">{completedAt.time || "—"}</div>
                                <div className={`text-[11px] mt-0.5 ${theme.mutedText}`}>
                                  {completedAt.date ? new Date(completedAt.date).toLocaleDateString() : "—"}
                                </div>
                              </td>

                              {/* VIEW DETAILS */}
                              <td className={`p-3 border-b text-center ${theme.border}`}>
                                <ArrowsPointingOutIcon
                                  className={`w-4 h-4 mx-auto ${isActive ? theme.mutedText : theme.mutedText} opacity-70`}
                                />
                              </td>
                            </motion.tr>
                          );
                        })}

                        {!data.length && (
                          <tr>
                            <td colSpan={COLUMNS.length + 2} className={`p-10 text-center text-sm ${theme.mutedText}`}>
                              No completed entries match these filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </AnimatePresence>
                  </table>
                </div>

                {/* PAGINATION */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`shrink-0 border-t px-5 sm:px-6 py-3 flex items-center justify-between backdrop-blur ${theme.border} ${theme.footerBg}`}
                >
                  <span className={`text-sm ${theme.mutedText}`}>
                    Page <span className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{currentPage}</span> of{" "}
                    <span className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{totalPages || 1}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={currentPage === 1 ? {} : { scale: 1.05 }}
                      whileTap={currentPage === 1 ? {} : { scale: 0.95 }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className={`px-4 py-1.5 rounded-full border text-sm font-medium transition
                        ${currentPage === 1 ? "opacity-40 cursor-not-allowed " + theme.paginationInactive : theme.paginationInactive}`}
                    >
                      Prev
                    </motion.button>

                    <motion.button
                      whileHover={currentPage === totalPages || totalPages === 0 ? {} : { scale: 1.05 }}
                      whileTap={currentPage === totalPages || totalPages === 0 ? {} : { scale: 0.95 }}
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className={`px-4 py-1.5 rounded-full border text-sm font-medium transition
                        ${
                          currentPage === totalPages || totalPages === 0
                            ? "opacity-40 cursor-not-allowed " + theme.paginationInactive
                            : theme.paginationInactive
                        }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* =====================================================================
          DETAIL MODAL
          =====================================================================
          A separate Dialog layered above the list modal (z-[70] > z-50), driven
          purely by `viewingTruck`. Because that state is a single value instead
          of a collection, there is no way for two of these to be "open" at
          once — selecting a different row while one is already open just
          swaps its contents instead of stacking another modal on top. Closing
          it (X button, backdrop click, Esc, or the parent modal closing) only
          ever does one thing: setViewingTruck(null).
      ===================================================================== */}
      <Transition appear show={!!viewingTruck} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={() => setViewingTruck(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.detailModalBg}`}
              >
                {viewingTruck && (
                  <TruckDetailContent
                    truck={viewingTruck}
                    theme={theme}
                    darkMode={darkMode}
                    onClose={() => setViewingTruck(null)}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

// ---------------------------------------------------------------------------
// TruckDetailContent
//
// Everything that used to live in the inline accordion panel, now rendered
// inside its own modal instead. Pure presentational component — all it needs
// is the truck and the parent's theme tokens.
// ---------------------------------------------------------------------------
function TruckDetailContent({ truck: t, theme, darkMode, onClose }) {
  const multiLeg = isMultiLeg(t);
  const duration = getTripDuration(t);
  const helpers = getHelpersArray(t);
  const isInternal =
    t.branchRegistered && t.destinationBranch && t.branchRegistered === t.destinationBranch;

  return (
    <>
      {/* HEADER */}
      <div className={`flex justify-between items-start gap-4 px-5 sm:px-6 py-4 border-b ${theme.headerBg}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog.Title className="ctl-title text-[15px] font-semibold leading-tight">
              {t.clientName || "—"}
            </Dialog.Title>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
                ${multiLeg ? theme.flowOutIn : theme.flowInOut}`}
            >
              {multiLeg ? "Out" : "In"}
              <ArrowRightIcon className="w-3 h-3" />
              {multiLeg ? "In" : "Out"}
            </span>
          </div>
          <p className={`text-xs mt-1 ${theme.mutedText}`}>
            {t.plateNumber || "—"} · {t.truckType || "—"}
            {t.vehicleId ? ` · ${t.vehicleId}` : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.border} ${theme.mutedText}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* BODY */}
      <div className="overflow-y-auto flex-1 min-h-0">
        <div className={`px-5 sm:px-6 py-5 ${theme.detailBg}`}>
          {/* ROUTE */}
          <div className="mb-4">
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>Route</p>
            {isInternal ? (
              <div className="flex items-center gap-1.5 text-sm">
                {t.branchRegistered}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${theme.internalBadge}`}>
                  Internal
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm">
                {t.branchRegistered || "—"}
                <ArrowRightIcon className="w-3.5 h-3.5 opacity-50 shrink-0" />
                {t.destinationBranch || "—"}
              </div>
            )}
          </div>

          {multiLeg ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${theme.mutedText}`}>
                  Trip Timeline
                </p>
                {duration && (
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${theme.flowOutIn}`}>
                    Total: {duration}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {getLegs(t).map((leg) => (
                  <div key={leg.key} className={`rounded-xl border p-3 ${theme.statCard}`}>
                    <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${theme.mutedText}`}>
                      <BuildingOfficeIcon className="w-3 h-3" />
                      {leg.branch || "—"}
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${theme.legTime}`}>{leg.label}</div>
                    <div className="ctl-tabular text-base font-bold mt-0.5">{leg.time || "—"}</div>
                    <div className={`text-[11px] mt-0.5 ${theme.mutedText}`}>
                      {leg.date ? new Date(leg.date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className={`text-[11px] font-semibold uppercase tracking-wide mb-3 ${theme.mutedText}`}>Time Log</p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border p-3 ${theme.statCard}`}>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${theme.mutedText}`}>
                    <ClockIcon className="w-3 h-3" /> Time In
                  </div>
                  <div className="ctl-tabular text-base font-bold mt-1">{t.timeIn || "—"}</div>
                  <div className={`text-[11px] mt-0.5 ${theme.mutedText}`}>
                    {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className={`rounded-xl border p-3 ${theme.statCard}`}>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${theme.mutedText}`}>
                    <ClockIcon className="w-3 h-3" /> Time Out
                  </div>
                  <div className="ctl-tabular text-base font-bold mt-1">{t.timeOut || "—"}</div>
                  <div className={`text-[11px] mt-0.5 ${theme.mutedText}`}>
                    {t.timeOutDate ? new Date(t.timeOutDate).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SUPPORTING DETAILS */}
          <div className={`mt-4 pt-4 border-t grid grid-cols-2 gap-x-4 gap-y-3 ${theme.border}`}>
            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${theme.mutedText}`}>
                Purpose
              </div>
              <div className="text-sm font-medium">{t.purpose || "—"}</div>
            </div>

            <div>
              <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${theme.mutedText}`}>
                <UserGroupIcon className="w-3 h-3" /> Helpers
              </div>
              <div className="text-sm font-medium">{helpers.length ? helpers.join(", ") : "—"}</div>
            </div>

            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${theme.mutedText}`}>
                Bay
              </div>
              <div className="text-sm font-medium font-mono">{t.bay || "—"}</div>
            </div>

            <div>
              <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${theme.mutedText}`}>
                <IdentificationIcon className="w-3 h-3" /> Vehicle ID
              </div>
              <div className="text-sm font-medium font-mono">{t.vehicleId || "—"}</div>
            </div>

            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${theme.mutedText}`}>
                Driver
              </div>
              <div className="text-sm font-medium">{t.driver || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={`shrink-0 border-t px-5 sm:px-6 py-3 flex justify-end ${theme.border} ${darkMode ? "bg-slate-950/90" : "bg-white/90"}`}>
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition hover:bg-white/5 ${theme.border} ${theme.mutedText}`}
        >
          Close
        </button>
      </div>
    </>
  );
}