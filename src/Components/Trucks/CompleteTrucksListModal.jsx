// src/Components/Trucks/CompleteTrucksListModal.jsx
import { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import {
  TruckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const tableRowVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function CompleteTrucksListModal({
  open,
  onClose,
  trucks: initialTrucks,
  selectedClient,
  setSelectedClient,
  onExport,
  darkMode = false,
}) {
  const [trucks, setTrucks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const ITEMS_PER_PAGE = 8;

  useEffect(() => setTrucks(initialTrucks), [initialTrucks]);
  useEffect(() => setCurrentPage(1), [selectedClient, dateRange, searchTerm]);

  const filtered = useMemo(() => {
    let data = [...trucks];

    if (selectedClient) {
      const clientNormalized = selectedClient.trim().toLowerCase();
      data = data.filter(
        (t) => (t.clientName || "").trim().toLowerCase() === clientNormalized
      );
    }

    if (startDate || endDate) {
      data = data.filter((t) => {
        if (!t.date) return false;
        const truckDate = new Date(t.date);
        if (startDate && truckDate < startDate) return false;
        if (endDate && truckDate > endDate) return false;
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((t) =>
        `${t.clientName || ""} ${t.truckType || ""} ${t.plateNumber || ""} ${t.bay || ""} ${t.driver || ""} ${t.purpose || ""}`.toLowerCase().includes(term)
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === "date" || sortConfig.key === "timeOutDate") {
          valA = valA ? new Date(valA) : new Date(0);
          valB = valB ? new Date(valB) : new Date(0);
        }
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [trucks, selectedClient, startDate, endDate, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key) => {
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
      await Promise.all(selectedIds.map((id) => axios.delete(`https://tmvasbackend.arrowgo-logistics.com/api/trucks/${id}`)));
      setTrucks((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert("Some trucks could not be deleted.");
    }
  };

  const highlight = (text) => {
    if (!searchTerm || !text) return text;
    return text.toString().split(new RegExp(`(${searchTerm})`, "gi")).map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-400/30 font-semibold">{part}</span>
      ) : part
    );
  };

  // ================= THEME =================
  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        filterBg: "bg-gray-800 text-gray-100",
        tableHeader: "bg-gray-800 text-cyan-300 border-b border-cyan-400/40",
        tableRowEven: "bg-gray-900",
        tableRowOdd: "bg-gray-800",
        rowHover: "hover:bg-cyan-500/10",
        filterInput: "bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-400",
        paginationActive: "bg-cyan-500 text-black shadow-[0_0_8px_cyan]",
        paginationInactive: "hover:bg-gray-700 text-gray-300 border-gray-600",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        filterBg: "bg-gray-100 text-gray-900",
        tableHeader: "bg-gray-100 text-gray-900 border-b border-gray-300",
        tableRowEven: "bg-gray-50",
        tableRowOdd: "bg-white",
        rowHover: "hover:bg-indigo-50",
        filterInput: "bg-white text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-indigo-400 focus:border-indigo-400",
        paginationActive: "bg-indigo-600 text-white shadow-[0_0_8px_indigo]",
        paginationInactive: "hover:bg-gray-200 text-gray-900 border-gray-300",
      };

  return (
    <Transition appear show={open} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
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
              className={`w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden ${theme.modalBg}`}
            >
              {/* HEADER */}
              <div className={`flex justify-between items-center px-6 py-4 ${theme.headerBg}`}>
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-6 h-6" />
                  <Dialog.Title className="text-xl font-semibold">Vehicle List</Dialog.Title>
                </div>
                <button onClick={onClose} className="hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* FILTERS */}
<motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 120 }}
  className={`flex flex-wrap gap-3 px-6 py-4 ${theme.filterBg}`}
>
  <select
    value={selectedClient || ""}
    onChange={(e) => setSelectedClient(e.target.value)}
    className={`h-10 border px-3 rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_cyan] hover:border-cyan-400 ${theme.filterInput}`}
  >
    <option value="">All Clients</option>
    {[...new Set(trucks.map(t => t.clientName))].map((c, i) => (
      <option key={i} value={c}>{c}</option>
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
    className={`h-10 border px-3 rounded-lg transition-all duration-200 hover:shadow-[0_0_10px_cyan] hover:border-cyan-400 ${theme.filterInput}`}
  />

  <input
    className={`h-10 border px-3 rounded-lg min-w-[260px] transition-all duration-200 hover:shadow-[0_0_10px_cyan] hover:border-cyan-400 ${theme.filterInput}`}
    placeholder="Search client, plate, driver..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <div className="ml-auto flex gap-2">
    {selectedIds.length > 0 && (
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 12px #f87171" }}
        whileTap={{ scale: 0.95 }}
        onClick={bulkDelete}
        className="h-10 px-4 bg-red-600 text-white rounded-lg transition-all duration-200"
      >
        Delete ({selectedIds.length})
      </motion.button>
    )}
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 0 12px #34d399" }}
      whileTap={{ scale: 0.95 }}
      onClick={onExport}
      className="h-10 px-4 bg-green-600 text-white rounded-lg transition-all duration-200"
    >
      Export CSV
    </motion.button>
  </div>
</motion.div>


              {/* TABLE */}
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full min-w-[1000px] text-sm border">
                 <thead className={`${theme.tableHeader}  top-0 z-10`}>
  <tr>
    <th className="px-4 py-3 border text-center">
      <input
        type="checkbox"
        onChange={toggleSelectAll}
        checked={selectedIds.length === data.length && data.length > 0}
      />
    </th>
    {["Client","Type","Plate","Bay","Driver","Purpose","Date","In","Out","Out Date"].map((h) => (
      <th
        key={h}
        onClick={() => handleSort(h.toLowerCase().replace(/\s+/g, ""))}
        className="px-4 py-3 border cursor-pointer whitespace-nowrap
                   transition-colors duration-200 hover:text-cyan-400 hover:shadow-[0_0_8px_cyan]"
      >
        <div className="flex items-center gap-1">
          {h}
          {sortConfig.key === h.toLowerCase().replace(/\s+/g, "") &&
            (sortConfig.direction === "asc" ? <ArrowUpIcon className="w-4" /> : <ArrowDownIcon className="w-4" />)}
        </div>
      </th>
    ))}
  </tr>
</thead>
                  <AnimatePresence>
                   <tbody>
  {data.map((t, i) => (
    <motion.tr
      key={i}
      variants={tableRowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`${i % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd} 
                 ${theme.rowHover} transition-shadow duration-200 hover:shadow-[0_0_8px_cyan/40]`}
    >
      <td className="p-3 border text-center">
        <input
          type="checkbox"
          checked={selectedIds.includes(t.id)}
          onChange={() => toggleSelect(t.id)}
        />
      </td>
      <td className="p-3 border">{highlight(t.clientName)}</td>
      <td className="p-3 border">{highlight(t.truckType)}</td>
      <td className="p-3 border">{highlight(t.plateNumber)}</td>
      <td className="p-3 border">{highlight(t.bay)}</td>
      <td className="p-3 border">{highlight(t.driver)}</td>
      <td className="p-3 border">{highlight(t.purpose)}</td>
      <td className="p-3 border">{t.date ? new Date(t.date).toLocaleDateString() : "-"}</td>
      <td className="p-3 border">{t.timeIn || "-"}</td>
      <td className="p-3 border">{t.timeOut || "-"}</td>
      <td className="p-3 border">{t.timeOutDate ? new Date(t.timeOutDate).toLocaleDateString() : "-"}</td>
    </motion.tr>
  ))}
</tbody>
                  </AnimatePresence>
                </table>
              </div>

              {/* PAGINATION */}
             {/* PAGINATION */}
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 8 }}
  transition={{ duration: 0.25 }}
  className={`sticky bottom-0 z-20 border-t px-6 py-3 flex items-center justify-between ${
    darkMode ? "bg-gray-900/90" : "bg-white/90"
  } backdrop-blur`}
>
  {/* Page Info */}
  <span className="text-sm opacity-70">
    Page <span className="font-semibold">{currentPage}</span> of{" "}
    <span className="font-semibold">{totalPages || 1}</span>
  </span>

  {/* Controls */}
  <div className="flex items-center gap-2">
    {/* PREV */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      className={`px-4 py-1.5 rounded-full border text-sm transition
        ${
          currentPage === 1
            ? "opacity-40 cursor-not-allowed"
            : darkMode
            ? "hover:bg-gray-700"
            : "hover:bg-gray-100"
        }`}
    >
      Prev
    </motion.button>

    {/* NEXT */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      className={`px-4 py-1.5 rounded-full border text-sm transition
        ${
          currentPage === totalPages || totalPages === 0
            ? "opacity-40 cursor-not-allowed"
            : darkMode
            ? "hover:bg-gray-700"
            : "hover:bg-gray-100"
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
  );
}
