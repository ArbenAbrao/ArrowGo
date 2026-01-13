// src/Pages/Visitors.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import AddVisitorModal from "../Components/Visitors/AddVisitorModal";
import EditVisitorModal from "../Components/Visitors/EditVisitorModal";
import DeleteVisitorModal from "../Components/Visitors/DeleteVisitorModal";
import AppointmentRequestsModal from "../Components/Visitors/AppointmentRequestsModal";
import CompleteVisitorsListModal from "../Components/Visitors/CompleteVisitorsListModal.jsx";

import {
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  TagIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function Visitors({ darkMode }) {
  // ---------- States ----------
  const [visitors, setVisitors] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, visitorId: null });
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(null);

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
    timeIn: "",
    timeOut: "",
    appointmentRequest: false,
  });

  // ---------- Styles ----------
  const containerBg = darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-900";
  const inputBg = darkMode
    ? "bg-gray-700 text-gray-100 border-gray-600"
    : "bg-white text-black border-gray-300";

  // ---------- Fetch Visitors ----------
  const fetchVisitors = async () => {
    try {
      const res = await axios.get("/api/visitors");
      setVisitors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  // ---------- Handlers ----------
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm({ ...addForm, [name]: value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/visitors/add", addForm);
      setVisitors((prev) => [res.data, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOpen = (visitor) => setEditModal({ open: true, visitor });
  const handleEditClose = () => setEditModal({ open: false, visitor: null });
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal((prev) => ({ ...prev, visitor: { ...prev.visitor, [name]: value } }));
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `/api/visitors/${editModal.visitor.id}`,
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

  const handleTimeOut = async (visitor) => {
    const updated = { ...visitor, timeOut: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    try {
      await axios.put(`/api/visitors/${visitor.id}`, updated);
      setVisitors((prev) => prev.map((v) => (v.id === visitor.id ? updated : v)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOpen = (id) => setDeleteModal({ open: true, visitorId: id });
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/visitors/${deleteModal.visitorId}`);
      setVisitors((prev) => prev.filter((v) => v.id !== deleteModal.visitorId));
      setDeleteModal({ open: false, visitorId: null });
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Appointment Requests ----------
  const appointmentRequests = visitors.filter((v) => v.appointmentRequest);
  const acceptAppointment = async (visitor) => {
    try {
      setProcessingId(visitor.id);
      const updated = { ...visitor, appointmentRequest: false, timeIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const res = await axios.put(`/api/visitors/${visitor.id}`, updated);
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
      await axios.delete(`/api/visitors/${visitorId}`);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  // ---------- Export CSV ----------
  const exportCompleteCSV = () => {
    const rows = visitors.filter((v) => v.timeOut).sort((a, b) => new Date(a.date) - new Date(b.date));
    const csvContent = "data:text/csv;charset=utf-8," + [
      "Visitor Name,Company,Person To Visit,Purpose,Date,Time In,Time Out",
      ...rows.map((v) =>
        [v.visitorName, v.company, v.personToVisit, v.purpose, new Date(v.date).toLocaleDateString(), v.timeIn, v.timeOut].join(",")
      )
    ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `completed_visitors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Filter + Pagination ----------
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch = v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) || v.personToVisit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(v.date).toDateString() === new Date(filterDate).toDateString() : true;
    const isActive = !v.timeOut;
    return !v.appointmentRequest && isActive && matchesSearch && matchesDate;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

   return (
    <div className={`p-4 md:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <div className="flex items-center mb-4 gap-3">
    <img src="/logo4.png" alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <h1 className={`text-2xl font-bold ${darkMode ? "text-cyan-400 drop-shadow-lg" : "text-green-500 drop-shadow-lg"} animate-pulse`}>
      Visitors Management
    </h1>
  </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className={`px-4 py-2 rounded-lg text-white transition-all duration-300 
              ${darkMode 
                ? "bg-yellow-500 hover:bg-yellow-600 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]" 
                : "bg-yellow-400 hover:bg-yellow-500 hover:shadow-[0_0_15px_rgba(250,204,21,0.7)]"}
            `}
          >
            Appointment Requests ({appointmentRequests.length})
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2 rounded-lg text-white transition-all duration-300
              ${darkMode 
                ? "bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(59,130,246,0.7)]" 
                : "bg-blue-500 hover:bg-blue-600 hover:shadow-[0_0_15px_rgba(59,130,246,0.7)]"}
            `}
          >
            Add Visitor
          </button>

          <button
            onClick={() => setIsCompleteListModalOpen(true)}
            className={`px-4 py-2 rounded-lg text-white transition-all duration-300
              ${darkMode 
                ? "bg-indigo-500 hover:bg-indigo-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)]" 
                : "bg-indigo-500 hover:bg-indigo-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)]"}
            `}
          >
            View Completed Visitors
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <input
          className={`border p-2 rounded flex-1 max-w-full sm:max-w-xs w-full transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-green-400 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
            ${inputBg}`}
          placeholder="Search visitor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DatePicker
          selected={filterDate}
          onChange={(date) => setFilterDate(date)}
          placeholderText="Filter date"
          className={`border p-2 rounded w-full sm:w-auto transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-green-400 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
            ${inputBg}`}
        />
      </div>

      {/* Visitors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentVisitors.map((visitor) => {
          const isActive = !visitor.timeOut;

          return (
            <div
              key={visitor.id}
              className={`relative rounded-xl p-6 min-h-[240px] w-full flex flex-col justify-between 
                transition-transform duration-300 transform hover:scale-105
                ${darkMode 
                  ? "bg-gray-900 text-gray-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]"
                  : "bg-green-900 text-green-100 shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.6)]"
                }
              `}
            >
              {/* Background Icon */}
              <UserIcon
                className={`absolute right-3 bottom-3 w-20 h-20 opacity-15 pointer-events-none ${darkMode ? "text-cyan-400" : "text-green-300"}`}
              />

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex gap-2 z-30 flex-wrap">
                {!visitor.timeOut && !visitor.appointmentRequest && (
                  <button
                    onClick={() => handleTimeOut(visitor)}
                    className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#facc15]"
                    title="Time Out"
                  >
                    <ClockIcon className="w-4 h-4" />
                  </button>
                )}
                {!visitor.appointmentRequest && (
                  <>
                    <button
                      onClick={() => handleEditOpen(visitor)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#3b82f6]"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                onClick={() => handleDeleteOpen(visitor.id)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_12px_#ef4444]"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
                  </>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full w-fit mb-2
                  ${visitor.appointmentRequest 
                    ? "bg-yellow-500 text-white shadow-[0_0_6px_rgba(250,204,21,0.7)] animate-pulse"
                    : isActive
                    ? "bg-green-500 text-white shadow-[0_0_6px_rgba(34,197,94,0.7)] animate-pulse"
                    : "bg-gray-400 text-white shadow-[0_0_6px_rgba(156,163,175,0.7)]"
                  }
                `}
              >
                {visitor.appointmentRequest
                  ? "Appointment Request"
                  : isActive
                  ? "Active"
                  : "Completed"}
              </span>

              {/* Visitor Name */}
              <h2 className={`font-bold text-lg truncate mt-1 ${darkMode ? "text-cyan-400" : "text-green-200"}`}>
                {visitor.visitorName}
              </h2>

              {/* Visitor Info */}
              <div className={`grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-2 gap-y-1 mt-2 text-sm ${darkMode ? "text-gray-300" : "text-green-100"}`}>
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
              <div className={`border-t my-2 ${darkMode ? "border-gray-700" : "border-green-200/50"}`}></div>

              {/* Date & Time */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm ${darkMode ? "text-gray-300" : "text-green-100"}`}>
                <p className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span className="font-semibold">Date:</span>{" "}
                  {visitor.date ? new Date(visitor.date).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }) : "--"}
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
      {/* MODALS */}
      <AppointmentRequestsModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentRequests={appointmentRequests}
        acceptAppointment={acceptAppointment}
        rejectAppointment={rejectAppointment}
        processingId={processingId}
        darkMode={darkMode}

      />
      <AddVisitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        form={addForm}
        onChange={handleAddChange}
        onSubmit={handleAddSubmit}
        darkMode={darkMode}

      />
      <EditVisitorModal
        isOpen={editModal.open}
        onClose={handleEditClose}
        visitor={editModal.visitor}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit} 
        darkMode={darkMode}

      />
      <DeleteVisitorModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, visitorId: null })}
        onConfirm={handleDeleteConfirm} // <- fixed
        darkMode={darkMode}

      />
      <CompleteVisitorsListModal
        isOpen={isCompleteListModalOpen}
        onClose={() => setIsCompleteListModalOpen(false)}
        visitors={visitors.filter((v) => v.timeOut)}
        exportCSV={exportCompleteCSV}
        darkMode={darkMode}

      />
    </div>
  );
}
