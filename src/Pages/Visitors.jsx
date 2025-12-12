// src/Pages/Visitors.jsx
import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import {
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  PencilIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  TagIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, visitorId: null });
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAppointments, setShowAppointments] = useState(false);

  // Appointment modal state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [addForm, setAddForm] = useState({
    visitorName: "",
    company: "",
    personToVisit: "",
    purpose: "",
    idType: "",
    idNumber: "",
    badgeNumber: "",
    vehicleMode: "On Foot",
    vehicleDetails: "",
    date: new Date().toISOString().split("T")[0],
    timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timeOut: "",
    appointmentRequest: false,
  });

  // Fetch Visitors
  const fetchVisitors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/visitors");
      setVisitors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);


  const [appointmentFilterDate, setAppointmentFilterDate] = useState(null);


  // ----- Add Visitor Handlers -----
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm({ ...addForm, [name]: value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/visitors/add", addForm);
      setVisitors((prev) => [res.data, ...prev]);
      setIsAddModalOpen(false);
      setAddForm({
        visitorName: "",
        company: "",
        personToVisit: "",
        purpose: "",
        idType: "",
        idNumber: "",
        badgeNumber: "",
        vehicleMode: "On Foot",
        vehicleDetails: "",
        date: new Date().toISOString().split("T")[0],
        timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timeOut: "",
        appointmentRequest: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ----- Edit Visitor Handlers -----
  const handleEditOpen = (visitor) => setEditModal({ open: true, visitor });
  const handleEditClose = () => setEditModal({ open: false, visitor: null });

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal((prev) => ({
      ...prev,
      visitor: { ...prev.visitor, [name]: value },
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `http://localhost:5000/api/visitors/${editModal.visitor.id}`,
        editModal.visitor
      );
      setVisitors((prev) =>
        prev.map((v) => (v.id === editModal.visitor.id ? res.data : v))
      );
      handleEditClose();
    } catch (err) {
      console.error(err);
    }
  };

  // ----- Time Out -----
  const handleTimeOut = async (visitor) => {
    const updatedVisitor = {
      ...visitor,
      timeOut: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    try {
      await axios.put(`http://localhost:5000/api/visitors/${visitor.id}`, updatedVisitor);
      setVisitors((prev) => prev.map((v) => (v.id === visitor.id ? updatedVisitor : v)));
    } catch (err) {
      console.error(err);
    }
  };

  // ----- Delete Visitor -----
  const handleDeleteOpen = (id) => setDeleteModal({ open: true, visitorId: id });
  const handleDeleteClose = () => setDeleteModal({ open: false, visitorId: null });

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/visitors/${deleteModal.visitorId}`);
      setVisitors((prev) => prev.filter((v) => v.id !== deleteModal.visitorId));
      handleDeleteClose();
    } catch (err) {
      console.error(err);
    }
  };

  // ----- Appointment modal actions -----
  const appointmentRequests = visitors.filter((v) => v.appointmentRequest);

  const acceptAppointment = async (visitor) => {
    try {
      setProcessingId(visitor.id);

      // Set current time as Time In
      const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const updated = { ...visitor, appointmentRequest: false, timeIn: currentTime };

      const res = await axios.put(`http://localhost:5000/api/visitors/${visitor.id}`, updated);
      setVisitors((prev) => prev.map((v) => (v.id === visitor.id ? res.data : v)));
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  const rejectAppointment = async (visitorId) => {
    try {
      setProcessingId(visitorId);
      await axios.delete(`http://localhost:5000/api/visitors/${visitorId}`);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  // ----- Filter & Search -----
  const filteredVisitors = visitors.filter((visitor) => {
    if (showAppointments && !visitor.appointmentRequest) return false;
    if (!showAppointments && visitor.appointmentRequest) return false;

    const matchesDate = filterDate
      ? new Date(visitor.date).toDateString() === new Date(filterDate).toDateString()
      : true;

    const matchesSearch =
      (visitor.visitorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.personToVisit || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.idNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  // ----- Pagination -----
  const indexOfLastVisitor = currentPage * itemsPerPage;
  const indexOfFirstVisitor = indexOfLastVisitor - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstVisitor, indexOfLastVisitor);
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  const openAppointmentModal = () => setIsAppointmentModalOpen(true);
  const closeAppointmentModal = () => setIsAppointmentModalOpen(false);
  const appointmentsCount = appointmentRequests.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserIcon className="h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-800">Visitor Management</h1>
        </div>
        {/* Appointment Button */}
        <button
          onClick={openAppointmentModal}
          className="relative flex items-center gap-2 px-4 py-2 rounded font-medium transition bg-gray-200 text-gray-800 hover:bg-gray-250"
        >
          <BellIcon className="w-5 h-5" />
          Appointment Requests
          {appointmentsCount > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {appointmentsCount}
            </span>
          )}
        </button>
      </div>

      {/* Controls */}
      {!showAppointments && (
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition"
          >
            Add Visitor
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder={`Search visitors...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
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

      {/* Visitor / Appointment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentVisitors.map((visitor) => {
          const isActive = !visitor.timeOut;
          return (
            <div
              key={visitor.id}
              className="relative rounded-xl shadow-md transition transform hover:scale-105 hover:shadow-xl duration-300 overflow-hidden flex flex-col justify-between p-6 min-h-[240px] w-full"
              style={{
                background: visitor.appointmentRequest
                  ? "linear-gradient(135deg, #fff4e3 0%, #ffdc9d 50%, #f2b84c 100%)"
                  : "linear-gradient(135deg, #e3f2ed 0%, #9df2c5 50%, #4cc89b 100%)",
              }}
            >
              {/* KEEP ALL DISPLAY CONTENT THE SAME */}
              <UserIcon className="absolute right-3 bottom-3 w-20 h-20 text-green-200 opacity-20 pointer-events-none" />

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-2 z-30">
                {!visitor.timeOut && !visitor.appointmentRequest && (
                  <button
                    onClick={() => handleTimeOut(visitor)}
                    className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow transition"
                    title="Time Out"
                  >
                    <ClockIcon className="w-4 h-4" />
                  </button>
                )}
                {!visitor.appointmentRequest && (
                  <>
                    <button
                      onClick={() => handleEditOpen(visitor)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow transition"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOpen(visitor.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full shadow-sm w-fit ${
                  visitor.appointmentRequest
                    ? "bg-yellow-500 text-white shadow-yellow-300 animate-pulse"
                    : isActive
                    ? "bg-green-500 text-white shadow-green-300 animate-pulse"
                    : "bg-gray-400 text-white shadow-gray-300"
                }`}
              >
                {visitor.appointmentRequest
                  ? "Appointment Request"
                  : isActive
                  ? "Active"
                  : "Completed"}
              </span>

              {/* Visitor Name */}
              <h2 className="text-green-800 font-bold text-lg truncate mt-1">{visitor.visitorName}</h2>

              {/* Visitor Info Grid */}
              <div className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-1 mt-2 text-green-800 text-sm">
                <p className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-semibold">From:</span>
                </p>
                <p>{visitor.company}</p>

                <p className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-semibold">Person:</span>
                </p>
                <p>{visitor.personToVisit}</p>

                <p className="flex items-center gap-1">
                  <ClipboardDocumentListIcon className="w-4 h-4" />
                  <span className="font-semibold">Purpose:</span>
                </p>
                <p>{visitor.purpose}</p>

                {!visitor.appointmentRequest && (
                  <>
                    <p className="flex items-center gap-1">
                      <IdentificationIcon className="w-4 h-4" />
                      <span className="font-semibold">ID:</span>
                    </p>
                    <p>{visitor.idType} - {visitor.idNumber}</p>

                    <p className="flex items-center gap-1">
                      <TagIcon className="w-4 h-4" />
                      <span className="font-semibold">Badge:</span>
                    </p>
                    <p>{visitor.badgeNumber}</p>

                    <p className="flex items-center gap-1">
                      <TruckIcon className="w-4 h-4" />
                      <span className="font-semibold">Vehicle:</span>
                    </p>
                    <p>{visitor.vehicleMode} {visitor.vehicleDetails && `(${visitor.vehicleDetails})`}</p>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-green-200/50 my-2"></div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-3 gap-2 text-green-800 text-sm">
                <p className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span className="font-semibold">Date:</span>{" "}
                  {visitor.date
                    ? new Date(visitor.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "--"}
                </p>
                <p className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-semibold">Time In:</span> {visitor.timeIn || "--"}
                </p>
                {!visitor.appointmentRequest && (
                  <p className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="font-semibold">Time Out:</span> {visitor.timeOut || "--"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- Pagination Controls ---------- */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 ? "bg-green-500 text-white" : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

{/* ---------- Modern Appointment Requests Modal with Hover Animation ---------- */}
<Transition appear show={isAppointmentModalOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={closeAppointmentModal}>
    <Transition.Child
      as={Fragment}
      enter="transition ease-out duration-300"
      enterFrom="opacity-0 -translate-y-4 scale-95"
      enterTo="opacity-100 translate-y-0 scale-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0 scale-100"
      leaveTo="opacity-0 -translate-y-4 scale-95"
    >
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-3xl">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
            <div className="flex items-center gap-3">
              <BellIcon className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Appointment Requests</h3>
              <span className="text-sm opacity-80">({appointmentsCount})</span>
            </div>

            {/* Date Filter inside modal */}
            <div className="flex items-center gap-2 mt-2 md:mt-0">
<DatePicker
  selected={appointmentFilterDate}
  onChange={(date) => setAppointmentFilterDate(date)}
  placeholderText="Filter by date"
  dateFormat="MMM d, yyyy"
  className="border p-2 rounded text-gray-800"
  popperProps={{
    strategy: 'fixed',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
          padding: 8,
        },
      },
    ],
  }}
/>

              {appointmentFilterDate && (
                <button
                  onClick={() => setAppointmentFilterDate(null)}
                  className="px-3 py-1 bg-yellow-600/30 rounded hover:bg-yellow-600/50 transition"
                >
                  Clear
                </button>
              )}
              <button
                onClick={closeAppointmentModal}
                className="px-3 py-1 bg-yellow-600/30 rounded-lg hover:bg-yellow-600/50 transition"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {appointmentRequests.filter((v) =>
              appointmentFilterDate
                ? new Date(v.date).toDateString() === new Date(appointmentFilterDate).toDateString()
                : true
            ).length === 0 ? (
              <p className="text-center text-gray-400 py-6">
                No appointment requests for selected date.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {appointmentRequests
                  .filter((v) =>
                    appointmentFilterDate
                      ? new Date(v.date).toDateString() === new Date(appointmentFilterDate).toDateString()
                      : true
                  )
                  .map((visitor) => (
                    <div
                      key={visitor.id}
                      className="bg-white border border-gray-200 shadow-lg rounded-2xl p-5 flex flex-col justify-between
                                 transform transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
                    >
                      {/* Visitor Info */}
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-800 truncate">
                          {visitor.visitorName}
                        </h2>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Appointment
                        </span>
                      </div>
                      <div className="space-y-1 text-gray-700 text-sm">
                        <p>
                          <span className="font-semibold text-gray-900">Company:</span>{" "}
                          {visitor.company}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Person:</span>{" "}
                          {visitor.personToVisit}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Purpose:</span>{" "}
                          {visitor.purpose}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Date:</span>{" "}
                          {new Date(visitor.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Time:</span>{" "}
                          {visitor.timeIn}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          onClick={() => rejectAppointment(visitor.id)}
                          disabled={processingId === visitor.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition"
                        >
                          <XMarkIcon className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => acceptAppointment(visitor)}
                          disabled={processingId === visitor.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition"
                        >
                          <CheckIcon className="w-4 h-4" /> Accept
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Transition.Child>
  </Dialog>
</Transition>


      
      {/* Add Visitor Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddModalOpen(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-30" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center gap-2 p-4 bg-blue-500 text-white rounded-t-2xl">
                  <UserIcon className="w-6 h-6" />
                  <Dialog.Title className="text-lg font-semibold">Add Visitor</Dialog.Title>
                </div>
                <div className="p-6 text-gray-700">
                  <form onSubmit={handleAddSubmit} className="space-y-3">
                    {/* Basic Inputs */}
                    <input type="text" name="visitorName" placeholder="Full Name" value={addForm.visitorName} onChange={handleAddChange} className="border p-2 w-full rounded" required />
                    <input type="text" name="company" placeholder="Company / From" value={addForm.company} onChange={handleAddChange} className="border p-2 w-full rounded" />
                    <input type="text" name="personToVisit" placeholder="Person to Visit" value={addForm.personToVisit} onChange={handleAddChange} className="border p-2 w-full rounded" />
                    <input type="text" name="purpose" placeholder="Purpose" value={addForm.purpose} onChange={handleAddChange} className="border p-2 w-full rounded" />

                    {/* ID Type & Number */}
                    <div className="grid md:grid-cols-2 gap-3">
                      <select name="idType" value={addForm.idType} onChange={handleAddChange} className="border p-2 w-full rounded" required>
                        <option value="">Select ID Type</option>
                        <option value="PhilHealth ID">PhilHealth ID</option>
                        <option value="SSS ID">SSS ID</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="TIN ID">TIN ID</option>
                        <option value="Other">Other</option>
                      </select>

                      <input type="text" name="idNumber" placeholder="ID Number" value={addForm.idNumber} onChange={handleAddChange} className="border p-2 w-full rounded" required />
                    </div>

                    {/* Badge Number Dropdown */}
                    <select name="badgeNumber" value={addForm.badgeNumber} onChange={handleAddChange} className="border p-2 w-full rounded" required>
                      <option value="">Select Badge Number</option>
                      {Array.from({ length: 15 }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>

                    {/* Vehicle Info */}
                    <div className="grid md:grid-cols-2 gap-3">
                      <select
                        name="vehicleMode"
                        value={addForm.vehicleMode}
                        onChange={handleAddChange}
                        className="border p-2 w-full rounded"
                      >
                        <option>On Foot</option>
                        <option>Truck</option>
                        <option>Company Vehicle</option>
                        <option>Private Car</option>
                        <option>Motorcycle</option>
                        <option>Other</option>
                      </select>

                      {/* Vehicle Details hidden only if On Foot */}
                      {addForm.vehicleMode !== "On Foot" && (
                        <input
                          type="text"
                          name="vehicleDetails"
                          placeholder="Vehicle Details (plate / note)"
                          value={addForm.vehicleDetails}
                          onChange={handleAddChange}
                          className="border p-2 w-full rounded"
                        />
                      )}
                    </div>

                    {/* Date only */}
                    <input type="date" name="date" value={addForm.date} onChange={handleAddChange} className="border p-2 w-full rounded" />

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                      <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">Cancel</button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                      >
                        Add Visitor
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Visitor Modal */}
      <Transition appear show={editModal.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleEditClose}>
          <div className="fixed inset-0 bg-black bg-opacity-30" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center gap-2 p-4 bg-yellow-500 text-white rounded-t-2xl">
                  <PencilIcon className="w-6 h-6" />
                  <Dialog.Title className="text-lg font-semibold">Edit Visitor</Dialog.Title>
                </div>
                <div className="p-6 text-gray-700">
                  {editModal.visitor && (
                    <form onSubmit={handleEditSubmit} className="space-y-3">
                      {/* Basic Inputs */}
                      <input type="text" name="visitorName" placeholder="Full Name" value={editModal.visitor.visitorName || ""} onChange={handleEditChange} className="border p-2 w-full rounded" required />
                      <input type="text" name="company" placeholder="Company / From" value={editModal.visitor.company || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                      <input type="text" name="personToVisit" placeholder="Person to Visit" value={editModal.visitor.personToVisit || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                      <input type="text" name="purpose" placeholder="Purpose" value={editModal.visitor.purpose || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />

                      {/* ID Type & Number */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <select name="idType" value={editModal.visitor.idType || ""} onChange={handleEditChange} className="border p-2 w-full rounded" required>
                          <option value="">Select ID Type</option>
                          <option value="PhilHealth ID">PhilHealth ID</option>
                          <option value="SSS ID">SSS ID</option>
                          <option value="Driver's License">Driver's License</option>
                          <option value="TIN ID">TIN ID</option>
                          <option value="Other">Other</option>
                        </select>
                        <input type="text" name="idNumber" placeholder="ID Number" value={editModal.visitor.idNumber || ""} onChange={handleEditChange} className="border p-2 w-full rounded" required />
                      </div>

                      {/* Badge Number Dropdown */}
                      <select name="badgeNumber" value={editModal.visitor.badgeNumber || ""} onChange={handleEditChange} className="border p-2 w-full rounded" required>
                        <option value="">Select Badge Number</option>
                        {Array.from({ length: 15 }, (_, i) => (
                          <option key={i} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>

                      {/* Vehicle Info */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <select name="vehicleMode" value={editModal.visitor.vehicleMode || "On Foot"} onChange={handleEditChange} className="border p-2 w-full rounded">
                          <option>On Foot</option>
                          <option>Truck</option>
                          <option>Company Vehicle</option>
                          <option>Private Car</option>
                          <option>Motorcycle</option>
                          <option>Other</option>
                        </select>

                        {/* Vehicle Details hidden only if On Foot */}
                        {editModal.visitor.vehicleMode !== "On Foot" && (
                          <input type="text" name="vehicleDetails" placeholder="Vehicle Details (plate / note)" value={editModal.visitor.vehicleDetails || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                        )}
                      </div>

                      {/* Date only */}
                      <input type="date" name="date" value={editModal.visitor.date ? new Date(editModal.visitor.date).toISOString().split("T")[0] : ""} onChange={handleEditChange} className="border p-2 w-full rounded" />

                      {/* Buttons */}
                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={handleEditClose} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition">Save</button>
                      </div>
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Visitor Modal */}
      <Transition appear show={deleteModal.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDeleteClose}>
          <div className="fixed inset-0 bg-black bg-opacity-30" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="p-6 text-center">
                  <Dialog.Title className="text-lg font-semibold text-gray-800">Delete Visitor?</Dialog.Title>
                  <p className="mt-2 text-gray-600">Are you sure you want to delete this visitor?</p>
                  <div className="mt-4 flex justify-center gap-4">
                    <button onClick={handleDeleteClose} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Cancel</button>
                    <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">Delete</button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
