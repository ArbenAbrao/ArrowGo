// src/Components/Request/RequestItem.jsx
import React, { useState } from "react";
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

// Soft pill tones per branch — driven by the darkMode prop (like the rest
// of the app) rather than Tailwind's `dark:` variant, so it stays in sync
// with the shared theme system instead of relying on a separate mechanism.
const BRANCH_TONES = {
  Marilao: { dark: "bg-amber-500/10 text-amber-400", light: "bg-amber-50 text-amber-600" },
  Taguig: { dark: "bg-violet-500/10 text-violet-400", light: "bg-violet-50 text-violet-600" },
  Palawan: { dark: "bg-teal-500/10 text-teal-400", light: "bg-teal-50 text-teal-600" },
  Cebu: { dark: "bg-pink-500/10 text-pink-400", light: "bg-pink-50 text-pink-600" },
  Davao: { dark: "bg-orange-500/10 text-orange-400", light: "bg-orange-50 text-orange-600" },
};
const BRANCH_FALLBACK = { dark: "bg-slate-700/60 text-slate-300", light: "bg-slate-100 text-slate-600" };

const TYPE_TONES = {
  appointment: { dark: "bg-sky-500/15 text-sky-400", light: "bg-sky-50 text-sky-600" },
  truck: { dark: "bg-emerald-500/15 text-emerald-400", light: "bg-emerald-50 text-emerald-600" },
};

export default function RequestItem({ req, darkMode, isSelected, toggleBulkSelect, openModal, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const mode = darkMode ? "dark" : "light";

  const branch = req.type === "truck" ? req.data.branchRegistered : req.data.branch;
  const branchBadgeClass = (BRANCH_TONES[branch] || BRANCH_FALLBACK)[mode];
  const typeBadgeClass = (TYPE_TONES[req.type] || TYPE_TONES.appointment)[mode];

  const cardClass = isSelected ? theme.itemSelectedBg : theme.itemBg;

  return (
    <div className={`relative rounded-xl border p-4 transition ${cardClass}`}>
      <div className="flex items-start gap-3">
        {/* Selection checkbox lives up front now — easier to hit, and it no
            longer overlaps the expanded accordion content below it. */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleBulkSelect(req.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 accent-emerald-500"
        />

        <div className="flex-1 min-w-0">
          <div
            className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
            onClick={() => setIsOpen((o) => !o)}
          >
            <div className="min-w-0">
              <p className={`font-semibold truncate ${theme.titleText}`}>
                {req.type === "truck" ? req.data.clientName : req.data.visitorName}
              </p>
              <p className={`text-xs ${theme.subtleText}`}>
                {req.type === "appointment" ? `Visiting ${req.data.personToVisit}` : req.data.truckType}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadgeClass}`}>{req.type}</span>
              {branch && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${branchBadgeClass}`}>{branch}</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(req);
                }}
                className={`p-1.5 rounded-lg transition ${theme.subtleText} hover:text-emerald-500`}
                title="Review request"
                aria-label="Review request"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${theme.subtleText} ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Accordion content */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isOpen ? "max-h-[600px] opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div
              className={`rounded-lg border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm ${theme.innerPanelBg} ${theme.detailText}`}
            >
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

            <p className={`text-[11px] mt-2 ${theme.metaText}`}>
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
        </div>
      </div>
    </div>
  );
}