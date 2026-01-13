import { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  TruckIcon,
  XMarkIcon,
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ViewTruckModal from "./ViewTruckModal";

const tableRowVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function RegisteredTrucksModal({ open, onClose, darkMode = false }) {
  const [trucks, setTrucks] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const ITEMS_PER_PAGE = 7;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTruck, setViewTruck] = useState(null);

  const openTruckDetails = (truck) => {
    setViewTruck(truck);
    setViewOpen(true);
  };

  /* ================= FETCH TRUCKS ================= */
  useEffect(() => {
    if (!open) return;
    axios
      .get("/api/clients")
      .then((res) => setTrucks(res.data.sort((a, b) => a.id - b.id)))
      .catch(console.error);
  }, [open]);

  /* ================= FILTER ================= */
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
        `${t.id} ${t.clientName || ""} ${t.truckType || ""} ${t.plateNumber || ""}`.toLowerCase().includes(term)
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

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setCurrentPage(1), [selectedClient, searchTerm, dateRange]);

  /* ================= SORT HANDLER ================= */
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ================= SELECT ================= */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((t) => t.id));
  };

  /* ================= DELETE ================= */
  const deleteTruck = async (id) => {
    if (!window.confirm("Delete this truck?")) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      setTrucks((prev) => prev.filter((t) => Number(t.id) !== Number(id)));
      setSelectedIds((prev) => prev.filter((i) => Number(i) !== Number(id)));
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm("Delete selected trucks?")) return;
    try {
      await Promise.all(selectedIds.map((id) => axios.delete(`/api/clients/${id}`)));
      setTrucks((prev) => prev.filter((t) => !selectedIds.includes(Number(t.id))));
      setSelectedIds([]);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert("Some trucks could not be deleted.");
    }
  };

  /* ================= CSV EXPORT ================= */
  const exportCSV = () => {
    const csv =
      "ID,Client Name,Truck Type,Plate Number,Date,Time In,Time Out,Time Out Date\n" +
      filtered
        .map((t) =>
          `${t.id},${t.clientName},${t.truckType},${t.plateNumber},${t.date || ""},${t.timeIn || ""},${t.timeOut || ""},${t.timeOutDate || ""}`
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registered_trucks.csv";
    a.click();
  };

  /* ================= HIGHLIGHT SEARCH ================= */
  const highlight = (text) => {
    if (!searchTerm || !text) return text;
    return text.toString().split(new RegExp(`(${searchTerm})`, "gi")).map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-400/30 font-semibold">{part}</span>
      ) : part
    );
  };

  /* ================= THEME ================= */
  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        filterBg: "bg-gray-800 text-gray-100",
        filterInput: "bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-400",
        rowHover: "hover:bg-cyan-500/10",
        tableHeader: "bg-gray-800 text-cyan-300 border-b border-cyan-400/40",
        tableRowEven: "bg-gray-900",
        tableRowOdd: "bg-gray-800",
        paginationActive: "bg-cyan-500 text-black shadow-[0_0_8px_cyan]",
        paginationInactive: "hover:bg-gray-700 text-gray-300 border-gray-600",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        filterBg: "bg-gray-100 text-gray-900",
        filterInput: "bg-white text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-indigo-400 focus:border-indigo-400",
        rowHover: "hover:bg-indigo-50",
        tableHeader: "bg-gray-100 text-gray-900 border-b border-gray-300",
        tableRowEven: "bg-gray-50",
        tableRowOdd: "bg-white",
        paginationActive: "bg-indigo-600 text-white shadow-[0_0_8px_indigo]",
        paginationInactive: "hover:bg-gray-200 text-gray-900 border-gray-300",
      };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <>
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
            <AnimatePresence>
              {open && (
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden ${theme.modalBg}`}
                >
                  {/* HEADER */}
                  <div className={`flex justify-between items-center px-6 py-4 ${theme.headerBg}`}>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-6 h-6" />
                      <Dialog.Title className="text-xl font-semibold">Registered Trucks</Dialog.Title>
                    </div>
                    <button onClick={onClose}>
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
    placeholder="Search ID / Client / Truck / Plate..."
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
      onClick={exportCSV}
      className="h-10 px-4 bg-green-600 text-white rounded-lg transition-all duration-200"
    >
      Export CSV
    </motion.button>
  </div>
</motion.div>

                  {/* TABLE */}
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full min-w-[900px] text-sm border">
                      <thead className={`${theme.tableHeader} sticky top-0 z-10`}>
                        <tr>
                          <th className="px-3 py-2 border text-center">
                            <input
                              type="checkbox"
                              onChange={toggleSelectAll}
                              checked={selectedIds.length === data.length && data.length > 0}
                            />
                          </th>
                          {["ID","Client","Type","Plate","QR","Action"].map((h) => (
                            <th
                              key={h}
                              onClick={() => handleSort(h.toLowerCase().replace(/\s+/g, ""))}
                              className="px-3 py-2 border cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-1">
                                {h}
                                {sortConfig.key === h.toLowerCase().replace(/\s+/g, "") &&
                                  (sortConfig.direction === "asc" ? <ArrowUpIcon className="w-4"/> : <ArrowDownIcon className="w-4"/>)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <AnimatePresence>
                        <tbody>
                          {data.map((t) => (
                            <motion.tr
                              key={t.id}
                              variants={tableRowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className={`${theme.rowHover} transition-shadow duration-200 hover:shadow-[0_0_8px_cyan/40]`}
                            >
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(t.id)}
                                  onChange={() => toggleSelect(t.id)}
                                />
                              </td>
                              <td className="border p-2">{highlight(t.id)}</td>
                              <td className="border p-2">{highlight(t.clientName)}</td>
                              <td className="border p-2">{highlight(t.truckType)}</td>
                              <td className="border p-2">{highlight(t.plateNumber)}</td>
                              <td className="border p-2 text-center">
                                <img
                                  src={`/api/clients/${t.id}/qrcode`}
                                  alt={`QR code for truck ${t.plateNumber}`}
                                  className="w-14 h-14 mx-auto cursor-pointer hover:scale-110 transition"
                                  onClick={() => openTruckDetails(t)}
                                />
                              </td>
                              <td className="border p-2 text-center">
                                <button onClick={() => deleteTruck(t.id)} className="text-red-600">
                                  <TrashIcon className="w-5 mx-auto"/>
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </AnimatePresence>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="sticky bottom-0 z-20 bg-opacity-90 border-t py-3 flex justify-center gap-2 flex-wrap shadow-inner"
                  >
                    {[...Array(totalPages)].map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 border rounded-lg ${
                          currentPage === i + 1
                            ? theme.paginationActive
                            : theme.paginationInactive
                        } transition`}
                      >
                        {i + 1}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog>
      </Transition>

      {/* VIEW TRUCK MODAL */}
      <ViewTruckModal open={viewOpen} onClose={() => setViewOpen(false)} truck={viewTruck} darkMode={darkMode}/>
    </>
  );
}
