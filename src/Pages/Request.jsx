// src/Pages/Request.jsx
import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";

export default function Request({ darkMode }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBulk, setSelectedBulk] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [selectAllAppointments, setSelectAllAppointments] = useState(false);
  const [selectAllTrucks, setSelectAllTrucks] = useState(false);

  /* ================= REALTIME SYNC ================= */
  const loadRequests = () => {
    const data = JSON.parse(localStorage.getItem("pendingRequests")) || [];
    setRequests(data);
  };

  useEffect(() => {
    loadRequests();
    fetchClients();

    const interval = setInterval(loadRequests, 3000);
    const sync = (e) => {
      if (e.key === "pendingRequests") loadRequests();
    };
    window.addEventListener("storage", sync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get("/api/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  /* ================= ACTIONS ================= */
  const openModal = (req) => {
    if (selectedBulk.length > 0) return;
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const approve = async (req) => {
    try {
      if (req.type === "appointment") {
        await axios.post("/api/visitors/add", {
          ...req.data,
          appointmentRequest: true,
        });
      }

      if (req.type === "truck") {
        await axios.post("/api/register-truck", {
          plateNumber: req.data.plateNumber,
          truckType: req.data.truckType,
          clientName: req.data.clientName,
        });
        fetchClients();
        setIsRegisteredModalOpen(true);
      }

      removeRequest(req.id);
      closeModal();
    } catch {
      alert("Approval failed");
    }
  };

  const reject = (id) => {
    removeRequest(id);
    closeModal();
  };

  const removeRequest = (id) => {
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    localStorage.setItem("pendingRequests", JSON.stringify(updated));
  };

  /* ================= BULK APPROVE ================= */
  const toggleBulkSelect = (id) => {
    setSelectedBulk((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkApprove = async () => {
    for (let id of selectedBulk) {
      const req = requests.find((r) => r.id === id);
      if (req) await approve(req);
    }
    setSelectedBulk([]);
    setIsBulkModalOpen(false);
  };

  /* ================= SELECT ALL ================= */
  const appointmentRequests = requests.filter((r) => r.type === "appointment");
  const truckRequests = requests.filter((r) => r.type === "truck");

  const toggleSelectAllAppointments = () => {
    if (selectAllAppointments) {
      setSelectedBulk((prev) =>
        prev.filter((id) => !appointmentRequests.some((r) => r.id === id))
      );
    } else {
      setSelectedBulk((prev) => [
        ...new Set([...prev, ...appointmentRequests.map((r) => r.id)]),
      ]);
    }
    setSelectAllAppointments(!selectAllAppointments);
  };

  const toggleSelectAllTrucks = () => {
    if (selectAllTrucks) {
      setSelectedBulk((prev) =>
        prev.filter((id) => !truckRequests.some((r) => r.id === id))
      );
    } else {
      setSelectedBulk((prev) => [
        ...new Set([...prev, ...truckRequests.map((r) => r.id)]),
      ]);
    }
    setSelectAllTrucks(!selectAllTrucks);
  };

  /* ================= FILTERING ================= */
  const isMatch = (req) => {
    const text = (req.data.visitorName || req.data.clientName || "").toLowerCase();
    return search.trim() === "" || text.includes(search.toLowerCase());
  };

  /* ================= STATS ================= */
  const stats = {
    total: requests.length,
    appointment: appointmentRequests.length,
    truck: truckRequests.length,
  };

  /* ================= CARD ================= */
  const RequestItem = ({ req }) => {
    const isSelected = selectedBulk.includes(req.id);
    const heading = req.type === "truck" ? req.data.clientName : req.data.visitorName;
    const match = isMatch(req);

    // Dark mode classes
    const bgClass = darkMode
      ? isSelected
        ? "ring-2 ring-green-400 bg-gray-700 border-green-400"
        : req.type === "appointment"
        ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
        : "bg-gray-700 hover:bg-gray-600 border-gray-600"
      : isSelected
      ? "ring-2 ring-green-400 bg-green-100 border-green-400"
      : req.type === "appointment"
      ? "bg-blue-50 hover:bg-blue-100 border-blue-200"
      : "bg-green-50 hover:bg-green-100 border-green-200";

    const textClass = darkMode
      ? match
        ? "text-gray-100"
        : "text-gray-400"
      : match
      ? "text-gray-900"
      : "text-gray-500";

    const subTextClass = darkMode
      ? match
        ? "text-gray-300"
        : "text-gray-500"
      : match
      ? "text-gray-500"
      : "text-gray-400";

    return (
      <div
        onClick={() => openModal(req)}
        className={`flex items-center justify-between p-5 rounded-xl border transition cursor-pointer ${bgClass} ${
          !match ? "opacity-50" : "opacity-100"
        }`}
      >
        <div className="flex flex-col">
          <p className={`font-semibold ${textClass}`}>{heading}</p>
          <p className={`text-xs ${subTextClass}`}>
            {req.type === "appointment"
              ? `Visiting ${req.data.personToVisit}`
              : `${req.data.truckType}`}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {new Date(req.timestamp || Date.now()).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              darkMode
                ? req.type === "appointment"
                  ? "bg-blue-800 text-blue-200"
                  : "bg-green-800 text-green-200"
                : req.type === "appointment"
                ? "bg-blue-200 text-blue-700"
                : "bg-green-200 text-green-700"
            }`}
          >
            {req.type}
          </span>

          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleBulkSelect(req.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  /* ================= BULK MODAL SUMMARY ================= */
  const bulkStats = selectedBulk.reduce(
    (acc, id) => {
      const req = requests.find((r) => r.id === id);
      if (!req) return acc;
      if (req.type === "appointment") acc.appointment += 1;
      if (req.type === "truck") acc.truck += 1;
      return acc;
    },
    { appointment: 0, truck: 0 }
  );

  /* ================= BUTTON COLORS ================= */
  const approveBtn = darkMode
    ? "bg-green-600 hover:bg-green-700 text-white"
    : "bg-green-600 hover:bg-green-700 text-white";

  const rejectBtn = darkMode
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  const cancelBtn = darkMode
    ? "bg-gray-700 text-white hover:bg-gray-600"
    : "bg-gray-300 text-gray-900 hover:bg-gray-200";

  return (
    <div className={`min-h-screen px-6 py-10 ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-br from-gray-100 to-gray-200"}`}>
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className={`text-4xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Requests Dashboard</h1>
        <p className={darkMode ? "text-gray-300" : "text-gray-500"}>Live monitoring of incoming requests</p>
      </div>

      {/* STATS */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 mb-8">
        <div className={`rounded-xl p-5 shadow text-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-800"}`}>Total</p>
          <p className={`text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{stats.total}</p>
        </div>
        <div className={`rounded-xl p-5 shadow text-center ${darkMode ? "bg-gray-700" : "bg-blue-200"}`}>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-800"}`}>Appointments</p>
          <p className={`text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{stats.appointment}</p>
        </div>
        <div className={`rounded-xl p-5 shadow text-center ${darkMode ? "bg-gray-700" : "bg-green-200"}`}>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-800"}`}>Trucks</p>
          <p className={`text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{stats.truck}</p>
        </div>
      </div>

      {/* SEARCH BAR & BULK */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 mb-6 items-center">
        <input
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full md:w-64 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${
            darkMode
              ? "bg-gray-800 text-gray-200 border-gray-600 focus:ring-blue-500 placeholder-gray-400"
              : "bg-blue-50 text-gray-800 border-gray-300 focus:ring-blue-400 placeholder-gray-500"
          }`}
        />

        {selectedBulk.length > 0 && (
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className={`px-4 py-2 rounded-xl transition-colors duration-300 ${
              darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            Approve Selected ({selectedBulk.length})
          </button>
        )}
      </div>

      {/* REQUEST LIST */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 mb-14">
        {/* APPOINTMENTS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className={darkMode ? "font-semibold text-gray-200 text-lg" : "font-semibold text-gray-700 text-lg"}>Appointments</p>
            <label className={darkMode ? "flex items-center gap-2 text-gray-300 cursor-pointer" : "flex items-center gap-2 text-gray-600 cursor-pointer"}>
              <input
                type="checkbox"
                checked={selectAllAppointments}
                onChange={toggleSelectAllAppointments}
              />
              Select All
            </label>
          </div>
          {appointmentRequests.map((req) => (
            <RequestItem key={req.id} req={req} />
          ))}
        </div>

        {/* TRUCKS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className={darkMode ? "font-semibold text-gray-200 text-lg" : "font-semibold text-gray-700 text-lg"}>Trucks</p>
            <label className={darkMode ? "flex items-center gap-2 text-gray-300 cursor-pointer" : "flex items-center gap-2 text-gray-600 cursor-pointer"}>
              <input
                type="checkbox"
                checked={selectAllTrucks}
                onChange={toggleSelectAllTrucks}
              />
              Select All
            </label>
          </div>
          {truckRequests.map((req) => (
            <RequestItem key={req.id} req={req} />
          ))}
        </div>
      </div>

      {/* MODALS */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className={`rounded-2xl p-6 shadow-xl max-w-md w-full ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}>
              <Dialog.Title className="text-xl font-semibold mb-4">Review Request</Dialog.Title>

              <div className="flex gap-3">
                <button onClick={() => approve(selectedRequest)} className={`flex-1 py-2 rounded-xl ${approveBtn}`}>
                  Approve
                </button>
                <button onClick={() => reject(selectedRequest.id)} className={`flex-1 py-2 rounded-xl ${rejectBtn}`}>
                  Reject
                </button>
              </div>

              <button onClick={closeModal} className={`mt-4 w-full py-2 rounded-xl ${cancelBtn}`}>
                Cancel
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isBulkModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsBulkModalOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}>
              <Dialog.Title className="text-lg font-semibold mb-4">Confirm Bulk Approval</Dialog.Title>
              <p className="mb-2 text-gray-700 dark:text-gray-300">
                You are about to approve <strong>{selectedBulk.length}</strong> request(s):
              </p>
              <ul className="mb-4 max-h-40 overflow-y-auto text-sm text-gray-600 dark:text-gray-400">
                {bulkStats.appointment > 0 && <li>Appointments: {bulkStats.appointment}</li>}
                {bulkStats.truck > 0 && <li>Trucks: {bulkStats.truck}</li>}
              </ul>
              <div className="flex gap-3">
                <button onClick={bulkApprove} className={`flex-1 py-2 rounded-xl ${approveBtn}`}>Confirm</button>
                <button onClick={() => setIsBulkModalOpen(false)} className={`flex-1 py-2 rounded-xl ${cancelBtn}`}>Cancel</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <RegisteredTrucksModal
        open={isRegisteredModalOpen}
        onClose={() => setIsRegisteredModalOpen(false)}
        clients={clients}
      />
    </div>
  );
}
