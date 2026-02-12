import React, { useState } from "react";

export default function RequestItem({
  req,
  darkMode,
  isSelected,
  toggleBulkSelect,
  openModal,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const branchColors = {
    Marilao:
      "bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100",
    Taguig:
      "bg-purple-200 text-purple-900 dark:bg-purple-600 dark:text-purple-100",
    Palawan:
      "bg-teal-200 text-teal-900 dark:bg-teal-600 dark:text-teal-100",
    Cebu:
      "bg-pink-200 text-pink-900 dark:bg-pink-600 dark:text-pink-100",
    Davao:
      "bg-orange-200 text-orange-900 dark:bg-orange-600 dark:text-orange-100",
  };

  const bgClass = darkMode
    ? isSelected
      ? "ring-2 ring-green-400 bg-gray-700 border-green-400"
      : req.type === "appointment"
      ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
      : "bg-gray-700 hover:bg-gray-600 border-gray-600"
    : isSelected
    ? "ring-2 ring-green-400 bg-green-100 border-green-400"
    : req.type === "appointment"
    ? "bg-blue-50 hover:bg-blue-100 border-blue-200"
    : "bg-green-50 hover:bg-green-100 border-green-200";

  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextClass = darkMode ? "text-gray-300" : "text-gray-600";
  const detailTextClass = darkMode ? "text-gray-200" : "text-gray-700";
  const metaTextClass = darkMode ? "text-gray-400" : "text-gray-500";

  const branch =
    req.type === "truck" ? req.data.branchRegistered : req.data.branch;

  const branchBadgeClass =
    branchColors[branch] ||
    "bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100";

  return (
    <div
      className={`relative flex flex-col p-5 rounded-xl border transition cursor-pointer ${bgClass}`}
    >
      {/* Header: badges + toggle */}
      <div className="flex justify-between items-center">
        <div
          className="flex-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <p className={`font-semibold ${textClass}`}>
            {req.type === "truck" ? req.data.clientName : req.data.visitorName}
          </p>
          <p className={`text-xs ${subTextClass}`}>
            {req.type === "appointment"
              ? `Visiting ${req.data.personToVisit}`
              : req.data.truckType}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              req.type === "appointment"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-green-600 text-white dark:bg-green-500"
            }`}
          >
            {req.type}
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${branchBadgeClass}`}
          >
            {branch}
          </span>

          {/* Accordion toggle */}
          <span
            className={`ml-2 text-sm transition-transform ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Accordion content */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`space-y-1 ${detailTextClass}`}>
          {req.type === "truck" ? (
            <>
              <p>Plate Number: {req.data.plateNumber}</p>
              <p>Brand: {req.data.brandName}</p>
              <p>Model: {req.data.model}</p>
              <p>Fuel Type: {req.data.fuelType}</p>
              <p>Displacement: {req.data.displacement}</p>
              <p>Payload Capacity: {req.data.payloadCapacity}</p>
            </>
          ) : (
            <>
              <p>Visitor Name: {req.data.visitorName}</p>
              <p>Company: {req.data.company}</p>
              <p>Purpose: {req.data.purpose}</p>
              <p>Visiting: {req.data.personToVisit}</p>
              <p>
                Date:{" "}
                {new Date(req.data.date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p>Time: {req.data.scheduleTime}</p>
            </>
          )}
        </div>

        <p className={`text-[11px] mt-2 ${metaTextClass}`}>
          Requested at:{" "}
          {new Date(req.timestamp || Date.now()).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </p>
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleBulkSelect(req.id)}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-3 right-3 accent-green-500"
      />
    </div>
  );
}
