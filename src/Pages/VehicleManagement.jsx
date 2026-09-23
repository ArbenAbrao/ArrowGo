import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  PencilSquareIcon,
  QrCodeIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

import ViewTruckModal from "../Components/Trucks/ViewTruckModal";
import TruckManagementLayout from "../Components/Trucks/TruckManagementLayout";
import RegisterTruckModal from "../Components/Trucks/RegisterTruckModal";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";
import CompleteTrucksListModal from "../Components/Trucks/CompleteTrucksListModal";
import NewViewModal from "../Components/Trucks/NewViewModal";

// Single source of truth for the API base URL.
// Set VITE_API_URL in your .env file (Vite root) so this never
// needs to be edited again when your WSL2/LAN IP changes.
const API_URL = process.env.REACT_APP_API_URL;

/* ================= HELPERS ================= */

// Same rule as RegisterTruckModal — used here to badge renewal urgency
// on each row instead of just showing a bare date.
function getRenewalStatus(nextRenewalDate) {
  if (!nextRenewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(nextRenewalDate);
  if (Number.isNaN(renewal.getTime())) return null;

  const diffDays = Math.round((renewal - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue ${Math.abs(diffDays)}d`,
      tone: "rose",
    };
  }
  if (diffDays <= 30) {
    return { label: `Due in ${diffDays}d`, tone: "amber" };
  }
  return { label: renewal.toLocaleDateString(), tone: "emerald" };
}

export default function VehicleManagement({ darkMode }) {
  /* ================= STATES ================= */
  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "controlId", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterDate, setFilterDate] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const canManage = userRole === "Admin" || userRole === "IT";

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTruck, setViewTruck] = useState(null);

  const [showNewView, setShowNewView] = useState(false);

  const [editingTruck, setEditingTruck] = useState(null);
  const [editBranch, setEditBranch] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState(null);

  /* ================= FORMS ================= */
  const initialRegisterForm = {
    plateNumber: "",
    truckType: "",
    clientName: "",
    brandName: "",
    model: "",
    fuelType: "",
    displacement: "",
    payloadCapacity: "",
    branchRegistered: "",
    controlId: "",
    registeredName: "",
    orNo: "",
    crNo: "",
    arNo: "",
    registrationDate: "",
    nextRenewalDate: "",
    status: "Not Paid",
    price: "",
    remarks: "",
  };

  const [registerForm, setRegisterForm] = useState(initialRegisterForm);

  /* ================= CONSTANTS ================= */
  const ITEMS_PER_PAGE = 10;

  /* ================= FETCH ================= */
  useEffect(() => {
    axios
      .get(`${API_URL}/api/trucks`)
      .then((res) => setTrucks(res.data.sort((a, b) => a.id - b.id)))
      .catch(console.error);

    axios
      .get(`${API_URL}/api/clients`)
      .then((res) => setClients(res.data))
      .catch(console.error);

    axios
      .get(`${API_URL}/api/branches`)
      .then((res) => setBranches(res.data))
      .catch(console.error);
  }, []);

  /* ================= FILTERS ================= */
  const filtered = useMemo(() => {
    let data = [...clients];

    if (selectedBranch) data = data.filter((c) => c.branchRegistered === selectedBranch);

    if (selectedClient) {
      data = data.filter(
        (c) => c.clientName?.trim().toLowerCase() === selectedClient.trim().toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((c) =>
        `${c.controlId} ${c.clientName} ${c.branchRegistered} ${c.truckType} ${c.plateNumber} ${c.brandName} ${c.model}`
          .toLowerCase()
          .includes(term)
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        const A = a[sortConfig.key] || "";
        const B = b[sortConfig.key] || "";
        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [clients, selectedClient, selectedBranch, searchTerm, sortConfig]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, selectedBranch, searchTerm]);

  /* ================= HANDLERS ================= */

  const updateTruckBranch = async () => {
    try {
      await axios.put(`${API_URL}/api/clients/${editingTruck.id}/branch`, {
        branchRegistered: editBranch,
      });

      setClients((prev) =>
        prev.map((truck) =>
          truck.id === editingTruck.id ? { ...truck, branchRegistered: editBranch } : truck
        )
      );

      setEditingTruck(null);
      setEditBranch("");
    } catch (err) {
      console.error(err);
      alert("Failed to update branch");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((t) => t.id));
  };

  const deleteTruck = async () => {
    if (!truckToDelete) return;

    try {
      await axios.delete(`${API_URL}/api/clients/${truckToDelete.id}`);

      setClients((prev) => prev.filter((t) => t.id !== truckToDelete.id));
      setTrucks((prev) => prev.filter((t) => t.id !== truckToDelete.id));

      setDeleteModalOpen(false);
      setTruckToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete truck");
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/register-truck`, registerForm);
      setIsRegisterModalOpen(false);
      setRegisterForm(initialRegisterForm);
    } catch (err) {
      console.error("Register truck failed:", err.response?.data || err.message);
      alert(
        err.response?.data?.error || "Failed to register vehicle. Check the console for details."
      );
    }
  };

  const exportCompleteCSV = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      trucks
        .map((t) => [t.clientName, t.truckType, t.plateNumber, t.bay, t.driver, t.purpose].join(","))
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "complete_trucks.csv";
    link.click();
  };

  /* ================= THEME ================= */
  // Same token family as trucks.jsx: slate-950/900 surfaces, single
  // emerald accent, semantic color reserved for status/renewal only.
  const theme = darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
        panelBg: "bg-slate-900/60 border-slate-800",
        tableHeadBg: "bg-slate-900/80 text-slate-400 border-slate-800",
        rowBorder: "border-slate-800",
        rowHover: "hover:bg-slate-800/50",
        cardBg: "bg-slate-900/60 border-slate-800",
        chipMuted: "bg-slate-800 text-slate-400",
        modalBg: "bg-slate-900 border-slate-800 text-slate-100",
        modalHeaderBg: "border-slate-800 bg-slate-800/60",
        inputBg:
          "bg-slate-800/70 text-slate-100 border-slate-700 focus:ring-emerald-500/40 focus:border-emerald-500/60",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
        btnDanger: "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110",
      }
    : {
        pageBg: "bg-slate-50 text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        panelBg: "bg-white border-slate-200",
        tableHeadBg: "bg-slate-100 text-slate-600 border-slate-200",
        rowBorder: "border-slate-200",
        rowHover: "hover:bg-emerald-50/60",
        cardBg: "bg-white border-slate-200",
        chipMuted: "bg-slate-100 text-slate-500",
        modalBg: "bg-white border-slate-200 text-slate-900",
        modalHeaderBg: "border-slate-200 bg-emerald-50",
        inputBg: "bg-white text-slate-900 border-slate-300 focus:ring-emerald-400 focus:border-emerald-400",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
        btnDanger: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20",
      };

  const tonePill = {
    emerald: darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    amber: darkMode ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600",
    rose: darkMode ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600",
  };

  const statusPill = (status) =>
    status === "Paid"
      ? tonePill.emerald
      : darkMode
      ? "bg-slate-700/60 text-slate-300"
      : "bg-slate-100 text-slate-600";

  const sortableColumns = [
    { label: "Control ID", key: "controlId" },
    { label: "Client", key: "clientName" },
    { label: "Branch", key: "branchRegistered" },
    { label: "Plate", key: "plateNumber" },
  ];

  /* ================= UI ================= */
  if (showNewView) {
    return <NewViewModal onClose={() => setShowNewView(false)} />;
  }

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
            Vehicle Management
          </h1>
          <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} registered
          </p>
        </div>
      </motion.div>

      <TruckManagementLayout
        darkMode={darkMode}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        setIsRegisteredModalOpen={setIsRegisteredModalOpen}
        setIsCompleteListModalOpen={setIsCompleteListModalOpen}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clients={clients}
        searchTerm={searchTerm}
        branches={branches}
        setSearchTerm={setSearchTerm}
      />

      {/* DESKTOP TABLE */}
      <div className={`hidden md:block mt-4 overflow-x-auto rounded-2xl border ${theme.panelBg}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${theme.tableHeadBg}`}>
              <th className="p-3 text-center w-10">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={selectedIds.length === data.length && data.length > 0}
                />
              </th>

              {sortableColumns.map(({ label, key }) => (
                <th key={key} onClick={() => handleSort(key)} className="p-3 cursor-pointer text-left select-none">
                  <div className="flex items-center gap-1">
                    {label}
                    {sortConfig.key === key &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      ))}
                  </div>
                </th>
              ))}

              <th className="p-3 text-left">Vehicle</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Renewal</th>
              <th className="p-3 text-center">QR</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((t) => {
              const renewal = getRenewalStatus(t.nextRenewalDate);
              return (
                <tr key={t.id} className={`border-b last:border-0 ${theme.rowBorder} ${theme.rowHover} transition`}>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleSelect(t.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">{t.controlId || "—"}</td>
                  <td className="p-3">{t.clientName}</td>
                  <td className="p-3">{t.branchRegistered}</td>
                  <td className="p-3 font-medium">{t.plateNumber}</td>
                  <td className="p-3">
                    <div>{t.truckType}</div>
                    {(t.brandName || t.model) && (
                      <div className={`text-xs ${theme.subtleText}`}>
                        {[t.brandName, t.model].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill(t.status)}`}>
                      {t.status || "Not Paid"}
                    </span>
                  </td>
                  <td className="p-3">
                    {renewal ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${tonePill[renewal.tone]}`}>
                        {renewal.label}
                      </span>
                    ) : (
                      <span className={`text-xs ${theme.subtleText}`}>—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <img
                      src={`${API_URL}/api/clients/${t.id}/qrcode`}
                      alt={`QR code for truck ${t.plateNumber}`}
                      className="w-9 mx-auto cursor-pointer hover:scale-110 transition rounded"
                      onClick={() => {
                        setViewTruck(t);
                        setViewOpen(true);
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-3">
                      {canManage && (
                        <button
                          onClick={() => {
                            setEditingTruck(t);
                            setEditBranch(t.branchRegistered);
                          }}
                          className="text-slate-400 hover:text-emerald-500 transition"
                          title="Edit branch"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => {
                            setTruckToDelete(t);
                            setDeleteModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-rose-500 transition"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center">
                  <TruckIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
                  <p className={theme.subtleText}>No vehicles match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3 mt-4">
        {data.map((t) => {
          const renewal = getRenewalStatus(t.nextRenewalDate);
          return (
            <div key={t.id} className={`border rounded-2xl p-4 ${theme.cardBg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-xs ${theme.subtleText}`}>{t.controlId || "No Control ID"}</p>
                  <p className={`font-semibold text-lg ${theme.titleText}`}>{t.plateNumber}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => toggleSelect(t.id)}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill(t.status)}`}>
                  {t.status || "Not Paid"}
                </span>
                {renewal && (
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${tonePill[renewal.tone]}`}>
                    {renewal.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className={`text-xs ${theme.subtleText}`}>Client</p>
                  <p>{t.clientName}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.subtleText}`}>Branch</p>
                  <p>{t.branchRegistered}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.subtleText}`}>Vehicle</p>
                  <p>{t.truckType}</p>
                  {(t.brandName || t.model) && (
                    <p className={`text-xs ${theme.subtleText}`}>
                      {[t.brandName, t.model].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex justify-between items-center mt-4 pt-3 border-t ${theme.rowBorder}`}>
                <button
                  onClick={() => {
                    setViewTruck(t);
                    setViewOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-500"
                >
                  <QrCodeIcon className="w-5 h-5" />
                  View QR
                </button>

                <div className="flex gap-3">
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditingTruck(t);
                        setEditBranch(t.branchRegistered);
                      }}
                      className="text-slate-400 hover:text-emerald-500 transition"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => {
                        setTruckToDelete(t);
                        setDeleteModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className={`text-center py-10 border rounded-2xl ${theme.cardBg}`}>
            <TruckIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
            <p className={theme.subtleText}>No vehicles match your filters.</p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className={theme.subtleText}>
          Page <b className={theme.titleText}>{currentPage}</b> of{" "}
          <b className={theme.titleText}>{totalPages || 1}</b>
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className={`px-4 py-1.5 rounded-lg disabled:opacity-40 transition ${theme.btnSecondary}`}
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className={`px-4 py-1.5 rounded-lg disabled:opacity-40 transition ${theme.btnSecondary}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <ViewTruckModal open={viewOpen} onClose={() => setViewOpen(false)} truck={viewTruck} darkMode={darkMode} />

      <AnimatePresence>
        {editingTruck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingTruck(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${theme.modalBg}`}
            >
              <div className={`px-6 py-5 border-b ${theme.modalHeaderBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${theme.iconBadge}`}>
                    <PencilSquareIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${theme.titleText}`}>Edit Branch</h2>
                    <p className={`text-xs ${theme.subtleText}`}>Reassign this vehicle's branch</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className={`mb-5 rounded-xl p-4 border ${theme.panelBg}`}>
                  <p className={`text-xs mb-1 ${theme.subtleText}`}>Selected Vehicle</p>
                  <p className={`text-base font-semibold ${theme.titleText}`}>{editingTruck.plateNumber}</p>
                  {editingTruck.controlId && (
                    <p className={`text-xs mt-0.5 ${theme.subtleText}`}>Control ID: {editingTruck.controlId}</p>
                  )}
                </div>

                <label className={`text-sm font-medium block mb-2 ${theme.titleText}`}>Branch</label>
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition ${theme.inputBg}`}
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => {
                    const branchValue = b.branchName || b.branch || b.name || "Unknown Branch";
                    return (
                      <option key={b.id} value={branchValue}>
                        {branchValue}
                      </option>
                    );
                  })}
                </select>

                <div className="flex justify-end gap-3 mt-7">
                  <button
                    onClick={() => setEditingTruck(null)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateTruckBranch}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition ${theme.btnPrimary}`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && truckToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setTruckToDelete(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${theme.modalBg}`}
            >
              <div
                className={`px-6 py-5 border-b ${
                  darkMode ? "border-slate-800 bg-rose-500/10" : "border-slate-200 bg-rose-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      darkMode ? "bg-rose-500/10 border-rose-500/25 text-rose-400" : "bg-rose-100 border-rose-200 text-rose-600"
                    }`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${theme.titleText}`}>Delete Vehicle</h2>
                    <p className={`text-xs ${theme.subtleText}`}>This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className={`rounded-xl border p-4 mb-5 ${theme.panelBg}`}>
                  <p className={`text-xs mb-1 ${theme.subtleText}`}>Selected Vehicle</p>
                  <p className={`text-base font-semibold ${theme.titleText}`}>{truckToDelete.plateNumber}</p>
                  <p className={`text-sm mt-0.5 ${theme.subtleText}`}>{truckToDelete.clientName}</p>
                  {truckToDelete.controlId && (
                    <p className={`text-xs mt-1 ${theme.subtleText}`}>Control ID: {truckToDelete.controlId}</p>
                  )}
                </div>

                <p className={`text-sm ${theme.subtleText}`}>
                  This permanently removes the vehicle record and its QR code.
                </p>

                <div className="flex justify-end gap-3 mt-7">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setTruckToDelete(null);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium transition ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteTruck}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition ${theme.btnDanger}`}
                  >
                    Delete Vehicle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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