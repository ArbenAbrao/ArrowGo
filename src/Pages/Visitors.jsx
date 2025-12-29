import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
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

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, visitorId: null });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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

  /* ================= FETCH VISITORS ================= */
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

  /* ================= ADD VISITOR ================= */
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm({ ...addForm, [name]: value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/visitors/add",
        addForm
      );
      setVisitors((prev) => [res.data, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= EDIT VISITOR ================= */
  const handleEditOpen = (visitor) =>
    setEditModal({ open: true, visitor });

  const handleEditClose = () =>
    setEditModal({ open: false, visitor: null });

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
        prev.map((v) =>
          v.id === editModal.visitor.id ? res.data : v
        )
      );
      handleEditClose();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async (visitor) => {
    const updated = {
      ...visitor,
      timeOut: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      await axios.put(
        `http://localhost:5000/api/visitors/${visitor.id}`,
        updated
      );
      setVisitors((prev) =>
        prev.map((v) => (v.id === visitor.id ? updated : v))
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= DELETE VISITOR ================= */
    const handleDeleteOpen = (id) => setDeleteModal({ open: true, visitorId: id });
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/visitors/${deleteModal.visitorId}`
      );
      setVisitors((prev) =>
        prev.filter((v) => v.id !== deleteModal.visitorId)
      );
      setDeleteModal({ open: false, visitorId: null });
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= APPOINTMENTS ================= */
  const appointmentRequests = visitors.filter(
    (v) => v.appointmentRequest
  );

  const acceptAppointment = async (visitor) => {
    try {
      setProcessingId(visitor.id);

      const updated = {
        ...visitor,
        appointmentRequest: false,
        timeIn: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const res = await axios.put(
        `http://localhost:5000/api/visitors/${visitor.id}`,
        updated
      );

      setVisitors((prev) =>
        prev.map((v) => (v.id === visitor.id ? res.data : v))
      );
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  const rejectAppointment = async (visitorId) => {
    try {
      setProcessingId(visitorId);
      await axios.delete(
        `http://localhost:5000/api/visitors/${visitorId}`
      );
      setVisitors((prev) =>
        prev.filter((v) => v.id !== visitorId)
      );
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };


const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);

// Export CSV function for completed visitors
const exportCompleteCSV = () => {
  const rows = visitors
    .filter((v) => v.timeOut)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [
      "Visitor Name,Company,Person To Visit,Purpose,Date,Time In,Time Out",
      ...rows.map((v) =>
        [
          v.visitorName,
          v.company,
          v.personToVisit,
          v.purpose,
          new Date(v.date).toLocaleDateString(),
          v.timeIn,
          v.timeOut,
        ].join(",")
      ),
    ].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `completed_visitors_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  /* ================= FILTER + PAGINATION ================= */
const filteredVisitors = visitors.filter((v) => {
  const matchesSearch =
    v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.personToVisit.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesDate = filterDate
    ? new Date(v.date).toDateString() ===
      new Date(filterDate).toDateString()
    : true;

  const isActive = !v.timeOut; // only show visitors without timeOut

  return !v.appointmentRequest && isActive && matchesSearch && matchesDate;
});

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(
    indexOfFirst,
    indexOfLast
  );

  const totalPages = Math.ceil(
    filteredVisitors.length / itemsPerPage
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visitor Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
          >
            Appointment Requests ({appointmentRequests.length})
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Add Visitor
          </button>
<button
  onClick={() => setIsCompleteListModalOpen(true)}
  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
>
  View Completed Visitors
</button>


        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          className="border p-2 rounded w-full"
          placeholder="Search visitor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DatePicker
          selected={filterDate}
          onChange={(date) => setFilterDate(date)}
          placeholderText="Filter date"
          className="border p-2 rounded"
        />
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

      {/* MODALS */}
      <AppointmentRequestsModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentRequests={appointmentRequests}
        acceptAppointment={acceptAppointment}
        rejectAppointment={rejectAppointment}
        processingId={processingId}
      />

      <AddVisitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        form={addForm}
        onChange={handleAddChange}
        onSubmit={handleAddSubmit}
      />

      <EditVisitorModal
        isOpen={editModal.open}
        onClose={handleEditClose}
        visitor={editModal.visitor}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
      />

      <DeleteVisitorModal
        isOpen={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, visitorId: null })
        }
        onConfirm={handleDeleteConfirm}
      />
      <CompleteVisitorsListModal
  isOpen={isCompleteListModalOpen}
  onClose={() => setIsCompleteListModalOpen(false)}
  visitors={visitors}
  filterDate={filterDate}
  onExport={exportCompleteCSV}
/>

    </div>
  );
}
