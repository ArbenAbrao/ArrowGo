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
  Waiting: { border: "border-yellow-400", dot: "bg-yellow-500" },
  Active: { border: "border-green-400", dot: "bg-green-500" },
  Completed: { border: "border-gray-400", dot: "bg-gray-500" },
};

export default function OutInTruckGrid({
  paginatedTrucks,
  clients, // clients array to fetch vehicleId
  darkMode,
  handleOutInAction,
  handleEditOpen,
  handleDeleteOpen,
  userRole,
}) {
  const [openCard, setOpenCard] = useState(null);
  const canModify = ["Admin", "IT", "User"].includes(userRole);

  return (
    <div className="flex flex-col gap-4">
      {paginatedTrucks.map((truck) => {
        const isTimeInPending = !truck.timeIn;
        const isTimeOutPending = truck.timeIn && !truck.timeOut;

        // OUT-IN logic
        let status = isTimeOutPending
          ? "Waiting"
          : isTimeInPending
          ? "Active"
          : "Completed";

        const statusColor = STATUS_COLORS[status];
        const isOpen = openCard === truck.id;

        const client = clients?.find((c) => c.id === truck.clientId);
        const helpersList = (() => {
  try {
    if (Array.isArray(truck.helpers)) return truck.helpers;

    if (truck.helper && typeof truck.helper === "string") {
      return JSON.parse(truck.helper); // ✅ SAME FIX
    }

    return [];
  } catch {
    return [];
  }
})();

        return (
          <div
            key={truck.id}
            className={`w-full rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.01]
              ${statusColor.border} ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
          >
            {/* ================= HEADER ================= */}
            <div
              onClick={() => setOpenCard(isOpen ? null : truck.id)}
              className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-12 gap-3 cursor-pointer"
            >
              {/* LEFT BADGES */}
              <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 h-6`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                  {status}
                </span>

                {truck.branchRegistered && truck.destinationBranch && (
                  <div className="flex items-center gap-2 h-6">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-100 flex items-center gap-1">
                      <BuildingOfficeIcon className="w-3 h-3" />
                      {truck.branchRegistered}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
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

                {truck.branchRegistered === truck.destinationBranch && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    Internal Transfer
                  </span>
                )}

                {truck.bay && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-white flex items-center gap-1 h-6">
                    <TagIcon className="w-3 h-3" />
                    Bay {truck.bay}
                  </span>
                )}
              </div>

              {/* RIGHT INFO & ACTIONS */}
              <div className="sm:col-span-9 flex justify-between items-center gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap min-w-0">
                  {/* Client */}
                  <div className="flex items-center gap-1 min-w-0">
                    <UserIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="text-xs text-gray-500">Client:</span>
                    <p className="font-bold break-words whitespace-normal">
                      {truck.clientName || "--"} 
                      {truck.clientId && (
                        <span className="ml-1 text-xs text-gray-400">({truck.clientId})</span>
                      )}
                    </p>
                  </div>

                  {/* Vehicle ID */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="flex items-center gap-1">
                      <IdentificationIcon className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-bold text-xs text-gray-500">V-ID:</span>

                      {truck.vehicleId || client?.vehicleId ? (
                        <span className="font-bold px-3 py-2 bg-blue-100 text-green-800 text-xs rounded">
                          {truck.vehicleId || client?.vehicleId}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">--</span>
                      )}
                    </span>
                  </div>

                  {/* Plate Number */}
                  <div className="flex items-center gap-1 min-w-0">
                    <TruckIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-xs text-gray-500">Plate:</span>
                    <span className="break-words whitespace-normal">{truck.plateNumber || "--"}</span>
                  </div>

                  {/* Truck Type */}
                  <div className="flex items-center gap-1 min-w-0">
                    <ArchiveBoxIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-xs text-gray-500">Type:</span>
                    <span className="break-words whitespace-normal">{truck.truckType || "--"}</span>
                  </div>

                  {/* Driver */}
                  <div className="flex items-center gap-1 min-w-0">
                    <UserIcon className="w-4 h-4 text-yellow-500 shrink-0" />
                    <span className="text-xs text-gray-500">Driver:</span>
                    <span className="break-words whitespace-normal">{truck.driver || "--"}</span>
                  </div>
                  {/* Helpers */}
                  <div className="flex items-center gap-1 min-w-0">
                    <UserIcon className="w-4 h-4 text-pink-500 shrink-0" />
                    <span className="text-xs text-gray-500">Helpers:</span>
                  
                    {helpersList.length > 0 ? (
                      <span className="break-words whitespace-normal text-sm">
                        {helpersList.join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">--</span>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2">
                  {canModify && (
                    <>
                      {/* TIME OUT FIRST */}
                      {!truck.timeOut && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOutInAction(truck, "TIME_OUT");
                          }}
                          className="p-2 bg-yellow-400 rounded-full text-white"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* TIME IN AFTER TIME OUT */}
                      {truck.timeOut && !truck.timeIn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOutInAction(truck, "TIME_IN");
                          }}
                          className="p-2 bg-green-500 rounded-full text-white"
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
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>

            {/* ================= DETAILS ================= */}
            {isOpen && (
              <div className="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t">
                <p className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold">Purpose:</span>
                  {truck.purpose || "--"}
                </p>

                <p className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">Date:</span>
                  {truck.timeOutDate
                    ? new Date(truck.timeOutDate).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })
                    : "--"}
                </p>

                <p className="flex items-center gap-2">
  <ClockIcon className="w-4 h-4 text-red-500" />
  <span className="font-semibold">Time Out:</span>
  {truck.timeOut
    ? new Date(`1970-01-01T${truck.timeOut}`).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--"}
</p>

<p className="flex items-center gap-2">
  <ClockIcon className="w-4 h-4 text-green-500" />
  <span className="font-semibold">Time In:</span>
  {truck.timeIn
    ? new Date(`1970-01-01T${truck.timeIn}`).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--"}
</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}