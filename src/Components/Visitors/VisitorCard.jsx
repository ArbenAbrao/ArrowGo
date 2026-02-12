import { useState } from "react";
import {
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  TagIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

/* ================= STATUS COLORS ================= */
const STATUS_COLORS = {
  Active: {
    bg: "bg-green-100 dark:bg-green-600",
    text: "text-green-900 dark:text-green-100",
    border: "border-green-400",
    dot: "bg-green-500",
  },
  Completed: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    border: "border-gray-400",
    dot: "bg-gray-500",
  },
};

/* ================= COMPANY COLORS ================= */
const COMPANY_COLORS = [
  "bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-600 dark:text-blue-100",
  "bg-green-200 text-green-900 border-green-400 dark:bg-green-600 dark:text-green-100",
  "bg-red-200 text-red-900 border-red-400 dark:bg-red-600 dark:text-red-100",
  "bg-indigo-200 text-indigo-900 border-indigo-400 dark:bg-indigo-600 dark:text-indigo-100",
  "bg-cyan-200 text-cyan-900 border-cyan-400 dark:bg-cyan-600 dark:text-cyan-100",
];

const getCompanyColor = (() => {
  const cache = {};
  return (company) => {
    if (!company)
      return "bg-gray-200 text-gray-900 border-gray-400 dark:bg-gray-600 dark:text-gray-100";
    if (!cache[company]) {
      cache[company] =
        COMPANY_COLORS[Object.keys(cache).length % COMPANY_COLORS.length];
    }
    return cache[company];
  };
})();

export default function VisitorCard({
  visitor,
  darkMode,
  handleEditOpen,
  handleDeleteOpen,
  handleTimeOut,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = !visitor.timeOut;
  const status = isActive ? "Active" : "Completed";
  const statusColor = STATUS_COLORS[status];

  return (
    <div
      className={`w-full relative rounded-xl overflow-hidden border-2 mb-4 transition-all hover:shadow-lg hover:scale-[1.01]
      ${statusColor.border} ${darkMode ? "bg-gray-900" : "bg-white"}`}
    >
      {/* HEADER */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-12 gap-2 cursor-pointer"
      >
        {/* BADGES */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:col-span-2">
          {/* STATUS */}
          <span className="px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 h-6">
            <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
            {status}
          </span>

          {/* BRANCH */}
          {visitor.branch && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-100 flex items-center gap-1 h-6">
              <BuildingOfficeIcon className="w-3 h-3" />
              {visitor.branch}
            </span>
          )}

          {/* BADGE NUMBER */}
          {visitor.badgeNumber && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-white flex items-center gap-1 h-6">
              <TagIcon className="w-3 h-3" />
              {visitor.badgeNumber}
            </span>
          )}

          {/* COMPANY - MOBILE ALIGN FIX */}
          {visitor.company && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 h-6 
              ${getCompanyColor(visitor.company)}
              sm:ml-0 w-full sm:w-auto text-center sm:text-left`}
            >
              <BuildingOfficeIcon className="w-3 h-3" />
              {visitor.company}
            </span>
          )}
        </div>

        {/* RIGHT: VISITOR INFO + ACTIONS */}
<div className="col-span-4 sm:col-span-10 flex justify-end items-center gap-2">
  {/* VISITOR INFO */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
    <div className="flex items-center gap-1">
      <UserIcon className="w-4 h-4 text-cyan-500 shrink-0" />
      <span className="text-xs text-gray-500">Visitor:</span>
      <p className="truncate font-bold">{visitor.visitorName}</p>
    </div>

    <div className="flex items-center gap-1">
      <BuildingOfficeIcon className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="text-xs text-gray-500">Person:</span>
      <span className="truncate">{visitor.personToVisit}</span>
    </div>

    <div className="flex items-center gap-1">
      <ClipboardDocumentListIcon className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="text-xs text-gray-500">Purpose:</span>
      <span className="truncate">{visitor.purpose}</span>
    </div>
  </div>

          {/* ACTIONS */}
          <div className="flex gap-1 sm:gap-2 items-center mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimeOut(visitor);
                }}
                className="p-2 bg-yellow-400 rounded-full text-white"
              >
                <ClockIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditOpen(visitor);
              }}
              className="p-2 bg-blue-500 rounded-full text-white"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteOpen(visitor.id);
              }}
              className="p-2 bg-red-500 rounded-full text-white"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            <ChevronDownIcon
              className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* DETAILS */}
      {isOpen && (
        <div className="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-sm border-t">
          <p className="flex items-center gap-2">
            <IdentificationIcon className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">ID:</span>
            {visitor.idType} — {visitor.idNumber}
          </p>

          <p className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">Badge:</span>
            {visitor.badgeNumber}
          </p>

          <p className="flex items-center gap-2">
            <TruckIcon className="w-4 h-4 text-orange-500" />
            <span className="font-semibold">Vehicle:</span>
            {visitor.vehicleMode}
          </p>

          <p className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Date:</span>
            {visitor.date}
          </p>

          <p className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-green-500" />
            <span className="font-semibold">Time In:</span>
            {visitor.timeIn}
          </p>

          <p className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-red-500" />
            <span className="font-semibold">Time Out:</span>
            {visitor.timeOut || "--"}
          </p>
        </div>
      )}
    </div>
  );
}
