// AddTruckModal.jsx
import { Fragment, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  TruckIcon,
  ChevronDownIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// DropdownPortal
//
// Why this exists: every Framer Motion `motion.div` carries an inline
// `transform` even at rest, and any element with a transform creates its own
// CSS stacking context. That means a dropdown's `z-50` only wins against
// siblings *inside that same stacking context* — it can't out-rank later
// sections in the form (Assignment, Personnel, Helpers), because each of
// those has its own motion.div stacking context too. The result is the
// "double exposure" bug where dropdown rows and page content paint over each
// other instead of one clearly sitting on top.
//
// The fix is to render the floating panel into document.body via a portal,
// positioned with getBoundingClientRect(). That escapes every ancestor's
// stacking context (and the modal's `overflow-hidden`) entirely, so nothing
// in the form can ever paint over it. Same pattern as the portal-based
// sidebar tooltips in Header.jsx.
//
// UNCHANGED from the previous version — this logic is load-bearing, only the
// visual classNames passed in via panelClassName differ.
// ---------------------------------------------------------------------------
function DropdownPortal({ anchorRef, open, onClose, children, panelClassName = "" }) {
  const [coords, setCoords] = useState(null);
  const panelRef = useRef(null);

  const recalc = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;

    setCoords({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 8,
      bottom: openUp ? window.innerHeight - r.top + 8 : undefined,
      maxHeight: Math.max(160, (openUp ? spaceAbove : spaceBelow) - 24),
    });
  }, [anchorRef]);

  // Recalculate on open, and keep tracking the anchor while open — including
  // scroll events from nested scrollable containers (the modal's own
  // overflow-y-auto form), which is why the scroll listener uses capture:true.
  useEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open, recalc]);

  // Click-outside-to-close. The panel now lives outside the card visually,
  // so this matters more than it did when it was (incorrectly) painted
  // inline with the rest of the form.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef.current?.contains(e.target)) return;
      onClose?.();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onClose, anchorRef]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: coords.left,
        width: coords.width,
        top: coords.top,
        bottom: coords.bottom,
        maxHeight: coords.maxHeight,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
      className={`overflow-hidden ${panelClassName}`}
    >
      {children}
    </div>,
    document.body
  );
}

// Order drives both the rail and the scrollspy below.
const SECTIONS = [
  { key: "flow", label: "Flow" },
  { key: "vehicle", label: "Vehicle" },
  { key: "assignment", label: "Assignment" },
  { key: "personnel", label: "Personnel" },
  { key: "details", label: "Details" },
];

export default function AddTruckModal({
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  clients,
  bays,
  activeTrucks,
  darkMode = true,
  drivers = [], // ADD THIS
  branches = [], // ✅ NEW — used for visitor-mode branch typing/selection
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState(""); // ✅ search inside Vehicle ID dropdown
  const [activeSection, setActiveSection] = useState("flow");

  // Anchors for the portal-positioned dropdowns
  const truckIdAnchorRef = useRef(null);
  const destinationAnchorRef = useRef(null);
  const bayAnchorRef = useRef(null);
  const driverAnchorRef = useRef(null);
  const visitorBranchAnchorRef = useRef(null); // ✅ NEW — home branch picker in visitor mode
  const helperAnchorRefs = useRef({});

  // Anchors for the rail's scrollspy / jump-to-section behavior
  const formScrollRef = useRef(null);
  const sectionRefs = useRef({});
  const registerSection = (key) => (el) => {
    sectionRefs.current[key] = el;
  };

  const safeHelpers = Array.isArray(form.helpers) ? form.helpers : [""];

  // ✅ Flow of this entry: "IN_OUT" (Time In -> Time Out) or "OUT_IN" (Time Out -> Time In)
  const flowType = form.flowType === "OUT_IN" ? "OUT_IN" : "IN_OUT";

  // ✅ Visitor / 3PL mode: unregistered vehicle, typed in instead of picked
  const isVisitor = !!form.isVisitor;

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // ---------------------------------------------------------------------
  // Theme tokens
  //
  // Palette pulled from the app's own dashboard: slate-950/900 surfaces,
  // the emerald that already means "Active" on the truck cards promoted to
  // the form's single accent, and a thin blue thread (from the ArrowGo "G"
  // mark) reserved for the rail's progress fill only, so it reads as a
  // deliberate accent rather than a second competing color.
  // ---------------------------------------------------------------------
  const theme = darkMode
    ? {
        modalBg: "bg-slate-950 text-slate-100",
        railBg: "bg-gradient-to-b from-slate-950 to-slate-900 border-slate-800",
        headerBg: "bg-slate-900 border-slate-800",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-100 hover:bg-slate-800",
        inputBg: "bg-slate-800/70 text-slate-100 border-slate-700",
        cardBg: "bg-white/[0.02] border-slate-800",
        dropdownSolid: "#0b1424", // guaranteed-opaque hex for floating panels
        dropdownHover: "hover:bg-emerald-500/10",
        optionBg: "bg-slate-800 text-slate-100",
        textColor: "text-slate-100",
        mutedText: "text-slate-500",
        borderColor: "border-slate-800",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500",
        accentSoft: "bg-emerald-500/10",
        okBadge: "bg-emerald-500/15 text-emerald-400",
        busyBadge: "bg-rose-500/15 text-rose-400",
        railLine: "bg-slate-800",
        railBarTrack: "bg-slate-800",
        railBarFill: "from-sky-500 to-emerald-400",
        toastBg: "bg-slate-900 border border-emerald-500/30 text-slate-100",
        amberBadge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      }
    : {
        modalBg: "bg-white text-slate-900",
        railBg: "bg-gradient-to-b from-slate-50 to-white border-slate-200",
        headerBg: "bg-white border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        inputBg: "bg-slate-50 text-slate-900 border-slate-200",
        cardBg: "bg-slate-50/60 border-slate-200",
        dropdownSolid: "#ffffff",
        dropdownHover: "hover:bg-emerald-50",
        optionBg: "bg-slate-100 text-slate-900",
        textColor: "text-slate-900",
        mutedText: "text-slate-500",
        borderColor: "border-slate-200",
        accentText: "text-emerald-600",
        accentBorder: "border-emerald-500",
        accentSoft: "bg-emerald-50",
        okBadge: "bg-emerald-50 text-emerald-600",
        busyBadge: "bg-rose-50 text-rose-500",
        railLine: "bg-slate-200",
        railBarTrack: "bg-slate-200",
        railBarFill: "from-sky-500 to-emerald-500",
        toastBg: "bg-white border border-emerald-200 text-slate-900",
        amberBadge: "bg-amber-50 text-amber-600 border-amber-200",
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // In visitor mode there's no client/branch pairing yet, so drivers and
  // helpers are simply filtered by "type" — visitor entries usually won't
  // have a matching entry in the drivers table anyway, and the Driver field
  // becomes free-text below instead of a picklist. Kept here only so
  // non-visitor logic below is untouched.
  const filteredDrivers = drivers.filter(
    (d) =>
      d.branch === form.branchRegistered &&
      d.client === form.clientName &&
      d.type === "Driver"
  );

  const filteredHelpers = drivers.filter(
    (d) =>
      d.branch === form.branchRegistered &&
      d.client === form.clientName &&
      d.type === "Helper"
  );

  const isOnTrip = (t) => {
    return !t.timeOut && !t.timeIn;
  };

  // 🚛 check if truck is already active
  const isTruckActive = (truckId) => {
    return activeTrucks.some(
      (t) =>
        isOnTrip(t) &&
        (t.id === truckId || t.vehicleId === truckId)
    );
  };

  // 👨 check if driver is already used (by name — works for visitor's
  // free-typed driver name too, not just picklist drivers)
  const isDriverBusy = (name) => {
    return activeTrucks.some(
      (t) =>
        isOnTrip(t) &&
        t.driver?.toLowerCase().trim() === name?.toLowerCase().trim()
    );
  };

  const getHelpersArray = (t) => {
    if (Array.isArray(t.helpers)) return t.helpers;

    if (typeof t.helpers === "string") {
      try {
        return JSON.parse(t.helpers);
      } catch {
        return [];
      }
    }

    if (typeof t.helper === "string") {
      try {
        return JSON.parse(t.helper);
      } catch {
        return [];
      }
    }

    return [];
  };
  // 🧑‍🔧 check if helper is already used
  const isHelperBusy = (name) => {
    if (!name) return false;

    return activeTrucks.some((t) => {
      if (!isOnTrip(t)) return false;

      const helpersList = getHelpersArray(t);

      return helpersList.some(
        (h) =>
          h &&
          h.toLowerCase().trim() === name.toLowerCase().trim()
      );
    });
  };

  const isHelperAlreadySelected = (name, currentIndex) => {
    return form.helpers.some(
      (h, i) =>
        i !== currentIndex &&
        h &&
        h.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };

  // ---------- Vehicle ID picker: filtering + grouping (registered mode only) ----------
  const filteredVehicles = clients.filter((truck) => {
    const q = vehicleSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      truck.controlId?.toString().toLowerCase().includes(q) ||
      truck.id?.toString().toLowerCase().includes(q) ||
      truck.plateNumber?.toLowerCase().includes(q) ||
      truck.clientName?.toLowerCase().includes(q) ||
      truck.branchRegistered?.toLowerCase().includes(q)
    );
  });

  // Group by branch only while browsing (no query) so the list reads like a
  // directory. Once the person searches, show a flat best-match list instead.
  const groupedVehicles = vehicleSearch.trim()
    ? null
    : filteredVehicles.reduce((acc, truck) => {
        const key = truck.branchRegistered || "Unassigned";
        if (!acc[key]) acc[key] = [];
        acc[key].push(truck);
        return acc;
      }, {});

  const handleSelectVehicle = (truck) => {
    // ✅ clientName first — its onChange handler in trucks.jsx resets
    // id/truckType/plateNumber, so it must run before we set the real values.
    onChange({ target: { name: "clientName", value: truck.clientName } });
    onChange({ target: { name: "branchRegistered", value: truck.branchRegistered } });
    onChange({ target: { name: "id", value: truck.id } });
    // Control ID is display-only — the internal `id` above is still what's
    // sent to the backend and used for the active-truck / bay lookups.
    onChange({ target: { name: "controlId", value: truck.controlId || "" } });
    onChange({ target: { name: "truckType", value: truck.truckType } });
    onChange({ target: { name: "plateNumber", value: truck.plateNumber } });
    onChange({ target: { name: "vehicleId", value: truck.id } });

    // Driver/helper lists are filtered by branch+client, so clear any stale
    // picks from a previously selected vehicle.
    onChange({ target: { name: "driver", value: "" } });
    onChange({ target: { name: "helpers", value: [""] } });

    setDropdownOpen(null);
    setVehicleSearch("");
  };

  // ✅ Flip the Vehicle Info card between "search registered vehicles" and
  // "type in visitor/3PL details." Clears out fields that don't carry over
  // cleanly between the two modes so a half-filled registered pick or a
  // half-typed visitor plate never gets silently submitted under the wrong
  // mode.
  const handleToggleVisitor = () => {
    const next = !isVisitor;
    onChange({ target: { name: "isVisitor", value: next } });
    onChange({ target: { name: "id", value: "" } });
    onChange({ target: { name: "controlId", value: "" } });
    onChange({ target: { name: "vehicleId", value: "" } });
    onChange({ target: { name: "clientName", value: "" } });
    onChange({ target: { name: "truckType", value: "" } });
    onChange({ target: { name: "plateNumber", value: "" } });
    onChange({ target: { name: "branchRegistered", value: "" } });
    onChange({ target: { name: "driver", value: "" } });
    onChange({ target: { name: "helpers", value: [""] } });
    onChange({ target: { name: "destinationBranch", value: "" } });
    onChange({ target: { name: "bay", value: "" } });
    if (!next) {
      onChange({ target: { name: "visitorCompany", value: "" } });
      onChange({ target: { name: "visitorContact", value: "" } });
    }
    // ✅ Visitor/3PL entries only support Time In → Time Out — the OUT_IN
    // multi-leg handoff assumes the truck is being routed between two of
    // our own branches, which isn't the case for a walk-in vehicle. Force
    // the flow back to IN_OUT if OUT_IN was selected before switching in.
    if (next && form.flowType === "OUT_IN") {
      onChange({ target: { name: "flowType", value: "IN_OUT" } });
    }
    setVehicleSearch("");
    setDropdownOpen(null);
  };

  const renderVehicleOption = (truck, i) => {
    const busy = isTruckActive(truck.id);

    return (
      <button
        key={truck.id ?? i}
        type="button"
        disabled={busy}
        onClick={() => {
          if (busy) return; // ❌ BLOCK CLICK
          handleSelectVehicle(truck);
        }}
        className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition
          ${busy ? "opacity-40 cursor-not-allowed" : `cursor-pointer ${theme.dropdownHover}`}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.optionBg}`}>
            <TruckIcon className="w-5 h-5 opacity-70" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {truck.controlId || "No Control ID"}{" "}
              <span className={`font-normal ${theme.mutedText}`}>· {truck.plateNumber}</span>
            </p>
            <p className={`text-xs truncate ${theme.mutedText}`}>
              {truck.clientName} — {truck.branchRegistered} · {truck.truckType}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${
            busy ? theme.busyBadge : theme.okBadge
          }`}
        >
          {busy ? "Active" : "Available"}
        </span>
      </button>
    );
  };

  // ---------------------------------------------------------------------
  // Rail: which sections are complete, and which is currently in view.
  // Mirrors the app's own "flow" vocabulary — this app already tracks
  // trucks through named stages (In → Out), so the create-entry form gets
  // the same treatment for its own stages.
  //
  // "vehicle" completeness now branches on mode: registered needs form.id,
  // visitor needs a typed plate number instead.
  //
  // "assignment" also branches on mode: a visitor/3PL entry only needs the
  // single hub they're visiting (no bay assignment, since they're not
  // being routed between branches — see destinationBranch === branchRegistered
  // below). Registered entries still need destination + bay.
  // ---------------------------------------------------------------------
  const sectionStatus = useMemo(
    () => ({
      flow: true,
      vehicle: isVisitor ? !!(form.plateNumber && form.plateNumber.trim()) : !!form.id,
      assignment: isVisitor ? !!form.destinationBranch : !!(form.destinationBranch && form.bay),
      personnel: !!form.driver,
      details: !!(form.purpose && form.purpose.trim()),
    }),
    [isVisitor, form.plateNumber, form.id, form.destinationBranch, form.bay, form.driver, form.purpose]
  );

  const sectionSubLabel = {
    flow: flowType === "OUT_IN" ? "Out → In" : "In → Out",
    vehicle: isVisitor
      ? form.plateNumber
        ? `${form.plateNumber} · Visitor/3PL`
        : "Not entered"
      : form.id
      ? `${form.controlId || "No Control ID"} · ${form.plateNumber || "—"}`
      : "Not selected",
    assignment: isVisitor
      ? form.destinationBranch
        ? `${form.destinationBranch} · Visitor/3PL`
        : "Select hub"
      : form.bay
      ? `${form.destinationBranch} · Bay ${form.bay}`
      : "Destination + bay",
    personnel: form.driver || "Driver + helpers",
    details: form.purpose ? form.purpose : "Purpose",
  };

  const completedCount = Object.values(sectionStatus).filter(Boolean).length;

  const scrollToSection = (key) => {
    const el = sectionRefs.current[key];
    const container = formScrollRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }
  };

  const handleFormScroll = () => {
    const container = formScrollRef.current;
    if (!container) return;
    const scrollPos = container.scrollTop + 90;
    let current = SECTIONS[0].key;
    for (const { key } of SECTIONS) {
      const el = sectionRefs.current[key];
      if (el && el.offsetTop <= scrollPos) current = key;
    }
    setActiveSection(current);
  };

  const scrollThumb = darkMode ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.4)";
  const scrollThumbHover = darkMode ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.65)";

  const RailNode = ({ sectionKey, label, isLast }) => {
    const done = sectionStatus[sectionKey];
    const active = activeSection === sectionKey;
    return (
      <button
        type="button"
        onClick={() => scrollToSection(sectionKey)}
        className="relative flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.03]"
      >
        {!isLast && (
          <span
            className={`absolute left-[19px] top-[34px] w-[2px] ${theme.railLine}`}
            style={{ height: "calc(100% - 10px)" }}
          />
        )}
        <span
          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition
            ${
              active
                ? `${theme.accentBorder} bg-emerald-400 text-slate-950 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]`
                : done
                ? `${theme.accentBorder} ${theme.accentSoft} ${theme.accentText}`
                : `${theme.borderColor} ${theme.mutedText}`
            }`}
        >
          {done && !active ? <CheckIcon className="w-3.5 h-3.5" /> : SECTIONS.findIndex((s) => s.key === sectionKey) + 1}
        </span>
        <span className="min-w-0 pt-0.5">
          <span className={`block text-[13px] font-semibold ${active || done ? theme.textColor : theme.mutedText}`}>
            {label}
          </span>
          <span className={`block text-[11px] truncate ${theme.mutedText}`}>{sectionSubLabel[sectionKey]}</span>
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Themed scrollbar for scrollable results lists / the rail — thin,
          rounded, transparent track so it doesn't fight the panel's own
          background. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .form-title { font-family: 'Space Grotesk', sans-serif; }
        .vehicle-id-scroll, .rail-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${scrollThumb} transparent;
        }
        .vehicle-id-scroll::-webkit-scrollbar, .rail-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .vehicle-id-scroll::-webkit-scrollbar-track, .rail-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .vehicle-id-scroll::-webkit-scrollbar-thumb, .rail-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .vehicle-id-scroll::-webkit-scrollbar-thumb:hover, .rail-scroll::-webkit-scrollbar-thumb:hover {
          background-color: ${scrollThumbHover};
        }
      `}</style>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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

          {/* Modal container */}
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
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
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`
                  w-full
                  max-w-4xl
                  h-[90vh]
                  flex
                  rounded-2xl
                  shadow-2xl
                  border
                  overflow-hidden
                  ${theme.modalBg} ${theme.borderColor}
                `}
              >
                {/* ===== RAIL (desktop) ===== */}
                <div className={`hidden md:flex w-[196px] shrink-0 flex-col border-r p-4 ${theme.railBg}`}>
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${theme.mutedText}`}>
                      New Entry
                    </span>
                  </div>

                  <div className="rail-scroll flex-1 overflow-y-auto -mx-1 px-1">
                    {SECTIONS.map((s, i) => (
                      <RailNode key={s.key} sectionKey={s.key} label={s.label} isLast={i === SECTIONS.length - 1} />
                    ))}
                  </div>

                  <div className={`mt-4 pt-4 border-t ${theme.borderColor}`}>
                    <p className={`text-[11px] mb-1.5 ${theme.mutedText}`}>
                      {completedCount} of {SECTIONS.length} sections complete
                    </p>
                    <div className={`h-1 rounded-full overflow-hidden ${theme.railBarTrack}`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.railBarFill} transition-all duration-300`}
                        style={{ width: `${(completedCount / SECTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ===== MAIN ===== */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Header */}
                  <div className={`flex items-center gap-3 p-4 border-b ${theme.headerBg}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                      <TruckIcon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="form-title text-[15px] font-semibold leading-tight">
                        Create Entry
                      </Dialog.Title>
                      <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                        {flowType === "OUT_IN" ? "Time Out → Time In" : "Time In → Time Out"}
                      </p>
                    </div>

                    {/* ✅ Registered vs Visitor/3PL toggle */}
                    <div className={`ml-auto flex items-center rounded-lg border p-0.5 text-xs font-semibold ${theme.borderColor}`}>
                      <button
                        type="button"
                        onClick={() => isVisitor && handleToggleVisitor()}
                        className={`px-2.5 py-1.5 rounded-md transition ${
                          !isVisitor ? "bg-emerald-400 text-slate-950" : theme.mutedText
                        }`}
                      >
                        Registered
                      </button>
                      <button
                        type="button"
                        onClick={() => !isVisitor && handleToggleVisitor()}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition ${
                          isVisitor ? "bg-amber-400 text-slate-950" : theme.mutedText
                        }`}
                      >
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        Visitor / 3PL
                      </button>
                    </div>

                    <button
                      onClick={onClose}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.borderColor} ${theme.mutedText}`}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile section strip (rail collapses to this below md) */}
                  <div className={`md:hidden flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b ${theme.headerBg} ${theme.borderColor}`}>
                    {SECTIONS.map((s) => {
                      const active = activeSection === s.key;
                      const done = sectionStatus[s.key];
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => scrollToSection(s.key)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                            ${
                              active
                                ? "bg-emerald-400 text-slate-950 border-emerald-400"
                                : done
                                ? `${theme.accentSoft} ${theme.accentText} ${theme.accentBorder}`
                                : `${theme.borderColor} ${theme.mutedText}`
                            }`}
                        >
                          {done && !active && <CheckIcon className="w-3 h-3" />}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    ref={formScrollRef}
                    onScroll={handleFormScroll}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 vehicle-id-scroll"
                  >
                    {/* ===== FLOW TYPE ===== */}
                    <div ref={registerSection("flow")} className={`rounded-xl border p-5 ${theme.cardBg}`}>
                      <h2 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${theme.mutedText}`}>
                        Flow
                      </h2>

                      {/* ✅ Visitor/3PL entries only support Time In → Time Out.
                          The Time Out → Time In option (and its multi-leg
                          branch handoff) only makes sense for a registered
                          vehicle being routed between two of our own branches,
                          so it's hidden entirely in visitor mode instead of
                          just disabled — nothing to reach for by mistake. */}
                      <div className={`grid grid-cols-1 ${isVisitor ? "" : "sm:grid-cols-2"} gap-3`}>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            onChange({ target: { name: "flowType", value: "IN_OUT" } })
                          }
                          className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left
                            ${
                              flowType === "IN_OUT"
                                ? "bg-emerald-400 text-slate-950 border-emerald-400 shadow-md"
                                : `${theme.inputBg} hover:border-emerald-500/60`
                            }`}
                        >
                          Time In → Time Out
                          <span className={`block text-xs font-normal mt-0.5 ${flowType === "IN_OUT" ? "text-slate-900/70" : theme.mutedText}`}>
                            Truck arrives first, then leaves
                          </span>
                        </motion.button>

                        {!isVisitor && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              onChange({ target: { name: "flowType", value: "OUT_IN" } })
                            }
                            className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left
                              ${
                                flowType === "OUT_IN"
                                  ? "bg-emerald-400 text-slate-950 border-emerald-400 shadow-md"
                                  : `${theme.inputBg} hover:border-emerald-500/60`
                              }`}
                          >
                            Time Out → Time In
                            <span className={`block text-xs font-normal mt-0.5 ${flowType === "OUT_IN" ? "text-slate-900/70" : theme.mutedText}`}>
                              Truck leaves first, then returns
                            </span>
                          </motion.button>
                        )}
                      </div>

                      {isVisitor && (
                        <p className={`mt-3 text-xs ${theme.mutedText}`}>
                          Visitor / 3PL entries always use Time In → Time Out.
                        </p>
                      )}
                    </div>

                    {/* ===== VEHICLE INFO CARD ===== */}
                    <div ref={registerSection("vehicle")} className={`rounded-xl border p-5 ${theme.cardBg}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xs uppercase tracking-wider font-semibold ${theme.mutedText}`}>
                          Vehicle Info
                        </h2>
                        {isVisitor && (
                          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border ${theme.amberBadge}`}>
                            <UserGroupIcon className="w-3.5 h-3.5" />
                            Unregistered — logged as visitor
                          </span>
                        )}
                      </div>

                      {isVisitor ? (
                        // ---------------- VISITOR / 3PL MODE ----------------
                        // No lookup — everything is typed directly. Kept
                        // deliberately minimal: plate number is the only
                        // required field so a gate guard can log a walk-in
                        // truck in seconds and fill in the rest if known.
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <motion.div variants={inputVariants} initial="hidden" animate="visible">
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Plate Number *
                            </label>
                            <input
                              type="text"
                              name="plateNumber"
                              value={form.plateNumber}
                              onChange={onChange}
                              placeholder="e.g. NGA-1234"
                              className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </motion.div>

                          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Truck Type
                            </label>
                            <input
                              type="text"
                              name="truckType"
                              value={form.truckType}
                              onChange={onChange}
                              placeholder="e.g. 6-Wheeler, Van"
                              className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </motion.div>

                          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Company / 3PL Name
                            </label>
                            <input
                              type="text"
                              name="visitorCompany"
                              value={form.visitorCompany || ""}
                              onChange={(e) => {
                                onChange(e);
                                // Also mirror into clientName so it shows up
                                // in TruckGrid / CSV export the same way a
                                // registered client's name does.
                                onChange({ target: { name: "clientName", value: e.target.value } });
                              }}
                              placeholder="e.g. ABC Trucking Services"
                              className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </motion.div>

                          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Contact Person / Number
                            </label>
                            <input
                              type="text"
                              name="visitorContact"
                              value={form.visitorContact || ""}
                              onChange={onChange}
                              placeholder="e.g. Juan Dela Cruz — 0917xxxxxxx"
                              className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </motion.div>
                        </div>
                      ) : (
                        // ---------------- REGISTERED MODE (unchanged) ----------------
                        <div className="grid grid-cols-1 gap-4">
                          {/* Vehicle ID — selected FIRST */}
                          <motion.div
                            variants={inputVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0 }}
                            className="relative"
                          >
                            <button
                              ref={truckIdAnchorRef}
                              type="button"
                              onClick={() =>
                                setDropdownOpen(dropdownOpen === "truckId" ? null : "truckId")
                              }
                              className={`w-full border p-3 rounded-lg text-left flex justify-between items-center gap-2 transition-all
                                ${theme.inputBg} hover:border-emerald-500/60`}
                            >
                              <span className="min-w-0 truncate">
                                {form.id ? (
                                  <>
                                    <span className="font-semibold">{form.controlId || "No Control ID"}</span>
                                    <span className={theme.mutedText}> · {form.plateNumber} · {form.clientName}</span>
                                  </>
                                ) : (
                                  <span className={theme.mutedText}>Select Vehicle</span>
                                )}
                              </span>
                              <ChevronDownIcon
                                className={`w-5 h-5 ml-2 shrink-0 transition-transform ${theme.mutedText} ${
                                  dropdownOpen === "truckId" ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <DropdownPortal
                              anchorRef={truckIdAnchorRef}
                              open={dropdownOpen === "truckId"}
                              onClose={() => setDropdownOpen(null)}
                            >
                              <AnimatePresence>
                                {dropdownOpen === "truckId" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    // ✅ Explicit opaque background (not a class): guarantees a fully
                                    // solid paint regardless of any backdrop-blur ancestor.
                                    style={{ backgroundColor: theme.dropdownSolid }}
                                    className={`w-full flex-1 min-h-0 flex flex-col rounded-xl shadow-xl border overflow-hidden ${theme.textColor} ${theme.borderColor}`}
                                  >
                                    {/* Search — fixed header, doesn't scroll with the list */}
                                    <div className={`shrink-0 p-2 border-b ${theme.borderColor}`}>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={vehicleSearch}
                                          onChange={(e) => setVehicleSearch(e.target.value)}
                                          placeholder="Search by Control ID, plate, client, branch..."
                                          className={`w-full p-2 pr-8 rounded-lg text-sm border ${theme.inputBg} ${theme.borderColor}`}
                                        />
                                        {vehicleSearch && (
                                          <button
                                            type="button"
                                            onClick={() => setVehicleSearch("")}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs hover:opacity-100 ${theme.mutedText}`}
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                      <p className={`mt-1.5 px-0.5 text-[11px] ${theme.mutedText}`}>
                                        {filteredVehicles.length} of {clients.length} vehicle{clients.length !== 1 ? "s" : ""}
                                        {vehicleSearch && ` matching "${vehicleSearch}"`}
                                      </p>
                                    </div>

                                    {/* Scrollable results — capped to roughly 10 rows tall; anything
                                        beyond that scrolls inside this list instead of the panel
                                        just growing to fill whatever space happens to be free. */}
                                    <div className="vehicle-id-scroll flex-1 min-h-0 max-h-[400px] overflow-y-auto p-2 space-y-0.5">
                                      {!filteredVehicles.length && (
                                        <p className={`text-sm text-center py-6 ${theme.mutedText}`}>No vehicles found</p>
                                      )}

                                      {groupedVehicles
                                        ? Object.keys(groupedVehicles)
                                            .sort()
                                            .map((branch) => (
                                              <div key={branch}>
                                                {/* ✅ Solid inline bg (not opacity-*) so this sticky label
                                                    fully covers rows scrolling underneath it — opacity-50
                                                    on the whole element would've made its background
                                                    see-through too, not just the text. */}
                                                <p
                                                  style={{ backgroundColor: theme.dropdownSolid }}
                                                  className={`sticky top-0 z-10 px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider ${theme.mutedText}`}
                                                >
                                                  {branch}
                                                </p>
                                                {groupedVehicles[branch].map((truck, i) => renderVehicleOption(truck, i))}
                                              </div>
                                            ))
                                        : filteredVehicles.map((truck, i) => renderVehicleOption(truck, i))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </DropdownPortal>
                          </motion.div>

                          {/* Selected vehicle details — auto-filled, read-only */}
                          {form.id ? (
                            <motion.div
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.15 }}
                              className={`rounded-lg border p-3 ${theme.inputBg} ${theme.borderColor}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className={`text-[11px] uppercase tracking-wide ${theme.mutedText}`}>Selected Vehicle</p>
                                <button
                                  type="button"
                                  onClick={() => setDropdownOpen("truckId")}
                                  className={`text-[11px] font-semibold hover:underline ${theme.accentText}`}
                                >
                                  Change
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="min-w-0">
                                  <p className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${theme.mutedText}`}>
                                    <IdentificationIcon className="w-3.5 h-3.5" /> Control ID
                                  </p>
                                  <p className="text-sm font-medium truncate mt-0.5">{form.controlId || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${theme.mutedText}`}>
                                    <MapPinIcon className="w-3.5 h-3.5" /> Branch
                                  </p>
                                  <p className="text-sm font-medium truncate mt-0.5">{form.branchRegistered || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${theme.mutedText}`}>
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" /> Client
                                  </p>
                                  <p className="text-sm font-medium truncate mt-0.5">{form.clientName || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${theme.mutedText}`}>
                                    <TruckIcon className="w-3.5 h-3.5" /> Type
                                  </p>
                                  <p className="text-sm font-medium truncate mt-0.5">{form.truckType || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${theme.mutedText}`}>
                                    <IdentificationIcon className="w-3.5 h-3.5" /> Plate
                                  </p>
                                  <p className="text-sm font-medium truncate mt-0.5">{form.plateNumber || "—"}</p>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <p className={`text-xs px-1 ${theme.mutedText}`}>Select a vehicle above to see its details.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ===== SECTION: ASSIGNMENT ===== */}
                    <div ref={registerSection("assignment")}>
                      <h2 className={`text-sm font-semibold mb-3 ${theme.mutedText}`}>Assignment</h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isVisitor ? (
                          // ---------------- VISITOR / 3PL MODE ----------------
                          // A visitor isn't being routed between two of our
                          // branches — they're just showing up at one hub to
                          // deliver/pick up. So there's exactly one field
                          // here: which hub. No bay assignment is needed,
                          // since visitor trucks aren't queued into a bay
                          // slot the way registered trucks are.
                          //
                          // branchRegistered and destinationBranch are both
                          // set to the same value on selection, which makes
                          // this entry read as an "Internal" single-branch
                          // stop everywhere else in the app (TruckGrid,
                          // reports, branch-scoped fetches) instead of
                          // looking like a two-branch transfer.
                          <div className="md:col-span-2">
                            <motion.div variants={inputVariants} initial="hidden" animate="visible" className="relative">
                              <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                                Branch / Hub Visited
                              </label>
                              <button
                                ref={visitorBranchAnchorRef}
                                type="button"
                                onClick={() =>
                                  setDropdownOpen(dropdownOpen === "visitorBranch" ? null : "visitorBranch")
                                }
                                className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center ${theme.inputBg} hover:border-emerald-500/60`}
                              >
                                <span className={form.destinationBranch ? "" : theme.mutedText}>
                                  {form.destinationBranch || "Select Branch"}
                                </span>
                                <ChevronDownIcon
                                  className={`w-5 h-5 ml-2 transition-transform ${theme.mutedText} ${
                                    dropdownOpen === "visitorBranch" ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <DropdownPortal
                                anchorRef={visitorBranchAnchorRef}
                                open={dropdownOpen === "visitorBranch"}
                                onClose={() => setDropdownOpen(null)}
                              >
                                <AnimatePresence>
                                  {dropdownOpen === "visitorBranch" && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      style={{ backgroundColor: theme.dropdownSolid }}
                                      className={`w-full flex-1 min-h-0 rounded-lg shadow-xl p-2 flex flex-wrap gap-2 overflow-y-auto border ${theme.textColor} ${theme.borderColor}`}
                                    >
                                      {(branches.length
                                        ? branches.map((b) => b.name)
                                        : [...new Set(clients.map((c) => c.branchRegistered))]
                                      ).map((branch, i) => (
                                        <span
                                          key={i}
                                          className={`px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium ${theme.optionBg} ${theme.dropdownHover}`}
                                          onClick={() => {
                                            // Visitor has no separate home vs
                                            // destination — both point at the
                                            // hub they physically showed up at.
                                            onChange({ target: { name: "branchRegistered", value: branch } });
                                            onChange({ target: { name: "destinationBranch", value: branch } });
                                            onChange({ target: { name: "bay", value: "" } });
                                            setDropdownOpen(null);
                                          }}
                                        >
                                          {branch}
                                        </span>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </DropdownPortal>
                              <p className={`mt-1.5 text-xs ${theme.mutedText}`}>
                                No bay assignment needed — this just records which hub they visited.
                              </p>
                            </motion.div>
                          </div>
                        ) : (
                          <>
                            {/* Destination */}
                            <div>
                              <motion.div
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.23 }}
                                className="relative"
                              >
                                <button
                                  ref={destinationAnchorRef}
                                  type="button"
                                  onClick={() =>
                                    setDropdownOpen(
                                      dropdownOpen === "destination" ? null : "destination"
                                    )
                                  }
                                  className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center ${theme.inputBg} hover:border-emerald-500/60`}
                                >
                                  <span className={form.destinationBranch ? "" : theme.mutedText}>
                                    {form.destinationBranch || "Select Destination Branch"}
                                  </span>
                                  <ChevronDownIcon
                                    className={`w-5 h-5 ml-2 transition-transform ${theme.mutedText} ${
                                      dropdownOpen === "destination" ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                <DropdownPortal
                                  anchorRef={destinationAnchorRef}
                                  open={dropdownOpen === "destination"}
                                  onClose={() => setDropdownOpen(null)}
                                >
                                  <AnimatePresence>
                                    {dropdownOpen === "destination" && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ backgroundColor: theme.dropdownSolid }}
                                        className={`w-full flex-1 min-h-0 rounded-lg shadow-xl p-2 flex flex-wrap gap-2 overflow-y-auto border ${theme.textColor} ${theme.borderColor}`}
                                      >
                                        {(branches.length
                                          ? branches.map((b) => b.name)
                                          : [...new Set(clients.map((c) => c.branchRegistered))]
                                        ).map((branch, i) => (
                                          <span
                                            key={i}
                                            className={`px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium ${theme.optionBg} ${theme.dropdownHover}`}
                                            onClick={() => {
                                              onChange({
                                                target: { name: "destinationBranch", value: branch },
                                              });
                                              onChange({ target: { name: "bay", value: "" } }); // reset bay
                                              setDropdownOpen(null);
                                            }}
                                          >
                                            {branch}
                                          </span>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </DropdownPortal>
                              </motion.div>
                            </div>

                            {/* Bay */}
                            <div>
                              <motion.div
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.25 }}
                                className="relative"
                              >
                                <button
                                  ref={bayAnchorRef}
                                  type="button"
                                  disabled={!form.destinationBranch}
                                  onClick={() =>
                                    setDropdownOpen(dropdownOpen === "bay" ? null : "bay")
                                  }
                                  className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center transition-all disabled:opacity-40
                                    ${theme.inputBg} ${theme.textColor} ${theme.borderColor} hover:border-emerald-500/60`}
                                >
                                  <span className={form.bay ? "" : theme.mutedText}>{form.bay || "Select Bay"}</span>
                                  <ChevronDownIcon
                                    className={`w-5 h-5 ml-2 transition-transform duration-200 ${theme.mutedText} ${
                                      dropdownOpen === "bay" ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                <DropdownPortal
                                  anchorRef={bayAnchorRef}
                                  open={dropdownOpen === "bay"}
                                  onClose={() => setDropdownOpen(null)}
                                >
                                  <AnimatePresence>
                                    {dropdownOpen === "bay" && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ backgroundColor: theme.dropdownSolid }}
                                        className={`w-full flex-1 min-h-0 rounded-lg shadow-xl p-2 flex flex-wrap gap-2 overflow-y-auto border
                                          ${theme.textColor} ${theme.borderColor}`}
                                      >
                                        {bays
                                          .filter((b) => b.branchName === form.destinationBranch)
                                          .map((b) => {
                                            const upper = b.name.toUpperCase();
                                            const bayCount = activeTrucks.filter(
                                              (t) =>
                                                t.bay &&
                                                t.bay.toUpperCase() === upper &&
                                                t.destinationBranch === form.destinationBranch
                                            ).length;

                                            const reachedMax = bayCount >= 2;
                                            const selected = form.bay === upper;

                                            return (
                                              <div key={b.id} className="relative group">
                                                <span
                                                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                                    ${
                                                      reachedMax
                                                        ? `${theme.busyBadge} cursor-not-allowed`
                                                        : selected
                                                        ? "bg-emerald-400 text-slate-950 shadow-md"
                                                        : `cursor-pointer ${theme.optionBg} ${theme.dropdownHover}`
                                                    }`}
                                                  onClick={() => {
                                                    if (!reachedMax) {
                                                      onChange({
                                                        target: { name: "bay", value: upper },
                                                      });
                                                      setDropdownOpen(null);
                                                    }
                                                  }}
                                                >
                                                  {upper}
                                                  {reachedMax && " (FULL)"}
                                                </span>

                                                {reachedMax && (
                                                  <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded bg-slate-950 text-slate-100 shadow-lg z-50 border border-slate-800">
                                                    reach the maximum waiting qty.
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </DropdownPortal>
                              </motion.div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ===== SECTION: PERSONNEL ===== */}
                    <div ref={registerSection("personnel")}>
                      <h2 className={`text-sm font-semibold mb-3 ${theme.mutedText}`}>Personnel</h2>

                      <div className="space-y-4">
                        {/* Driver — free text in visitor mode, picklist otherwise */}
                        {isVisitor ? (
                          <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                            <input
                              type="text"
                              name="driver"
                              value={form.driver}
                              onChange={onChange}
                              placeholder="Driver name"
                              className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            {form.driver && isDriverBusy(form.driver) && (
                              <p className="mt-1.5 text-xs text-rose-400">
                                Heads up: a driver with this name is already on an active trip.
                              </p>
                            )}
                          </motion.div>
                        ) : (
                          <div>
                            <motion.div
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.3 }}
                              className="relative"
                            >
                              <button
                                ref={driverAnchorRef}
                                type="button"
                                disabled={!form.branchRegistered || !form.clientName}
                                onClick={() =>
                                  setDropdownOpen(dropdownOpen === "driver" ? null : "driver")
                                }
                                className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center disabled:opacity-40 ${theme.inputBg} hover:border-emerald-500/60`}
                              >
                                <span className={form.driver ? "" : theme.mutedText}>{form.driver || "Select Driver"}</span>
                                <ChevronDownIcon
                                  className={`w-5 h-5 ml-2 transition-transform ${theme.mutedText} ${
                                    dropdownOpen === "driver" ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <DropdownPortal
                                anchorRef={driverAnchorRef}
                                open={dropdownOpen === "driver"}
                                onClose={() => setDropdownOpen(null)}
                              >
                                <AnimatePresence>
                                  {dropdownOpen === "driver" && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      style={{ backgroundColor: theme.dropdownSolid }}
                                      className={`w-full flex-1 min-h-0 rounded-lg shadow-xl p-2 flex flex-wrap gap-2 overflow-y-auto border ${theme.textColor} ${theme.borderColor}`}
                                    >
                                      {filteredDrivers.map((d) => {
                                        const busy = isDriverBusy(d.name);

                                        return (
                                          <span
                                            key={d.id}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                                              ${busy ? `${theme.busyBadge} cursor-not-allowed` : `${theme.optionBg} ${theme.dropdownHover} cursor-pointer`}`}
                                            onClick={() => {
                                              if (busy) return; // ❌ BLOCK

                                              onChange({ target: { name: "driver", value: d.name } });
                                              setDropdownOpen(null);
                                            }}
                                          >
                                            {d.name} {busy && " (ON TRIP)"}
                                          </span>
                                        );
                                      })}

                                      {!filteredDrivers.length && (
                                        <span className={`text-sm ${theme.mutedText}`}>No drivers found</span>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </DropdownPortal>
                            </motion.div>
                          </div>
                        )}

                        {/* Helpers — free text in visitor mode, picklist otherwise */}
                        <div className="space-y-2">
                          <p className={`text-xs ${theme.mutedText}`}>Helpers</p>

                          {safeHelpers.map((helper, index) =>
                            isVisitor ? (
                              <motion.div
                                key={index}
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.32 + index * 0.05 }}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  value={helper}
                                  onChange={(e) => {
                                    const updated = [...form.helpers];
                                    updated[index] = e.target.value;
                                    onChange({ target: { name: "helpers", value: updated } });
                                  }}
                                  placeholder="Helper name"
                                  className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    onChange({
                                      target: { name: "helpers", value: [...form.helpers, ""] },
                                    });
                                  }}
                                  className="shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition"
                                >
                                  +
                                </button>

                                {form.helpers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = form.helpers.filter((_, i) => i !== index);
                                      onChange({ target: { name: "helpers", value: updated } });
                                    }}
                                    className="shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition"
                                  >
                                    −
                                  </button>
                                )}
                              </motion.div>
                            ) : (
                              <motion.div
                                key={index}
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.32 + index * 0.05 }}
                                className="flex gap-2 items-center"
                              >
                                {/* Dropdown */}
                                <div className="relative w-full">
                                  <button
                                    ref={(el) => (helperAnchorRefs.current[index] = el)}
                                    type="button"
                                    disabled={!form.branchRegistered || !form.clientName}
                                    onClick={() =>
                                      setDropdownOpen(
                                        dropdownOpen === `helper-${index}` ? null : `helper-${index}`
                                      )
                                    }
                                    className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center disabled:opacity-40 ${theme.inputBg} hover:border-emerald-500/60`}
                                  >
                                    <span className={helper ? "" : theme.mutedText}>{helper || "Select Helper"}</span>
                                    <ChevronDownIcon
                                      className={`w-5 h-5 ml-2 transition-transform ${theme.mutedText} ${
                                        dropdownOpen === `helper-${index}` ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>

                                  <DropdownPortal
                                    anchorRef={{ current: helperAnchorRefs.current[index] }}
                                    open={dropdownOpen === `helper-${index}`}
                                    onClose={() => setDropdownOpen(null)}
                                  >
                                    <AnimatePresence>
                                      {dropdownOpen === `helper-${index}` && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          style={{ backgroundColor: theme.dropdownSolid }}
                                          className={`w-full flex-1 min-h-0 rounded-lg shadow-xl p-2 flex flex-wrap gap-2 overflow-y-auto border ${theme.textColor} ${theme.borderColor}`}
                                        >
                                          {filteredHelpers.map((h) => {
                                            const busy =
                                              isHelperBusy(h.name) ||
                                              isHelperAlreadySelected(h.name, index);

                                            return (
                                              <span
                                                key={h.id}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                                                  ${busy ? `${theme.busyBadge} cursor-not-allowed` : `${theme.optionBg} ${theme.dropdownHover} cursor-pointer`}`}
                                                onClick={() => {
                                                  if (busy) return; // ❌ BLOCK

                                                  const updated = [...form.helpers];
                                                  updated[index] = h.name;

                                                  onChange({
                                                    target: { name: "helpers", value: updated },
                                                  });

                                                  setDropdownOpen(null);
                                                }}
                                              >
                                                {h.name} {busy && " (BUSY)"}
                                              </span>
                                            );
                                          })}

                                          {!filteredHelpers.length && (
                                            <span className={`text-sm ${theme.mutedText}`}>No helpers found</span>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </DropdownPortal>
                                </div>

                                {/* Add */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onChange({
                                      target: { name: "helpers", value: [...form.helpers, ""] },
                                    });
                                  }}
                                  className="shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition"
                                >
                                  +
                                </button>

                                {/* Remove */}
                                {form.helpers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = form.helpers.filter((_, i) => i !== index);
                                      onChange({
                                        target: { name: "helpers", value: updated },
                                      });
                                    }}
                                    className="shrink-0 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition"
                                  >
                                    −
                                  </button>
                                )}
                              </motion.div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ===== PURPOSE ===== */}
                    <div ref={registerSection("details")}>
                      <h2 className={`text-sm font-semibold mb-2 ${theme.mutedText}`}>Details</h2>

                      <motion.input
                        variants={inputVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.35 }}
                        name="purpose"
                        value={form.purpose}
                        onChange={onChange}
                        placeholder="Purpose"
                        className={`border p-2.5 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                      />
                    </div>

                    {/* ===== ACTIONS ===== */}
                    <motion.div
                      className={`flex justify-end gap-3 p-4 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 border-t sticky bottom-0 ${theme.headerBg}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.button
                        type="button"
                        onClick={onClose}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${theme.btnSecondary}`}
                      >
                        Cancel
                      </motion.button>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold ${theme.btnPrimary}`}
                      >
                        Save Entry
                      </motion.button>
                    </motion.div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-5 right-5 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 ${theme.toastBg}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">Entry saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}