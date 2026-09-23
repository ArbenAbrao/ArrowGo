// visitors.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

import AddVisitorModal from "../Components/Visitors/AddVisitorModal";
import EditVisitorModal from "../Components/Visitors/EditVisitorModal";
import DeleteVisitorModal from "../Components/Visitors/DeleteVisitorModal";
import AppointmentRequestsModal from "../Components/Visitors/AppointmentRequestsModal";
import ArchivedRequestsModal from "../Components/Visitors/ArchivedRequestsModal"; // ✅ NEW
import CompleteVisitorsListModal from "../Components/Visitors/CompleteVisitorsListModal.jsx";
import VisitorsHeader from "../Components/Visitors/VisitorsHeader";
import VisitorsGrid from "../Components/Visitors/VisitorsGrid";
import VisitorsPagination from "../Components/Visitors/VisitorsPagination";
import { getDateField, isAppointmentExpired } from "../Components/Visitors/appointmentUtils"; // ✅ NEW

// Single source of truth for the API base URL.
// Set VITE_API_URL in your .env file (Vite root) so this never
// needs to be edited again when your WSL2/LAN IP changes.
const API_URL = process.env.REACT_APP_API_URL;

export default function Visitors({ darkMode }) {
  /* ================= STATES ================= */

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const userBranch = storedUser?.branch || ""; // ✅ NEW — same key trucks.jsx uses
  const [visitors, setVisitors] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [archivedRequests, setArchivedRequests] = useState([]); // ✅ NEW

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, visitorId: null });
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false); // ✅ NEW
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // ✅ NEW — ids we've already asked the server to archive this session, so the
  // 5s poll doesn't re-send the same PUT for a request that's still in flight.
  const archiveAttemptedRef = useRef(new Set());

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
  // Page-level tokens only — VisitorsHeader now owns its own theme object
  // (same slate/emerald tokens as trucks.jsx / AddTruckModal) instead of
  // being handed a single precomputed `inputBg` class string.
  const containerBg = darkMode ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-700";

  /* ================= FETCH DATA ================= */
  const fetchVisitors = async () => {
    // ✅ NEW — same pattern as fetchTrucks in trucks.jsx: only IT sees
    // every branch (no branch param); everyone else is scoped
    // server-side to just their own branch's visitors.
    const scopeToBranch = userBranch && userRole !== "IT";

    const res = await axios.get(`${API_URL}/api/visitors`, {
      params: scopeToBranch ? { branch: userBranch } : {},
    });
    setVisitors(res.data);
  };

  // ✅ NEW — archived (expired) appointment requests, scoped like everything else.
  const fetchArchived = async () => {
    try {
      const scopeToBranch = userBranch && userRole !== "IT";

      const res = await axios.get(`${API_URL}/api/appointment-requests/archived`, {
        params: scopeToBranch ? { branch: userBranch } : {},
      });

      setArchivedRequests(
        res.data.filter((a) => userRole === "IT" || !userBranch || a.branch === userBranch)
      );
    } catch (err) {
      console.error("Fetch archived requests failed:", err);
    }
  };

  const fetchAppointments = async () => {
    // ✅ NEW — assumes appointment requests carry a `branch` field like
    // visitors do (needed since accepting one promotes it into a visitor
    // row with a branch). If your API names this differently, tell me
    // and I'll adjust the `a.branch` check below.
    const scopeToBranch = userBranch && userRole !== "IT";

    const res = await axios.get(`${API_URL}/api/appointment-requests/approved`, {
      params: scopeToBranch ? { branch: userBranch } : {},
    });

    const approvedOnly = res.data.filter(
      (a) =>
        String(a.status).toLowerCase().trim() === "approved" &&
        (userRole === "IT" || !userBranch || a.branch === userBranch)
    );

    // ✅ NEW — requests whose visit date has passed no longer belong in the
    // active list. They're hidden right away, then moved to the archive on
    // the server (once per id per session) so they can be restored or deleted.
    const expired = approvedOnly.filter(isAppointmentExpired);
    setAppointmentRequests(approvedOnly.filter((a) => !isAppointmentExpired(a)));

    const toArchive = expired.filter((a) => !archiveAttemptedRef.current.has(a.id));
    if (toArchive.length) {
      toArchive.forEach((a) => archiveAttemptedRef.current.add(a.id));
      await Promise.allSettled(
        toArchive.map((a) =>
          axios.put(`${API_URL}/api/appointment-requests/${a.id}/archive`)
        )
      );
      fetchArchived();
    }
  };

  useEffect(() => {
    fetchVisitors();
    fetchAppointments();
    fetchArchived(); // ✅ NEW

    const interval = setInterval(() => {
      fetchVisitors();
      fetchAppointments();
      fetchArchived(); // ✅ NEW
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const res = await axios.post(`${API_URL}/api/visitors/add`, payload);
    setVisitors((prev) => [res.data, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.put(
      `${API_URL}/api/visitors/${editModal.visitor.id}`,
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

    await axios.put(`${API_URL}/api/visitors/${visitor.id}`, updated);
    setVisitors((p) => p.map((v) => (v.id === visitor.id ? updated : v)));
  };

  const handleDeleteConfirm = async () => {
    await axios.delete(`${API_URL}/api/visitors/${deleteModal.visitorId}`);
    setVisitors((p) => p.filter((v) => v.id !== deleteModal.visitorId));
    setDeleteModal({ open: false, visitorId: null });
  };

  /* ================= APPOINTMENTS ================= */
  const acceptAppointment = async (appointment) => {
    try {
      setProcessingId(appointment.id);
      await axios.put(`${API_URL}/api/appointment-requests/${appointment.id}/accept`);
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
      await axios.put(`${API_URL}/api/appointment-requests/${id}/reject`);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= ARCHIVE ================= */
  // ✅ NEW — these throw on failure on purpose: ArchivedRequestsModal catches
  // the error and shows an inline message instead of silently closing the row.

  // Restoring needs a NEW visit date. Without one, the request would still be
  // in the past and get archived again on the next poll.
  const restoreArchived = async (request, newDate) => {
    await axios.put(`${API_URL}/api/appointment-requests/${request.id}/restore`, {
      [getDateField(request)]: newDate,
    });

    // Allow it to be auto-archived again if this new date passes too.
    archiveAttemptedRef.current.delete(request.id);
    setArchivedRequests((p) => p.filter((a) => a.id !== request.id));
    fetchAppointments();
  };

  const deleteArchived = async (id) => {
    await axios.delete(`${API_URL}/api/appointment-requests/${id}`);
    setArchivedRequests((p) => p.filter((a) => a.id !== id));
  };

  const deleteAllArchived = async () => {
    const ids = archivedRequests.map((a) => a.id);
    const results = await Promise.allSettled(
      ids.map((id) => axios.delete(`${API_URL}/api/appointment-requests/${id}`))
    );

    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    setArchivedRequests((p) => p.filter((a) => !deleted.includes(a.id)));

    if (deleted.length < ids.length) {
      throw new Error(`${ids.length - deleted.length} request(s) failed to delete`);
    }
  };

  /* ================= FILTERING ================= */
  const filteredVisitors = visitors.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (v.visitorName || "").toLowerCase().includes(term) ||
      (v.personToVisit || "").toLowerCase().includes(term);

    // ✅ BRANCH OWNERSHIP GUARD (client-side safety net — the backend
    // already scopes the fetch above, but this keeps the grid correct
    // even if visitors[] ever gets populated from an unscoped source).
    // Only IT is exempt and keeps the full cross-branch view. Same
    // pattern as trucks.jsx's filteredTrucks.
    const matchesUserBranch =
      userBranch && userRole !== "IT" ? v.branch === userBranch : true;

    // ✅ BRANCH FILTER (manual dropdown filter, independent of the above)
    const matchesBranch = selectedBranch ? v.branch === selectedBranch : true;

    return !v.timeOut && matchesSearch && matchesUserBranch && matchesBranch;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const currentVisitors = filteredVisitors.slice(
    indexOfLast - itemsPerPage,
    indexOfLast
  );
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);

  /* ================= RENDER ================= */
  return (
    <div className={`p-4 md:p-6 min-h-screen transition-colors ${containerBg}`}>
      <VisitorsHeader
        darkMode={darkMode}
        appointmentRequests={appointmentRequests}
        setIsAppointmentModalOpen={setIsAppointmentModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        setIsCompleteListModalOpen={setIsCompleteListModalOpen}
        archivedCount={archivedRequests.length} // ✅ NEW
        setIsArchiveModalOpen={setIsArchiveModalOpen} // ✅ NEW
        visitors={visitors}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        userRole={userRole}
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

      {/* ✅ NEW */}
      <ArchivedRequestsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedRequests={archivedRequests}
        onRestore={restoreArchived}
        onDelete={deleteArchived}
        onDeleteAll={deleteAllArchived}
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
        visitors={visitors.filter(
          (v) =>
            v.timeOut &&
            (userRole === "IT" || !userBranch || v.branch === userBranch)
        )}
        darkMode={darkMode}
      />
    </div>
  );
}