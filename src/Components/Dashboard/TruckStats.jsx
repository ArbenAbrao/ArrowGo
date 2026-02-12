import React, { useState } from "react";
import { TruckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function TruckStats({ trucks, registeredTrucks, darkMode }) {
  const [openIndex, setOpenIndex] = useState(null); // for mobile accordion

  let activeTrucks = 0;
  let completedTrucks = 0;
  trucks.forEach((t) => {
    if (t.timeOut) completedTrucks++;
    else activeTrucks++;
  });

  const totalTrucks = trucks.length;

  const cardBg = darkMode
    ? "bg-gray-900 text-gray-300"
    : "bg-green-100 text-green-900";

  const stats = [
    { icon: TruckIcon, label: "Total Trucks", value: totalTrucks, color: darkMode ? "text-green-400" : "text-green-700", neonColor: darkMode ? "#22c55e" : "#166534", description: "All trucks in the system" },
    { icon: TruckIcon, label: "Active Trucks", value: activeTrucks, color: darkMode ? "text-blue-400" : "text-blue-700", neonColor: darkMode ? "#60a5fa" : "#1e3a8a", description: "Trucks currently active" },
    { icon: TruckIcon, label: "Completed Trucks", value: completedTrucks, color: darkMode ? "text-red-400" : "text-red-700", neonColor: darkMode ? "#f87171" : "#b91c1c", description: "Trucks that have completed their task" },
    { icon: TruckIcon, label: "Registered Trucks", value: registeredTrucks.length, color: darkMode ? "text-yellow-400" : "text-yellow-700", neonColor: darkMode ? "#facc15" : "#b45309", description: "Trucks registered to clients" },
  ];

  return (
    <div className="w-full">
      {/* Desktop / medium and larger screens */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((card, i) => (
          <article
            key={i}
            className={`
              shadow-md rounded-lg p-4 flex flex-col gap-2 ${cardBg}
              transition-all duration-300 ease-in-out
              transform hover:scale-[1.03] hover:shadow-lg
              cursor-pointer relative overflow-hidden
            `}
            title={card.description}
          >
            <div className="flex items-center gap-2">
              <card.icon className={`w-6 h-6 transition-colors duration-300 ${card.color}`} />
              <span className="font-semibold">{card.label}</span>
            </div>

            <h2 className="text-2xl font-bold">{card.value}</h2>

            <span
              className="absolute bottom-0 left-0 w-full h-1 opacity-0 transition-all duration-300"
              style={{
                boxShadow: `0 0 10px ${card.neonColor}, 0 0 20px ${card.neonColor}, 0 0 30px ${card.neonColor}`,
                backgroundColor: card.neonColor,
              }}
            />

            <style jsx>{`
              article:hover span {
                opacity: 1;
              }
            `}</style>
          </article>
        ))}
      </div>

      {/* Mobile / small screens: accordion */}
      <div className="md:hidden flex flex-col gap-2">
        {stats.map((card, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`rounded-lg shadow-md ${cardBg} overflow-hidden`}>
              {/* Accordion Header */}
              <button
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <span className="font-semibold">{card.label}</span>
                </div>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>

              {/* Accordion Content */}
              <div
                className="transition-[max-height] duration-500 ease-in-out overflow-hidden"
                style={{ maxHeight: isOpen ? "200px" : "0px" }}
              >
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                  <h2 className="text-2xl font-bold">{card.value}</h2>
                  <p className="mt-1 text-sm">{card.description}</p>
                  <span
                    className="block w-full h-1 mt-2 rounded"
                    style={{
                      boxShadow: `0 0 10px ${card.neonColor}, 0 0 20px ${card.neonColor}, 0 0 30px ${card.neonColor}`,
                      backgroundColor: card.neonColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
