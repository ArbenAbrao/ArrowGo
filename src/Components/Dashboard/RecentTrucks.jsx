// src/Components/Dashboard/RecentTrucks.jsx
import React from "react";

export default function RecentTrucks({ trucks, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";
  const recentTrucks = [...trucks].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className={`rounded-lg p-4 flex flex-col h-full ${chartContainerBg}`}>
      <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Recent Trucks</h2>
      <ul className="divide-y divide-gray-300 flex-1 overflow-auto">
        {recentTrucks.map((truck) => (
          <li key={truck.id} className="py-2 flex justify-between">
            <span>{truck.clientName} - {truck.plateNumber} ({truck.truckType})</span>
            <span>{truck.timeIn} {truck.timeOut ? `- ${truck.timeOut}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
