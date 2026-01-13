// src/Components/Dashboard/RequestStats.jsx
import React from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export default function RequestStats({ requests, darkMode }) {
  const totalRequests = requests.length;
  const truckRequests = requests.filter((r) => r.type === "truck").length;
  const appointmentRequests = requests.filter((r) => r.type === "appointment").length;

  const cardBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-green-100 text-green-900";

  const stats = [
    { icon: ClipboardDocumentIcon, label: "Total Requests", value: totalRequests },
    { icon: ClipboardDocumentIcon, label: "Truck Requests", value: truckRequests },
    { icon: ClipboardDocumentIcon, label: "Appointment Requests", value: appointmentRequests },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((card, i) => (
        <div key={i} className={`shadow-md rounded-lg p-4 flex flex-col gap-2 ${cardBg}`}>
          <div className="flex items-center gap-2">
            <card.icon className={`w-6 h-6 ${darkMode ? "text-green-400" : "text-green-700"}`} />
            <span className="font-semibold">{card.label}</span>
          </div>
          <h2 className="text-2xl font-bold">{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
