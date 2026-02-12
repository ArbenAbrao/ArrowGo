// src/Components/Dashboard/RecentVisitors.jsx
import React from "react";

export default function RecentVisitors({ visitors, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";

  // Sort by latest date and take top 5
  const recentVisitors = [...visitors]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className={`rounded-lg p-4 flex flex-col h-full w-full ${chartContainerBg}`}>
      <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
        Recent Visitors
      </h2>

      {/* Scrollable list for small screens */}
      <div className="flex-1 overflow-x-auto sm:overflow-x-hidden">
        <ul className="divide-y divide-gray-300 dark:divide-gray-700">
          {recentVisitors.map((v) => (
            <li
              key={v.id}
              className="py-2 px-2 sm:px-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"
            >
              <span className="font-medium">
                {v.visitorName} - {v.company}
              </span>
              <span className="text-sm opacity-80">
                {v.timeIn} {v.timeOut ? `- ${v.timeOut}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
