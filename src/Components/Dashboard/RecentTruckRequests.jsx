// src/Components/Dashboard/RecentTruckRequests.jsx
import React from "react";

export default function RecentTruckRequests({ requests, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";
  const recentTruckRequests = requests
    .filter((r) => r.type === "truck")
    .sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()))
    .slice(0, 5);

  return (
    <div className={`rounded-lg p-4 flex flex-col h-full transition-colors duration-300 ${chartContainerBg}`}>
      <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Recent Truck Requests</h2>
      <ul className="divide-y divide-gray-300 flex-1 overflow-auto">
        {recentTruckRequests.map((req) => (
          <li key={req.id} className="py-2">
            {req.data.clientName} - {req.data.truckType}
          </li>
        ))}
      </ul>
    </div>
  );
}
