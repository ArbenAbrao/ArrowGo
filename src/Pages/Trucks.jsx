// trucks.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import DeleteTruckModal from "../Components/Trucks/DeleteTruckModal";
import EditTruckModal from "../Components/Trucks/EditTruckModal";
import RegisterTruckModal from "../Components/Trucks/RegisterTruckModal";
import AddTruckModal from "../Components/Trucks/AddTruckModal";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";
import CompleteTrucksListModal from "../Components/Trucks/CompleteTrucksListModal";

import TruckGrid from "../Components/Trucks/TruckGrid";
import PaginationControls from "../Components/Trucks/PaginationControls";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

// ---------------------------------------------------------------------------
// Branch ownership rule — multi-leg for OUT_IN entries
//
// IN_OUT (default): destination branch owns the whole entry end-to-end,
// same as before. Card shows up in destination's module from the start,
// waiting for Time In, then later Time Out.
//
// OUT_IN: ownership now moves across THREE legs instead of staying with
// one branch the whole time. Example: a Marilao-registered truck headed
// to Taguig —
//
//   1. LEG1_PENDING_OUT  -> Marilao's module. They Time Out (truck leaves).
//   2. LEG2_PENDING_IN   -> automatically hands off to Taguig's module.
//                           They Time In (truck arrives at their gate).
//   3. LEG2_PENDING_OUT  -> stays in Taguig's module. They Time Out
//                           (truck leaves Taguig, heading back).
//   4. LEG3_PENDING_IN   -> hands back to Marilao's module. They Time In
//                           (truck returns home). Entry is now COMPLETED.
//
// This mirrors the backend's GET /trucks?branch= filter and the
// backend-enforced check on the Time In / Time Out endpoints — this
// copy is the client-side safety net + what decides what's shown.
// Keep in sync with TruckGrid.jsx's copy of the same function.
// ---------------------------------------------------------------------------
const getResponsibleBranch = (truck) => {
  if (truck.flowType !== "OUT_IN") {
    return truck.destinationBranch;
  }

  switch (truck.currentStage) {
    case "LEG1_PENDING_OUT":
      return truck.branchRegistered;
    case "LEG2_PENDING_IN":
    case "LEG2_PENDING_OUT":
      return truck.destinationBranch;
    case "LEG3_PENDING_IN":
      return truck.branchRegistered;
    default:
      return truck.branchRegistered;
  }
};

export default function Trucks({ darkMode }) {
  // ---------- States ----------
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const userBranch = storedUser?.branch || "";
  const sessionToken = storedUser?.sessionToken || localStorage.getItem("sessionToken") || "";
  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, truck: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, truckKey: null });
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
  const isTruckCompleted = (t) => !!(t.timeIn && t.timeOut) && t.currentStage !== "LEG2_PENDING_IN" && t.currentStage !== "LEG2_PENDING_OUT" && t.currentStage !== "LEG3_PENDING_IN";

  const occupiedBays = trucks
    .filter((t) => !isTruckCompleted(t))
    .map((t) => t.bay);

  const allBays = Array.from({ length: 10 }, (_, i) => [`${i + 1}a`, `${i + 1}b`]).flat();

  const [drivers, setDrivers] = useState([]);

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
    destinationBranch: "",
    bay: "",
    driver: "",
    helpers: [""], // ✅ THIS IS THE FIX
    purpose: "",
    date: null,
    timeIn: null,
    flowType: "IN_OUT", // ✅ NEW: "IN_OUT" = Time In -> Time Out, "OUT_IN" = Time Out -> Time In
    isVisitor: false, // ✅ NEW: unregistered third-party / walk-in vehicle
    visitorCompany: "", // ✅ NEW: 3PL / company name for visitor entries
    visitorContact: "", // ✅ NEW: contact person / number for visitor entries
  });

  const [selectedBranch, setSelectedBranch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ---------- Fetch Data ----------
  const fetchTrucks = async () => {
    try {
      // Only IT sees everything (no branch param); Admin, Client, and User
      // are all scoped server-side to only the entries their branch
      // currently owns, per getResponsibleBranch's multi-leg rule.
      const scopeToBranch = userBranch && userRole !== "IT";

      const res = await axios.get(`${API_URL}/api/trucks`, {
        params: scopeToBranch ? { branch: userBranch } : {},
      });

      setTrucks(
        res.data.map((t) => ({
          ...t,
          clientId: t.clientId || t.client?.id, // ensure we have client id
          // Set activeTrucks to the client's ID
          activeTrucks: t.clientId ? [t.clientId] : t.client?.id ? [t.client.id] : [],
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/clients`);

      // Map clients to include a vehicleId based on their id
      const clientsWithVehicleId = res.data.map((client) => ({
        ...client,
        vehicleId: `VI-${client.id.toString().padStart(4, "0")}`,
      }));

      setClients(clientsWithVehicleId);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/drivers`);
      setDrivers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrucks();
    fetchClients();
    fetchDrivers(); // ✅ ADD THIS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filtered Trucks ----------
  const filteredTrucks = trucks
    .filter((truck) => !isTruckCompleted(truck))

    // ✅ BRANCH OWNERSHIP GUARD (client-side safety net — the backend
    // already scopes the fetch above, but this keeps the grid correct
    // even if trucks[] ever gets populated from an unscoped source).
    // Only IT is exempt and keeps the full cross-branch view.
    .filter((truck) =>
      userBranch && userRole !== "IT"
        ? getResponsibleBranch(truck) === userBranch
        : true
    )

    // ✅ BRANCH FILTER (manual dropdown filter, independent of the above)
    .filter((truck) =>
      selectedBranch ? truck.destinationBranch === selectedBranch : true
    )

    // DATE + SEARCH FILTER
    .filter((truck) => {
      const matchesDate = filterDate
        ? new Date(truck.date).toDateString() === new Date(filterDate).toDateString()
        : true;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (truck.clientName || "").toLowerCase().includes(term) ||
        (truck.plateNumber || "").toLowerCase().includes(term) ||
        (truck.truckType || "").toLowerCase().includes(term) ||
        (truck.driver && truck.driver.toLowerCase().includes(term));

      return matchesDate && matchesSearch;
    });

  // ---------- Pagination ----------
  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const paginatedTrucks = filteredTrucks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const isOnTrip = (t) => !t.timeOut && !t.timeIn;
  const activeTrucks = trucks.filter(isOnTrip);
  // ---------- Handlers ----------
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/register-truck`, registerForm);
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

  // ✅ Visitor/3PL entries skip the clients-table lookup entirely, so they
  // post to a dedicated endpoint that accepts free-typed vehicle details
  // and stores id = NULL, isVisitor = 1 on the trucks row. Everything else
  // (flow, leg staging, branch ownership) reuses the exact same pipeline
  // as a registered entry. Visitor entries don't carry a bay — they're
  // logged as visiting a single hub, not routed between two branches.
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = addForm.isVisitor
        ? `${API_URL}/api/add-visitor-truck`
        : `${API_URL}/api/add-truck`;

      await axios.post(endpoint, addForm);
      fetchTrucks();
      setIsAddModalOpen(false);
      setAddForm({
        id: "",
        plateNumber: "",
        truckType: "",
        clientName: "",
        branchRegistered: "",
        destinationBranch: "",
        bay: "",
        driver: "",
        helpers: [""],
        purpose: "",
        date: null,
        timeIn: null,
        flowType: "IN_OUT", // ✅ reset back to default
        isVisitor: false,
        visitorCompany: "",
        visitorContact: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add truck");
    }
  };

  // Shared auth header for the two endpoints the backend now enforces
  // branch ownership on. If sessionToken is empty, the request will
  // come back 401 from authMiddleware — same as any other expired
  // session, handled the normal way by the existing axios error path.
  const authHeaders = { headers: { "x-session-token": sessionToken } };

  // ✅ NEW: session heartbeat. Time In / Time Out are the only calls
  // that hit authMiddleware, which is also the only thing that
  // refreshes the account's last_active timestamp. That means normal
  // browsing (searching, filtering, adding/editing trucks) never keeps
  // the session alive server-side — only clicking Time In/Out does. So
  // a user can be actively using the page for 15+ minutes and still get
  // hit with "Session expired" on their next Time In/Out click, because
  // nothing else was resetting the idle clock in the meantime.
  // This pings a lightweight authenticated endpoint every 5 minutes
  // while the page is open so ordinary use keeps the session fresh.
  useEffect(() => {
    if (!sessionToken) return;

    const ping = () => {
      axios.get(`${API_URL}/api/session/ping`, authHeaders).catch(() => {
        // Session is genuinely gone — let the next real action (Time
        // In/Out) surface the expired-session message as usual instead
        // of alerting here too.
      });
    };

    const interval = setInterval(ping, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  // ✅ NEW: shared 401 handler for the auth-protected endpoints below.
  // Clears the stale session and sends the user back to log in instead
  // of leaving the page stuck showing an alert with no way forward.
  // ⚠️ Update the redirect path below if your login route isn't "/login".
  const handleSessionExpired = (err) => {
    if (err.response?.status === 401) {
      alert(err.response?.data?.error || "Your session has expired. Please log in again.");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionToken");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  // ✅ FIX ("Truck not found"): Time In / Time Out now key off
  // truck.truckKey instead of truck.id. `id` is really the *client's*
  // id carried onto the trucks row for registered entries — it's
  // NULL for visitor/3PL entries (see add-visitor-truck), so calling
  // this with truck.id sent `/timein`/`undefined` and always 404'd
  // for visitor trucks. truckKey is the real unique row identifier
  // every entry has, registered or visitor.
  const handleTimeIn = async (truck) => {
    try {
      const now = new Date();

      const date = now.toLocaleDateString("en-CA");
      const timeIn = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await axios.put(
        `${API_URL}/api/trucks/${truck.truckKey}/timein`,
        { date, timeIn },
        authHeaders
      );

      // Re-fetch instead of patching state locally — a Time In can
      // advance currentStage and hand the card off to a different
      // branch's module entirely, so the safest source of truth is
      // asking the backend again rather than guessing the new stage
      // client-side.
      await fetchTrucks();
    } catch (err) {
      console.error(err);
      if (!handleSessionExpired(err)) {
        alert(err.response?.data?.error || "Failed to save Time In");
      }
    }
  };

  const handleTimeOut = async (truck) => {
    try {
      const now = new Date();

      const timeout = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const timeOutDate = now.toLocaleDateString("en-CA");

      await axios.put(
        `${API_URL}/api/trucks/${truck.truckKey}/timeout`,
        { timeOut: timeout, timeOutDate },
        authHeaders
      );

      // Same reasoning as handleTimeIn — re-fetch so a stage hand-off
      // (e.g. Marilao's Time Out moving the card to Taguig) is reflected
      // immediately instead of the card lingering with stale local state.
      await fetchTrucks();
    } catch (err) {
      console.error(err);
      if (!handleSessionExpired(err)) {
        alert(err.response?.data?.error || "Failed to save Time Out");
      }
    }
  };

  // ---------- Additional Handlers ----------

  // Open/close modals
  const handleEditOpen = (truck) => setEditModal({ open: true, truck });
  const handleEditClose = () => setEditModal({ open: false, truck: null });

  // ✅ Same truckKey fix as Time In/Out — deleteModal now stores/keys off
  // truckKey (passed in from TruckGrid as truck.truckKey) instead of id,
  // so deleting a visitor entry (id === null) actually targets the row.
  const handleDeleteOpen = (truckKey) => setDeleteModal({ open: true, truckKey });
  const handleDeleteClose = () => setDeleteModal({ open: false, truckKey: null });

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
      // ✅ FIX: the backend route is /trucks/:truckKey (see
      // backend/routes/trucks.js EDIT TRUCK), not /trucks/:id — id is
      // NULL for visitor entries, so this now targets truckKey, which
      // every row has.
      const res = await axios.put(`${API_URL}/api/trucks/${editModal.truck.truckKey}`, {
        driver: editModal.truck.driver,
        purpose: editModal.truck.purpose,
        bay: editModal.truck.bay,
      });

      // Update state with new truck data from backend — matched on
      // truckKey so this can't accidentally patch a different entry
      // that happens to share the same (possibly-NULL) id.
      setTrucks((prev) =>
        prev.map((t) => (t.truckKey === editModal.truck.truckKey ? res.data.truck : t))
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
      // ✅ FIX: delete by truckKey (matches the backend's
      // /trucks/:truckKey route) instead of id, which visitor entries
      // don't have.
      await axios.delete(`${API_URL}/api/trucks/${deleteModal.truckKey}`);
      setTrucks((prev) => prev.filter((t) => t.truckKey !== deleteModal.truckKey));
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
  // Same tokens as AddTruckModal / CompleteTrucksListModal: slate-950/900
  // surfaces, emerald as the single accent.
  const theme = darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
        toolbarBg: "bg-slate-900/60 border-slate-800",
        inputBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 placeholder-slate-500 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        selectBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
      }
    : {
        pageBg: "bg-slate-50 text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        toolbarBg: "bg-white border-slate-200",
        inputBg:
          "bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:ring-emerald-400 focus:border-emerald-400",
        selectBg: "bg-white text-slate-900 border-slate-300 focus:ring-emerald-400 focus:border-emerald-400",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
      };

  const [branches, setBranches] = useState([]);
  const [bays, setBays] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/branches`).then((res) => setBranches(res.data));

    axios.get(`${API_URL}/api/bays`).then((res) => {
      const formatted = res.data.map((b) => ({
        id: b.id,
        name: b.bayName,
        branchName: b.branchName,
      }));
      setBays(formatted);
    });
  }, []);

  return (
    <div className={`min-h-screen p-4 sm:p-6 transition-colors ${theme.pageBg}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .page-title { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-6"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
          <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
        </span>
        <div>
          <h1 className={`page-title text-xl sm:text-2xl font-bold leading-tight ${theme.titleText}`}>
            Time-in &amp; Time-out Management
          </h1>
          <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
            {activeTrucks.length} vehicle{activeTrucks.length !== 1 ? "s" : ""} currently active
          </p>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={`flex flex-col sm:flex-row gap-3 sm:items-center mb-6 rounded-2xl border p-3 ${theme.toolbarBg}`}
      >
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${theme.subtleText}`} />
          <input
            type="text"
            placeholder="Search truck, plate, client, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${theme.inputBg}`}
          />
        </div>

        {/* Branch Filter */}
        <div className="relative w-full sm:w-auto">
          <MapPinIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.subtleText}`} />
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={`w-full sm:w-auto pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 transition appearance-none ${theme.selectBg}`}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 sm:ml-auto">
          {/* Add Truck Button */}
          {(userRole === "Admin" || userRole === "IT" || userRole === "User") && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnPrimary}`}
            >
              <PlusIcon className="w-4 h-4" />
              Create Entry
            </motion.button>
          )}

          {/* Completed Vehicle List Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCompleteListModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${theme.btnSecondary}`}
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            Completed List
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          <TruckGrid
            paginatedTrucks={paginatedTrucks}
            clients={clients}
            darkMode={darkMode}
            handleTimeIn={handleTimeIn}
            handleTimeOut={handleTimeOut}
            handleEditOpen={handleEditOpen}
            handleDeleteOpen={handleDeleteOpen}
            userRole={userRole}
            userBranch={userBranch}
          />
        </motion.div>
      </AnimatePresence>

      <PaginationControls
        darkMode={darkMode}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      {/* Modals */}
      <DeleteTruckModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, truckKey: null })}
        onConfirm={handleDeleteConfirm}
        truck={trucks.find((t) => t.truckKey === deleteModal.truckKey)}
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
        drivers={drivers} // ADD THIS
        bays={bays}
        branches={branches} // ✅ NEW — used by visitor mode's branch pickers
        darkMode={darkMode}
        activeTrucks={activeTrucks}
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