import { useState } from "react";
import {
  TruckIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  IdentificationIcon,
  TagIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

/* ================= STATUS COLORS ================= */
const STATUS_COLORS = {
  Waiting: {
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

export default function TruckGrid({
  paginatedTrucks,
  darkMode,
  handleTimeIn,
  handleTimeOut,
  handleEditOpen,
  handleDeleteOpen,
  userRole,
}) {
  const [openCard, setOpenCard] = useState(null);

  const canModify =
    userRole === "Admin" || userRole === "IT" || userRole === "User";

  return (
    <div className="flex flex-col gap-4">
      {paginatedTrucks.map((truck) => {
        const isWaiting = !truck.timeIn;
        const isActive = truck.timeIn && !truck.timeOut;
        const status = isWaiting
          ? "Waiting"
          : isActive
          ? "Active"
          : "Completed";

        const statusColor = STATUS_COLORS[status];
        const isOpen = openCard === truck.id;

        return (
          <div
            key={truck.id}
            className={`w-full rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.01]
            ${statusColor.border}
            ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
          >
            {/* ================= HEADER ================= */}
            <div
              onClick={() => setOpenCard(isOpen ? null : truck.id)}
              className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-12 gap-3 cursor-pointer"
            >
              {/* BADGES */}
<div className="flex flex-wrap items-center gap-2 sm:col-span-3">

  {/* STATUS */}
  <span className="px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 h-6">
    <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
    {status}
  </span>

  {/* ROUTE */}
  {truck.branchRegistered && truck.destinationBranch && (
    <div className="flex items-center gap-2 h-6">
      {/* ORIGIN */}
      <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-100 flex items-center gap-1">
        <BuildingOfficeIcon className="w-3 h-3" />
        {truck.branchRegistered}
      </span>

      {/* ARROW */}
      <ArrowRightIcon className="w-4 h-4 text-gray-400" />

      {/* DESTINATION */}
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1
        ${
          truck.branchRegistered === truck.destinationBranch
            ? "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white"
            : "bg-purple-100 text-purple-900 dark:bg-purple-600 dark:text-purple-100"
        }`}
      >
        <BuildingOfficeIcon className="w-3 h-3" />
        {truck.destinationBranch}
      </span>
    </div>
  )}

  {/* 🔥 INTERNAL TRANSFER LABEL — ADD IT RIGHT HERE */}
  {truck.branchRegistered === truck.destinationBranch && (
    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
      Internal Transfer
    </span>
  )}

  {/* BAY */}
  {truck.bay && (
    <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-white flex items-center gap-1 h-6">
      <TagIcon className="w-3 h-3" />
      Bay {truck.bay}
    </span>
  )}

</div>
              {/* RIGHT SIDE */}
              <div className="sm:col-span-9 flex justify-between items-center gap-3">
                {/* INFO */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap min-w-0">
                  
                  {/* CLIENT NAME */}
                  <div className="flex items-center gap-1 min-w-0">
                    <UserIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="text-xs text-gray-500">Client:</span>
                    <p className="font-bold break-words whitespace-normal">
                      {truck.clientName}
                    </p>
                  </div>

                  {/* CLIENT ID */}
                  {truck.clientTruckId && (
                    <div className="flex items-center gap-1">
                      <IdentificationIcon className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-xs text-gray-500">ID:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        VI-{truck.clientTruckId
                          .toString()
                          .padStart(4, "0")}
                      </span>
                    </div>
                  )}

                  {/* PLATE */}
                  <div className="flex items-center gap-1 min-w-0">
                    <TruckIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-xs text-gray-500">Plate:</span>
                    <span className="break-words whitespace-normal">
                      {truck.plateNumber}
                    </span>
                  </div>

                  {/* TYPE */}
                  <div className="flex items-center gap-1 min-w-0">
                    <ArchiveBoxIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-xs text-gray-500">Type:</span>
                    <span className="break-words whitespace-normal">
                      {truck.truckType}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">
                  {canModify && (
                    <>
                      {isWaiting && (
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

                      {isActive && (
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
                    </>
                  )}

                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* ================= DETAILS ================= */}
            {isOpen && (
              <div className="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t">
                <p className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold">Purpose:</span>
                  {truck.purpose}
                </p>

                <p className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">Date:</span>
                  {new Date(truck.date).toLocaleDateString()}
                </p>

                <p className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">Time In:</span>
                  {truck.timeIn || "--"}
                </p>

                <p className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-red-500" />
                  <span className="font-semibold">Time Out:</span>
                  {truck.timeOut || "--"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}