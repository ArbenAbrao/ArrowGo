// src/Components/Dashboard/RecentVisitors.jsx
import React from "react";

export default function RecentVisitors({ visitors, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";
  const recentVisitors = [...visitors].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className={`rounded-lg p-4 flex flex-col h-full ${chartContainerBg}`}>
      <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Recent Visitors</h2>
      <ul className="divide-y divide-gray-300 flex-1 overflow-auto">
        {recentVisitors.map((v) => (
          <li key={v.id} className="py-2 flex justify-between">
            <span>{v.visitorName} - {v.company}</span>
            <span>{v.timeIn} {v.timeOut ? `- ${v.timeOut}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
