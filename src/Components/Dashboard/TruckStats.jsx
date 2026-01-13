// src/Components/Dashboard/TruckStats.jsx
import React from "react";
import { TruckIcon } from "@heroicons/react/24/outline";

export default function TruckStats({ trucks, registeredTrucks, darkMode }) {
  const totalTrucks = trucks.length;
  const activeTrucks = trucks.filter((t) => !t.timeOut).length;
  const completedTrucks = trucks.filter((t) => t.timeOut).length;

  const cardBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-green-100 text-green-900";

  const stats = [
    { icon: TruckIcon, label: "Total Trucks", value: totalTrucks },
    { icon: TruckIcon, label: "Active Trucks", value: activeTrucks },
    { icon: TruckIcon, label: "Completed Trucks", value: completedTrucks },
    { icon: TruckIcon, label: "Registered Trucks", value: registeredTrucks.length },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
