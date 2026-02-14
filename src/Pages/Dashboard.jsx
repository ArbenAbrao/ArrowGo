import React, { useState, useEffect } from "react";
import axios from "axios";

// Components
import TruckStats from "../Components/Dashboard/TruckStats";
import VisitorStats from "../Components/Dashboard/VisitorStats";
import RecentTrucks from "../Components/Dashboard/RecentTrucks";
import RecentVisitors from "../Components/Dashboard/RecentVisitors";
import MovementChart from "../Components/Dashboard/MovementChart";
import TrucksPerClient from "../Components/Dashboard/TrucksPerClient";
import VisitorsPerCompany from "../Components/Dashboard/VisitorsPerCompany";
import useRequestAnalytics from "../Components/Dashboard/useRequestAnalytics";
import RequestReport from "../Components/Dashboard/RequestReport";
import BranchesChart from "../Components/Dashboard/BranchesChart";

export default function Dashboard({ darkMode }) {
  const [trucks, setTrucks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [registeredTrucks, setRegisteredTrucks] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);

  const { data: requestAnalytics } = useRequestAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [truckRes, visitorRes, clientRes, appointmentRes] =
          await Promise.all([
            axios.get("https://tmvasbackend.arrowgo-logistics.com/api/trucks"),
            axios.get("https://tmvasbackend.arrowgo-logistics.com/api/visitors"),
            axios.get("https://tmvasbackend.arrowgo-logistics.com/api/clients"),
            axios.get("https://tmvasbackend.arrowgo-logistics.com/api/appointment-requests"),
          ]);

        setTrucks(truckRes.data);
        setVisitors(visitorRes.data);
        setRegisteredTrucks(clientRes.data);
        setAppointmentRequests(appointmentRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-black"
      }`}
    >
      {/* Responsive Container */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Title */}
        <h1
          className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 ${
            darkMode ? "text-gray-100" : "text-black"
          }`}
        >
          Dashboard
        </h1>

        {/* ================= Request Report ================= */}
        <div className="mb-8">
          <RequestReport analytics={requestAnalytics} darkMode={darkMode} />
        </div>

        {/* ================= Truck Stats ================= */}
        <div className="mb-8">
          <TruckStats
            trucks={trucks}
            registeredTrucks={registeredTrucks}
            darkMode={darkMode}
          />
        </div>

        {/* ================= Visitor Stats ================= */}
        <div className="mb-8">
          <VisitorStats
            visitors={visitors}
            appointmentRequests={appointmentRequests}
            filteredAppointmentsCount={appointmentRequests.length}
            darkMode={darkMode}
          />
        </div>

        {/* ================= Movement Chart ================= */}
        <div className="mb-8">
          <MovementChart
            trucks={trucks}
            visitors={visitors}
            darkMode={darkMode}
          />
        </div>

        {/* ================= Company & Branch Charts ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mb-8">
          <VisitorsPerCompany visitors={visitors} darkMode={darkMode} />
          <BranchesChart trucks={trucks} darkMode={darkMode} />
        </div>

        {/* ================= Trucks per Client ================= */}
        <div className="mb-8">
          <TrucksPerClient trucks={trucks} darkMode={darkMode} />
        </div>

        {/* ================= Recent Tables ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          <RecentTrucks trucks={trucks} darkMode={darkMode} />
          <RecentVisitors visitors={visitors} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
