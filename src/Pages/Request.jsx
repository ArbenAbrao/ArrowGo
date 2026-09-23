// src/Components/Request/Request.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

import useRequests from "../Components/Request/useRequests";
import RequestItem from "../Components/Request/RequestItem";
import RequestModal from "../Components/Request/RequestModal";
import BulkApprovalModal from "../Components/Request/BulkApprovalModal";
import StatsCard from "../Components/Request/StatsCard";

export default function Request({ darkMode }) {
  const { requests, selectedBulk, setSelectedBulk, approve, reject, bulkApprove } = useRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= FILTERING ================= */
  const normalizedSearch = search.trim().toLowerCase();

  const matchesSearch = (req) =>
    !normalizedSearch || JSON.stringify(req).toLowerCase().includes(normalizedSearch);

  const appointmentRequests = useMemo(
    () => requests.filter((r) => r.type === "appointment" && matchesSearch(r)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, normalizedSearch]
  );
  const truckRequests = useMemo(
    () => requests.filter((r) => r.type === "truck" && matchesSearch(r)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, normalizedSearch]
  );

  /* ================= HANDLERS ================= */
  const toggleBulkSelect = (id) => {
    setSelectedBulk((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openModal = (req) => {
    if (selectedBulk.length > 0) return;
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const bulkStats = selectedBulk.reduce(
    (acc, id) => {
      const req = requests.find((r) => r.id === id);
      if (!req) return acc;
      if (req.type === "appointment") acc.appointment += 1;
      if (req.type === "truck") acc.truck += 1;
      return acc;
    },
    { appointment: 0, truck: 0 }
  );

  // Confirm-before-approve: the floating toolbar opens this modal instead
  // of calling bulkApprove directly, so BulkApprovalModal is actually used.
  const handleConfirmBulkApprove = () => {
    bulkApprove();
    setIsBulkModalOpen(false);
  };

  /* ================= THEME ================= */
  // Same token family as VehicleManagement.jsx — slate-950/900 surfaces,
  // single emerald accent, semantic color reserved for status/danger only.
  const theme = darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
        detailText: "text-slate-300",
        metaText: "text-slate-500",
        panelBg: "bg-slate-900/60 border-slate-800",
        itemBg: "bg-slate-800/50 border-slate-700 hover:bg-slate-800/80",
        itemSelectedBg: "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/40",
        innerPanelBg: "bg-slate-800/60 border-slate-700",
        rowBorder: "border-slate-800",
        chipMuted: "bg-slate-800 text-slate-400",
        inputBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60 placeholder:text-slate-500",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
        btnDanger:
          "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110",
        toolbarBg: "bg-slate-900/95 border-slate-700",
        modalBg: "bg-slate-900 border-slate-800 text-slate-100",
        modalHeaderBg: "border-slate-800 bg-slate-800/60",
      }
    : {
        pageBg: "bg-slate-50 text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        detailText: "text-slate-700",
        metaText: "text-slate-500",
        panelBg: "bg-white border-slate-200",
        itemBg: "bg-slate-50 border-slate-200 hover:bg-white",
        itemSelectedBg: "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/50",
        innerPanelBg: "bg-slate-50 border-slate-200",
        rowBorder: "border-slate-200",
        chipMuted: "bg-slate-100 text-slate-500",
        inputBg:
          "bg-white text-slate-900 border-slate-300 focus:ring-emerald-400 focus:border-emerald-400 placeholder:text-slate-400",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        btnDanger: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20",
        toolbarBg: "bg-white/95 border-slate-200",
        modalBg: "bg-white border-slate-200 text-slate-900",
        modalHeaderBg: "border-slate-200 bg-emerald-50",
      };

  // Passed through to RequestModal / BulkApprovalModal so their buttons
  // pick up the same palette.
  const approveBtn = theme.btnPrimary;
  const rejectBtn = theme.btnDanger;
  const cancelBtn = theme.btnSecondary;

  const columns = [
    { key: "appointment", label: "Appointments", icon: CalendarDaysIcon, items: appointmentRequests },
    { key: "truck", label: "Trucks", icon: TruckIcon, items: truckRequests },
  ];

  /* ================= UI ================= */
  return (
    <div className={`min-h-screen p-4 sm:p-6 pb-28 transition-colors duration-300 ${theme.pageBg}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .page-title { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-6"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
          <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
        </span>
        <div>
          <h1 className={`page-title text-xl sm:text-2xl font-bold leading-tight ${theme.titleText}`}>
            Request Dashboard
          </h1>
          <p className={`text-xs mt-0.5 ${theme.subtleText}`}>Live monitoring of incoming requests</p>
        </div>
      </motion.div>

      {/* STATS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total" value={requests.length} icon={ClipboardDocumentListIcon} accent="slate" darkMode={darkMode} />
        <StatsCard title="Appointments" value={appointmentRequests.length} icon={CalendarDaysIcon} accent="blue" darkMode={darkMode} />
        <StatsCard title="Trucks" value={truckRequests.length} icon={TruckIcon} accent="emerald" darkMode={darkMode} />
      </div>

      {/* SEARCH */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.subtleText}`} />
          <input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-9 py-2.5 rounded-xl border outline-none focus:ring-2 transition-colors ${theme.inputBg}`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.subtleText} hover:text-rose-500 transition`}
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* COLUMNS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        {columns.map(({ key, label, icon: Icon, items }) => {
          const allSelected = items.length > 0 && items.every((r) => selectedBulk.includes(r.id));
          return (
            <div key={key} className={`rounded-2xl border p-4 sm:p-5 ${theme.panelBg}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${theme.subtleText}`} />
                  <p className={`font-semibold text-lg ${theme.titleText}`}>{label}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme.chipMuted}`}>
                    {items.length}
                  </span>
                </div>
                <label className={`flex items-center gap-1.5 text-sm cursor-pointer ${theme.subtleText}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBulk((prev) => [
                          ...prev,
                          ...items.map((r) => r.id).filter((id) => !prev.includes(id)),
                        ]);
                      } else {
                        setSelectedBulk((prev) => prev.filter((id) => !items.some((r) => r.id === id)));
                      }
                    }}
                    className="accent-emerald-500"
                  />
                  Select all
                </label>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((req) => (
                  <RequestItem
                    key={req.id}
                    req={req}
                    darkMode={darkMode}
                    isSelected={selectedBulk.includes(req.id)}
                    toggleBulkSelect={toggleBulkSelect}
                    openModal={openModal}
                    theme={theme}
                  />
                ))}

                {items.length === 0 && (
                  <div className={`text-center py-10 rounded-xl border border-dashed ${theme.rowBorder}`}>
                    <Icon className={`h-7 w-7 mx-auto mb-2 ${theme.subtleText}`} />
                    <p className={`text-sm ${theme.subtleText}`}>
                      {normalizedSearch ? "No matching requests." : `No pending ${label.toLowerCase()}.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING BULK ACTION BAR */}
      <AnimatePresence>
        {selectedBulk.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border shadow-2xl px-4 py-3 backdrop-blur ${theme.toolbarBg}`}
          >
            <span className={`text-sm font-medium px-1 ${theme.titleText}`}>{selectedBulk.length} selected</span>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition ${approveBtn}`}
            >
              <CheckIcon className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() =>
                selectedBulk.forEach((id) => {
                  const req = requests.find((r) => r.id === id);
                  if (req) reject(id, req.type);
                })
              }
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${rejectBtn}`}
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedBulk([])}
              className={`p-2 rounded-xl transition ${cancelBtn}`}
              aria-label="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedRequest={selectedRequest}
        approve={approve}
        reject={reject}
        approveBtn={approveBtn}
        rejectBtn={rejectBtn}
        cancelBtn={cancelBtn}
        theme={theme}
      />
      <BulkApprovalModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedBulk={selectedBulk}
        bulkStats={bulkStats}
        bulkApprove={handleConfirmBulkApprove}
        approveBtn={approveBtn}
        cancelBtn={cancelBtn}
        theme={theme}
      />
    </div>
  );
}