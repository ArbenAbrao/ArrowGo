import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

import AddVisitorModal from "../Components/Visitors/AddVisitorModal";
import EditVisitorModal from "../Components/Visitors/EditVisitorModal";
import DeleteVisitorModal from "../Components/Visitors/DeleteVisitorModal";
import AppointmentRequestsModal from "../Components/Visitors/AppointmentRequestsModal";
import CompleteVisitorsListModal from "../Components/Visitors/CompleteVisitorsListModal.jsx";
import VisitorsHeader from "../Components/Visitors/VisitorsHeader";
import VisitorsGrid from "../Components/Visitors/VisitorsGrid";
import VisitorsPagination from "../Components/Visitors/VisitorsPagination";

export default function Visitors({ darkMode }) {
  /* ================= STATES ================= */
  const [visitors, setVisitors] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, visitorId: null });
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(""); // NEW STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const badgeNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
  const branches = ["Marilao", "Taguig", "Palawan", "Davao", "Cebu"];

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
    branch: "",
    date: "",
    timeIn: "",
    timeOut: "",
  });

  /* ================= STYLES ================= */
  const containerBg = darkMode
    ? "bg-gray-800 text-gray-300"
    : "bg-gray-50 text-gray-900";

  const inputBg = darkMode
    ? "bg-gray-700 text-gray-100 border-gray-600"
    : "bg-white text-black border-gray-300";

  /* ================= FETCH DATA ================= */
  const fetchVisitors = async () => {
    const res = await axios.get("/api/visitors");
    setVisitors(res.data);
  };

  const fetchAppointments = async () => {
    const res = await axios.get("/api/appointment-requests/approved");
    const approvedOnly = res.data.filter(
      (a) => String(a.status).toLowerCase().trim() === "approved"
    );
    setAppointmentRequests(approvedOnly);
  };

  useEffect(() => {
    fetchVisitors();
    fetchAppointments();

    const interval = setInterval(() => {
      fetchVisitors();
      fetchAppointments();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ================= VISITOR CRUD ================= */
  const handleAddChange = (e) =>
    setAddForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const payload = {
      ...addForm,
      date: localDate,
      timeIn: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timeOut: "",
      appointmentRequest: 1, // mark manual add as "accepted"
    };

    const res = await axios.post("/api/visitors/add", payload);
    setVisitors((prev) => [res.data, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.put(
      `/api/visitors/${editModal.visitor.id}`,
      editModal.visitor
    );
    setVisitors((p) => p.map((v) => (v.id === res.data.id ? res.data : v)));
    setEditModal({ open: false, visitor: null });
  };

  const handleTimeOut = async (visitor) => {
    const updated = {
      ...visitor,
      timeOut: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    await axios.put(`/api/visitors/${visitor.id}`, updated);
    setVisitors((p) => p.map((v) => (v.id === visitor.id ? updated : v)));
  };

  const handleDeleteConfirm = async () => {
    await axios.delete(`/api/visitors/${deleteModal.visitorId}`);
    setVisitors((p) => p.filter((v) => v.id !== deleteModal.visitorId));
    setDeleteModal({ open: false, visitorId: null });
  };

  /* ================= APPOINTMENTS ================= */
  const acceptAppointment = async (appointment) => {
    try {
      setProcessingId(appointment.id);
      await axios.put(`/api/appointment-requests/${appointment.id}/accept`);
      fetchVisitors();
      fetchAppointments();
    } catch (err) {
      console.error("Accept appointment failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectAppointment = async (id) => {
    try {
      setProcessingId(id);
      await axios.put(`/api/appointment-requests/${id}/reject`);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= FILTERING ================= */
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.personToVisit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = selectedBranch ? v.branch === selectedBranch : true;

    return !v.timeOut && matchesSearch && matchesBranch;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const currentVisitors = filteredVisitors.slice(
    indexOfLast - itemsPerPage,
    indexOfLast
  );
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  /* ================= RENDER ================= */
  return (
    <div className={`p-4 md:p-6 min-h-screen ${containerBg}`}>
      <VisitorsHeader
  darkMode={darkMode}
  appointmentRequests={appointmentRequests}
  setIsAppointmentModalOpen={setIsAppointmentModalOpen}
  setIsAddModalOpen={setIsAddModalOpen}
  setIsCompleteListModalOpen={setIsCompleteListModalOpen}
  visitors={visitors}
  selectedBranch={selectedBranch}
  setSelectedBranch={setSelectedBranch}

  // 🔍 search props
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  inputBg={inputBg}
/>


      <VisitorsGrid
        currentVisitors={currentVisitors}
        darkMode={darkMode}
        handleEditOpen={(v) => setEditModal({ open: true, visitor: v })}
        handleDeleteOpen={(id) => setDeleteModal({ open: true, visitorId: id })}
        handleTimeOut={handleTimeOut}
      />

      <VisitorsPagination
        darkMode={darkMode}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

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
        badgeNumbers={badgeNumbers}
        branches={branches}
        darkMode={darkMode}
      />

      <EditVisitorModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, visitor: null })}
        visitor={editModal.visitor}
        onChange={(e) =>
          setEditModal((p) => ({
            ...p,
            visitor: { ...p.visitor, [e.target.name]: e.target.value },
          }))
        }
        onSubmit={handleEditSubmit}
        darkMode={darkMode}
      />

      <DeleteVisitorModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, visitorId: null })}
        onConfirm={handleDeleteConfirm}
        darkMode={darkMode}
      />

      <CompleteVisitorsListModal
        isOpen={isCompleteListModalOpen}
        onClose={() => setIsCompleteListModalOpen(false)}
        visitors={visitors.filter((v) => v.timeOut)}
        darkMode={darkMode}
      />
    </div>
  );
}
