import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TruckIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

/* ===============================
   ANIMATED NUMBER
   =============================== */
const AnimatedNumber = ({ value }) => (
  <motion.span
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    {value}
  </motion.span>
);

/* ===============================
   STAT CARD
   =============================== */
const StatCard = ({ icon: Icon, label, value, color, neonColor, darkMode }) => {
  const cardBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-green-100 text-green-900";

  return (
    <motion.article
      whileHover={{ scale: 1.05 }}
      title={label}
      className={`rounded-lg shadow-md p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer relative overflow-hidden ${cardBg}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className="font-semibold">{label}</span>
      </div>

      <h2 className="text-2xl font-bold">
        <AnimatedNumber value={value} />
      </h2>

      <span
        className="absolute bottom-0 left-0 w-full h-1 opacity-0 transition-all duration-300"
        style={{
          boxShadow: `0 0 10px ${neonColor}, 0 0 20px ${neonColor}`,
          backgroundColor: neonColor,
        }}
      />

      <style jsx>{`
        article:hover span {
          opacity: 1;
        }
      `}</style>
    </motion.article>
  );
};

/* ===============================
   STATUS BADGE
   =============================== */
const StatusBadge = ({ status }) => {
  const baseClass =
    "px-2 py-1 text-xs font-semibold rounded-full text-white inline-block";
  switch (status?.toLowerCase()) {
    case "approved":
      return <span className={`${baseClass} bg-green-500`}>Approved</span>;
    case "completed":
      return <span className={`${baseClass} bg-blue-500`}>Completed</span>;
    case "pending":
    default:
      return <span className={`${baseClass} bg-yellow-500`}>Pending</span>;
  }
};

/* ===============================
   DETAILS MODAL
   =============================== */
const DetailsModal = ({ item, type, onClose, darkMode }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-11/12 sm:w-96 rounded-xl p-6 ${
          darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">
          {type === "appointment" ? "Appointment Details" : "Truck Details"}
        </h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {item.name}
          </p>
          {item.person_to_visit && (
            <p>
              <span className="font-medium">Person to Visit:</span>{" "}
              {item.person_to_visit}
            </p>
          )}
          {item.plate_number && (
            <p>
              <span className="font-medium">Plate Number:</span>{" "}
              {item.plate_number}
            </p>
          )}
          {item.branch && (
            <p>
              <span className="font-medium">Branch:</span> {item.branch}
            </p>
          )}
          {item.status && (
            <p>
              <span className="font-medium">Status:</span>{" "}
              <StatusBadge status={item.status} />
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

/* ===============================
   REQUEST REPORT COMPONENT
   =============================== */
export default function RequestReport({ analytics, darkMode }) {
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [openIndex, setOpenIndex] = useState(null); // mobile accordion

  if (!analytics) return null;

  const stats = [
    {
      icon: ClockIcon,
      label: "Total Pending",
      value: analytics.totalPending,
      color: darkMode ? "text-purple-400" : "text-purple-700",
      neonColor: darkMode ? "#c084fc" : "#6b21a8",
    },
    {
      icon: CalendarDaysIcon,
      label: "Appointments",
      value: analytics.appointmentPending,
      color: darkMode ? "text-blue-400" : "text-blue-700",
      neonColor: darkMode ? "#60a5fa" : "#1e3a8a",
    },
    {
      icon: TruckIcon,
      label: "Trucks",
      value: analytics.truckPending,
      color: darkMode ? "text-green-400" : "text-green-700",
      neonColor: darkMode ? "#22c55e" : "#166534",
    },
  ];

  return (
    <section className="space-y-6 mb-6 w-full">
      {/* Desktop / large screens */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} darkMode={darkMode} />
        ))}
      </div>

      {/* Mobile / small screens: accordion */}
      <div className="md:hidden flex flex-col gap-2">
        {stats.map((s, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-lg shadow-md ${
                darkMode
                  ? "bg-gray-900 text-gray-300"
                  : "bg-green-100 text-green-900"
              } overflow-hidden w-[95%] mx-auto`}
            >
              <button
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="font-semibold">{s.label}</span>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>

              <div
                className="transition-[max-height] duration-500 ease-in-out overflow-hidden"
                style={{ maxHeight: isOpen ? "150px" : "0px" }}
              >
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                  <h2 className="text-2xl font-bold">
                    <AnimatedNumber value={s.value} />
                  </h2>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT ACTIVITY */}
      <div
        className={`rounded-xl p-5 shadow-md w-full ${
          darkMode ? "bg-gray-800 text-gray-200" : "bg-white"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <div className="overflow-x-auto w-full min-w-0">
            <p className="font-medium mb-2">Pending Appointments</p>
            <div className="max-h-[250px] overflow-y-auto border rounded">
              <table className="w-full text-sm border-collapse min-w-[400px]">
                <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <tr className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    <th className="pb-2 text-left">Name</th>
                    <th className="pb-2 text-left">Person to Visit</th>
                    <th className="pb-2 text-left">Branch</th>
                    <th className="pb-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent.appointments.map((a) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-t ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`}
                      onClick={() => {
                        setModalItem(a);
                        setModalType("appointment");
                      }}
                    >
                      <td className="py-2">{a.name}</td>
                      <td className="py-2">{a.person_to_visit || "-"}</td>
                      <td className="py-2 opacity-80">{a.branch}</td>
                      <td className="py-2">
                        <StatusBadge status={a.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trucks */}
          <div className="overflow-x-auto w-full min-w-0">
            <p className="font-medium mb-2">Trucks Register Requests</p>
            <div className="max-h-[250px] overflow-y-auto border rounded">
              <table className="w-full text-sm border-collapse min-w-[400px]">
                <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <tr className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    <th className="pb-2 text-left">Truck</th>
                    <th className="pb-2 text-left">Plate Number</th>
                    <th className="pb-2 text-left">Branch</th>
                    <th className="pb-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent.trucks.map((t) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-t ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`}
                      onClick={() => {
                        setModalItem(t);
                        setModalType("truck");
                      }}
                    >
                      <td className="py-2">{t.name}</td>
                      <td className="py-2">{t.plate_number || "-"}</td>
                      <td className="py-2 opacity-80">{t.branch}</td>
                      <td className="py-2">
                        <StatusBadge status={t.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {modalItem && (
        <DetailsModal
          item={modalItem}
          type={modalType}
          darkMode={darkMode}
          onClose={() => setModalItem(null)}
        />
      )}
    </section>
  );
}
