import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { UserIcon, ClockIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CompleteVisitorsListModal({ isOpen, onClose, visitors, onExport }) {
  const completedVisitors = visitors.filter((v) => v.timeOut);

  // Date range state
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-xl font-semibold text-black">
                  Completed Visitors
                </Dialog.Title>

                {/* Date Range Picker + Export */}
                <div className="mt-4 flex gap-2 items-center">
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    isClearable={true}
                    placeholderText="Select date range"
                    className="border p-2 rounded w-full text-black"
                  />
                  <button
                    onClick={handleExport}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-all duration-300 transform hover:scale-105 shadow-md"
                  >
                    Export CSV
                  </button>
                </div>

                {/* Visitor Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto mt-4">
                  {filteredVisitors.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center">No completed visitors found.</p>
                  ) : (
                    filteredVisitors.map((visitor) => {
                      const highlight = isInRange(visitor.date);
                      return (
                        <div
                          key={visitor.id}
                          className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-500 ${
                            highlight
                              ? "bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 shadow-2xl scale-105"
                              : "bg-gradient-to-br from-green-100 to-green-200 shadow-lg hover:shadow-2xl hover:scale-105"
                          }`}
                        >
                          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white w-fit mb-2 animate-pulse">
                            Completed
                          </span>
                          <h4 className="font-bold text-black text-lg">{visitor.visitorName}</h4>
                          <p className="text-sm text-black flex items-center gap-1">
                            <UserIcon className="w-4 h-4" /> {visitor.personToVisit}
                          </p>
                          <p className="text-sm text-black flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" /> {new Date(visitor.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-black flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" /> {visitor.timeIn} - {visitor.timeOut}
                          </p>
                          <p className="text-sm text-black mt-1">{visitor.purpose}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
