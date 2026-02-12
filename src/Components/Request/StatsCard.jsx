// src/Components/Request/StatsCard.jsx
import React from "react";

export default function StatsCard({ title, value, colorClass, darkMode }) {
  const baseClass = `rounded-xl p-5 shadow text-center ${darkMode ? "bg-gray-700" : colorClass}`;
  const textClass = darkMode ? "text-gray-100" : "text-gray-900";

  return (
    <div className={baseClass}>
      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-800"}`}>{title}</p>
      <p className={`text-3xl font-bold ${textClass}`}>{value}</p>
    </div>
  );
}
