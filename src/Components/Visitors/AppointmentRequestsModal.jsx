import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BellIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function AppointmentRequestsModal({
  isOpen,
  onClose,
  appointmentRequests,
  acceptAppointment,
  rejectAppointment,
  processingId,
  appointmentFilterDate,
  setAppointmentFilterDate,
}) {
  const filteredAppointments = appointmentRequests.filter((v) =>
    appointmentFilterDate
      ? new Date(v.date).toDateString() ===
        new Date(appointmentFilterDate).toDateString()
      : true
  );

  const appointmentsCount = appointmentRequests.length;

  return (
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
            <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                <div className="flex items-center gap-3">
                  <BellIcon className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Appointment Requests</h3>
                  <span className="text-sm opacity-80">({appointmentsCount})</span>
                </div>

                {/* Date Filter inside modal */}
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <DatePicker
                    selected={appointmentFilterDate}
                    onChange={setAppointmentFilterDate}
                    placeholderText="Filter by date"
                    dateFormat="MMM d, yyyy"
                    className="border p-2 rounded text-gray-800"
                    popperProps={{
                      strategy: "fixed",
                      modifiers: [
                        {
                          name: "preventOverflow",
                          options: { altAxis: true, padding: 8 },
                        },
                      ],
                    }}
                  />

                  {appointmentFilterDate && (
                    <button
                      onClick={() => setAppointmentFilterDate(null)}
                      className="px-3 py-1 bg-yellow-600/30 rounded hover:bg-yellow-600/50 transition"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-3 py-1 bg-yellow-600/30 rounded-lg hover:bg-yellow-600/50 transition"
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
                      <div
                        key={visitor.id}
                        className="bg-white border border-gray-200 shadow-lg rounded-2xl p-5 flex flex-col justify-between
                                   transform transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
                      >
                        {/* Visitor Info */}
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-bold text-gray-800 truncate">
                            {visitor.visitorName}
                          </h2>
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                            Appointment
                          </span>
                        </div>
                        <div className="space-y-1 text-gray-700 text-sm">
                          <p>
                            <span className="font-semibold text-gray-900">Company:</span>{" "}
                            {visitor.company}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">Person:</span>{" "}
                            {visitor.personToVisit}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">Purpose:</span>{" "}
                            {visitor.purpose}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">Date:</span>{" "}
                            {new Date(visitor.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p> 
                            <span className="font-semibold text-gray-900">Time:</span>{" "}
                            {visitor.timeIn}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            onClick={() => rejectAppointment(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition"
                          >
                            <XMarkIcon className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => acceptAppointment(visitor)}
                            disabled={processingId === visitor.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition"
                          >
                            <CheckIcon className="w-4 h-4" /> Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
