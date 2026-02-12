// src/Components/Dashboard/MovementChart.jsx
import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getMonth, getYear } from "date-fns";
import { motion } from "framer-motion"; // removed AnimatePresence
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function MovementChart({ trucks = [], visitors = [], darkMode }) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [useStackedArea, setUseStackedArea] = useState(false);
  const [openIndex, setOpenIndex] = useState(null); // Mobile accordion for KPI cards

  const allData = useMemo(
    () => [...trucks.map((t) => ({ ...t, type: "truck" })), ...visitors.map((v) => ({ ...v, type: "visitor" }))],
    [trucks, visitors]
  );

  const movementData = useMemo(() => {
    let grouped = [];
    if (selectedMonth === "all") {
      for (let m = 0; m < 12; m++) {
        const start = startOfMonth(new Date(selectedYear, m));
        let Trucks = 0,
          Visitors = 0;

        allData.forEach((item) => {
          const d = new Date(item.date);
          if (getYear(d) !== selectedYear || getMonth(d) !== m) return;
          item.type === "truck" ? Trucks++ : Visitors++;
        });

        grouped.push({ name: format(start, "MMM"), Trucks, Visitors });
      }
    } else {
      const start = startOfMonth(new Date(selectedYear, selectedMonth));
      const days = eachDayOfInterval({ start, end: endOfMonth(start) });
      grouped = days.map((d) => ({ name: format(d, "d"), Trucks: 0, Visitors: 0 }));

      allData.forEach((item) => {
        const d = new Date(item.date);
        if (getYear(d) !== selectedYear || getMonth(d) !== selectedMonth) return;
        const targetName = format(d, "d");
        const target = grouped.find((g) => g.name === targetName);
        if (!target) return;
        item.type === "truck" ? target.Trucks++ : target.Visitors++;
      });
    }
    return grouped;
  }, [allData, selectedMonth, selectedYear]);

  const kpis = useMemo(
    () => ({
      totalTrucks: movementData.reduce((a, b) => a + b.Trucks, 0),
      totalVisitors: movementData.reduce((a, b) => a + b.Visitors, 0),
    }),
    [movementData]
  );

  // heatmapMax and setHeatmapFilter removed since they're not used

  const exportCSV = () => {
    const headers = ["Period", "Trucks", "Visitors"];
    const rows = movementData.map((d) => [d.name, d.Trucks, d.Visitors]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movement-data.csv";
    a.click();
  };

  const containerBg = darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800";
  const selectStyle = darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white border-gray-300";
  const axisColor = darkMode ? "#E5E7EB" : "#374151";
  const cardBg = darkMode ? "bg-gray-800 text-gray-200" : "";
  const tooltipBg = darkMode
    ? "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white"
    : "bg-gradient-to-r from-green-100 via-green-200 to-green-300 text-black";

  const stats = [
    { label: "Total Trucks", value: kpis.totalTrucks, color: darkMode ? "text-green-400" : "text-green-700", neonColor: darkMode ? "#22c55e" : "#166534" },
    { label: "Total Visitors", value: kpis.totalVisitors, color: darkMode ? "text-yellow-400" : "text-yellow-700", neonColor: darkMode ? "#facc15" : "#b45309" },
  ];


  return (
    <div className={`p-4 rounded-lg shadow mb-6 transition-colors duration-500 ${containerBg}`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap justify-between gap-2 mb-3">
        <h3 className="text-xl font-semibold transition-colors duration-500">Movement Analytics</h3>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
            className={`border rounded px-2 py-1 transition-colors duration-500 hover:scale-105 transform ${selectStyle}`}
          >
            <option value="all">All Months</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {format(new Date(2024, i), "MMMM")}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`border rounded px-2 py-1 transition-colors duration-500 hover:scale-105 transform ${selectStyle}`}
          >
            {Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 hover:scale-105 transform transition-all duration-300"
          >
            Export CSV
          </button>
          <button
            onClick={() => setUseStackedArea(!useStackedArea)}
            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 hover:scale-105 transform transition-all duration-300"
          >
            {useStackedArea ? "Line View" : "Stacked Area"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className={`p-2 rounded transition-colors duration-500 ${cardBg} ${darkMode ? "" : "bg-green-100"}`}
          >
            <div className="text-sm">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Mobile Accordion KPI Cards */}
      <div className="sm:hidden flex flex-col gap-2 mb-4">
        {stats.map((s, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`rounded-lg shadow-md ${darkMode ? "bg-gray-900 text-gray-200" : "bg-green-100 text-green-900"} overflow-hidden`}>
              <button
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="font-semibold">{s.label}</span>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
              <div
                className="transition-[max-height] duration-500 ease-in-out overflow-hidden"
                style={{ maxHeight: isOpen ? "80px" : "0px" }}
              >
                <div className="p-4">
                  <div className="text-xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Trucks Chart */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2 transition-colors duration-500">Trucks</h4>
          <ResponsiveContainer width="100%" height={200}>
            {useStackedArea ? (
              <AreaChart data={movementData}>
                <XAxis dataKey="name" stroke={axisColor} interval={0} />
                <YAxis allowDecimals={false} stroke={axisColor} />
                <Area type="monotone" dataKey="Trucks" stackId="1" stroke="#10B981" fill="#10B981" />
                <RechartsTooltip />
              </AreaChart>
            ) : (
              <LineChart data={movementData}>
                <Line type="monotone" dataKey="Trucks" stroke="#10B981" strokeWidth={2} dot={false} />
                <XAxis dataKey="name" stroke={axisColor} interval={0} />
                <YAxis allowDecimals={false} stroke={axisColor} />
                <RechartsTooltip />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Visitors Chart */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2 transition-colors duration-500">Visitors</h4>
          <ResponsiveContainer width="100%" height={200}>
            {useStackedArea ? (
              <AreaChart data={movementData}>
                <XAxis dataKey="name" stroke={axisColor} interval={0} />
                <YAxis allowDecimals={false} stroke={axisColor} />
                <Area type="monotone" dataKey="Visitors" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                <RechartsTooltip />
              </AreaChart>
            ) : (
              <LineChart data={movementData}>
                <Line type="monotone" dataKey="Visitors" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <XAxis dataKey="name" stroke={axisColor} interval={0} />
                <YAxis allowDecimals={false} stroke={axisColor} />
                <RechartsTooltip />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-4 relative">
        <h4 className="text-sm font-semibold mb-2 transition-colors duration-500">Click Heatmap to Filter</h4>
        <div className="grid grid-cols-7 gap-1 relative">
          {/* Heatmap rendering logic stays unchanged */}
        </div>
        <div
          id="heatmap-tooltip"
          className={`fixed z-50 p-3 rounded-lg shadow-lg pointer-events-none text-xs transition-colors duration-300 ${tooltipBg}`}
          style={{ display: "none", minWidth: "140px" }}
        />
      </div>
    </div>
  );
}
