import { Fragment, useEffect, useState } from "react";
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

export default function RegisteredTrucksModal({ open, onClose }) {
  const [trucks, setTrucks] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const ITEMS_PER_PAGE = 7;

  // ================= FETCH =================
  useEffect(() => {
    if (!open) return;
    axios
      .get("http://localhost:5000/api/clients")
      .then((res) => {
        const sortedData = res.data.sort((a, b) => a.id - b.id);
        setTrucks(sortedData);
      })
      .catch(console.error);
  }, [open]);

  // ================= FILTER =================
  const filtered = trucks
    .filter((t) => (selectedClient ? t.clientName === selectedClient : true))
    .filter((t) =>
      `${t.id} ${t.clientName} ${t.truckType} ${t.plateNumber}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  // ================= SORT =================
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setCurrentPage(1), [selectedClient, searchTerm]);

  // ================= SORT HANDLER =================
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ================= DELETE =================
  const deleteTruck = async (id) => {
    if (!window.confirm("Delete this registered truck?")) return;
    await axios.delete(`http://localhost:5000/api/clients/${id}`);
    setTrucks((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const bulkDelete = async () => {
    if (!window.confirm("Delete selected trucks?")) return;
    await Promise.all(
      selectedIds.map((id) => axios.delete(`http://localhost:5000/api/clients/${id}`))
    );
    setTrucks((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  // ================= CSV EXPORT =================
  const exportCSV = () => {
    const csv =
      "ID,Client Name,Truck Type,Plate Number\n" +
      filtered
        .map((t) => `${t.id},${t.clientName},${t.truckType},${t.plateNumber}`)
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registered_trucks.csv";
    a.click();
  };

  const highlight = (text) => {
    if (!searchTerm) return text;
    return text.split(new RegExp(`(${searchTerm})`, "gi")).map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((t) => t.id));
    }
  };

  // ================= ANIMATION VARIANTS =================
  const tableRowVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4">
          <AnimatePresence>
            {open && (
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* HEADER */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-t-3xl shadow-md"
                >
                  <div className="flex gap-2 items-center">
                    <TruckIcon className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">Registered Trucks</h2>
                  </div>
                  <button onClick={onClose} className="hover:text-gray-200 transition">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </motion.div>

                {/* FILTER + ACTIONS */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="sticky top-0 z-20 bg-white p-4 border-b shadow-sm grid md:grid-cols-5 gap-2 md:gap-4 items-center"
                >
                  <select
                    className="border p-2 rounded-lg text-black hover:ring-1 hover:ring-purple-400 transition"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">All Clients</option>
                    {[...new Set(trucks.map((t) => t.clientName))].map((name, i) => (
                      <option key={i}>{name}</option>
                    ))}
                  </select>

                  <input
                    className="border p-2 rounded-lg text-black md:col-span-2 hover:ring-1 hover:ring-purple-400 transition"
                    placeholder="Search ID / Client / Truck / Plate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="flex gap-2 md:col-span-2 justify-end flex-wrap">
                    {selectedIds.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={bulkDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Delete Selected ({selectedIds.length})
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Export CSV
                    </motion.button>
                  </div>
                </motion.div>

                {/* TABLE */}
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full border text-black min-w-[600px]">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === data.length && data.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        {["id", "clientName", "truckType", "plateNumber"].map((key) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="px-4 py-3 border cursor-pointer select-none whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1">
                              {key.toUpperCase()}
                              {sortConfig.key === key &&
                                (sortConfig.direction === "asc" ? (
                                  <ArrowUpIcon className="w-4" />
                                ) : (
                                  <ArrowDownIcon className="w-4" />
                                ))}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 border text-center whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <AnimatePresence>
                      <tbody>
                        {data.map((t, index) => (
                          <motion.tr
                            key={t.id}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ delay: index * 0.05 }}
                            className="even:bg-gray-50 hover:from-purple-100 hover:to-purple-50 hover:bg-gradient-to-r transition-all"
                          >
                            <td className="px-4 py-4 border text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(t.id)}
                                onChange={() => toggleSelect(t.id)}
                              />
                            </td>
                            <td className="px-4 py-4 border">{highlight(String(t.id))}</td>
                            <td className="px-4 py-4 border">{highlight(t.clientName)}</td>
                            <td className="px-4 py-4 border">{highlight(t.truckType)}</td>
                            <td className="px-4 py-4 border">{highlight(t.plateNumber)}</td>
                            <td className="px-4 py-4 border text-center">
                              <motion.button
                                whileHover={{ scale: 1.2, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => deleteTruck(t.id)}
                                className="text-red-600 hover:text-red-800 transition"
                              >
                                <TrashIcon className="w-5 mx-auto" />
                              </motion.button>
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
                  className="sticky bottom-0 z-20 bg-white py-3 border-t flex justify-center gap-2 flex-wrap shadow-inner"
                >
                  {[...Array(totalPages)].map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 border rounded-lg ${
                        currentPage === i + 1
                          ? "bg-purple-600 text-white"
                          : "text-black hover:bg-gray-200"
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
  );
}
