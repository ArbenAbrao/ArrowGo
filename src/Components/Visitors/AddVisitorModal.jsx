// src/Components/Visitors/AddVisitorModal.jsx
import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  UserIcon,
  ChevronDownIcon,
  XMarkIcon,
  CheckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// DropdownPortal — same fix as AddTruckModal.jsx / Header.jsx: a Framer
// Motion `motion.div` carries an inline `transform` even at rest, which
// creates its own CSS stacking context, so a dropdown's `z-50` only wins
// against siblings in that same context. Rendering the floating panel into
// document.body via a portal, positioned with getBoundingClientRect(),
// escapes every ancestor's stacking context (and the modal's
// `overflow-hidden`) entirely.
// ---------------------------------------------------------------------------
function DropdownPortal({ anchorRef, open, onClose, children, panelClassName = "" }) {
  const [coords, setCoords] = useState(null);
  const panelRef = useRef(null);

  const recalc = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    setCoords({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 8,
      bottom: openUp ? window.innerHeight - r.top + 8 : undefined,
      maxHeight: Math.max(140, (openUp ? spaceAbove : spaceBelow) - 24),
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
      }}
      className={`overflow-hidden ${panelClassName}`}
    >
      {children}
    </div>,
    document.body
  );
}

const ID_TYPES = ["PhilHealth ID", "SSS ID", "Driver's License", "TIN ID", "Other"];
const DEFAULT_BRANCHES = ["Marilao", "Taguig", "Palawan", "Davao", "Cebu"];
// Decorative only — widths for the badge's barcode strip.
const BARCODE_PATTERN = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 3, 1, 2, 1, 3, 2];

// ---------------------------------------------------------------------------
// IconField — every text field's icon-prefixed input treatment.
//
// ✅ FIX (input losing focus after every keystroke / "one letter at a
// time"): this used to be defined INSIDE AddVisitorModal's render body as
// `const IconField = (...) => (...)`. That means a brand-new IconField
// *function* was created on every render of AddVisitorModal — and
// AddVisitorModal re-renders on every keystroke, since typing updates
// `form` state. React identifies component types by function identity, so
// each render's new IconField was a "different" component as far as React
// was concerned, and it unmounted the old <input> DOM node and mounted a
// fresh one in its place instead of just updating it. That's what dropped
// focus after each character.
//
// Hoisting it out to module scope (like DropdownPortal and BadgePreview
// already were) means it's the SAME function reference on every render, so
// React correctly diffs and updates the existing <input> instead of
// remounting it. `form`, `onChange`, and `theme` — previously grabbed via
// closure — are now passed in explicitly as props.
// ---------------------------------------------------------------------------
function IconField({ icon: Icon, label, name, placeholder, required = false, form, onChange, theme }) {
  return (
    <div>
      <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
        {label}
        {required && " *"}
      </label>
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.fieldIcon}`} />
        <input
          type="text"
          name={name}
          value={form[name]}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`border p-2.5 pl-9 w-full rounded-lg ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BadgePreview — the one bold element in this form. It mirrors a physical
// visitor lanyard badge and fills in live as the guard types, so what's
// being issued is legible at a glance instead of trusted to a flat list of
// filled inputs.
// ---------------------------------------------------------------------------
function BadgePreview({ form, theme, darkMode }) {
  const row = (label, value, mono = false) => (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`text-[10px] uppercase tracking-wide shrink-0 ${theme.mutedText}`}>{label}</span>
      <span
        className={`text-xs font-medium truncate text-right ${mono ? "mono-badge" : ""} ${
          value ? theme.textColor : theme.mutedText
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="w-full max-w-[280px] mx-auto lg:mx-0 lg:sticky lg:top-0"
    >
      {/* lanyard clip */}
      <div className="flex justify-center relative z-10" aria-hidden="true">
        <div
          className="h-4 w-12 rounded-t-md border border-b-0"
          style={{
            background: darkMode
              ? "linear-gradient(180deg, #d4d4d8, #8b8f99)"
              : "linear-gradient(180deg, #f4f4f5, #cbd0d8)",
            borderColor: darkMode ? "#71717a" : "#a1a7b3",
          }}
        />
      </div>

      <div className={`relative overflow-hidden rounded-2xl border shadow-2xl ${theme.badgeCardBg}`}>
        {/* hole punch */}
        <div className="flex justify-center pt-3" aria-hidden="true">
          <div className={`h-2.5 w-8 rounded-full ${darkMode ? "bg-slate-950/80 ring-1 ring-white/10" : "bg-slate-200 ring-1 ring-black/5"}`} />
        </div>

        {/* header stripe */}
        <div className={`mt-3 bg-gradient-to-r ${theme.badgeStripe} px-4 py-2 flex items-center justify-between`}>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950/80">Visitor Pass</span>
          <span className="text-[10px] font-semibold text-slate-950/60">ArrowGo</span>
        </div>

        {/* photo + name */}
        <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center border-2"
            style={{ borderColor: darkMode ? "#b98d2f" : "#c9932f" }}
          >
            <UserIcon className={`w-8 h-8 ${theme.mutedText}`} />
          </div>
          <p className="form-title mt-3 text-base font-semibold leading-tight truncate max-w-full">
            {form.visitorName || "Visitor Name"}
          </p>
          <p className={`text-xs mt-0.5 truncate max-w-full ${theme.mutedText}`}>
            {form.company || "Company / From"}
          </p>
        </div>

        <div className={`mx-5 border-t ${theme.borderColor}`} />

        {/* details */}
        <div className="px-5 py-4 space-y-2.5">
          {row("Visiting", form.personToVisit)}
          {row("Purpose", form.purpose)}
          {row("ID Type", form.idType)}
          {row("ID No.", form.idNumber, true)}
          {row("Branch", form.branch)}
        </div>

        <div className={`mx-5 border-t ${theme.borderColor}`} />

        {/* badge number + barcode */}
        <div className="px-5 pt-4 flex items-end justify-between gap-3">
          <div>
            <p className={`text-[10px] uppercase tracking-wide ${theme.mutedText}`}>Badge No.</p>
            <p className="mono-badge text-xl font-semibold leading-none mt-1">{form.badgeNumber || "—"}</p>
          </div>
          <div className="flex items-end h-7 gap-[1.5px]" aria-hidden="true">
            {BARCODE_PATTERN.map((w, i) => (
              <span
                key={i}
                className={`h-full ${i % 5 === 0 ? (darkMode ? "bg-slate-400/60" : "bg-slate-500/50") : (darkMode ? "bg-slate-600/50" : "bg-slate-300/70")}`}
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        </div>

        {/* perforation, ticket-stub style */}
        <div className="flex justify-center gap-1 py-3" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className={`h-1 w-1 rounded-full ${darkMode ? "bg-slate-700/60" : "bg-slate-300/80"}`} />
          ))}
        </div>

        <p className={`px-5 pb-4 text-[10px] ${theme.mutedText}`}>Valid {todayStr}</p>

        {/* glossy laminate sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}

export default function AddVisitorModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  darkMode = true,
  branches = [], // optional — same shape as AddTruckModal's `branches` prop; falls back to the static list below
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const idTypeAnchorRef = useRef(null);
  const branchAnchorRef = useRef(null);

  const branchOptions = branches.length
    ? branches.map((b) => (typeof b === "string" ? b : b.name))
    : DEFAULT_BRANCHES;

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // ---------------------------------------------------------------------
  // Theme tokens — builds on AddTruckModal's slate/emerald palette, with a
  // glassier header/toast and a warm brass accent reserved for the badge
  // preview's hole-punch ring, so the one "physical object" in the form
  // reads as considered rather than another flat card.
  // ---------------------------------------------------------------------
  const theme = darkMode
    ? {
        modalBg: "bg-slate-950 text-slate-100",
        headerBg: "bg-slate-900/70 backdrop-blur-xl border-slate-800",
        iconBadge:
          "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_18px_-4px_rgba(16,185,129,0.45)]",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-100 hover:bg-slate-800",
        inputBg: "bg-slate-900/60 text-slate-100 border-slate-800",
        fieldIcon: "text-slate-600",
        cardBg: "bg-white/[0.02] border-slate-800/80",
        dropdownSolid: "#0c1526",
        dropdownHover: "hover:bg-emerald-500/10",
        optionBg: "bg-slate-800/80 text-slate-100",
        textColor: "text-slate-100",
        mutedText: "text-slate-500",
        borderColor: "border-slate-800",
        toastBg: "bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 text-slate-100",
        badgeCardBg: "bg-gradient-to-b from-slate-900 to-slate-950 border-white/10",
        badgeStripe: "from-emerald-400 via-emerald-500 to-teal-500",
      }
    : {
        modalBg: "bg-white text-slate-900",
        headerBg: "bg-white/80 backdrop-blur-xl border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_0_14px_-6px_rgba(16,185,129,0.35)]",
        btnPrimary:
          "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        inputBg: "bg-slate-50 text-slate-900 border-slate-200",
        fieldIcon: "text-slate-400",
        cardBg: "bg-slate-50/60 border-slate-200",
        dropdownSolid: "#ffffff",
        dropdownHover: "hover:bg-emerald-50",
        optionBg: "bg-slate-100 text-slate-900",
        textColor: "text-slate-900",
        mutedText: "text-slate-500",
        borderColor: "border-slate-200",
        toastBg: "bg-white/95 backdrop-blur-xl border border-emerald-200 text-slate-900",
        badgeCardBg: "bg-gradient-to-b from-white to-slate-50 border-black/5",
        badgeStripe: "from-emerald-400 via-emerald-500 to-teal-500",
      };

  const scrollThumb = darkMode ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.4)";
  const scrollThumbHover = darkMode ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.65)";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    onClose();
  };

  const chip = (label, active, onClick) => (
    <span
      key={label}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full cursor-pointer text-sm font-medium border transition
        ${active ? "bg-emerald-400 text-slate-950 border-emerald-400" : `${theme.optionBg} ${theme.borderColor} ${theme.dropdownHover}`}`}
    >
      {label}
    </span>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .form-title { font-family: 'Space Grotesk', sans-serif; }
        .mono-badge { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }
        .visitor-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${scrollThumb} transparent;
        }
        .visitor-scroll::-webkit-scrollbar { width: 8px; }
        .visitor-scroll::-webkit-scrollbar-track { background: transparent; }
        .visitor-scroll::-webkit-scrollbar-thumb {
          background-color: ${scrollThumb};
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .visitor-scroll::-webkit-scrollbar-thumb:hover { background-color: ${scrollThumbHover}; }
      `}</style>

      <Transition appear show={isOpen} as={Fragment}>
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
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${theme.modalBg} ${theme.borderColor}`}
              >
                {/* hairline accent */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent shrink-0" />

                {/* Header */}
                <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${theme.headerBg}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="form-title text-[15px] font-semibold leading-tight">
                      Add Visitor
                    </Dialog.Title>
                    <p className={`text-xs mt-0.5 ${theme.mutedText}`}>Issue a gate visitor pass</p>
                  </div>
                  <button
                    onClick={onClose}
                    className={`ml-auto flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-white/5 ${theme.borderColor} ${theme.mutedText}`}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="visitor-scroll flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_284px] gap-6 lg:gap-8 p-4 sm:p-6">
                    {/* ===== LEFT: FIELDS ===== */}
                    <div className="order-2 lg:order-1 space-y-6 min-w-0">
                      {/* Visitor Info */}
                      <motion.div
                        variants={inputVariants}
                        initial="hidden"
                        animate="visible"
                        className={`rounded-xl border p-5 ${theme.cardBg}`}
                      >
                        <h2 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${theme.mutedText}`}>
                          Visitor Info
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <IconField
                              icon={UserIcon}
                              label="Full Name"
                              name="visitorName"
                              placeholder="Juan Dela Cruz"
                              required
                              form={form}
                              onChange={onChange}
                              theme={theme}
                            />
                          </div>
                          <IconField
                            icon={BuildingOfficeIcon}
                            label="Company / From"
                            name="company"
                            placeholder="e.g. ABC Trucking Services"
                            form={form}
                            onChange={onChange}
                            theme={theme}
                          />
                          <IconField
                            icon={UserGroupIcon}
                            label="Person to Visit"
                            name="personToVisit"
                            placeholder="Who they're here to see"
                            form={form}
                            onChange={onChange}
                            theme={theme}
                          />
                          <div className="sm:col-span-2">
                            <IconField
                              icon={ClipboardDocumentListIcon}
                              label="Purpose"
                              name="purpose"
                              placeholder="Delivery, meeting, inspection..."
                              form={form}
                              onChange={onChange}
                              theme={theme}
                            />
                          </div>
                        </div>
                      </motion.div>

                      {/* Identification */}
                      <motion.div
                        variants={inputVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.05 }}
                        className={`rounded-xl border p-5 ${theme.cardBg}`}
                      >
                        <h2 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${theme.mutedText}`}>
                          Identification
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* ID Type */}
                          <div className="relative">
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              ID Type
                            </label>
                            <button
                              ref={idTypeAnchorRef}
                              type="button"
                              onClick={() => setDropdownOpen(dropdownOpen === "idType" ? null : "idType")}
                              className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center gap-2 ${theme.inputBg} hover:border-emerald-500/60`}
                            >
                              <span className={`flex items-center gap-2 min-w-0 truncate ${form.idType ? "" : theme.mutedText}`}>
                                <IdentificationIcon className={`w-4 h-4 shrink-0 ${theme.fieldIcon}`} />
                                {form.idType || "Select ID Type"}
                              </span>
                              <ChevronDownIcon
                                className={`w-5 h-5 ml-2 shrink-0 transition-transform ${theme.mutedText} ${
                                  dropdownOpen === "idType" ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <DropdownPortal
                              anchorRef={idTypeAnchorRef}
                              open={dropdownOpen === "idType"}
                              onClose={() => setDropdownOpen(null)}
                            >
                              <AnimatePresence>
                                {dropdownOpen === "idType" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ backgroundColor: theme.dropdownSolid }}
                                    className={`rounded-lg shadow-xl border p-2 flex flex-wrap gap-2 overflow-y-auto ${theme.textColor} ${theme.borderColor}`}
                                  >
                                    {ID_TYPES.map((type) =>
                                      chip(type, form.idType === type, () => {
                                        onChange({ target: { name: "idType", value: type } });
                                        setDropdownOpen(null);
                                      })
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </DropdownPortal>
                          </div>

                          {/* ID Number */}
                          <IconField
                            icon={IdentificationIcon}
                            label="ID Number"
                            name="idNumber"
                            placeholder="ID Number"
                            required
                            form={form}
                            onChange={onChange}
                            theme={theme}
                          />

                          {/* Branch */}
                          <div className="relative sm:col-span-2">
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Branch
                            </label>
                            <button
                              ref={branchAnchorRef}
                              type="button"
                              onClick={() => setDropdownOpen(dropdownOpen === "branch" ? null : "branch")}
                              className={`w-full border p-2.5 rounded-lg text-left flex justify-between items-center gap-2 ${theme.inputBg} hover:border-emerald-500/60`}
                            >
                              <span className={`flex items-center gap-2 min-w-0 truncate ${form.branch ? "" : theme.mutedText}`}>
                                <MapPinIcon className={`w-4 h-4 shrink-0 ${theme.fieldIcon}`} />
                                {form.branch || "Select Branch"}
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
                                    className={`rounded-lg shadow-xl border p-2 flex flex-wrap gap-2 overflow-y-auto ${theme.textColor} ${theme.borderColor}`}
                                  >
                                    {branchOptions.map((branchName) =>
                                      chip(branchName, form.branch === branchName, () => {
                                        onChange({ target: { name: "branch", value: branchName } });
                                        setDropdownOpen(null);
                                      })
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </DropdownPortal>
                          </div>

                          {/* Badge Number */}
                          <div className="sm:col-span-2">
                            <label className={`block text-[11px] uppercase tracking-wide mb-1.5 ${theme.mutedText}`}>
                              Badge Number *
                            </label>
                            <select
                              name="badgeNumber"
                              value={form.badgeNumber}
                              onChange={onChange}
                              required
                              className={`border p-2.5 w-full rounded-lg mono-badge ${theme.inputBg} focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition`}
                            >
                              <option value="">Select Badge Number</option>
                              {Array.from({ length: 15 }, (_, i) => (
                                <option key={i} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* ===== RIGHT: LIVE BADGE PREVIEW ===== */}
                    <div className="order-1 lg:order-2">
                      <BadgePreview form={form} theme={theme} darkMode={darkMode} />
                    </div>
                  </div>

                  {/* ===== ACTIONS ===== */}
                  <div className={`flex justify-end gap-3 p-4 border-t sticky bottom-0 ${theme.headerBg}`}>
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
                      Issue Visitor Pass
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Success Toast */}
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
            <span className="text-sm font-medium">Visitor pass issued</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}