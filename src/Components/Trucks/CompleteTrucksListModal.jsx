// src/Components/Trucks/CompleteTrucksListModal.jsx
import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  TruckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";

export default function CompleteTrucksListModal({
  open,
  onClose,
  trucks,
  selectedClient,
  setSelectedClient,
  filterDate,
  setFilterDate,
  onExport,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, filterDate, searchTerm]);

  let filtered = trucks
    .filter((t) => (selectedClient ? t.clientName === selectedClient : true))
    .filter((t) =>
      filterDate
        ? new Date(t.date).toDateString() === new Date(filterDate).toDateString()
        : true
    )
    .filter((t) =>
      `${t.clientName} ${t.truckType} ${t.plateNumber} ${t.bay} ${t.driver} ${t.purpose}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  if (sortConfig.key) {
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

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

  const highlight = (text) => {
    if (!searchTerm) return text;
    return text
      .toString()
      .split(new RegExp(`(${searchTerm})`, "gi"))
      .map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          part
        )
      );
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const tableContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* Background overlay */}
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

        {/* Modal panel */}
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
              className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >

              {/* HEADER */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white"
              >
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-6 h-6" />
                  <Dialog.Title className="text-xl font-semibold">
                    Complete Trucks List
                  </Dialog.Title>
                </div>
                <button onClick={onClose} className="hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </motion.div>

              {/* FILTER BAR */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="sticky top-0 z-20 bg-white border-b px-6 py-4"
              >
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="h-10 border px-3 rounded-lg text-black"
                  >
                    <option value="">All Clients</option>
                    {[...new Set(trucks.map((t) => t.clientName))].map(
                      (c, i) => (
                        <option key={i} value={c}>{c}</option>
                      )
                    )}
                  </select>

                  <DatePicker
                    selected={filterDate}
                    onChange={setFilterDate}
                    placeholderText="Filter by date"
                    dateFormat="MMM d, yyyy"
                    className="border p-2 rounded text-gray-800"
                  />

                  <input
                    className="h-10 border px-3 rounded-lg min-w-[260px]"
                    placeholder="Search client, plate, driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="ml-auto flex items-center gap-4"
                  >
                    <span className="text-sm text-gray-600">
                      Total Records: <span className="font-semibold text-black">{filtered.length}</span>
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onExport}
                      className="h-10 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Export CSV
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>

              {/* TABLE */}
              <div className="overflow-x-auto max-h-[60vh]">
                <motion.table
                  className="w-full border text-black min-w-[1000px]"
                  variants={tableContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {["Client","Type","Plate","Bay","Driver","Purpose","Date","In","Out"].map((h) => (
                        <th
                          key={h}
                          onClick={() => handleSort(h.toLowerCase())}
                          className="px-4 py-3 border cursor-pointer whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            {h}
                            {sortConfig.key === h.toLowerCase() &&
                              (sortConfig.direction === "asc" ? (
                                <ArrowUpIcon className="w-4" />
                              ) : (
                                <ArrowDownIcon className="w-4" />
                              ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <AnimatePresence>
                    <tbody>
                      {data.map((t, index) => (
                        <motion.tr
                          key={index}
                          variants={tableRowVariants}
                          className="even:bg-gray-50 hover:bg-indigo-50"
                        >
                          <td className="p-3 border">{highlight(t.clientName)}</td>
                          <td className="p-3 border">{highlight(t.truckType)}</td>
                          <td className="p-3 border">{highlight(t.plateNumber)}</td>
                          <td className="p-3 border">{highlight(t.bay)}</td>
                          <td className="p-3 border">{highlight(t.driver)}</td>
                          <td className="p-3 border">{highlight(t.purpose)}</td>
                          <td className="p-3 border">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-3 border">{t.timeIn}</td>
                          <td className="p-3 border">{t.timeOut || "-"}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </AnimatePresence>
                </motion.table>
              </div>

              {/* PAGINATION */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="sticky bottom-0 bg-white border-t py-3 flex justify-center gap-2"
              >
                {[...Array(totalPages)].map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-lg border ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </motion.button>
                ))}
              </motion.div>

            </motion.div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
