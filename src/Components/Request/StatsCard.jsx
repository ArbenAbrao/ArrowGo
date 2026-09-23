// src/Components/Request/StatsCard.jsx
import React from "react";

const ACCENTS = {
  slate: {
    dark: "bg-slate-500/10 border-slate-500/25 text-slate-300",
    light: "bg-slate-100 border-slate-200 text-slate-600",
  },
  blue: {
    dark: "bg-sky-500/10 border-sky-500/25 text-sky-400",
    light: "bg-sky-50 border-sky-200 text-sky-600",
  },
  emerald: {
    dark: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    light: "bg-emerald-50 border-emerald-200 text-emerald-600",
  },
};

export default function StatsCard({ title, value, icon: Icon, accent = "slate", darkMode }) {
  const tone = ACCENTS[accent] || ACCENTS.slate;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
          tone[darkMode ? "dark" : "light"]
        }`}
      >
        {Icon && <Icon className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{title}</p>
        <p className={`text-2xl font-bold leading-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}