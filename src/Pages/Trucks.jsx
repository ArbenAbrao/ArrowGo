// src/Pages/Trucks.jsx
import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const [truckTypes, setTruckTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, truck: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, truckId: null });
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [registerForm, setRegisterForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
  });

  const [addForm, setAddForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
    bay: "",
    driver: "",
    purpose: "",
    date: new Date(),
    timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const allBays = Array.from({ length: 10 }, (_, i) => [`${i + 1}a`, `${i + 1}b`]).flat();

  // ---------- Fetch Data ----------
  const fetchTrucks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/trucks");
      setTrucks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTruckTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/truck-types");
      setTruckTypes(res.data);
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
    fetchTruckTypes();
    fetchClients();
  }, []);

  // ---------- Register ----------
  const handleRegisterChange = (e) =>
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/register-truck", registerForm);
      fetchClients();
      setIsRegisterModalOpen(false);
      setRegisterForm({ plateNumber: "", truckType: "", clientName: "" });
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Add Truck ----------
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...addForm, [name]: value };

    if (name === "clientName") {
      updatedForm.truckType = "";
      updatedForm.plateNumber = "";
    }

    if (name === "truckType" || name === "clientName") {
      const truck = clients.find(
        (c) => c.clientName === updatedForm.clientName && c.truckType === updatedForm.truckType
      );
      updatedForm.plateNumber = truck ? truck.plateNumber : "";
    }

    setAddForm(updatedForm);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add-truck", addForm);
      fetchTrucks();
      setIsAddModalOpen(false);
      setAddForm({
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

  // ---------- Filter Trucks by Date and Search ----------
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


{/* ===================== REGISTERED TRUCKS TABLE MODAL ===================== */}
const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
const [selectedClient, setSelectedClient] = useState("");


const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
const [completeFilterDate, setCompleteFilterDate] = useState(null);

const exportCompleteCSV = () => {
  const rows = trucks
    .filter((t) =>
      completeFilterDate
        ? new Date(t.date).toDateString() === new Date(completeFilterDate).toDateString()
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


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Logo and Buttons */}
      <div className="flex items-center mb-4">
        <img src="/logo4.png" alt="Logo" className="h-12 w-12 mr-3 object-contain" />
        <h1 className="text-2xl font-bold text-gray-800">Truck Management</h1>
      </div>

      {/* Actions */}
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
        {/* Button to Open Registered Trucks Modal */}
{/* Button to Open Registered Trucks Modal */}
<button
  onClick={() => setIsRegisteredModalOpen(true)}
  className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-medium transition"
>
  View Registered Trucks
</button>

 {/* ---------- NEW BUTTON: View Complete Trucks List ---------- */}
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

{/* ---------- Truck Cards with Minimalist Action Buttons ---------- */}
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
        {/* Decorative Icon */}
        <TruckIcon className="absolute right-2 bottom-2 w-20 h-20 text-green-200 opacity-20 pointer-events-none" />

        {/* Minimalist Action Buttons */}
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

        {/* Card Content */}
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


      {/* Keep all your existing Modals here (Register, Add, Edit, Delete) */}
       {/* ===================== DELETE MODAL ===================== */}
<Transition appear show={deleteModal.open} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={handleDeleteClose}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-t-2xl">
              <TrashIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">Delete Truck</Dialog.Title>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-gray-700">
              <p className="mb-4">
                Are you sure you want to delete the truck{" "}
                <span className="font-bold text-red-500">
                  {trucks.find((t) => t.id === deleteModal.truckId)?.plateNumber || ""}
                </span>{" "}
                for client{" "}
                <span className="font-bold">
                  {trucks.find((t) => t.id === deleteModal.truckId)?.clientName || ""}
                </span>
                ?
              </p>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleDeleteClose}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>

{/* ===================== EDIT MODAL ===================== */}
<Transition appear show={editModal.open} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={handleEditClose}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-t-2xl">
              <PencilIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">Edit Truck</Dialog.Title>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-gray-700">
              {editModal.truck && (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <input
                    type="text"
                    name="driver"
                    placeholder="Driver Name"
                    value={editModal.truck.driver}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  <input
                    type="text"
                    name="purpose"
                    placeholder="Purpose"
                    value={editModal.truck.purpose}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                  />
                  <select
                    name="bay"
                    value={editModal.truck.bay}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Select Bay</option>
                    {allBays.map((b) => (
                      <option
                        key={b}
                        value={b}
                        disabled={occupiedBays.includes(b) && b !== editModal.truck.bay}
                      >
                        {b} {occupiedBays.includes(b) && b !== editModal.truck.bay ? "(Occupied)" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleEditClose}
                      className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition">
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>

{/* ===================== REGISTER MODAL ===================== */}
<Transition appear show={isRegisterModalOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={() => setIsRegisterModalOpen(false)}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-t-2xl">
              <TruckIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">Register Truck</Dialog.Title>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-gray-700">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <input
                  type="text"
                  name="plateNumber"
                  placeholder="Plate Number"
                  value={registerForm.plateNumber}
                  onChange={handleRegisterChange}
                  className="border p-2 w-full rounded"
                  required
                />
                <input
                  type="text"
                  name="truckType"
                  placeholder="Truck Type"
                  value={registerForm.truckType}
                  onChange={handleRegisterChange}
                  className="border p-2 w-full rounded"
                  required
                />
                <input
                  type="text"
                  name="clientName"
                  placeholder="Client Name"
                  value={registerForm.clientName}
                  onChange={handleRegisterChange}
                  className="border p-2 w-full rounded"
                  required
                />

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition">
                    Register
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>

{/* ===================== ADD MODAL ===================== */}
<Transition appear show={isAddModalOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={() => setIsAddModalOpen(false)}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-t-2xl">
              <TruckIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">Add Truck</Dialog.Title>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-gray-700">
              <form onSubmit={handleAddSubmit} className="space-y-3">
                {/* --- Client Name Dropdown --- */}
                <select
                  name="clientName"
                  value={addForm.clientName}
                  onChange={handleAddChange}
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="">Select Client</option>
                  {Array.from(new Set(clients.map((c) => c.clientName))).map((client, idx) => (
                    <option key={idx} value={client}>
                      {client}
                    </option>
                  ))}
                </select>

                {/* --- Truck Type Dropdown --- */}
                <select
                  name="truckType"
                  value={addForm.truckType}
                  onChange={handleAddChange}
                  className="border p-2 w-full rounded"
                  required
                  disabled={!addForm.clientName}
                >
                  <option value="">Select Truck Type</option>
                  {addForm.clientName &&
                    clients
                      .filter((c) => c.clientName === addForm.clientName)
                      .map((c) => c.truckType)
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map((type, idx) => (
                        <option key={idx} value={type}>
                          {type}
                        </option>
                      ))}
                </select>

                {/* --- Plate Number (Read Only) --- */}
                <input
                  type="text"
                  name="plateNumber"
                  value={addForm.plateNumber}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                  placeholder="Plate Number will auto-fill"
                />

                {/* --- Bay Dropdown --- */}
                <select
                  name="bay"
                  value={addForm.bay}
                  onChange={handleAddChange}
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="">Select Bay</option>
                  {allBays.map((b) => (
                    <option key={b} value={b} disabled={occupiedBays.includes(b)}>
                      {b} {occupiedBays.includes(b) ? "(Occupied)" : ""}
                    </option>
                  ))}
                </select>

                {/* --- Driver --- */}
                <input
                  type="text"
                  name="driver"
                  placeholder="Driver Name"
                  value={addForm.driver}
                  onChange={handleAddChange}
                  className="border p-2 w-full rounded"
                  required
                />

                {/* --- Purpose --- */}
                <input
                  type="text"
                  name="purpose"
                  placeholder="Purpose"
                  value={addForm.purpose}
                  onChange={handleAddChange}
                  className="border p-2 w-full rounded"
                />

                {/* --- Modal Actions --- */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Add Truck
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>


{/* ===================== VIEW TRUCK MODAL ===================== */}

<Transition appear show={isRegisteredModalOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={() => setIsRegisteredModalOpen(false)}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-t-2xl">
              <TruckIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">Registered Trucks</Dialog.Title>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-gray-700">
              {/* Filter by Client */}
              <div className="mb-4">
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="border p-2 rounded w-full md:w-1/2"
                >
                  <option value="">All Clients</option>
                  {Array.from(new Set(trucks.map((t) => t.clientName))).map((client, idx) => (
                    <option key={idx} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trucks Table */}
              <div className="overflow-x-auto">
               <table className="min-w-full border border-gray-200">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-2 text-left text-sm font-semibold border-b">Client</th>
        <th className="px-4 py-2 text-left text-sm font-semibold border-b">Truck Type</th>
        <th className="px-4 py-2 text-left text-sm font-semibold border-b">Plate Number</th>
      </tr>
    </thead>
    <tbody>
      {Array.from(
        new Set(
          trucks
            .filter((t) => (selectedClient ? t.clientName === selectedClient : true))
            .map((t) => `${t.clientName}|${t.truckType}|${t.plateNumber}`)
        )
      )
        .map((key) => {
          const [clientName, truckType, plateNumber] = key.split("|");
          return { clientName, truckType, plateNumber };
        })
        .sort((a, b) => {
          // Sort by Client Name → Truck Type → Plate Number
          if (a.clientName !== b.clientName) return a.clientName.localeCompare(b.clientName);
          if (a.truckType !== b.truckType) return a.truckType.localeCompare(b.truckType);
          return a.plateNumber.localeCompare(b.plateNumber);
        })
        .map((truck, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
            <td className="px-4 py-2 border-b">{truck.clientName}</td>
            <td className="px-4 py-2 border-b">{truck.truckType}</td>
            <td className="px-4 py-2 border-b">{truck.plateNumber}</td>
          </tr>
        ))}
    </tbody>
  </table>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsRegisteredModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>


{/* ===================== COMPLETE TRUCKS LIST MODAL ===================== */}
<Transition appear show={isCompleteListModalOpen} as={Fragment}>
  <Dialog
    as="div"
    className="relative z-50"
    onClose={() => setIsCompleteListModalOpen(false)}
  >
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-t-2xl">
              <TruckIcon className="w-6 h-6" />
              <Dialog.Title className="text-lg font-semibold">
                Complete Trucks List
              </Dialog.Title>
            </div>

            {/* Filters & Export */}
            <div className="p-6 text-gray-700 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                
                {/* Client Filter */}
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="border p-2 rounded w-full md:w-1/3"
                >
                  <option value="">All Clients</option>
                  {Array.from(new Set(trucks.map((t) => t.clientName))).map((client, idx) => (
                    <option key={idx} value={client}>
                      {client}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <DatePicker
                    selected={completeFilterDate}
                    onChange={(date) => setCompleteFilterDate(date)}
                    dateFormat="MMM d, yyyy"
                    placeholderText="Filter by date"
                    className="border p-2 rounded w-full md:w-auto"
                  />
                  {completeFilterDate && (
                    <button
                      onClick={() => setCompleteFilterDate(null)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* CSV Export */}
                <button
                  onClick={exportCompleteCSV}
                  className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition mt-2 md:mt-0"
                >
                  Export CSV
                </button>
              </div>

              {/* Trucks Table */}
              <div className="overflow-x-auto max-h-[60vh] border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {["Client", "Truck Type", "Plate Number", "Bay", "Driver", "Purpose", "Date", "Time In", "Time Out"].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {trucks
                      .filter((t) =>
                        selectedClient ? t.clientName === selectedClient : true
                      )
                      .filter((t) =>
                        completeFilterDate
                          ? new Date(t.date).toDateString() ===
                            new Date(completeFilterDate).toDateString()
                          : true
                      )
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((truck, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{truck.clientName}</td>
                          <td className="px-4 py-2">{truck.truckType}</td>
                          <td className="px-4 py-2">{truck.plateNumber}</td>
                          <td className="px-4 py-2">{truck.bay}</td>
                          <td className="px-4 py-2">{truck.driver}</td>
                          <td className="px-4 py-2">{truck.purpose}</td>
                          <td className="px-4 py-2">
                            {new Date(truck.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-2">{truck.timeIn}</td>
                          <td className="px-4 py-2">{truck.timeOut || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setIsCompleteListModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>

          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>


    </div>
  );
}
