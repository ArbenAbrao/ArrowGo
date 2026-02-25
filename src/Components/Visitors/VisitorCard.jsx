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
  userRole,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = !visitor.timeOut;
  const status = isActive ? "Active" : "Completed";
  const statusColor = STATUS_COLORS[status];

  /* ================= ROLE PERMISSIONS ================= */
  const canModify =
    userRole === "Admin" || userRole === "IT" || userRole === "User";

  return (
    <div
      className={`w-full relative rounded-xl overflow-hidden border-2 mb-4 transition-all hover:shadow-lg hover:scale-[1.01]
      ${statusColor.border} ${darkMode ? "bg-gray-900" : "bg-white"}`}
    >
      {/* HEADER */}
<div
  onClick={() => setIsOpen(!isOpen)}
  className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer overflow-hidden"
>

  {/* LEFT SIDE (All Info) */}
  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">

    {/* STATUS */}
    <span className="px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 shrink-0 h-6">
      <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
      {status}
    </span>

    {/* BRANCH */}
    {visitor.branch && (
      <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-indigo-100 text-indigo-900 dark:bg-indigo-600 dark:text-indigo-100 shrink-0 h-6">
        {visitor.branch}
      </span>
    )}

    {/* BADGE */}
    {visitor.badgeNumber && (
      <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-white shrink-0 h-6">
        {visitor.badgeNumber}
      </span>
    )}

    {/* COMPANY */}
    {visitor.company && (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full border shrink-0 h-6 ${getCompanyColor(
          visitor.company
        )}`}
      >
        {visitor.company}
      </span>
    )}

    {/* VISITOR NAME */}
    <div className="flex items-center gap-1 min-w-0">
      <UserIcon className="w-4 h-4 text-cyan-500 shrink-0" />
      <span className="font-bold truncate">
        {visitor.visitorName}
      </span>
    </div>

    {/* PERSON */}
    <div className="flex items-center gap-1 min-w-0">
      <UserIcon className="w-4 h-4 text-cyan-500 shrink-0" />
      <span className="truncate">
        {visitor.personToVisit}
      </span>
    </div>

    {/* PURPOSE */}
    <div className="flex items-center gap-1 min-w-0">
      <ClipboardDocumentListIcon className="w-4 h-4 text-cyan-500 shrink-0" />
      <span className="truncate">
        {visitor.purpose}
      </span>
    </div>

  </div>

  {/* RIGHT SIDE (Buttons) */}
  <div className="flex items-center gap-2 shrink-0">

    <button
      onClick={(e) => {
        e.stopPropagation();
        if (canModify && isActive) handleTimeOut(visitor);
      }}
      disabled={!canModify || !isActive}
      className={`p-2 rounded-full text-white transition
        ${
          !canModify || !isActive
            ? "bg-gray-400 cursor-not-allowed opacity-60"
            : "bg-yellow-400 hover:scale-105"
        }`}
    >
      <ClockIcon className="w-4 h-4" />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        if (canModify) handleEditOpen(visitor);
      }}
      disabled={!canModify}
      className={`p-2 rounded-full text-white transition
        ${
          !canModify
            ? "bg-gray-400 cursor-not-allowed opacity-60"
            : "bg-blue-500 hover:scale-105"
        }`}
    >
      <PencilSquareIcon className="w-4 h-4" />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        if (canModify) handleDeleteOpen(visitor.id);
      }}
      disabled={!canModify}
      className={`p-2 rounded-full text-white transition
        ${
          !canModify
            ? "bg-gray-400 cursor-not-allowed opacity-60"
            : "bg-red-500 hover:scale-105"
        }`}
    >
      <TrashIcon className="w-4 h-4" />
    </button>

    <ChevronDownIcon
      className={`w-5 h-5 transition-transform ${
        isOpen ? "rotate-180" : ""
      }`}
    />
  </div>
</div>

      {/* DETAILS SECTION */}
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