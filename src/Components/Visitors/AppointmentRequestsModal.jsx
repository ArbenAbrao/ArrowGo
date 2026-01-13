// src/Components/Appointments/AppointmentRequestsModal.jsx
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BellIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function AppointmentRequestsModal({
  isOpen,
  onClose,
  appointmentRequests,
  acceptAppointment,
  rejectAppointment,
  processingId,
  appointmentFilterDate,
  setAppointmentFilterDate,
  darkMode = true,
}) {
  const [showToast, setShowToast] = useState({ visible: false, message: "" });

  const filteredAppointments = appointmentRequests.filter((v) =>
    appointmentFilterDate
      ? new Date(v.date).toDateString() ===
        new Date(appointmentFilterDate).toDateString()
      : true
  );

  const appointmentsCount = appointmentRequests.length;

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        inputBg: "bg-gray-800 text-gray-100 border-gray-700",
        btnAccept: "bg-green-500 hover:bg-green-600 text-black",
        btnReject: "bg-red-500 hover:bg-red-600 text-black",
        btnSecondary: "border text-gray-100 hover:bg-gray-700",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        btnAccept: "bg-green-100 hover:bg-green-200 text-green-700",
        btnReject: "bg-red-100 hover:bg-red-200 text-red-700",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      };

  const handleAccept = (visitor) => {
    acceptAppointment(visitor);
    setShowToast({ visible: true, message: "Appointment accepted ✅" });
    setTimeout(() => setShowToast({ visible: false, message: "" }), 2500);
  };

  const handleReject = (id) => {
    rejectAppointment(id);
    setShowToast({ visible: true, message: "Appointment rejected ❌" });
    setTimeout(() => setShowToast({ visible: false, message: "" }), 2500);
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="opacity-0 -translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 -translate-y-4 scale-95"
          >
            <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-3xl">
              <div className={`rounded-3xl overflow-hidden shadow-2xl border ${theme.modalBg}`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 ${theme.headerBg}`}>
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-6 h-6" />
                    <h3 className="text-xl font-semibold">Appointment Requests</h3>
                    <span className="text-sm opacity-80">({appointmentsCount})</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <DatePicker
                      selected={appointmentFilterDate}
                      onChange={setAppointmentFilterDate}
                      placeholderText="Filter by date"
                      dateFormat="MMM d, yyyy"
                      className={`border p-2 rounded ${theme.inputBg} ${theme.neonGlow}`}
                      popperProps={{
                        strategy: "fixed",
                        modifiers: [{ name: "preventOverflow", options: { altAxis: true, padding: 8 } }],
                      }}
                    />
                    {appointmentFilterDate && (
                      <button
                        onClick={() => setAppointmentFilterDate(null)}
                        className="px-3 py-1 rounded bg-yellow-600/30 hover:bg-yellow-600/50 transition"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-3 py-1 rounded bg-yellow-600/30 hover:bg-yellow-600/50 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
                  {filteredAppointments.length === 0 ? (
                    <p className="text-center text-gray-400 py-6">
                      No appointment requests for selected date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredAppointments.map((visitor) => (
                        <motion.div
                          key={visitor.id}
                          className={`p-5 rounded-2xl shadow-lg flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Visitor Info */}
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold truncate">{visitor.visitorName}</h2>
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Appointment</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-semibold">Company:</span> {visitor.company}</p>
                            <p><span className="font-semibold">Person:</span> {visitor.personToVisit}</p>
                            <p><span className="font-semibold">Purpose:</span> {visitor.purpose}</p>
                            <p><span className="font-semibold">Date:</span> {new Date(visitor.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                            <p><span className="font-semibold">Time:</span> {visitor.timeIn}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={() => handleReject(visitor.id)}
                              disabled={processingId === visitor.id}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${theme.btnReject} transition`}
                            >
                              <XMarkIcon className="w-4 h-4" /> Reject
                            </button>
                            <button
                              onClick={() => handleAccept(visitor)}
                              disabled={processingId === visitor.id}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${theme.btnAccept} transition`}
                            >
                              <CheckIcon className="w-4 h-4" /> Accept
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>

      {/* Toast */}
      <AnimatePresence>
        {showToast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-medium"
          >
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
