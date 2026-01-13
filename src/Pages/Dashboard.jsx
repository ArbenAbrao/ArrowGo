import React, { useState, useEffect } from "react";
import axios from "axios";

// Components
import TruckStats from "../Components/Dashboard/TruckStats";
import VisitorStats from "../Components/Dashboard/VisitorStats";
import RequestStats from "../Components/Dashboard/RequestStats";
import RecentTrucks from "../Components/Dashboard/RecentTrucks";
import RecentVisitors from "../Components/Dashboard/RecentVisitors";
import MovementChart from "../Components/Dashboard/MovementChart";
import RecentTruckRequests from "../Components/Dashboard/RecentTruckRequests";
import RecentAppointmentRequests from "../Components/Dashboard/RecentAppointmentRequests";
import TrucksPerClient from "../Components/Dashboard/TrucksPerClient";
import VisitorsPerCompany from "../Components/Dashboard/VisitorsPerCompany";


export default function Dashboard({ darkMode }) {
  const [trucks, setTrucks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [registeredTrucks, setRegisteredTrucks] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [truckRes, visitorRes, clientRes] = await Promise.all([
          axios.get("/api/trucks"),
          axios.get("/api/visitors"),
          axios.get("/api/clients")
        ]);
        setTrucks(truckRes.data);
        setVisitors(visitorRes.data);
        setRegisteredTrucks(clientRes.data);
        const storedRequests = JSON.parse(localStorage.getItem("pendingRequests")) || [];
        setRequests(storedRequests);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-black"}`}>
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? "text-gray-100" : "text-black"}`}>Dashboard</h1>

         <TruckStats trucks={trucks} registeredTrucks={registeredTrucks} darkMode={darkMode} />
         <VisitorStats visitors={visitors} darkMode={darkMode} />
         <RequestStats requests={requests} darkMode={darkMode} />
         <MovementChart trucks={trucks} visitors={visitors} darkMode={darkMode} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         <TrucksPerClient trucks={trucks} darkMode={darkMode} />
         <VisitorsPerCompany visitors={visitors} darkMode={darkMode} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col h-full">
          <RecentTrucks trucks={trucks} darkMode={darkMode} />
        </div>
        <div className="flex flex-col h-full">
          <RecentVisitors visitors={visitors} darkMode={darkMode} />
        </div>
        <div className="flex flex-col h-full">
          <RecentTruckRequests requests={requests} darkMode={darkMode} />
        </div>
        <div className="flex flex-col h-full">
          <RecentAppointmentRequests requests={requests} darkMode={darkMode} />
        </div>  
      </div>
    </div>
  );
}
