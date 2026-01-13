import React from "react";
import { Bar } from "react-chartjs-2";

export default function VisitorsPerCompany({ visitors, darkMode }) {
  const visitorsPerCompany = visitors.reduce((acc, v) => {
    acc[v.company] = (acc[v.company] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(visitorsPerCompany),
    datasets: [
      {
        label: "Visitors per Company",
        data: Object.values(visitorsPerCompany),
        backgroundColor: darkMode ? "rgba(251,191,36,0.7)" : "rgba(59,130,246,0.7)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: darkMode ? "#DDD" : "#000" } },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: darkMode ? "#DDD" : "#000" } },
      y: { ticks: { color: darkMode ? "#DDD" : "#000" } },
    },
  };

  return (
    <div className={`rounded-lg p-4 flex flex-col h-full transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black"}`}>
      <h2 className={`text-lg font-bold mb-4 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Visitors per Company</h2>
      <Bar data={chartData} options={chartOptions} />

      {/* Scrollable table */}
      <div className="overflow-y-auto mt-4 max-h-64 border rounded">
        <table className={`w-full text-left border-collapse ${darkMode ? "text-gray-300" : "text-black"}`}>
          <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
            <tr>
              <th className="border-b px-3 py-2">Company</th>
              <th className="border-b px-3 py-2">Number of Visitors</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(visitorsPerCompany).map(([company, count]) => (
              <tr key={company} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}>
                <td className="border-b px-3 py-2">{company}</td>
                <td className="border-b px-3 py-2">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
