import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import DeleteTruckModal from "../Components/Trucks/DeleteTruckModal";
import EditTruckModal from "../Components/Trucks/EditTruckModal";
import RegisterTruckModal from "../Components/Trucks/RegisterTruckModal";
import AddTruckModal from "../Components/Trucks/AddTruckModal";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";
import CompleteTrucksListModal from "../Components/Trucks/CompleteTrucksListModal";

import {
  TruckIcon,
  ArchiveBoxIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function Trucks({ darkMode }) {
  // ---------- States ----------
  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, truck: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, truckId: null });
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);

  const allBays = Array.from({ length: 10 }, (_, i) => [`${i + 1}a`, `${i + 1}b`]).flat();

  const [registerForm, setRegisterForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
  });

  const [addForm, setAddForm] = useState({
    id: "",
    plateNumber: "",
    truckType: "",
    clientName: "",
    bay: "",
    driver: "",
    purpose: "",
    date: new Date(),
    timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ---------- Fetch Data ----------
const fetchTrucks = async () => {
  try {
    const res = await axios.get("/api/trucks");
    setTrucks(res.data);
  } catch (err) {
    console.error(err);
  }
};

const fetchClients = async () => {
  try {
    const res = await axios.get("/api/clients");
    setClients(res.data);
  } catch (err) {
    console.error(err);
  }
};


  useEffect(() => {
    fetchTrucks();
    fetchClients();
  }, []);

  // ---------- Filtered Trucks ----------
  const filteredTrucks = trucks
    .filter((truck) => !truck.timeOut)
    .filter((truck) => {
      const matchesDate = filterDate
        ? new Date(truck.date).toDateString() === new Date(filterDate).toDateString()
        : true;
      const matchesSearch =
        truck.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.truckType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (truck.driver && truck.driver.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDate && matchesSearch;
    });

  // ---------- Pagination ----------
  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const paginatedTrucks = filteredTrucks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const occupiedBays = trucks.filter((t) => !t.timeOut).map((t) => t.bay);

  // ---------- Handlers ----------
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

 const handleRegisterSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("/api/register-truck", registerForm);
    await fetchTrucks();

    setRegisterForm({
      plateNumber: "",
      truckType: "",
      clientName: "",
    });

    // ✅ close register modal only
    setIsRegisterModalOpen(false);

    // ❌ tinanggal na — hindi na mag-aauto open
    // setIsRegisteredModalOpen(true);

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "Failed to register truck");
  }
};



  const handleAddChange = (e) => {
    const { name, value } = e.target;
    if (name === "__truck_select__") {
      setAddForm((prev) => ({
        ...prev,
        id: value.id,
        truckType: value.truckType,
        plateNumber: value.plateNumber,
      }));
      return;
    }
    setAddForm((prev) => {
      if (name === "clientName") {
        return { ...prev, clientName: value, id: "", truckType: "", plateNumber: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAddSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("/api/add-truck", addForm);
    fetchTrucks();
    setIsAddModalOpen(false);
    setAddForm({
      id: "",
      plateNumber: "",
      truckType: "",
      clientName: "",
      bay: "",
      driver: "",
      purpose: "",
      date: new Date(),
      timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (err) {
    console.error(err);
  }
};


 const handleTimeOut = async (truck) => {
  try {
    const timeout = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    await axios.put(`/api/trucks/${truck.id}/timeout`, { timeOut: timeout });
    setTrucks((prev) =>
      prev.map((t) => (t.id === truck.id ? { ...t, timeOut: timeout } : t))
    );
  } catch (err) {
    console.error(err);
  }
};


  // ---------- Additional Handlers ----------

// Open/close modals
const handleEditOpen = (truck) => setEditModal({ open: true, truck });
const handleEditClose = () => setEditModal({ open: false, truck: null });

const handleDeleteOpen = (truckId) => setDeleteModal({ open: true, truckId });
const handleDeleteClose = () => setDeleteModal({ open: false, truckId: null });

// Edit truck
const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditModal((prev) => ({
    ...prev,
    truck: { ...prev.truck, [name]: value },
  }));
};

const handleEditSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.put(`/api/trucks/${editModal.truck.id}`, {
      driver: editModal.truck.driver,
      purpose: editModal.truck.purpose,
      bay: editModal.truck.bay,
    });
    setTrucks((prev) =>
      prev.map((t) => (t.id === editModal.truck.id ? editModal.truck : t))
    );
    handleEditClose();
  } catch (err) {
    console.error(err);
  }
};


// Delete truck
const handleDeleteConfirm = async () => {
  try {
    await axios.delete(`/api/trucks/${deleteModal.truckId}`);
    setTrucks((prev) => prev.filter((t) => t.id !== deleteModal.truckId));
    handleDeleteClose();
  } catch (err) {
    console.error(err);
  }
};

// Export CSV
const exportCompleteCSV = () => {
  const rows = trucks
    .filter((t) =>
      filterDate ? new Date(t.date).toDateString() === new Date(filterDate).toDateString() : true
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [
      "Client,Truck Type,Plate Number,Bay,Driver,Purpose,Date,Time In,Time Out",
      ...rows.map((t) =>
        [
          t.clientName,
          t.truckType,
          t.plateNumber,
          t.bay,
          t.driver,
          t.purpose,
          new Date(t.date).toLocaleDateString("en-US"),
          t.timeIn,
          t.timeOut || "",
        ].join(",")
      ),
    ].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `complete_trucks_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  // ---------- Styles ----------
  const containerBg = darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-900";




  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
  {/* Logo */}
  <div className="flex items-center mb-4 gap-3">
    <img src="/logo4.png" alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <h1 className={`text-2xl font-bold ${darkMode ? "text-cyan-400 drop-shadow-lg" : "text-green-500 drop-shadow-lg"} animate-pulse`}>
      Truck Management
    </h1>
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4 items-start sm:items-center">
    <button
      onClick={() => setIsRegisterModalOpen(true)}
      className={`w-full sm:w-auto px-5 py-2 rounded-lg font-medium transition-all duration-300
        bg-green-500 text-white hover:bg-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]
        active:scale-95`}
    >
      Register Truck
    </button>

    <button
      onClick={() => setIsAddModalOpen(true)}
      className={`w-full sm:w-auto px-5 py-2 rounded-lg font-medium transition-all duration-300
        bg-blue-500 text-white hover:bg-blue-600 hover:shadow-[0_0_15px_rgba(59,130,246,0.7)]
        active:scale-95`}
    >
      Add Truck
    </button>

    <button
      onClick={() => setIsRegisteredModalOpen(true)}
      className={`w-full sm:w-auto px-5 py-2 rounded-lg font-medium transition-all duration-300
        bg-purple-500 text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.7)]
        active:scale-95`}
    >
      View Registered Trucks
    </button>

    <button
      onClick={() => setIsCompleteListModalOpen(true)}
      className={`w-full sm:w-auto px-5 py-2 rounded-lg font-medium transition-all duration-300
        bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)]
        active:scale-95`}
    >
      View Complete Trucks List
    </button>

   {/* Date Filter */}
<div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
  <DatePicker
    selected={filterDate}
    onChange={(date) => setFilterDate(date)}
    dateFormat="MMM d, yyyy"
    placeholderText="Filter by date"
    className={`w-full sm:w-auto
      bg-transparent border border-green-400/30
      p-2 rounded shadow-md
      focus:outline-none focus:ring-2 focus:ring-green-400
      hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
      transition-all duration-300 text-green-900 placeholder-green-600
      dark:text-gray-100 dark:placeholder-gray-400
    `}
  />
  {filterDate && (
    <button
      onClick={() => setFilterDate(null)}
      className={`px-3 py-1 rounded
        bg-transparent border border-green-400/30
        shadow-md hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
        text-green-900 placeholder-green-600
        dark:text-gray-100 dark:border-gray-500 dark:hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]
        transition-all duration-300 active:scale-95
      `}
    >
      Clear
    </button>
  )}
</div>

  </div>

{/* Search Bar */}
<div className="mb-4">
  <input
    type="text"
    placeholder="Search by client, plate, truck type, or driver..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className={`w-full sm:w-2/3 md:w-1/2
      bg-transparent border border-green-400/30
      p-2 rounded shadow-md
      focus:outline-none focus:ring-2 focus:ring-green-400
      hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
      transition-all duration-300 text-green-900 placeholder-green-600
      dark:text-gray-100 dark:placeholder-gray-400
    `}
  />
</div>



{/* Truck Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {paginatedTrucks.map((truck) => {
    const isActive = !truck.timeOut;

    return (
      <div
        key={truck.id}
        tabIndex={0}
        className={`
          group relative rounded-xl overflow-hidden transition-transform duration-300 transform
          hover:scale-[1.03] focus:scale-[1.03] focus:outline-none
          ${
            darkMode
              ? `
                bg-gray-900 text-gray-100
                border border-green-500/20
                shadow-[0_4px_20px_rgba(34,197,94,0.2)]
                hover:shadow-[0_0_40px_rgba(34,197,94,0.6)]
              `
              : `
                bg-green-900 text-green-100
                border border-green-200
                shadow-[0_4px_20px_rgba(34,197,94,0.2)]
                hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]
              `
          }
        `}
      >
        {/* Neon Watermark Icon */}
        <TruckIcon
          className={`absolute right-2 bottom-2 w-16 h-16 sm:w-20 sm:h-20 pointer-events-none ${
            darkMode ? "text-cyan-400 opacity-20" : "text-green-300 opacity-30"
          }`}
        />

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          {!truck.timeOut && (
            <button
              onClick={() => handleTimeOut(truck)}
              className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#facc15]"
            >
              <ClockIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleEditOpen(truck)}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#3b82f6]"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteOpen(truck.id)}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#ef4444]"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-between h-full space-y-3">
          {/* Status Badge */}
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
              isActive
                ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.7)] animate-pulse"
                : "bg-gray-500 text-white shadow-[0_0_10px_rgba(156,163,175,0.7)]"
            }`}
          >
            {isActive ? "Active" : "Completed"}
          </span>

          {/* Client Name */}
          <h2
            className={`font-bold text-base sm:text-lg truncate ${
              darkMode ? "text-cyan-400" : "text-green-200"
            }`}
          >
            {truck.clientName}
          </h2>

          {/* Main Info */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm ${
              darkMode ? "text-gray-300" : "text-green-100"
            }`}
          >
            <p className="flex items-center gap-1">
              <TruckIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Plate:</span> {truck.plateNumber}
            </p>

            <p className="flex items-center gap-1">
              <ArchiveBoxIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Bay:</span> {truck.bay}
            </p>

            <p className="flex items-center gap-1">
              <UserIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Driver:</span> {truck.driver}
            </p>

            <p className="flex items-center gap-1">
              <ClipboardDocumentListIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Purpose:</span> {truck.purpose}
            </p>

            <p className="flex items-center gap-1 sm:col-span-2">
              <TruckIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Type:</span> {truck.truckType}
            </p>
          </div>

          {/* Divider */}
          <div className={`border-t ${darkMode ? "border-gray-700" : "border-green-200/50"}`} />

          {/* Date / Time */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm ${
              darkMode ? "text-gray-300" : "text-green-100"
            }`}
          >
            {/* Date */}
            <p className="flex items-center gap-1">
              <CalendarIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Date:</span>{" "}
              {new Date(truck.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>

            {/* Time In */}
            <p className="flex items-center gap-1">
              <ClockIcon
                className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
              />
              <span className="font-semibold">Time In:</span> {truck.timeIn}
            </p>

            {/* Time Out + Time Out Date */}
            {truck.timeOut && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <p className="flex items-center gap-1">
                  <ClockIcon
                    className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
                  />
                  <span className="font-semibold">Time Out:</span> {truck.timeOut}
                </p>
                <p className="flex items-center gap-1">
                  <CalendarIcon
                    className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
                  />
                  <span className="font-semibold">Time Out Date:</span>{" "}
                  {truck.timeOutDate
                    ? new Date(truck.timeOutDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })}
</div>




   {/* Pagination Controls */}
<div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    className={`
      px-4 py-2 border rounded transition
      ${darkMode 
        ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]" 
        : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    Prev
  </button>

  {Array.from({ length: totalPages }).map((_, index) => {
    const pageNum = index + 1;
    const isActive = currentPage === pageNum;
    return (
      <button
        key={index}
        onClick={() => setCurrentPage(pageNum)}
        className={`
          px-4 py-2 border rounded transition
          ${darkMode 
            ? isActive
              ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
              : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]"
            : isActive
              ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
              : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"
          }
        `}
      >
        {pageNum}
      </button>
    );
  })}

  <button
    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
    disabled={currentPage === totalPages}
    className={`
      px-4 py-2 border rounded transition
      ${darkMode 
        ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]" 
        : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    Next
  </button>
</div>


      {/* Modals */}
      <DeleteTruckModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, truckId: null })}
        onConfirm={handleDeleteConfirm}
        truck={trucks.find((t) => t.id === deleteModal.truckId)}
        darkMode={darkMode}
      />
      <EditTruckModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, truck: null })}
        truck={editModal.truck}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        bays={allBays}
        occupiedBays={occupiedBays}
        darkMode={darkMode}
      />
      <AddTruckModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        form={addForm}
        onChange={handleAddChange}
        clients={clients}
        bays={allBays}
        occupiedBays={occupiedBays}
        darkMode={darkMode}
      />
      <CompleteTrucksListModal
        open={isCompleteListModalOpen}
        onClose={() => setIsCompleteListModalOpen(false)}
        trucks={trucks}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        onExport={exportCompleteCSV}
        darkMode={darkMode}
      />
      <RegisterTruckModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        form={registerForm}
        onChange={handleRegisterChange}
        onSubmit={handleRegisterSubmit}
        darkMode={darkMode}
      />
      <RegisteredTrucksModal
        open={isRegisteredModalOpen}
        onClose={() => setIsRegisteredModalOpen(false)}
        trucks={trucks}
        clientName={registerForm.clientName}
        darkMode={darkMode}
      />
    </div>
  );
}
