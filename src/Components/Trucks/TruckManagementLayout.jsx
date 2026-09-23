import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

// Same tokens as visitors.jsx: slate-950/900 surfaces, emerald as the
// primary accent. Kept local so this file matches its sibling exactly.
function getTheme(darkMode) {
  return darkMode
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
      };
}

/* ================= MAIN LAYOUT ================= */
export default function TruckManagementLayout({
  darkMode,
  filterDate,
  setFilterDate,
  setIsRegisterModalOpen,
  setIsRegisteredModalOpen,
  setIsAddModalOpen,
  setIsCompleteListModalOpen,
  selectedBranch,
  setSelectedBranch,
  selectedClient,
  setSelectedClient,
  clients,
  searchTerm,
  setSearchTerm,
}) {
  const theme = getTheme(darkMode);
  const [branches, setBranches] = useState([]);
  const datePickerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/branches`).then((res) => setBranches(res.data));
  }, []);

  const clientOptions = selectedBranch
    ? [
        ...new Set(
          clients
            .filter((c) => c.branchRegistered === selectedBranch)
            .map((c) => c.clientName)
        ),
      ]
    : [];

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
            type="text"
            placeholder="Search by client, plate, truck type, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${theme.inputBg}`}
          />
        </div>

        {/* Branch Filter */}
        <div className="relative w-full sm:w-auto">
          <MapPinIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.subtleText}`} />
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedClient("");
            }}
            className={`w-full sm:w-auto pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition appearance-none ${theme.selectBg}`}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Client Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={!selectedBranch}
            className={`w-full sm:w-auto px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition appearance-none disabled:opacity-50 ${theme.selectBg}`}
          >
            <option value="">All Clients</option>
            {clientOptions.map((clientName) => (
              <option key={clientName} value={clientName}>
                {clientName}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative w-full sm:w-auto">
          <CalendarDaysIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${theme.subtleText}`} />
          <DatePicker
            ref={datePickerRef}
            selected={filterDate}
            onChange={setFilterDate}
            dateFormat="MMM d, yyyy"
            placeholderText="Filter by date"
            className={`w-full sm:w-auto pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition ${theme.inputBg}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {/* Register Vehicle */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsRegisterModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnPrimary}`}
          >
            <TruckIcon className="w-4 h-4" />
            Register Vehicle
          </motion.button>

          {/* Registered Vehicles */}
          {setIsRegisteredModalOpen && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsRegisteredModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Registered
            </motion.button>
          )}

          {/* Add Truck */}
          {setIsAddModalOpen && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
            >
              <PlusIcon className="w-4 h-4" />
              Add Truck
            </motion.button>
          )}

          {/* Completed */}
          {setIsCompleteListModalOpen && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsCompleteListModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Completed
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}