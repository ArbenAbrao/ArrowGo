import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ================= SEARCH BAR ================= */
function SearchBar({ searchTerm, setSearchTerm, darkMode }) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Search by client, plate, truck type, or driver..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`
          w-full md:w-1/2 px-4 py-2.5 rounded-lg text-sm transition
          focus:outline-none focus:ring-2
          ${
            darkMode
              ? "bg-gray-800 text-gray-300 border border-gray-700 focus:ring-green-500 placeholder-gray-400"
              : "bg-gray-50 text-gray-900 border border-gray-300 focus:ring-green-400 placeholder-gray-500"
          }
        `}
      />
    </div>
  );
}

/* ================= HEADER ================= */
function HeaderSection({ darkMode }) {
  return (
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
        Vehicle Management
      </h1>
    </div>
  );
}

/* ================= ACTIONS + FILTERS ================= */
function ActionSection({
  filterDate,
  setFilterDate,
  setIsRegisterModalOpen,
  setIsRegisteredModalOpen,
  setIsAddModalOpen,
  setIsCompleteListModalOpen,
  selectedBranch,
  setSelectedBranch,
  selectedClient,
  setSelectedClient,
  clients,
  darkMode,
}) {
  const [branches, setBranches] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    axios.get("https://tmvasbackend.arrowgo-logistics.com/api/branches").then((res) => setBranches(res.data));
  }, []);

  return (
    <div className="w-full">
      {/* MOBILE TOGGLE */}
      <button
        className={`sm:hidden w-full flex justify-between items-center px-4 py-2 rounded-lg mb-2 transition
          ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-900"}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <span>Actions</span>
        <span className={`transition-transform ${isMobileOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="flex flex-col md:flex-row gap-3 items-start md:items-center overflow-hidden transition-[max-height] duration-500"
        style={{
          maxHeight:
            isMobileOpen || window.innerWidth >= 640
              ? contentRef.current?.scrollHeight + "px"
              : "0px",
        }}
      >
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className={`px-4 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Register Truck
          </button>

          

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Create Appointment
          </button>

        
        </div>

        {/* FILTERS */}
        <div className="md:ml-auto flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
          {/* BRANCH */}
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedClient("");
            }}
            className={`px-3 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-gray-800 text-gray-300 border border-gray-700"
                : "bg-gray-50 text-gray-900 border border-gray-300"
            }`}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* CLIENT */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={!selectedBranch}
            className={`px-3 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-gray-800 text-gray-300 border border-gray-700"
                : "bg-gray-50 text-gray-900 border border-gray-300"
            }`}
          >
            <option value="">All Clients</option>
           {selectedBranch &&
  [...new Set(
    clients
      .filter((c) => c.branchRegistered === selectedBranch)
      .map((c) => c.clientName)
  )].map((clientName) => (
    <option key={clientName} value={clientName}>
      {clientName}
    </option>
  ))}

          </select>

          {/* DATE */}
          <DatePicker
            selected={filterDate}
            onChange={setFilterDate}
            dateFormat="MMM d, yyyy"
            placeholderText="Filter by date"
            className={`px-3 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-gray-800 text-gray-300 border border-gray-700"
                : "bg-gray-50 text-gray-900 border border-gray-300"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN LAYOUT ================= */
export default function TruckManagementLayout({
  darkMode,
  filterDate,
  setFilterDate,
  setIsRegisterModalOpen,
  setIsRegisteredModalOpen,
  setIsAddModalOpen,
  setIsCompleteListModalOpen,
  selectedBranch,
  setSelectedBranch,
  selectedClient,
  setSelectedClient,
  clients,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div
      className={`flex flex-col gap-4 w-full p-4 rounded-lg ${
        darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-900"
      }`}
    >
      <HeaderSection darkMode={darkMode} />

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        darkMode={darkMode}
      />

      <ActionSection
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        setIsRegisteredModalOpen={setIsRegisteredModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        setIsCompleteListModalOpen={setIsCompleteListModalOpen}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clients={clients}
        darkMode={darkMode}
      />
    </div>
  );
}
