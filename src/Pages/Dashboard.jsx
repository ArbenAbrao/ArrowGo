// src/Pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { TruckIcon, UserIcon, BellIcon } from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from "recharts";
import { startOfWeek, format } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [trucks, setTrucks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [registeredTrucks, setRegisteredTrucks] = useState([]);
  const [chartType, setChartType] = useState("day");
  const [movementData, setMovementData] = useState([]);

  // ---------- Fetch Data ----------
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/trucks");
        setTrucks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchRegisteredTrucks = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/clients");
        setRegisteredTrucks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchVisitors = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/visitors");
        setVisitors(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrucks();
    fetchRegisteredTrucks();
    fetchVisitors();
  }, []);

  // ---------- Metrics ----------
  const totalTrucks = trucks.length;
  const activeTrucks = trucks.filter((t) => !t.timeOut).length;
  const completedTrucks = trucks.filter((t) => t.timeOut).length;
  const trucksPerClient = trucks.reduce((acc, t) => {
    acc[t.clientName] = (acc[t.clientName] || 0) + 1;
    return acc;
  }, {});
  const recentTrucks = [...trucks]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const totalVisitors = visitors.length;
  const activeVisitors = visitors.filter((v) => !v.timeOut && !v.appointmentRequest).length;
  const completedVisitors = visitors.filter((v) => v.timeOut).length;
  const appointmentRequests = visitors.filter((v) => v.appointmentRequest);
  const visitorsPerCompany = visitors.reduce((acc, v) => {
    acc[v.company] = (acc[v.company] || 0) + 1;
    return acc;
  }, {});
  const recentVisitors = [...visitors]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // ---------- Bar Chart Data ----------
  const truckChartData = {
    labels: Object.keys(trucksPerClient),
    datasets: [
      {
        label: "Trucks per Client",
        data: Object.values(trucksPerClient),
        backgroundColor: "rgba(34,197,94,0.7)",
      },
    ],
  };
  const visitorChartData = {
    labels: Object.keys(visitorsPerCompany),
    datasets: [
      {
        label: "Visitors per Company",
        data: Object.values(visitorsPerCompany),
        backgroundColor: "rgba(59,130,246,0.7)",
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#000" } },
      title: { display: false },
    },
    scales: { x: { ticks: { color: "#000" } }, y: { ticks: { color: "#000" } } },
  };

  // ---------- Line Chart Data (Day/Week/Month/Year) ----------
  useEffect(() => {
    const grouped = {};
    const allData = [...trucks, ...visitors];

    allData.forEach((item) => {
      const dateObj = new Date(item.date);
      let key = "";

      switch (chartType) {
        case "day":
          key = dateObj.toLocaleDateString();
          break;
        case "week":
          key = `Week of ${format(startOfWeek(dateObj), "MM/dd/yyyy")}`;
          break;
        case "month":
          key = `${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;
          break;
        case "year":
          key = `${dateObj.getFullYear()}`;
          break;
        default:
          key = dateObj.toLocaleDateString();
      }

      if (!grouped[key]) grouped[key] = { name: key, Trucks: 0, Visitors: 0 };
      if (item.truckType) grouped[key].Trucks += 1;
      else grouped[key].Visitors += 1;
    });

    setMovementData(Object.values(grouped));
  }, [trucks, visitors, chartType]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6 text-black">Dashboard</h1>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TruckIcon, label: "Total Trucks", value: totalTrucks },
          { icon: TruckIcon, label: "Active Trucks", value: activeTrucks },
          { icon: TruckIcon, label: "Completed Trucks", value: completedTrucks },
          { icon: TruckIcon, label: "Registered Trucks", value: registeredTrucks.length },
        ].map((card, i) => (
          <div
  key={i}
  className="
    bg-gradient-to-br from-green-100 to-green-300
    shadow-md rounded-lg p-4 flex flex-col gap-2
    transition-all duration-300 ease-in-out
    hover:-translate-y-1 hover:scale-105 hover:shadow-xl
    cursor-pointer
  "
>
            <div className="flex items-center gap-2">
              <card.icon className="w-6 h-6 text-green-700" />
              <span className="font-semibold text-green-900">{card.label}</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">{card.value}</h2>
          </div>
        ))}
      </div>

      {/* Visitors Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: UserIcon, label: "Total Visitors", value: totalVisitors },
          { icon: UserIcon, label: "Active Visitors", value: activeVisitors },
          { icon: UserIcon, label: "Completed Visitors", value: completedVisitors },
          { icon: BellIcon, label: "Appointment Requests", value: appointmentRequests.length },
        ].map((card, i) => (
          <div
            key={i}
  className="
    bg-gradient-to-br from-green-100 to-green-300
    shadow-md rounded-lg p-4 flex flex-col gap-2
    transition-all duration-300 ease-in-out
    hover:-translate-y-1 hover:scale-105 hover:shadow-xl
    cursor-pointer
  "
>
            <div className="flex items-center gap-2">
              <card.icon className="w-6 h-6 text-green-700" />
              <span className="font-semibold text-green-900">{card.label}</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">{card.value}</h2>
          </div>
        ))}
      </div>

      {/* Line Chart for Movement */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-700 font-semibold">Truck & Visitor Movements</h3>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border rounded p-1"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={movementData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fill: "#000" }} axisLine={{ stroke: "#ccc" }} tickLine={false} />
            <YAxis tick={{ fill: "#000" }} axisLine={{ stroke: "#ccc" }} tickLine={false} />
            <RechartsTooltip
              contentStyle={{ backgroundColor: "#fff", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <RechartsLegend />
            <Line
              type="monotone"
              dataKey="Trucks"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={true}
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="Visitors"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={true}
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trucks per Client & Visitors per Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col h-full text-black">
          <h2 className="text-lg font-bold mb-4">Trucks per Client</h2>
          <Bar data={truckChartData} options={chartOptions} />
          <div className="overflow-x-auto mt-4 flex-1">
            <table className="w-full text-left border-collapse text-black">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2">Client</th>
                  <th className="border-b px-3 py-2">Number of Trucks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(trucksPerClient).map(([client, count]) => (
                  <tr key={client}>
                    <td className="border-b px-3 py-2">{client}</td>
                    <td className="border-b px-3 py-2">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex flex-col h-full text-black">
          <h2 className="text-lg font-bold mb-4">Visitors per Company</h2>
          <Bar data={visitorChartData} options={chartOptions} />
          <div className="overflow-x-auto mt-4 flex-1">
            <table className="w-full text-left border-collapse text-black">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2">Company</th>
                  <th className="border-b px-3 py-2">Number of Visitors</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(visitorsPerCompany).map(([company, count]) => (
                  <tr key={company}>
                    <td className="border-b px-3 py-2">{company}</td>
                    <td className="border-b px-3 py-2">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Trucks & Visitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col h-full text-black">
          <h2 className="text-lg font-bold mb-2">Recent Trucks</h2>
          <ul className="divide-y divide-gray-200 flex-1 overflow-auto">
            {recentTrucks.map((truck) => (
              <li key={truck.id} className="py-2 flex justify-between">
                <span>
                  {truck.clientName} - {truck.plateNumber} ({truck.truckType})
                </span>
                <span>
                  {truck.timeIn} {truck.timeOut ? `- ${truck.timeOut}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex flex-col h-full text-black">
          <h2 className="text-lg font-bold mb-2">Recent Visitors</h2>
          <ul className="divide-y divide-gray-200 flex-1 overflow-auto">
            {recentVisitors.map((visitor) => (
              <li key={visitor.id} className="py-2 flex justify-between">
                <span>
                  {visitor.visitorName} - {visitor.company}
                </span>
                <span>
                  {visitor.timeIn} {visitor.timeOut ? `- ${visitor.timeOut}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
