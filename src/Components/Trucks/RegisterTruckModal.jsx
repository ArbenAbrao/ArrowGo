// RegisterTruckModal.jsx
import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  TruckIcon,
  ChevronDownIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API = `${process.env.REACT_APP_API_URL}/api`;

// ---- Registration & compliance helpers -------------------------------
// Price schedule: ₱30 for 2-wheelers, ₱70 for 4-wheel/cars, ₱150 for trucks.
const TWO_WHEEL_TYPES = ["2-Wheel Motorcycle", "3-Wheel Motorcycle (Tricycle)", "Big Bike"];
const FOUR_WHEEL_TYPES = ["Sedan", "SUV", "Van","Shuttle Van", "Pickup Truck"];

function getSuggestedPrice(vehicleType) {
  if (!vehicleType) return null;
  if (TWO_WHEEL_TYPES.includes(vehicleType)) return 30;
  if (FOUR_WHEEL_TYPES.includes(vehicleType)) return 70;
  return 150; // everything else (4-wheel trucks and heavier) falls under the truck rate
}

function addOneYear(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function getRenewalStatus(nextRenewalDate) {
  if (!nextRenewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(nextRenewalDate);
  if (Number.isNaN(renewal.getTime())) return null;

  const diffDays = Math.round((renewal - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
      tone: "red",
    };
  }
  if (diffDays <= 30) {
    return { label: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`, tone: "amber" };
  }
  return { label: `Renews ${renewal.toLocaleDateString()}`, tone: "green" };
}
// -----------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DropdownPortal
//
// Same pattern as AddTruckModal.jsx: every Framer Motion `motion.div` carries
// an inline `transform` even at rest, which creates its own CSS stacking
// context. That means a dropdown's `z-50` only wins against siblings *inside
// that same stacking context* — it can't out-rank later sections in the form,
// because each of those has its own motion.div stacking context too. The fix
// is to render the floating panel into document.body via a portal, positioned
// with getBoundingClientRect(). That escapes every ancestor's stacking
// context (and the modal's `overflow-hidden`) entirely.
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
  { key: "owner", label: "Branch & Client" },
  { key: "vehicle", label: "Vehicle" },
  { key: "registration", label: "Registration" },
];

export default function RegisterTruckModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  darkMode = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeSection, setActiveSection] = useState("owner");

  // Anchors for the portal-positioned dropdowns
  const branchAnchorRef = useRef(null);
  const clientAnchorRef = useRef(null);
  const truckTypeAnchorRef = useRef(null);

  // Anchors for the rail's scrollspy / jump-to-section behavior
  const formScrollRef = useRef(null);
  const sectionRefs = useRef({});
  const registerSection = (key) => (el) => {
    sectionRefs.current[key] = el;
  };

  // Track the last value WE auto-filled, so we only overwrite price /
  // renewal date while the user hasn't typed their own value over it.
  const lastAutoPrice = useRef(null);
  const lastAutoRenewal = useRef(null);

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // ---------------------------------------------------------------------
  // Theme tokens — identical palette to AddTruckModal: slate-950/900
  // surfaces, emerald accent, thin sky-to-emerald rail progress fill.
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
        dropdownSolid: "#0b1424",
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
      };

  const truckOptions = [
    "2-Wheel Motorcycle",
    "3-Wheel Motorcycle (Tricycle)",
    "Big Bike",
    "Sedan",
    "SUV",
    "Van",
    "Shuttle Van",
    "Pickup Truck",
    "4-Wheel Truck",
    "Closed Van",
    "6-Wheel Truck",
    "8-Wheel Truck",
    "10-Wheel Truck",
    "12-Wheel Truck",
    "Trailer Truck",
    "Semi-Trailer",
    "Low Bed Trailer",
    "Flatbed Trailer",
    "Container Truck",
    "Wing Van",
    "Dump Truck",
    "Refrigerated Truck (Reefer)",
    "Tanker Truck",
    "Cement Mixer Truck",
    "Car Carrier Truck",
    "Heavy Equipment Transporter",
    
  ];

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches`);
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async (branchId) => {
    if (!branchId) return setClients([]);
    try {
      const res = await axios.get(`${API}/branch-clients`);
      const filtered = res.data.filter((c) => c.branch_id === parseInt(branchId));
      setClients(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchClients(form.branchRegisteredId);
    onChange({ target: { name: "clientName", value: "" } });
    // eslint-disable-next-line
  }, [form.branchRegisteredId]);

  // Auto-suggest price from vehicle type, but don't clobber a manual edit.
  useEffect(() => {
    const suggested = getSuggestedPrice(form.truckType);
    if (suggested == null) return;

    const priceIsBlank = form.price === "" || form.price === undefined || form.price === null;
    const priceMatchesLastAuto = String(form.price) === String(lastAutoPrice.current);

    if (priceIsBlank || priceMatchesLastAuto) {
      onChange({ target: { name: "price", value: String(suggested) } });
      lastAutoPrice.current = suggested;
    }
    // eslint-disable-next-line
  }, [form.truckType]);

  // Auto-suggest next renewal date as +1 year from registration date.
  useEffect(() => {
    if (!form.registrationDate) return;
    const suggested = addOneYear(form.registrationDate);
    if (!suggested) return;

    const renewalIsBlank = !form.nextRenewalDate;
    const renewalMatchesLastAuto = form.nextRenewalDate === lastAutoRenewal.current;

    if (renewalIsBlank || renewalMatchesLastAuto) {
      onChange({ target: { name: "nextRenewalDate", value: suggested } });
      lastAutoRenewal.current = suggested;
    }
    // eslint-disable-next-line
  }, [form.registrationDate]);

  const renewalStatus = getRenewalStatus(form.nextRenewalDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // ---------------------------------------------------------------------
  // Rail: which sections are complete, and which is currently in view.
  // ---------------------------------------------------------------------
  const sectionStatus = useMemo(
    () => ({
      owner: !!(form.branchRegistered && form.clientName),
      vehicle: !!(form.truckType && form.plateNumber),
      registration: !!(form.controlId && form.registrationDate),
    }),
    [form.branchRegistered, form.clientName, form.truckType, form.plateNumber, form.controlId, form.registrationDate]
  );

  const sectionSubLabel = {
    owner: form.clientName ? `${form.branchRegistered} · ${form.clientName}` : "Branch + client",
    vehicle: form.plateNumber ? `${form.truckType || "—"} · ${form.plateNumber}` : "Type + plate",
    registration: form.controlId ? `${form.controlId}` : "Control ID + dates",
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .form-title { font-family: 'Space Grotesk', sans-serif; }
        .register-scroll, .rail-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${scrollThumb} transparent;
        }
        .register-scroll::-webkit-scrollbar, .rail-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .register-scroll::-webkit-scrollbar-track, .rail-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .register-scroll::-webkit-scrollbar-thumb, .rail-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .register-scroll::-webkit-scrollbar-thumb:hover, .rail-scroll::-webkit-scrollbar-thumb:hover {
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
                  max-w-5xl
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
                      New Vehicle
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
                <div className="flex-1 flex min-w-0">
                  {/* ===== FORM COLUMN ===== */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className={`flex items-center gap-3 p-4 border-b ${theme.headerBg}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                        <TruckIcon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <Dialog.Title className="form-title text-[15px] font-semibold leading-tight">
                          Register Vehicle
                        </Dialog.Title>
                        <p className={`text-xs mt-0.5 ${theme.mutedText}`}>Fill in truck details below</p>
                      </div>
                      <button
                        onClick={onClose}
                        className={`ml-auto flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.borderColor} ${theme.mutedText}`}
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
                      id="register-truck-form"
                      ref={formScrollRef}
                      onScroll={handleFormScroll}
                      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 register-scroll"
                    >
                      {/* ===== SECTION: BRANCH & CLIENT ===== */}
                      <div ref={registerSection("owner")} className={`rounded-xl border p-5 ${theme.cardBg}`}>
                        <h2 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${theme.mutedText}`}>
                          Branch &amp; Client
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Branch */}
                          <motion.div variants={inputVariants} initial="hidden" animate="visible" className="relative">
                            <button
                              ref={branchAnchorRef}
                              type="button"
                              onClick={() => setDropdownOpen(dropdownOpen === "branch" ? null : "branch")}
                              className={`w-full border p-3 rounded-lg text-left flex justify-between items-center transition-all ${theme.inputBg} hover:border-emerald-500/60`}
                            >
                              <span className={form.branchRegistered ? "" : theme.mutedText}>
                                {form.branchRegistered || "Select Branch Registered"}
                              </span>
                              <ChevronDownIcon
                                className={`w-5 h-5 ml-2 shrink-0 transition-transform ${theme.mutedText} ${
                                  dropdownOpen === "branch" ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <DropdownPortal
                              anchorRef={branchAnchorRef}
                              open={dropdownOpen === "branch"}
                              onClose={() => setDropdownOpen(null)}
                            >
                              <AnimatePresence>
                                {dropdownOpen === "branch" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ backgroundColor: theme.dropdownSolid }}
                                    className={`w-full flex-1 min-h-0 rounded-xl shadow-xl border overflow-y-auto p-2 register-scroll ${theme.textColor} ${theme.borderColor}`}
                                  >
                                    {branches.map((branch) => (
                                      <div
                                        key={branch.id}
                                        className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition ${theme.dropdownHover}`}
                                        onClick={() => {
                                          onChange({ target: { name: "branchRegistered", value: branch.name } });
                                          onChange({ target: { name: "branchRegisteredId", value: branch.id } });
                                          onChange({ target: { name: "clientName", value: "" } });
                                          setDropdownOpen(null);
                                        }}
                                      >
                                        {branch.name}
                                      </div>
                                    ))}
                                    {!branches.length && (
                                      <p className={`text-sm text-center py-6 ${theme.mutedText}`}>No branches found</p>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </DropdownPortal>
                          </motion.div>

                          {/* Client */}
                          <motion.div
                            variants={inputVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.05 }}
                            className="relative"
                          >
                            <button
                              ref={clientAnchorRef}
                              type="button"
                              disabled={!form.branchRegisteredId}
                              onClick={() => setDropdownOpen(dropdownOpen === "client" ? null : "client")}
                              className={`w-full border p-3 rounded-lg text-left flex justify-between items-center transition-all disabled:opacity-40 ${theme.inputBg} hover:border-emerald-500/60`}
                            >
                              <span className={form.clientName ? "" : theme.mutedText}>
                                {form.clientName || "Select Client"}
                              </span>
                              <ChevronDownIcon
                                className={`w-5 h-5 ml-2 shrink-0 transition-transform ${theme.mutedText} ${
                                  dropdownOpen === "client" ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <DropdownPortal
                              anchorRef={clientAnchorRef}
                              open={dropdownOpen === "client"}
                              onClose={() => setDropdownOpen(null)}
                            >
                              <AnimatePresence>
                                {dropdownOpen === "client" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ backgroundColor: theme.dropdownSolid }}
                                    className={`w-full flex-1 min-h-0 rounded-xl shadow-xl border overflow-y-auto p-2 register-scroll ${theme.textColor} ${theme.borderColor}`}
                                  >
                                    {clients.map((c) => (
                                      <div
                                        key={c.id}
                                        className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition ${theme.dropdownHover}`}
                                        onClick={() => {
                                          onChange({ target: { name: "clientName", value: c.name } });
                                          onChange({ target: { name: "clientId", value: c.id } });
                                          setDropdownOpen(null);
                                        }}
                                      >
                                        {c.name}
                                      </div>
                                    ))}
                                    {clients.length === 0 && (
                                      <p className={`text-sm text-center py-6 ${theme.mutedText}`}>
                                        No clients available for this branch
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </DropdownPortal>
                          </motion.div>
                        </div>
                      </div>

                      {/* ===== SECTION: VEHICLE ===== */}
                      <div ref={registerSection("vehicle")} className={`rounded-xl border p-5 ${theme.cardBg}`}>
                        <h2 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${theme.mutedText}`}>
                          Vehicle Details
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Truck Type */}
                            <motion.div
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.1 }}
                              className="relative"
                            >
                              <button
                                ref={truckTypeAnchorRef}
                                type="button"
                                onClick={() => setDropdownOpen(dropdownOpen === "truckType" ? null : "truckType")}
                                className={`w-full border p-3 rounded-lg text-left flex justify-between items-center transition-all ${theme.inputBg} hover:border-emerald-500/60`}
                              >
                                <span className={form.truckType ? "" : theme.mutedText}>
                                  {form.truckType || "Select Vehicle Type"}
                                </span>
                                <ChevronDownIcon
                                  className={`w-5 h-5 ml-2 shrink-0 transition-transform ${theme.mutedText} ${
                                    dropdownOpen === "truckType" ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <DropdownPortal
                                anchorRef={truckTypeAnchorRef}
                                open={dropdownOpen === "truckType"}
                                onClose={() => setDropdownOpen(null)}
                              >
                                <AnimatePresence>
                                  {dropdownOpen === "truckType" && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{ duration: 0.2 }}
                                      style={{ backgroundColor: theme.dropdownSolid }}
                                      className={`w-full flex-1 min-h-0 rounded-xl shadow-xl border overflow-y-auto p-2 register-scroll ${theme.textColor} ${theme.borderColor}`}
                                    >
                                      {truckOptions.map((type, i) => (
                                        <div
                                          key={i}
                                          className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition ${theme.dropdownHover}`}
                                          onClick={() => {
                                            onChange({ target: { name: "truckType", value: type } });
                                            setDropdownOpen(null);
                                          }}
                                        >
                                          {type}
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </DropdownPortal>
                            </motion.div>

                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.12 }}
                              name="plateNumber"
                              value={form.plateNumber}
                              onChange={onChange}
                              placeholder="Plate Number"
                              className={`border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.14 }}
                              name="brandName"
                              value={form.brandName}
                              onChange={onChange}
                              placeholder="Brand"
                              className={`border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.16 }}
                              name="model"
                              value={form.model}
                              onChange={onChange}
                              placeholder="Model"
                              className={`border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.18 }}
                              name="fuelType"
                              value={form.fuelType}
                              onChange={onChange}
                              placeholder="Fuel Type"
                              className={`border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.2 }}
                              name="displacement"
                              value={form.displacement}
                              onChange={onChange}
                              placeholder="Displacement (e.g. 3.0L)"
                              className={`border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>

                          <motion.input
                            variants={inputVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.22 }}
                            name="payloadCapacity"
                            value={form.payloadCapacity}
                            onChange={onChange}
                            placeholder="Payload Capacity"
                            className={`w-full border p-3 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                          />
                        </div>
                      </div>

                      {/* ===== SECTION: REGISTRATION & COMPLIANCE ===== */}
                      <div ref={registerSection("registration")}>
                        <h2 className={`text-sm font-semibold mb-3 ${theme.mutedText}`}>Registration &amp; Compliance</h2>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.24 }}
                              name="controlId"
                              value={form.controlId}
                              onChange={onChange}
                              placeholder="Control ID"
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.26 }}
                              name="registeredName"
                              value={form.registeredName}
                              onChange={onChange}
                              placeholder="Registered Name (on OR/CR)"
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.28 }}
                              name="orNo"
                              value={form.orNo}
                              onChange={onChange}
                              placeholder="OR No. (Official Receipt)"
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.3 }}
                              name="crNo"
                              value={form.crNo}
                              onChange={onChange}
                              placeholder="CR No. / File No."
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.32 }}
                              name="arNo"
                              value={form.arNo}
                              onChange={onChange}
                              placeholder="Acknowledgement Receipt (AR) No."
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />

                            <motion.select
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.34 }}
                              name="status"
                              value={form.status || "Not Paid"}
                              onChange={onChange}
                              className={`border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            >
                              <option value="Not Paid">Not Paid</option>
                              <option value="Paid">Paid</option>
                            </motion.select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-xs mb-1 ml-1 ${theme.mutedText}`}>Registration Date</label>
                              <motion.input
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.36 }}
                                type="date"
                                name="registrationDate"
                                value={form.registrationDate}
                                onChange={onChange}
                                className={`w-full border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                              />
                            </div>

                            <div>
                              <label className={`block text-xs mb-1 ml-1 ${theme.mutedText}`}>Next Renewal Date</label>
                              <motion.input
                                variants={inputVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.38 }}
                                type="date"
                                name="nextRenewalDate"
                                value={form.nextRenewalDate}
                                onChange={onChange}
                                className={`w-full border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                              />
                              <p className={`text-[11px] mt-1 ml-1 ${theme.mutedText}`}>
                                Auto-filled to 1 year after registration — edit if different.
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className={`block text-xs mb-1 ml-1 ${theme.mutedText}`}>Price (₱)</label>
                            <motion.input
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.4 }}
                              type="number"
                              step="0.01"
                              min="0"
                              name="price"
                              value={form.price}
                              onChange={onChange}
                              placeholder="Price"
                              className={`w-full border p-2.5 rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                            <p className={`text-[11px] mt-1 ml-1 ${theme.mutedText}`}>
                              Auto-suggested from vehicle type — ₱30 (2-wheel), ₱70 (4-wheel/car), ₱150 (truck). Edit if
                              this record differs.
                            </p>
                          </div>

                          <div>
                            <label className={`block text-xs mb-1 ml-1 ${theme.mutedText}`}>Remarks</label>
                            <motion.textarea
                              variants={inputVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: 0.42 }}
                              name="remarks"
                              value={form.remarks}
                              onChange={onChange}
                              placeholder="Remarks"
                              rows={3}
                              className={`w-full border p-2.5 rounded-lg resize-none ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ===== ACTIONS ===== */}
                      <motion.div
                        className={`flex justify-end gap-3 p-4 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 border-t sticky bottom-0 ${theme.headerBg}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
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
                          form="register-truck-form"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`px-5 py-2 rounded-lg text-sm font-semibold ${theme.btnPrimary}`}
                        >
                          Register Vehicle
                        </motion.button>
                      </motion.div>
                    </form>
                  </div>

                  {/* ===== RIGHT: LIVE PREVIEW (desktop only) ===== */}
                  <div className={`hidden lg:flex w-[300px] shrink-0 flex-col border-l p-5 ${theme.headerBg}`}>
                    <div className={`rounded-xl border p-5 ${theme.cardBg}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xs uppercase tracking-wider font-semibold ${theme.mutedText}`}>
                          Live Preview
                        </h3>
                        {form.status && (
                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                              form.status === "Paid" ? theme.okBadge : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {form.status}
                          </span>
                        )}
                      </div>

                      {form.plateNumber ? (
                        <div className="flex flex-col items-center">
                          <div className="p-3 rounded-lg bg-white">
                            <QRCodeCanvas
                              value={`${window.location.origin}/truck/${form.plateNumber}`}
                              size={140}
                            />
                          </div>
                          <p className={`text-xs mt-2 ${theme.mutedText}`}>Scan to view truck</p>
                        </div>
                      ) : (
                        <div className={`text-xs text-center py-10 ${theme.mutedText}`}>QR will appear here</div>
                      )}

                      <div className={`my-4 border-t ${theme.borderColor}`} />

                      <div className="space-y-2 text-xs">
                        <p className="flex items-center gap-1.5">
                          <IdentificationIcon className="w-3.5 h-3.5 opacity-60" />
                          <span className={theme.mutedText}>Plate:</span> {form.plateNumber || "—"}
                        </p>
                        <p>
                          <span className={theme.mutedText}>Client:</span> {form.clientName || "—"}
                        </p>
                        <p>
                          <span className={theme.mutedText}>Type:</span> {form.truckType || "—"}
                        </p>
                        <p>
                          <span className={theme.mutedText}>Brand:</span> {form.brandName || "—"}
                        </p>
                        <p>
                          <span className={theme.mutedText}>Model:</span> {form.model || "—"}
                        </p>
                        {form.controlId && (
                          <p className="flex items-center gap-1.5">
                            <DocumentTextIcon className="w-3.5 h-3.5 opacity-60" />
                            <span className={theme.mutedText}>Control ID:</span> {form.controlId}
                          </p>
                        )}
                        {form.registeredName && (
                          <p>
                            <span className={theme.mutedText}>Registered Name:</span> {form.registeredName}
                          </p>
                        )}
                        {form.price !== "" && form.price !== undefined && (
                          <p>
                            <span className={theme.mutedText}>Price:</span> ₱{form.price}
                          </p>
                        )}
                      </div>

                      {renewalStatus && (
                        <div
                          className={`mt-4 text-xs rounded-lg px-3 py-2 font-medium ${
                            renewalStatus.tone === "red"
                              ? theme.busyBadge
                              : renewalStatus.tone === "amber"
                              ? "bg-amber-500/15 text-amber-400"
                              : theme.okBadge
                          }`}
                        >
                          {renewalStatus.label}
                        </div>
                      )}
                    </div>
                  </div>
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
            <span className="text-sm font-medium">Truck registered successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}