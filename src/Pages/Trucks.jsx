import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

import DeleteTruckModal from "../Components/Trucks/DeleteTruckModal";
import EditTruckModal from "../Components/Trucks/EditTruckModal";
import RegisterTruckModal from "../Components/Trucks/RegisterTruckModal";
import AddTruckModal from "../Components/Trucks/AddTruckModal";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";
import CompleteTrucksListModal from "../Components/Trucks/CompleteTrucksListModal";

import TruckGrid from "../Components/Trucks/TruckGrid";
import PaginationControls from "../Components/Trucks/PaginationControls";



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
  brandName: "",
  model: "",
  fuelType: "",
  displacement: "",
  payloadCapacity: "",
  branchRegistered: "", // ✅ NEW
});


 const [addForm, setAddForm] = useState({
  id: "",
  plateNumber: "",
  truckType: "",
  clientName: "",
  branchRegistered: "",
  bay: "",
  driver: "",
  purpose: "",
  date: null,        // ⛔ no auto date
  timeIn: null,      // ⛔ no auto time
});


const [selectedBranch, setSelectedBranch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ---------- Fetch Data ----------
const fetchTrucks = async () => {
  try {
    const res = await axios.get("https://tmvasbackend.arrowgo-logistics.com/api/trucks");
    setTrucks(res.data);
  } catch (err) {
    console.error(err);
  }
};

const fetchClients = async () => {
  try {
    const res = await axios.get("https://tmvasbackend.arrowgo-logistics.com/api/clients");
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
    await axios.post("https://tmvasbackend.arrowgo-logistics.com/api/register-truck", registerForm);
    await fetchTrucks();

    setRegisterForm({
      plateNumber: "",
      truckType: "",
      clientName: "",
      brandName: "",
      model: "",
      fuelType: "",
      displacement: "",
      payloadCapacity: "",
      branchRegistered: "", // ✅ reset
    });

    setIsRegisterModalOpen(false);
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
    await axios.post("https://tmvasbackend.arrowgo-logistics.com/api/add-truck", addForm);
    fetchTrucks();
    setIsAddModalOpen(false);
    setAddForm({
  id: "",
  plateNumber: "",
  truckType: "",
  clientName: "",
  branchRegistered: "",
  bay: "",
  driver: "",
  purpose: "",
  date: null,
  timeIn: null,
});


  } catch (err) {
    console.error(err);
  }
};

const handleTimeIn = async (truck) => {
  try {
    const now = new Date();

    const date = now.toISOString();
    const timeIn = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    await axios.put(`https://tmvasbackend.arrowgo-logistics.com/api/trucks/${truck.id}/timein`, {
      date,
      timeIn,
    });

    setTrucks((prev) =>
      prev.map((t) =>
        t.id === truck.id ? { ...t, date, timeIn } : t
      )
    );
  } catch (err) {
    console.error(err);
  }
};


const handleTimeOut = async (truck) => {
  try {
    const now = new Date();

    const timeout = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const timeOutDate = now.toISOString(); // Save full date for reference

    await axios.put(`https://tmvasbackend.arrowgo-logistics.com/api/trucks/${truck.id}/timeout`, {
      timeOut: timeout,
      timeOutDate, // send date to backend
    });

    setTrucks((prev) =>
      prev.map((t) =>
        t.id === truck.id ? { ...t, timeOut: timeout, timeOutDate } : t
      )
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
    const res = await axios.put(`https://tmvasbackend.arrowgo-logistics.com/api/trucks/${editModal.truck.id}`, {
      driver: editModal.truck.driver,
      purpose: editModal.truck.purpose,
      bay: editModal.truck.bay,
    });

    // Update state with new truck data from backend
    setTrucks((prev) =>
      prev.map((t) => (t.id === editModal.truck.id ? res.data.truck : t))
    );
    handleEditClose();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "Failed to save changes");
  }
};



// Delete truck
const handleDeleteConfirm = async () => {
  try {
    await axios.delete(`https://tmvasbackend.arrowgo-logistics.com/api/trucks/${deleteModal.truckId}`);
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

  const [branches, setBranches] = useState([]);
  
 

  useEffect(() => {
    axios.get("https://tmvasbackend.arrowgo-logistics.com/api/branches").then((res) => setBranches(res.data));
  }, []);


  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
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
                Time-in & Time-out Management
              </h1>
            </div>

            {/* FILTER BAR */}
<div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
  {/* Search */}
  <input
    type="text"
    placeholder="Search truck, plate, client, driver..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className={`w-full sm:w-72 px-3 py-2 rounded-lg border text-sm
      ${darkMode
        ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
        : "bg-white border-gray-300 text-gray-900"}`}
  />

  {/* Branch Filter */}
  <select
    value={selectedBranch || ""}
    onChange={(e) => setSelectedBranch(e.target.value)}
    className={`
      px-3 py-2 rounded-md text-sm focus:outline-none transition
      ${darkMode ? "bg-gray-800 text-gray-300 border border-gray-700" : "bg-gray-50 text-gray-900 border border-gray-300"}`}
  >
    <option value="">All Branches</option>
    {branches.map((b) => (
      <option key={b.id} value={b.name}>
        {b.name}
      </option>
    ))}
  </select>

  {/* Add Truck Button */}
  <button
    onClick={() => setIsAddModalOpen(true)}
    className={`
      px-4 py-2 rounded-md text-sm transition
      ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
  >
    Add Truck
  </button>

  {/* Completed Vehicle List Button */}
  <button
    onClick={() => setIsCompleteListModalOpen(true)}
    className={`
      px-4 py-2 rounded-md text-sm transition
      ${darkMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}
  >
    Completed Vehicle List
  </button>
</div>




            



<TruckGrid
  paginatedTrucks={paginatedTrucks}
    selectedBranch={selectedBranch} // 🔥 THIS

  darkMode={darkMode}
  handleTimeIn={handleTimeIn}   // ✅ NEW
  handleTimeOut={handleTimeOut}
  handleEditOpen={handleEditOpen}
  handleDeleteOpen={handleDeleteOpen}
/>


<PaginationControls
  darkMode={darkMode}
  currentPage={currentPage}
  totalPages={totalPages}
  setCurrentPage={setCurrentPage}
/>

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
