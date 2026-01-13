// src/Components/Dashboard/TrucksPerClient.jsx
import React from "react";
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

export default function TrucksPerClient({ trucks, darkMode }) {
  const trucksPerClient = trucks.reduce((acc, t) => {
    acc[t.clientName] = (acc[t.clientName] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(trucksPerClient),
    datasets: [
      {
        label: "Trucks per Client",
        data: Object.values(trucksPerClient),
        backgroundColor: darkMode ? "rgba(16,185,129,0.7)" : "rgba(34,197,94,0.7)",
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
      <h2 className={`text-lg font-bold mb-4 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Trucks per Client</h2>
      <Bar data={chartData} options={chartOptions} />

      {/* Scrollable table */}
      <div className="overflow-y-auto mt-4 max-h-64 border rounded">
        <table className={`w-full text-left border-collapse ${darkMode ? "text-gray-300" : "text-black"}`}>
          <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
            <tr>
              <th className="border-b px-3 py-2">Client</th>
              <th className="border-b px-3 py-2">Number of Trucks</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(trucksPerClient).map(([client, count]) => (
              <tr key={client} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}>
                <td className="border-b px-3 py-2">{client}</td>
                <td className="border-b px-3 py-2">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
