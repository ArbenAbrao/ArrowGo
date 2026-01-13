// src/Components/Dashboard/VisitorStats.jsx
import React from "react";
import { UserIcon, BellIcon } from "@heroicons/react/24/outline";

export default function VisitorStats({ visitors, darkMode }) {
  const totalVisitors = visitors.length;
  const activeVisitors = visitors.filter((v) => !v.timeOut && !v.appointmentRequest).length;
  const completedVisitors = visitors.filter((v) => v.timeOut).length;
  const appointmentRequests = visitors.filter((v) => v.appointmentRequest).length;

  const cardBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-green-100 text-green-900";

  const stats = [
    { icon: UserIcon, label: "Total Visitors", value: totalVisitors },
    { icon: UserIcon, label: "Active Visitors", value: activeVisitors },
    { icon: UserIcon, label: "Completed Visitors", value: completedVisitors },
    { icon: BellIcon, label: "Pending Appointment", value: appointmentRequests },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((card, i) => (
        <div key={i} className={`shadow-md rounded-lg p-4 flex flex-col gap-2 ${cardBg}`}>
          <div className="flex items-center gap-2">
            <card.icon className={`w-6 h-6 ${darkMode ? "text-yellow-400" : "text-blue-700"}`} />
            <span className="font-semibold">{card.label}</span>
          </div>
          <h2 className="text-2xl font-bold">{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
