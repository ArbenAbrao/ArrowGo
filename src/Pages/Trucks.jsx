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

export default function Trucks() {
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

  // ---------- Fetch Data ----------
  const fetchTrucks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/trucks");
      setTrucks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrucks();
    fetchClients();
  }, []);

  // ---------- Register Truck ----------
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/register-truck", registerForm);
      await fetchTrucks();
      setRegisterForm({ plateNumber: "", truckType: "", clientName: "" });
      setIsRegisterModalOpen(false);
      setIsRegisteredModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to register truck");
    }
  };

  // ---------- Add Truck ----------
 const handleAddChange = (e) => {
  const { name, value } = e.target;

  // Special handler for selecting a truck
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
    // Reset dependent fields when client changes
    if (name === "clientName") {
      return {
        ...prev,
        clientName: value,
        id: "",
        truckType: "",
        plateNumber: "",
      };
    }

    return {
      ...prev,
      [name]: value,
    };
  });
};

const handleAddSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("http://localhost:5000/api/add-truck", addForm);
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
      timeIn: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (err) {
    console.error(err);
  }
};




  // ---------- Time Out ----------
  const handleTimeOut = async (truck) => {
    try {
      const timeout = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await axios.put(`http://localhost:5000/api/trucks/${truck.id}/timeout`, { timeOut: timeout });
      setTrucks((prev) =>
        prev.map((t) => (t.id === truck.id ? { ...t, timeOut: timeout } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Edit ----------
  const handleEditOpen = (truck) => setEditModal({ open: true, truck });
  const handleEditClose = () => setEditModal({ open: false, truck: null });
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
      await axios.put(`http://localhost:5000/api/trucks/${editModal.truck.id}`, {
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

  // ---------- Delete ----------
  const handleDeleteOpen = (id) => setDeleteModal({ open: true, truckId: id });
  const handleDeleteClose = () => setDeleteModal({ open: false, truckId: null });
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/trucks/${deleteModal.truckId}`);
      setTrucks((prev) => prev.filter((t) => t.id !== deleteModal.truckId));
      handleDeleteClose();
    } catch (err) {
      console.error(err);
    }
  };

  const occupiedBays = trucks.filter((t) => !t.timeOut).map((t) => t.bay);

  // ---------- Filtered Trucks ----------
  const filteredTrucks = trucks.filter((truck) => {
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

  // ---------- Export CSV ----------
  const exportCompleteCSV = () => {
    const rows = trucks
      .filter((t) =>
        filterDate
          ? new Date(t.date).toDateString() === new Date(filterDate).toDateString()
          : true
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

  // ---------- JSX Return ----------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Logo */}
      <div className="flex items-center mb-4">
        <img src="/logo4.png" alt="Logo" className="h-12 w-12 mr-3 object-contain" />
        <h1 className="text-2xl font-bold text-gray-800">Truck Management</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          Register Truck
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          Add Truck
        </button>
        <button
          onClick={() => setIsRegisteredModalOpen(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          View Registered Trucks
        </button>
        <button
          onClick={() => setIsCompleteListModalOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          View Complete Trucks List
        </button>

        {/* Date Filter */}
        <div className="ml-auto flex items-center gap-2">
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            dateFormat="MMM d, yyyy"
            placeholderText="Filter by date"
            className="border p-2 rounded"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate(null)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
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
          className="w-full md:w-1/2 border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Truck Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        style={{
          maxHeight: filteredTrucks.length > 9 ? "75vh" : "auto",
          overflowY: filteredTrucks.length > 9 ? "scroll" : "visible",
        }}
      >
        {filteredTrucks.map((truck) => {
          const isActive = !truck.timeOut;
          return (
            <div
              key={truck.id}
              className="relative rounded-xl shadow-md transition transform hover:scale-105 hover:shadow-xl duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #d2dbd7ff 0%, #7aedb1ff 50%, #43c584ff 100%)",
              }}
            >
              {/* Icon */}
              <TruckIcon className="absolute right-2 bottom-2 w-20 h-20 text-green-200 opacity-20 pointer-events-none" />

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                {!truck.timeOut && (
                  <button
                    onClick={() => handleTimeOut(truck)}
                    className="p-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-sm transition"
                  >
                    <ClockIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEditOpen(truck)}
                  className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOpen(truck.id)}
                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col justify-between h-full space-y-3">
                <span
                  className={`inline-block px-3 py-1 mb-1 text-xs font-semibold rounded-full shadow-sm ${
                    isActive
                      ? "bg-green-500 text-white shadow-green-300"
                      : "bg-gray-400 text-white shadow-gray-300"
                  }`}
                >
                  {isActive ? "Active" : "Completed"}
                </span>

                <h2 className="text-green-800 font-bold text-base md:text-lg truncate">{truck.clientName}</h2>

                <div className="grid grid-cols-2 gap-2 text-green-700 text-sm">
  <p className="flex items-center gap-1">
    <TruckIcon className="w-4 h-4 text-green-600" />
    <span className="font-semibold">Plate:</span> {truck.plateNumber}
  </p>
  <p className="flex items-center gap-1">
    <ArchiveBoxIcon className="w-4 h-4 text-green-600" />
    <span className="font-semibold">Bay:</span> {truck.bay}
  </p>
  <p className="flex items-center gap-1">
    <UserIcon className="w-4 h-4 text-green-600" />
    <span className="font-semibold">Driver:</span> {truck.driver}
  </p>
  <p className="flex items-center gap-1">
    <ClipboardDocumentListIcon className="w-4 h-4 text-green-600" />
    <span className="font-semibold">Purpose:</span> {truck.purpose}
  </p>
  <p className="flex items-center gap-1">
    <TruckIcon className="w-4 h-4 text-green-600" />
    <span className="font-semibold">Type:</span> {truck.truckType}
  </p>
</div>


                <div className="border-t border-green-200/50"></div>

                <div className="grid grid-cols-2 gap-2 text-green-700 text-sm">
                  <p className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">Date:</span>{" "}
                    {new Date(truck.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">Time In:</span> {truck.timeIn}
                  </p>
                  {truck.timeOut && (
                    <p className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">Time Out:</span> {truck.timeOut}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <DeleteTruckModal
        open={deleteModal.open}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        truck={trucks.find((t) => t.id === deleteModal.truckId)}
      />

      <EditTruckModal
        open={editModal.open}
        onClose={handleEditClose}
        truck={editModal.truck}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        bays={allBays}
        occupiedBays={occupiedBays}
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
      />

      <RegisterTruckModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        form={registerForm}
        onChange={handleRegisterChange}
        onSubmit={handleRegisterSubmit}
      />

      <RegisteredTrucksModal
        open={isRegisteredModalOpen}
        onClose={() => setIsRegisteredModalOpen(false)}
        trucks={trucks}
        clientName={registerForm.clientName}
      />
    </div>
  );
}
