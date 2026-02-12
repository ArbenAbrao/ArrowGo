import { useState } from "react";
import {
  TruckIcon,
  ArchiveBoxIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  IdentificationIcon,
  XMarkIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

/* ================= BRANCH COLORS ================= */
const BRANCH_COLORS = {
  Marilao:
    "bg-yellow-200 text-yellow-900 border-yellow-400 dark:bg-yellow-600 dark:text-yellow-100",
  Taguig:
    "bg-purple-200 text-purple-900 border-purple-400 dark:bg-purple-600 dark:text-purple-100",
  Palawan:
    "bg-teal-200 text-teal-900 border-teal-400 dark:bg-teal-600 dark:text-teal-100",
  Cebu:
    "bg-pink-200 text-pink-900 border-pink-400 dark:bg-pink-600 dark:text-pink-100",
  Davao:
    "bg-orange-200 text-orange-900 border-orange-400 dark:bg-orange-600 dark:text-orange-100",
};

const AUTO_COLORS = [
  "bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-600 dark:text-blue-100",
  "bg-green-200 text-green-900 border-green-400 dark:bg-green-600 dark:text-green-100",
  "bg-red-200 text-red-900 border-red-400 dark:bg-red-600 dark:text-red-100",
  "bg-indigo-200 text-indigo-900 border-indigo-400 dark:bg-indigo-600 dark:text-indigo-100",
  "bg-cyan-200 text-cyan-900 border-cyan-400 dark:bg-cyan-600 dark:text-cyan-100",
];

/* ================= STATUS COLORS ================= */
const STATUS_COLORS = {
  Pending: {
    border: "border-yellow-400",
    dot: "bg-yellow-500",
  },
  Active: {
    border: "border-green-400",
    dot: "bg-green-500",
  },
  Completed: {
    border: "border-gray-400",
    dot: "bg-gray-500",
  },
};

const getBranchColor = (() => {
  const cache = {};
  return (branch) => {
    if (!branch)
      return "bg-gray-200 text-gray-900 border-gray-400 dark:bg-gray-600 dark:text-gray-100";
    if (BRANCH_COLORS[branch]) return BRANCH_COLORS[branch];
    if (!cache[branch]) {
      cache[branch] =
        AUTO_COLORS[Object.keys(cache).length % AUTO_COLORS.length];
    }
    return cache[branch];
  };
})();

/* ================= TRUCK GRID ================= */
export default function TruckGrid({
  paginatedTrucks,
  selectedBranch, // 👈 FILTER INPUT
  darkMode,
  handleTimeIn,
  handleTimeOut,
  handleEditOpen,
  handleDeleteOpen,
}) {
  const [openCard, setOpenCard] = useState(null);
  const [showClient, setShowClient] = useState(null);

  /* ================= BRANCH FILTER ================= */
  const filteredTrucks = selectedBranch
    ? paginatedTrucks.filter(
        (truck) =>
          truck.branchRegistered &&
          truck.branchRegistered.toLowerCase() ===
            selectedBranch.toLowerCase()
      )
    : paginatedTrucks;

  return (
    <>
      <div className="flex flex-col gap-4">
        {filteredTrucks.map((truck) => {
          const isNotTimedIn = !truck.timeIn;
          const isActive = !truck.timeOut;
          const status = isNotTimedIn
            ? "Pending"
            : isActive
            ? "Active"
            : "Completed";
          const isOpen = openCard === truck.id;
          const statusColor = STATUS_COLORS[status];

          return (
            <div
              key={truck.id}
              className={`relative rounded-xl overflow-hidden border-2 transition-all
                ${statusColor.border} hover:shadow-lg hover:scale-[1.01]
                ${darkMode ? "bg-gray-900" : "bg-white"}`}
            >
              {/* HEADER */}
              <div
                onClick={() => setOpenCard(isOpen ? null : truck.id)}
                className="px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-3 cursor-pointer"
              >
                {/* STATUS */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                    {status}
                  </span>
                </div>

                {/* CLIENT */}
                <div className="sm:col-span-3 flex items-center gap-2 truncate">
                  <UserIcon className="w-5 h-5 text-cyan-500" />
                  <div className="truncate">
                    <p className="font-bold truncate">
                      Client: {truck.clientName}
                    </p>
                    {truck.clientTruckId && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClient(truck);
                        }}
                        className="flex items-center gap-1 text-xs cursor-pointer text-green-500"
                      >
                        <IdentificationIcon className="w-4 h-4" />
                        CL-{truck.clientTruckId.toString().padStart(5, "0")}
                      </div>
                    )}
                  </div>
                </div>

                {/* PLATE */}
                <div className="sm:col-span-2 flex items-center gap-2 truncate">
                  <TruckIcon className="w-5 h-5" />
                  Plate: {truck.plateNumber}
                </div>

                {/* TYPE */}
                <div className="sm:col-span-2 flex items-center gap-2 truncate">
                  <ArchiveBoxIcon className="w-5 h-5" />
                  Type: {truck.truckType}
                </div>

                {/* BRANCH */}
                <div className="sm:col-span-2 flex items-center gap-2 truncate">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBranchColor(
                      truck.branchRegistered
                    )}`}
                  >
                    {truck.branchRegistered}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="sm:col-span-1 flex gap-2 justify-end">
                  {!truck.timeIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimeIn(truck);
                      }}
                      className="p-2 bg-green-500 rounded-full text-white"
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  )}
                  {truck.timeIn && !truck.timeOut && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimeOut(truck);
                      }}
                      className="p-2 bg-yellow-400 rounded-full text-white"
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditOpen(truck);
                    }}
                    className="p-2 bg-blue-500 rounded-full text-white"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOpen(truck.id);
                    }}
                    className="p-2 bg-red-500 rounded-full text-white"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* TOGGLE */}
                <div className="sm:col-span-1 flex justify-end">
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* ACCORDION */}
              {isOpen && (
                <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm border-t">
                  <p className="flex gap-2 items-center">
                    <UserIcon className="w-4 h-4" />
                    Driver: {truck.driver}
                  </p>
                  <p className="flex gap-2 items-center">
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    Purpose: {truck.purpose}
                  </p>
                  <p className="flex gap-2 items-center">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(truck.date).toLocaleDateString()}
                  </p>
                  <p className="flex gap-2 items-center">
                    <ClockIcon className="w-4 h-4" />
                    {truck.timeIn}
                  </p>
                  <p className="flex gap-2 items-center">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Bay: {truck.bay || "-"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CLIENT MODAL */}
      {showClient && (
        <Modal onClose={() => setShowClient(null)}>
          <h2 className="text-xl font-bold mb-2">{showClient.clientName}</h2>
          <p>Plate: {showClient.plateNumber}</p>
          <p>Type: {showClient.truckType}</p>
          <p>Branch: {showClient.branchRegistered}</p>
        </Modal>
      )}
    </>
  );
}

/* ================= MODAL ================= */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-xl relative w-11/12 max-w-md">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
