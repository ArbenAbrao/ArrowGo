import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginHistory({ logs, darkMode, currentPage, setCurrentPage, ITEMS_PER_PAGE }) {
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const [openIndex, setOpenIndex] = useState(null); // mobile accordion

  return (
    <div className="mt-3 w-full">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg shadow-md border">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead className={darkMode ? "bg-blue-700 text-white" : "bg-blue-300 text-gray-900"}>
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, i) => (
              <tr key={log.id} className={`border-b transition-colors duration-200 ${
                i % 2 === 0
                  ? darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
                  : darkMode ? "bg-gray-900 hover:bg-gray-800" : "bg-white hover:bg-gray-100"
              }`}>
                <td className="px-4 py-2">{log.name || log.username_or_email}</td>
                <td className={`px-4 py-2 font-semibold ${
                  log.status === "SUCCESS"
                    ? "text-green-500"
                    : log.status === "FAILED"
                    ? "text-red-500"
                    : "text-gray-500"
                }`}>{log.status}</td>
                <td className="px-4 py-2">{log.location || "-"}</td>
                <td className="px-4 py-2">
                  {new Date(log.created_at).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Card View */}
      <div className="sm:hidden flex flex-col gap-3">
        {paginatedLogs.map((log, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={log.id} className={`border rounded-lg shadow-md p-4 flex flex-col gap-2 ${
              darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-gray-900"
            }`}>
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-semibold">{log.name || log.username_or_email}</span>
                <span className="text-xs opacity-60">{new Date(log.created_at).toLocaleDateString()}</span>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-1 mt-2 text-sm"
                  >
                    <span>Status: <span className={`font-semibold ${
                      log.status === "SUCCESS"
                        ? "text-green-500"
                        : log.status === "FAILED"
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}>{log.status}</span></span>
                    <span>Location: {log.location || "-"}</span>
                    <span>Date: {new Date(log.created_at).toLocaleString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <motion.div className={`flex items-center justify-between mt-2 px-4 py-2 border rounded ${
        darkMode ? "bg-gray-900/90" : "bg-white/90"
      }`}>
        <span className="text-sm opacity-70">
          Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages || 1}</span>
        </span>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className={`px-4 py-1.5 rounded-full border text-sm transition ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            Prev
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className={`px-4 py-1.5 rounded-full border text-sm transition ${currentPage === totalPages || totalPages === 0 ? "opacity-40 cursor-not-allowed" : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            Next
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
