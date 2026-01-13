// src/Components/Visitors/CompleteVisitorsListModal.jsx
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UserIcon, ClockIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";

export default function CompleteVisitorsListModal({ isOpen, onClose, visitors, darkMode = true }) {
  const completedVisitors = visitors.filter((v) => v.timeOut);

  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const filteredVisitors = completedVisitors.filter((v) => {
    if (startDate && endDate) {
      const visitorDate = new Date(v.date);
      return visitorDate >= startDate && visitorDate <= endDate;
    }
    return true;
  });

  const isInRange = (visitorDate) => {
    if (!startDate || !endDate) return false;
    const date = new Date(visitorDate);
    return date >= startDate && date <= endDate;
  };

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        inputBg: "bg-gray-800 text-gray-100 border-gray-700",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
        btnSecondary: "border text-gray-100 hover:bg-gray-700",
        cardBg: "bg-gray-800 text-gray-100",
        cardHover: "hover:shadow-[0_0_12px_#00ff66] hover:scale-105",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        cardBg: "bg-white text-gray-900",
        cardHover: "hover:shadow-lg hover:scale-105",
      };

  const handleExport = () => {
    const exportData = filteredVisitors.map(v => ({
      Name: v.visitorName,
      PersonToVisit: v.personToVisit,
      Purpose: v.purpose,
      Date: new Date(v.date).toLocaleDateString(),
      TimeIn: v.timeIn,
      TimeOut: v.timeOut,
    }));
    const csv = [
      Object.keys(exportData[0]).join(","),
      ...exportData.map(row => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "completed_visitors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-4xl transform overflow-hidden rounded-2xl shadow-2xl transition-all ${theme.modalBg}`}>
                
                {/* Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 ${theme.headerBg}`}>
                  <h2 className="text-xl font-semibold">Completed Visitors</h2>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <DatePicker
                      selectsRange
                      startDate={startDate}
                      endDate={endDate}
                      onChange={setDateRange}
                      isClearable
                      placeholderText="Select date range"
                      className={`border p-2 rounded w-full ${theme.inputBg} ${theme.btnSecondary}`}
                    />
                    <button
                      onClick={handleExport}
                      className={`px-4 py-2 rounded ${theme.btnPrimary} transition transform hover:scale-105`}
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={onClose}
                      className={`px-4 py-2 rounded ${theme.btnSecondary} transition transform hover:scale-105`}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Visitor Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5 max-h-[60vh] overflow-y-auto">
                  {filteredVisitors.length === 0 ? (
                    <p className="text-center text-gray-400 col-span-full py-6">No completed visitors found.</p>
                  ) : (
                    filteredVisitors.map(visitor => {
                      const highlight = isInRange(visitor.date);
                      return (
                        <motion.div
                          key={visitor.id}
                          className={`p-4 rounded-xl flex flex-col justify-between ${theme.cardBg} ${theme.cardHover} transition-all duration-500 ${highlight ? "ring-2 ring-cyan-400" : ""}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white w-fit mb-2 animate-pulse">
                            Completed
                          </span>
                          <h4 className="font-bold text-lg truncate">{visitor.visitorName}</h4>
                          <p className="flex items-center gap-1 text-sm"><UserIcon className="w-4 h-4" /> {visitor.personToVisit}</p>
                          <p className="flex items-center gap-1 text-sm"><CalendarDaysIcon className="w-4 h-4" /> {new Date(visitor.date).toLocaleDateString()}</p>
                          <p className="flex items-center gap-1 text-sm"><ClockIcon className="w-4 h-4" /> {visitor.timeIn} - {visitor.timeOut}</p>
                          <p className="text-sm mt-1">{visitor.purpose}</p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
