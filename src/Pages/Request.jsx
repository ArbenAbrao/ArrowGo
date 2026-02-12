// src/Components/Request/Request.jsx
import React, { useState } from "react";
import useRequests from "../Components/Request/useRequests";
import RequestItem from "../Components/Request/RequestItem";
import RequestModal from "../Components/Request/RequestModal";
import BulkApprovalModal from "../Components/Request/BulkApprovalModal";
import StatsCard from "../Components/Request/StatsCard";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";


export default function Request({ darkMode }) {
  const { requests, selectedBulk, setSelectedBulk, approve, reject, bulkApprove } = useRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const appointmentRequests = requests.filter(r => r.type === "appointment");
  const truckRequests = requests.filter(r => r.type === "truck");

  const toggleBulkSelect = (id) => {
    setSelectedBulk(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openModal = (req) => {
    if (selectedBulk.length > 0) return;
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const bulkStats = selectedBulk.reduce((acc, id) => {
    const req = requests.find(r => r.id === id);
    if (!req) return acc;
    if (req.type === "appointment") acc.appointment += 1;
    if (req.type === "truck") acc.truck += 1;
    return acc;
  }, { appointment: 0, truck: 0 });

  const approveBtn = "bg-green-600 hover:bg-green-700 text-white";
  const rejectBtn = "bg-red-600 hover:bg-red-700 text-white";
  const cancelBtn = "bg-gray-700 text-white hover:bg-gray-600";

const containerBg = darkMode
    ? "bg-gray-800 text-gray-300"
    : "bg-gray-50 text-gray-900";
  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
      {/* HEADER */}
      <div className="flex flex-col items-start mb-4 gap-1 sm:gap-2">
  <div className="flex items-center gap-3">
    <img
      src="/logo4.png"
      alt="Logo"
      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
    />
    <h1
      className={`text-2xl font-bold ${
        darkMode
          ? "text-cyan-400 drop-shadow-lg"
          : "text-green-500 drop-shadow-lg"
      }`}
    >
      Request Dashboard
    </h1>
  </div>
  <p className={darkMode ? "text-gray-300" : "text-gray-500"}>
    Live monitoring of incoming requests
  </p>
</div>


      {/* STATS */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 mb-8">
        <StatsCard title="Total" value={requests.length} colorClass="bg-gray-200" darkMode={darkMode} />
        <StatsCard title="Appointments" value={appointmentRequests.length} colorClass="bg-blue-200" darkMode={darkMode} />
        <StatsCard title="Trucks" value={truckRequests.length} colorClass="bg-green-200" darkMode={darkMode} />
      </div>

      {/* SEARCH & BULK */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 mb-6 items-center">
        <input
          placeholder="Search requests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full md:w-64 px-4 py-2 rounded-xl border focus:outline-none transition-colors duration-300 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-600" : "bg-blue-50 text-gray-800 border-gray-300"}`}
        />
        {selectedBulk.length > 0 && (
  <div className="flex gap-2 justify-end max-w-6xl mx-auto mb-6">
    <button onClick={bulkApprove} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white">
      Approve Selected ({selectedBulk.length})
    </button>
    <button onClick={() => selectedBulk.forEach(id => {
      const req = requests.find(r => r.id === id);
      if (req) reject(id, req.type);
    })} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white">
      Reject Selected ({selectedBulk.length})
    </button>
  </div>
)}
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 mb-14">
  {/* Appointments */}
  <div className="flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <p className="font-semibold text-gray-200 text-lg">Appointments</p>
      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={appointmentRequests.every(r => selectedBulk.includes(r.id))}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedBulk(prev => [...prev, ...appointmentRequests.map(r => r.id).filter(id => !prev.includes(id))]);
            } else {
              setSelectedBulk(prev => prev.filter(id => !appointmentRequests.some(r => r.id === id)));
            }
          }}
          className="accent-green-500"
        />
        Select All
      </label>
    </div>

    {appointmentRequests.map(req => (
      <RequestItem
        key={req.id}
        req={req}
        darkMode={darkMode}
        isSelected={selectedBulk.includes(req.id)}
        toggleBulkSelect={toggleBulkSelect}
        openModal={openModal}
      />
    ))}
  </div>

  {/* Trucks */}
  <div className="flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <p className="font-semibold text-gray-200 text-lg">Trucks</p>
      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={truckRequests.every(r => selectedBulk.includes(r.id))}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedBulk(prev => [...prev, ...truckRequests.map(r => r.id).filter(id => !prev.includes(id))]);
            } else {
              setSelectedBulk(prev => prev.filter(id => !truckRequests.some(r => r.id === id)));
            }
          }}
          className="accent-green-500"
        />
        Select All
      </label>
    </div>

    {truckRequests.map(req => (
      <RequestItem
        key={req.id}
        req={req}
        darkMode={darkMode}
        isSelected={selectedBulk.includes(req.id)}
        toggleBulkSelect={toggleBulkSelect}
        openModal={openModal}
      />
    ))}
  </div>
</div>



      {/* MODALS */}
      <RequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedRequest={selectedRequest} approve={approve} reject={reject} approveBtn={approveBtn} rejectBtn={rejectBtn} cancelBtn={cancelBtn} />
      <BulkApprovalModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} selectedBulk={selectedBulk} bulkStats={bulkStats} bulkApprove={bulkApprove} approveBtn={approveBtn} cancelBtn={cancelBtn} />
      <RegisteredTrucksModal open={isRegisteredModalOpen} onClose={() => setIsRegisteredModalOpen(false)} />
    </div>
  );
}
