import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

export default function ViewTruckModal({ open, onClose, truck, darkMode = false }) {
  const [logs, setLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const FRONTEND_URL = window.location.origin;

  /* ================= FETCH LOGS ================= */
  useEffect(() => {
    if (!truck) return;

    const fetchTruckLogs = async () => {
      try {
        const res = await axios.get("/api/trucks");
        const truckLogs = res.data.filter(t => t.plateNumber === truck.plateNumber);
        setLogs(truckLogs);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTruckLogs();
  }, [truck]);

  /* ================= SORT ================= */
  const sortedLogs = useMemo(() => {
    const sorted = [...logs];
    if (!sortConfig.key) return sorted;

    sorted.sort((a, b) => {
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

    return sorted;
  }, [logs, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (!truck) return null;

  const truckDetailsURL = `${FRONTEND_URL}/truck-details/${truck.plateNumber}`;

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        rowEven: "bg-gray-800",
        rowOdd: "bg-gray-900",
        rowHover: "hover:bg-cyan-500/20",
        tableHeader: "bg-gray-800 text-cyan-300 border-b border-cyan-400/40",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
        text: "text-gray-100",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        rowEven: "bg-gray-50",
        rowOdd: "bg-white",
        rowHover: "hover:bg-indigo-50",
        tableHeader: "bg-gray-100 text-gray-900 border-b border-gray-300",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        text: "text-gray-900",
      };

  const tableRowVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
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
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden ${theme.modalBg}`}
              >
                {/* HEADER */}
                <div className={`flex justify-between items-center px-6 py-4 ${theme.headerBg}`}>
                  <h2 className="text-xl font-semibold">Truck Details</h2>
                  <button onClick={onClose} className="text-xl font-bold">✕</button>
                </div>

                {/* QR & Info */}
                <div className="flex flex-col md:flex-row items-center gap-8 px-6 py-6">
                  <div className="flex flex-col items-center">
                    <a href={truckDetailsURL} target="_blank" rel="noopener noreferrer">
                      <QRCodeCanvas value={truckDetailsURL} size={180} />
                    </a>
                    <p className="mt-2 text-sm text-gray-500">Scan or click to view truck details</p>
                    <a
                      href={truckDetailsURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-3 px-4 py-2 rounded ${theme.btnPrimary} transition`}
                    >
                      View Full Truck Details
                    </a>
                  </div>
                  <div className={`text-lg space-y-2 ${theme.text}`}>
                    <p><b>Client Name:</b> {truck.clientName}</p>
                    <p><b>Truck Type:</b> {truck.truckType}</p>
                    <p><b>Plate Number:</b> {truck.plateNumber}</p>
                  </div>
                </div>

                {/* LOGS TABLE */}
                <div className="overflow-x-auto max-h-96 px-6 pb-4">
                  <table className="w-full border min-w-[700px] text-sm">
                    <thead className={`${theme.tableHeader} sticky top-0 z-10`}>
                      <tr>
                        {["Bay","Driver","Purpose","Date","In","Out","Out Date"].map(h => (
                          <th
                            key={h}
                            onClick={() => handleSort(h.toLowerCase().replace(/\s+/g, ""))}
                            className="border px-3 py-2 cursor-pointer select-none"
                          >
                            {h}
                            {sortConfig.key === h.toLowerCase().replace(/\s+/g, "") &&
                              (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {sortedLogs.map((log, i) => (
                          <motion.tr
                            key={i}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`${i % 2 === 0 ? theme.rowEven : theme.rowOdd} ${theme.rowHover}`}
                          >
                            <td className="border px-3 py-2">{log.bay}</td>
                            <td className="border px-3 py-2">{log.driver}</td>
                            <td className="border px-3 py-2">{log.purpose}</td>
                            <td className="border px-3 py-2">{log.date ? new Date(log.date).toLocaleDateString() : "-"}</td>
                            <td className="border px-3 py-2">{log.timeIn || "-"}</td>
                            <td className="border px-3 py-2">{log.timeOut || "-"}</td>
                            <td className="border px-3 py-2">{log.timeOutDate ? new Date(log.timeOutDate).toLocaleDateString() : "-"}</td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={onClose}
                  className={`w-full mt-4 py-2 rounded ${theme.btnPrimary} transition`}
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Dialog>
    </Transition>
  );
}
