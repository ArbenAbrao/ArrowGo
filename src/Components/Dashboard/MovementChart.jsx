import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  addDays,
  addWeeks,
  addMonths,
  format,
} from "date-fns";

export default function MovementChart({ trucks, visitors, darkMode }) {
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  const [chartType, setChartType] = useState("day");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [movementData, setMovementData] = useState([]);
  const [sparkData, setSparkData] = useState([]);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showVisitors, setShowVisitors] = useState(true);
  const [hoverPeriod, setHoverPeriod] = useState(null); // keep it, disable warning
  const [totalTrucks, setTotalTrucks] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [growthTrucks, setGrowthTrucks] = useState(0);
  const [growthVisitors, setGrowthVisitors] = useState(0);

  const getKey = (dateObj, type = chartType) => {
    switch (type) {
      case "day": return format(dateObj, "MM/dd/yyyy");
      case "week": return `Week of ${format(startOfWeek(dateObj), "MM/dd/yyyy")}`;
      case "month": return format(startOfMonth(dateObj), "MM/yyyy");
      case "year": return format(startOfYear(dateObj), "yyyy");
      default: return format(dateObj, "MM/dd/yyyy");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const computeData = () => {
    const allData = [...(trucks || []), ...(visitors || [])];
    const grouped = {};

    if (chartType === "day") {
      let d = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31);
      while (d <= end) {
        grouped[getKey(d)] = { name: getKey(d), Trucks: 0, Visitors: 0 };
        d = addDays(d, 1);
      }
    } else if (chartType === "week") {
      let d = startOfWeek(new Date(selectedYear, 0, 1));
      const last = startOfWeek(new Date(selectedYear, 11, 31));
      while (d <= last) {
        grouped[getKey(d)] = { name: getKey(d), Trucks: 0, Visitors: 0 };
        d = addWeeks(d, 1);
      }
    } else if (chartType === "month") {
      let d = startOfMonth(new Date(selectedYear, 0, 1));
      const last = startOfMonth(new Date(selectedYear, 11, 1));
      while (d <= last) {
        grouped[getKey(d)] = { name: getKey(d), Trucks: 0, Visitors: 0 };
        d = addMonths(d, 1);
      }
    } else if (chartType === "year") {
      for (let y = 2020; y <= currentYear; y++) {
        grouped[`${y}`] = { name: `${y}`, Trucks: 0, Visitors: 0 };
      }
    }

    let trucksCount = 0;
    let visitorsCount = 0;
    allData.forEach((item) => {
      if (!item?.date) return;
      const dateObj = new Date(item.date);
      const year = dateObj.getFullYear();
      if (chartType !== "year" && year !== selectedYear) return;
      const key = getKey(dateObj);
      if (!grouped[key]) grouped[key] = { name: key, Trucks: 0, Visitors: 0 };
      if (item.truckType) {
        grouped[key].Trucks += 1;
        trucksCount++;
      } else {
        grouped[key].Visitors += 1;
        visitorsCount++;
      }
    });

    const values = Object.values(grouped);
    setMovementData(values);

    // 🚀 Sparkline: show only current week, current month, or current year
    let sparklineData = [];
    const today = new Date();
    if (chartType === "day") {
      const start = startOfWeek(today);
      const end = addDays(start, 6);
      sparklineData = values.filter((v) => {
        const d = new Date(v.name);
        return d >= start && d <= end;
      });
    } else if (chartType === "week") {
      const currentWeek = getKey(today, "week");
      sparklineData = values.filter((v) => v.name === currentWeek);
    } else if (chartType === "month") {
      const currentMonth = getKey(today, "month");
      sparklineData = values.filter((v) => v.name === currentMonth);
    } else {
      sparklineData = values.slice(-7); // fallback
    }
    setSparkData(sparklineData);

    setTotalTrucks(trucksCount);
    setTotalVisitors(visitorsCount);

    const prev = values.length > 1 ? values[values.length - 2] : { Trucks: 0, Visitors: 0 };
    setGrowthTrucks(prev.Trucks ? Math.round(((trucksCount - prev.Trucks) / prev.Trucks) * 100) : 0);
    setGrowthVisitors(prev.Visitors ? Math.round(((visitorsCount - prev.Visitors) / prev.Visitors) * 100) : 0);
  };

  useEffect(() => {
    computeData();
    const interval = setInterval(computeData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks, visitors, chartType, selectedYear]);

  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";

  return (
    <div className={`p-4 rounded-lg shadow mb-6 ${chartContainerBg}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
        <h3 className={`font-semibold text-xl ${darkMode ? "text-gray-100" : "text-gray-700"}`}>
          Truck & Visitor Movements
        </h3>
        <div className="flex gap-2">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className={`border rounded p-1 ${darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-black border-gray-300"}`}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          {chartType !== "year" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={`border rounded p-1 ${darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-black border-gray-300"}`}
            >
              {yearsList.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          )}
        </div>
      </div>

{/* Live Counters */}
      <div className="flex gap-4 mb-2">
        <div className={`px-3 py-2 rounded ${darkMode ? "bg-gray-800" : "bg-green-100"}`}>
          <div className="text-sm font-medium flex justify-between">
            <span>Total Trucks</span>
            <span className={`text-xs ${growthTrucks >= 0 ? "text-green-600" : "text-red-500"}`}>
              {growthTrucks >= 0 ? `+${growthTrucks}%` : `${growthTrucks}%`}
            </span>
          </div>
          <div className="text-xl font-bold text-green-600">{totalTrucks}</div>
        </div>
        <div className={`px-3 py-2 rounded ${darkMode ? "bg-gray-800" : "bg-yellow-100"}`}>
          <div className="text-sm font-medium flex justify-between">
            <span>Total Visitors</span>
            <span className={`text-xs ${growthVisitors >= 0 ? "text-green-600" : "text-red-500"}`}>
              {growthVisitors >= 0 ? `+${growthVisitors}%` : `${growthVisitors}%`}
            </span>
          </div>
          <div className="text-xl font-bold text-yellow-600">{totalVisitors}</div>
        </div>
      </div>

      {/* Toggle lines */}
      <div className="flex gap-2 mb-2">
        <button className={`px-2 py-1 rounded ${showTrucks ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"}`} onClick={() => setShowTrucks(!showTrucks)}>Trucks</button>
        <button className={`px-2 py-1 rounded ${showVisitors ? "bg-yellow-500 text-white" : "bg-gray-300 text-gray-800"}`} onClick={() => setShowVisitors(!showVisitors)}>Visitors</button>
      </div>

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={movementData}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#AAA" : "#555", fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#AAA" : "#555", fontSize: 12 }} allowDecimals={false} min={0} />
          <RechartsTooltip cursor={{ stroke: darkMode ? "#555" : "#ccc", strokeWidth: 1 }} contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", border: "none", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
          <Legend />
          {showTrucks && <Line type="monotone" dataKey="Trucks" stroke="url(#colorTrucks)" strokeWidth={2} dot={false} />}
          {showVisitors && <Line type="monotone" dataKey="Visitors" stroke="url(#colorVisitors)" strokeWidth={2} dot={false} />}
          <defs>
            <linearGradient id="colorTrucks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>

      {/* Sparkline */}
      <div className="mt-2 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sparkData}
            onClick={(e) => {
              if (e && e.activeLabel) {
                setHoverPeriod(e.activeLabel); // still assigned but unused
              }
            }}
          >
            <XAxis dataKey="name" hide />
            <YAxis
              hide
              domain={[
                0,
                Math.max(...sparkData.map(d => Math.max(d.Trucks, d.Visitors))) + 5,
              ]}
            />
            <RechartsTooltip
              cursor={{ stroke: darkMode ? "#555" : "#ccc", strokeWidth: 2 }}
              contentStyle={{
                backgroundColor: darkMode ? "#1f2937" : "#fff",
                border: "none",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) => [value, name]}
            />
            {showTrucks && (
              <Line
                type="monotone"
                dataKey="Trucks"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            )}
            {showVisitors && (
              <Line
                type="monotone"
                dataKey="Visitors"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* ✅ hoverPeriod is now USED */}
{hoverPeriod && (
  <div
    className={`mt-2 text-sm ${
      darkMode ? "text-gray-400" : "text-gray-600"
    }`}
  >
    Selected period: <span className="font-medium">{hoverPeriod}</span>
  </div>
)}
    </div>
  );
}
