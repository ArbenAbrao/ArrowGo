import React, { useMemo, useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ==================== COLORS ==================== */
const ARROWGO_COLOR = "rgba(22, 233, 36, 0.85)";
const COLOR_HUES = [0, 30, 60, 90, 180, 210, 240, 270, 300, 330];

const genColor = (hue, dark) =>
  `hsl(${hue}, 70%, ${dark ? "45%" : "55%"})`;

export default function TrucksPerClient({ trucks, darkMode }) {
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [stackedView, setStackedView] = useState(true);

  const clientChartRef = useRef(null);
  const branchChartRef = useRef(null);
  const colorMap = useRef({});

  const today = new Date().toISOString().split("T")[0];
  const textColor = darkMode ? "#DDD" : "#000";

  /* ==================== COLOR REGISTRY ==================== */
  useMemo(() => {
    let i = 0;
    [...new Set(trucks.map(t => t.clientName))].forEach(c => {
      if (!colorMap.current[c]) {
        colorMap.current[c] =
          c.toLowerCase() === "arrowgo"
            ? ARROWGO_COLOR
            : genColor(COLOR_HUES[i++ % COLOR_HUES.length], darkMode);
      }
    });
  }, [trucks, darkMode]);

  /* ==================== FILTERS ==================== */
  const branches = useMemo(
    () => ["ALL", ...new Set(trucks.map(t => t.branchRegistered))],
    [trucks]
  );

  const clients = useMemo(() => {
    const src =
      selectedBranch === "ALL"
        ? trucks
        : trucks.filter(t => t.branchRegistered === selectedBranch);
    return ["ALL", ...new Set(src.map(t => t.clientName))];
  }, [trucks, selectedBranch]);

  useEffect(() => setSelectedClient("ALL"), [selectedBranch]);

  const filtered = useMemo(() => {
    return trucks.filter(t => {
      if (selectedBranch !== "ALL" && t.branchRegistered !== selectedBranch)
        return false;
      if (selectedClient !== "ALL" && t.clientName !== selectedClient)
        return false;
      return true;
    });
  }, [trucks, selectedBranch, selectedClient]);

  /* ==================== AGGREGATION ==================== */
  const perClient = useMemo(() => {
    return filtered.reduce((a, t) => {
      a[t.clientName] = (a[t.clientName] || 0) + 1;
      return a;
    }, {});
  }, [filtered]);

  const branchLabels = useMemo(
    () =>
      selectedBranch === "ALL"
        ? [...new Set(trucks.map(t => t.branchRegistered))]
        : [selectedBranch],
    [trucks, selectedBranch]
  );

  const allClients = useMemo(
    () => [...new Set(trucks.map(t => t.clientName))],
    [trucks]
  );

  /* ==================== CHART DATA ==================== */
  const clientChart = {
    labels: Object.keys(perClient),
    datasets: [
      {
        label: "Trucks",
        data: Object.values(perClient),
        backgroundColor: Object.keys(perClient).map(c => colorMap.current[c]),
      },
    ],
  };

  const branchChart = {
    labels: branchLabels,
    datasets: allClients.map(c => ({
      label: c,
      data: branchLabels.map(
        b =>
          trucks.filter(
            t => t.branchRegistered === b && t.clientName === c
          ).length
      ),
      backgroundColor: colorMap.current[c],
    })),
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      x: { ticks: { color: textColor } },
      y: { ticks: { color: textColor } },
    },
  };

  const branchOptions = {
    ...baseOptions,
    scales: {
      x: { stacked: stackedView },
      y: { stacked: stackedView },
    },
    plugins: {
      legend: { position: "bottom", labels: { color: textColor } },
    },
  };

  /* ==================== EXPORT PNG WITH H3 ==================== */
const exportPNG = async () => {
  const logo = new Image();
  logo.src = "/logo11.png";

  logo.onload = () => {
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = 1100; // increase to fit h3 titles
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = darkMode ? "#111" : "#fff";
    ctx.fillRect(0, 0, width, height);

    // Draw logo top-left (fixed height 50px)
    const logoHeight = 50;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    ctx.drawImage(logo, 20, 20, logoWidth, logoHeight);

    // Draw header
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Trucks Dashboard - Date: ${today}`, logoWidth + 40, 45);
    ctx.font = "16px Arial";
    ctx.fillText(`Branch: ${selectedBranch} | Client: ${selectedClient}`, logoWidth + 40, 70);

    // Draw Trucks per Client title
    ctx.font = "bold 18px Arial";
    ctx.fillText("Trucks per Client", 20, 100);

    // Draw Client chart
    const clientImg = new Image();
    clientImg.src = clientChartRef.current.toBase64Image();
    clientImg.onload = () => {
      ctx.drawImage(clientImg, 20, 110, width - 40, 400);

      // Draw Trucks per Branch title
      ctx.font = "bold 18px Arial";
      ctx.fillText(`Trucks per Branch (${stackedView ? "Stacked" : "Grouped"})`, 20, 530);

      // Draw Branch chart below
      const branchImg = new Image();
      branchImg.src = branchChartRef.current.toBase64Image();
      branchImg.onload = () => {
        ctx.drawImage(branchImg, 20, 540, width - 40, 400);

        // Download PNG
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `Trucks_${today}.png`;
        link.click();
      };
    };
  };
};

  return (
    <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      <h2 className="text-lg font-bold mb-4">Trucks Dashboard</h2>

      {/* FILTER ROW */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          className={`px-3 py-2 rounded border text-sm ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-300"
          }`}
        >
          {branches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className={`px-3 py-2 rounded border text-sm ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-300"
          }`}
        >
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={() => setStackedView(v => !v)}
          className={`px-4 py-2 rounded text-sm font-medium ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {stackedView ? "Grouped View" : "Stacked View"}
        </button>

        <button
          onClick={exportPNG}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export PNG
        </button>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-[400px]">
                  <h3 className="font-semibold mb-2">Trucks per Client</h3>

          <Bar ref={clientChartRef} data={clientChart} options={baseOptions} />
        </div>
        <div className="h-[400px]">
                  <h3 className="font-semibold mb-2">
            Trucks per Branch ({stackedView ? "Stacked" : "Grouped"})
          </h3>
          <Bar ref={branchChartRef} data={branchChart} options={branchOptions} />
        </div>
      </div>
    </div>
  );
}
