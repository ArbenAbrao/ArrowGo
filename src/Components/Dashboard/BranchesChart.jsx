// src/Components/Dashboard/BranchesChart.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Doughnut, Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

export default function BranchesChart({ darkMode, trucks = [] }) {
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, clientsRes] = await Promise.all([
          axios.get("http://192.168.254.126:5000/api/branches"),
          axios.get("http://192.168.254.126:5000/api/branch-clients")
        ]);
        setBranches(branchesRes.data);
        setClients(clientsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const selectedBranchId = parseInt(selectedBranch);

  const branchClients = clients.filter(
    c => c.branch_id === selectedBranchId
  );


  const isSingleBranch = selectedBranch !== "all";

  const chartData = useMemo(() => {
    if (!branches.length) return { labels: [], datasets: [] };

    if (!isSingleBranch) {
      // All branches → clients per branch
      return {
        labels: branches.map(b => b.name),
        datasets: [
          {
            data: branches.map(b => b.clientCount),
            backgroundColor: branches.map(
              (_, i) =>
                `hsl(${(i * 360) / branches.length}, 70%, ${
                  darkMode ? "50%" : "65%"
                })`
            )
          }
        ]
      };
    } else {
      // Single branch → show only clients
      return {
        labels: branchClients.map(c => c.name),
        datasets: [
          {
            data: Array(branchClients.length).fill(1),
            backgroundColor: branchClients.map(
              (_, i) =>
                `hsl(${(i * 360) / branchClients.length}, 65%, ${
                  darkMode ? "50%" : "65%"
                })`
            )
          }
        ]
      };
    }
  }, [branches, isSingleBranch, branchClients, darkMode]);

  const total =
    chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: isSingleBranch ? "75%" : "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: darkMode ? "#fff" : "#000" }
      },
      title: {
        display: true,
        text:
          selectedBranch === "all"
            ? "Clients per Branch"
            : "Clients Distribution",
        color: darkMode ? "#fff" : "#000"
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 12 },
        formatter: value => {
          if (!total) return "";
          return ((value / total) * 100).toFixed(1) + "%";
        }
      }
    },
    onClick: (_, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;

      if (!isSingleBranch) {
        const branch = branches[index];
        const branchClientsList = clients.filter(
          c => c.branch_id === branch.id
        );

        const branchTrucksList = trucks.filter(
          t => t.branch_id === branch.id
        );

        setModalData({
          title: branch.name,
          clients: branchClientsList,
          trucks: branchTrucksList
        });
      } else {
        // Single branch → show clicked client details
        const client = branchClients[index];
        setModalData({
          title: client.name,
          clients: [client],
          trucks: []
        });
      }
    }
  };

  const usePie =
    selectedBranch === "all" && branches.length <= 4;

  const ChartComponent = usePie ? Pie : Doughnut;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 w-full transition-all
      ${
        darkMode
          ? "bg-gray-900 border border-white/10 text-gray-200"
          : "bg-white border border-gray-200 shadow-sm text-black"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="font-semibold text-lg sm:text-xl">
          Branches Overview
        </h2>

        <select
          className={`w-full sm:w-auto p-2 rounded-lg border
          ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-300"
              : "bg-gray-50 border-gray-300 text-black"
          }`}
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="all">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="relative w-full h-[280px] sm:h-[350px] md:h-[400px]">
        {chartData.labels.length > 0 && (
          <>
            <ChartComponent data={chartData} options={options} />

            {/* Center Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs opacity-70">
                {isSingleBranch ? "Total Clients" : "Total Clients"}
              </span>
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-[95%] max-w-lg max-h-[80vh] overflow-y-auto
            ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
          >
            <h3 className="text-lg font-bold mb-4">{modalData.title}</h3>

            {modalData.clients.length > 0 && (
              <>
                <h4 className="font-semibold mb-2">Clients</h4>
                <ul className="space-y-1 text-sm mb-4">
                  {modalData.clients.map(client => (
                    <li
                      key={client.id}
                      className="border-b border-gray-500/20 pb-1"
                    >
                      {client.name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {modalData.trucks.length > 0 && (
              <>
                <h4 className="font-semibold mb-2">Trucks</h4>
                <ul className="space-y-1 text-sm">
                  {modalData.trucks.map(truck => (
                    <li
                      key={truck.id}
                      className="border-b border-gray-500/20 pb-1"
                    >
                      {truck.plate_number || truck.id}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button
              onClick={() => setModalData(null)}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
