import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function VisitorsPerCompany({ visitors = [], darkMode }) {

  const visitorsPerCompany = useMemo(() => {
    return visitors.reduce((acc, v) => {
      const company = v.company || "Unknown";
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});
  }, [visitors]);

  const labels = Object.keys(visitorsPerCompany);
  const values = Object.values(visitorsPerCompany);

  // 🔥 AUTO SWITCH CONDITION
  const useHorizontal = labels.length > 6;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Visitors per Company",
        data: values,
        backgroundColor: darkMode
          ? "rgba(251,191,36,0.7)"
          : "rgba(59,130,246,0.7)",
        borderRadius: 6,
        barThickness: "flex",
        maxBarThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: useHorizontal ? "y" : "x", // 🔥 SWITCH HERE
    plugins: {
      legend: {
        labels: { color: darkMode ? "#DDD" : "#000" },
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? "#DDD" : "#000",
          precision: 0,
        },
        grid: {
          color: darkMode
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.05)",
        },
      },
      y: {
        ticks: {
          color: darkMode ? "#DDD" : "#000",
        },
        grid: {
          display: !useHorizontal,
        },
      },
    },
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 flex flex-col transition-all duration-300 w-full
        ${
          darkMode
            ? "bg-gray-900 text-gray-300 border border-white/10"
            : "bg-white text-black border border-gray-200 shadow-sm"
        }
      `}
    >
      <h2
        className={`text-base sm:text-lg md:text-xl font-bold mb-4 ${
          darkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        Visitors per Company
      </h2>

      {labels.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm opacity-60">
          No visitor data available
        </div>
      ) : (
        <>
          {/* 🔥 Dynamic height when horizontal */}
          <div
            className={`w-full ${
              useHorizontal
                ? `h-[${Math.max(labels.length * 50, 300)}px]`
                : "h-[300px] sm:h-[380px]"
            }`}
            style={
              useHorizontal
                ? { height: Math.max(labels.length * 50, 300) }
                : {}
            }
          >
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Scrollable Table */}
          <div className="mt-6 max-h-[300px] overflow-y-auto overflow-x-auto rounded-lg">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead
                className={`sticky top-0 z-10 ${
                  darkMode ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <tr>
                  <th className="px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                    Company
                  </th>
                  <th className="px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                    Visitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(visitorsPerCompany).map(
                  ([company, count]) => (
                    <tr
                      key={company}
                      className={`transition-colors ${
                        darkMode
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-4 py-2 text-xs sm:text-sm border-b whitespace-nowrap">
                        {company}
                      </td>
                      <td className="px-4 py-2 text-xs sm:text-sm border-b font-medium">
                        {count}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
