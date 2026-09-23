import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ArchiveBoxIcon, // ✅ NEW
} from "@heroicons/react/24/outline";

export default function VisitorsHeader({
  darkMode,
  appointmentRequests,
  setIsAppointmentModalOpen,
  setIsAddModalOpen,
  setIsCompleteListModalOpen,
  archivedCount = 0, // ✅ NEW
  setIsArchiveModalOpen, // ✅ NEW
  visitors,
  selectedBranch,
  setSelectedBranch,
  searchTerm,
  setSearchTerm,
  userRole,
}) {
  const [branches, setBranches] = useState([]);

  // Extract unique branches
  useEffect(() => {
    const uniqueBranches = [
      ...new Set(visitors.map((v) => v.branch).filter(Boolean)),
    ];
    setBranches(uniqueBranches);
  }, [visitors]);

  const activeCount = visitors.filter((v) => !v.timeOut).length;

  // Same tokens as trucks.jsx / AddTruckModal / CompleteTrucksListModal:
  // slate-950/900 surfaces, emerald as the primary accent. Amber is
  // reserved for Appointment Requests — the one action here that's
  // waiting on the person rather than something they initiate.
  const theme = darkMode
    ? {
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
        toolbarBg: "bg-slate-900/60 border-slate-800",
        inputBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 placeholder-slate-500 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        selectBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
        btnWarning: "bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20",
        warningBadge: "bg-amber-400 text-slate-950",
        // ✅ NEW — neutral count chip for Archive (amber stays with Appointment Requests)
        countBadge: "bg-slate-700 text-slate-200",
      }
    : {
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        toolbarBg: "bg-white border-slate-200",
        inputBg:
          "bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:ring-emerald-400 focus:border-emerald-400",
        selectBg: "bg-white text-slate-900 border-slate-300 focus:ring-emerald-400 focus:border-emerald-400",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        btnWarning: "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100",
        warningBadge: "bg-amber-500 text-white",
        countBadge: "bg-slate-200 text-slate-700", // ✅ NEW
      };

  return (
    <div className="mb-6">
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
            Visitors Management
          </h1>
          <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
            {activeCount} visitor{activeCount !== 1 ? "s" : ""} currently on site
          </p>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center rounded-2xl border p-3 ${theme.toolbarBg}`}
      >
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${theme.subtleText}`} />
          <input
            className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${theme.inputBg}`}
            placeholder="Search visitor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Branch Filter */}
        <div className="relative w-full sm:w-auto">
          <MapPinIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.subtleText}`} />
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={`w-full sm:w-auto pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition appearance-none ${theme.selectBg}`}
          >
            <option value="">All Branches</option>
            {branches.map((branch, index) => (
              <option key={index} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {/* Appointment Requests */}
          {(userRole === "Admin" || userRole === "IT" || userRole === "User") && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAppointmentModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnWarning}`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              Appointment Requests
              {appointmentRequests.length > 0 && (
                <span className={`ml-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${theme.warningBadge}`}>
                  {appointmentRequests.length}
                </span>
              )}
            </motion.button>
          )}

          {/* Add Visitor */}
          {(userRole === "Admin" || userRole === "IT" || userRole === "User") && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnPrimary}`}
            >
              <PlusIcon className="w-4 h-4" />
              Add Visitor
            </motion.button>
          )}

          {/* View Completed Visitors */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCompleteListModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            Completed
          </motion.button>

          {/* ✅ NEW — Archived (expired) appointment requests. Same roles as
              Appointment Requests, since it can restore or permanently delete them. */}
          {(userRole === "Admin" || userRole === "IT" || userRole === "User") && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsArchiveModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Archive
              {archivedCount > 0 && (
                <span className={`ml-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${theme.countBadge}`}>
                  {archivedCount}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}