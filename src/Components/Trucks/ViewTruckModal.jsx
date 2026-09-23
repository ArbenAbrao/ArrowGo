import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowDownTrayIcon,
  CameraIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

// ---- helpers -----------------------------------------------------------
function getRenewalStatus(nextRenewalDate) {
  if (!nextRenewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(nextRenewalDate);
  if (Number.isNaN(renewal.getTime())) return null;

  const diffDays = Math.round((renewal - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue by ${Math.abs(diffDays)}d`, tone: "rose" };
  }
  if (diffDays <= 30) {
    return { label: `Due in ${diffDays}d`, tone: "amber" };
  }
  return { label: `Renews ${renewal.toLocaleDateString()}`, tone: "emerald" };
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function getHelpers(log) {
  const raw = Array.isArray(log.helpers) ? log.helpers : log.helpers ?? log.helper;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const LOG_COLUMNS = [
  { label: "Bay", key: "bay" },
  { label: "Driver", key: "driver" },
  { label: "Helpers", key: null },
  { label: "Purpose", key: "purpose" },
  { label: "Date", key: "date" },
  { label: "In", key: "timeIn" },
  { label: "Out", key: "timeOut" },
  { label: "Out Date", key: "timeOutDate" },
];

export default function ViewTruckModal({ open, onClose, truck, darkMode = true }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const canManage = userRole === "Admin" || userRole === "IT";

  const [logs, setLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [activeTab, setActiveTab] = useState("info");
  const [showProfile, setShowProfile] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const exportRef = useRef(null);

  const FRONTEND_URL = window.location.origin;
  const defaultTruckImage = "/images/truck-placeholder.png";

  useEffect(() => {
    if (!open) {
      setShowActions(false);
      setImagePreview(null);
    }
  }, [open]);

  useEffect(() => {
    if (!truck) return;
    const fetchTruckLogs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/trucks`);
        setLogs(res.data.filter((t) => t.plateNumber === truck.plateNumber));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTruckLogs();
  }, [truck]);

  const sortedLogs = useMemo(() => {
    const sorted = [...logs];
    if (!sortConfig.key) return sorted;
    sorted.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (["date", "timeOutDate"].includes(sortConfig.key)) {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [logs, sortConfig]);

  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (!truck) return null;

  // truck.id is the clients table primary key — the same id VehicleManagement's
  // table uses for edit/delete/QR — so it's used directly here instead of the
  // old clientTruckId lookup, which relied on a plate-number match that could
  // silently fail to populate.
  const truckDetailsURL = `${FRONTEND_URL}/truck-details/${truck.plateNumber}`;
  const imageSrc = imagePreview || (truck.imageUrl ? `${API_URL}${truck.imageUrl}` : defaultTruckImage);

  const renewal = getRenewalStatus(truck.nextRenewalDate);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      if (!truck.id) throw new Error("Vehicle ID is missing");
      const formData = new FormData();
      formData.append("truckImage", file);
      const res = await axios.put(`${API_URL}/api/clients/${truck.id}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.imageUrl) {
        setImagePreview(`${API_URL}${res.data.imageUrl}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.error || "Image upload failed");
      setImagePreview(truck.imageUrl || defaultTruckImage);
    } finally {
      setUploading(false);
    }
  };

  const handleExportPNG = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 3 });
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `Vehicle_${truck.controlId || truck.plateNumber}.png`;
    link.click();
  };

  /* ================= THEME ================= */
  // Same token family used across VehicleManagement.jsx / trucks.jsx.
  const theme = darkMode
    ? {
        modalBg: "bg-slate-900 border-slate-800 text-slate-100",
        headerBg: "border-slate-800 bg-slate-900",
        panelBg: "bg-slate-950/40 border-slate-800",
        fieldBg: "bg-slate-800/50 border-slate-800",
        subtleText: "text-slate-500",
        titleText: "text-slate-100",
        tabBg: "bg-slate-800/60",
        tabActive: "bg-emerald-500 text-slate-950",
        tabInactive: "text-slate-400 hover:text-slate-200",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        tableHeadBg: "bg-slate-900 text-slate-400 border-slate-800",
        rowBorder: "border-slate-800",
        rowHover: "hover:bg-slate-800/40",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
        btnSecondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
      }
    : {
        modalBg: "bg-white border-slate-200 text-slate-900",
        headerBg: "border-slate-200 bg-white",
        panelBg: "bg-slate-50 border-slate-200",
        fieldBg: "bg-white border-slate-200",
        subtleText: "text-slate-500",
        titleText: "text-slate-900",
        tabBg: "bg-slate-100",
        tabActive: "bg-emerald-500 text-white",
        tabInactive: "text-slate-500 hover:text-slate-700",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        tableHeadBg: "bg-slate-100 text-slate-600 border-slate-200",
        rowBorder: "border-slate-200",
        rowHover: "hover:bg-emerald-50/60",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        btnSecondary: "border border-slate-300 text-slate-700 hover:bg-slate-100",
      };

  const tonePill = {
    emerald: darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    amber: darkMode ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600",
    rose: darkMode ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600",
  };

  const statusPill =
    truck.status === "Paid"
      ? tonePill.emerald
      : darkMode
      ? "bg-slate-700/60 text-slate-300"
      : "bg-slate-100 text-slate-600";

  const vehicleFields = [
    ["Client Name", truck.clientName],
    ["Branch Registered", truck.branchRegistered],
    ["Vehicle Type", truck.truckType],
    ["Plate Number", truck.plateNumber],
    ["Brand", truck.brandName],
    ["Model", truck.model],
    ["Fuel Type", truck.fuelType],
    ["Displacement", truck.displacement],
    ["Payload Capacity", truck.payloadCapacity],
  ];

  const registrationFields = [
    ["Control ID", truck.controlId],
    ["Registered Name", truck.registeredName],
    ["OR No.", truck.orNo],
    ["CR No.", truck.crNo],
    ["AR No.", truck.arNo],
    ["Registration Date", formatDate(truck.registrationDate)],
    ["Next Renewal Date", formatDate(truck.nextRenewalDate)],
    ["Price", truck.price !== undefined && truck.price !== null && truck.price !== "" ? `₱${truck.price}` : "—"],
  ];

  const Field = ({ label, value }) => (
    <div className={`p-4 rounded-xl border ${theme.fieldBg}`}>
      <p className={`text-xs mb-1 ${theme.subtleText}`}>{label}</p>
      <p className={`font-medium break-words ${theme.titleText}`}>{value || "—"}</p>
    </div>
  );

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4"
          >
            <Dialog.Panel className={`relative w-full max-w-6xl h-[78vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${theme.modalBg}`}>
              {/* HEADER */}
              <div className={`shrink-0 flex items-center justify-between px-6 py-5 border-b ${theme.headerBg}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
                    <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
                  </span>
                  <div>
                    <h2 className={`text-lg sm:text-xl font-bold leading-tight ${theme.titleText}`}>
                      {truck.plateNumber}
                    </h2>
                    <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
                      {truck.controlId ? `Control ID ${truck.controlId}` : "Vehicle profile, logs & QR verification"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={canManage ? handleExportPNG : undefined}
                    disabled={!canManage}
                    title={!canManage ? "Only Admin or IT can export stickers" : "Export sticker sheet"}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      canManage
                        ? theme.btnPrimary
                        : darkMode
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export PNG
                  </button>

                  <button
                    onClick={onClose}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition ${
                      darkMode ? "bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400" : "bg-slate-100 hover:bg-rose-100 hover:text-rose-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
                {/* LEFT: Profile + QR — stays fixed, does not scroll */}
                <div className={`flex flex-row items-start justify-center gap-5 w-full lg:flex-col lg:items-center lg:w-[280px] shrink-0 rounded-2xl p-5 border overflow-y-auto lg:overflow-visible ${theme.panelBg}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      onClick={() => setShowActions((prev) => !prev)}
                      className="group relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden border-4 border-white/10 shadow-xl cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      <img src={imageSrc} alt="Vehicle" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm z-10">
                          Uploading...
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div
                        className={`absolute inset-0 z-20 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity ${
                          showActions ? "opacity-100" : "opacity-0"
                        } lg:opacity-0 lg:hover:opacity-100`}
                      >
                        <button
                          onClick={canManage ? (e) => { e.stopPropagation(); handleImageClick(); } : undefined}
                          disabled={!canManage}
                          title={!canManage ? "Only Admin or IT can upload photo" : ""}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            canManage ? "bg-white text-slate-900 active:scale-95" : "bg-slate-400 text-slate-600 cursor-not-allowed"
                          }`}
                        >
                          <CameraIcon className="w-3.5 h-3.5" />
                          Upload
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold active:scale-95"
                        >
                          <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                          Expand
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusPill}`}>
                        {truck.status || "Not Paid"}
                      </span>
                      {renewal && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tonePill[renewal.tone]}`}>
                          {renewal.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`w-full rounded-2xl border p-4 flex flex-col items-center ${theme.fieldBg}`}>
                    <a href={truckDetailsURL} target="_blank" rel="noopener noreferrer">
                      <QRCodeCanvas value={truckDetailsURL} size={104} bgColor="transparent" fgColor={darkMode ? "#e2e8f0" : "#0f172a"} />
                    </a>
                    <p className={`text-xs mt-3 text-center ${theme.subtleText}`}>Scan to view this vehicle</p>
                    <a
                      href={truckDetailsURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hidden lg:block mt-3 w-full text-center px-4 py-2 rounded-xl text-sm font-medium transition ${theme.btnPrimary}`}
                    >
                      Open Full Details
                    </a>
                  </div>
                </div>

                {/* RIGHT: Tabs — scrolls independently */}
                <div className="flex-1 min-h-0 flex flex-col gap-4 w-full min-w-0">
                  <div className={`shrink-0 flex gap-1.5 p-1.5 rounded-xl w-fit ${theme.tabBg}`}>
                    <button
                      onClick={() => setActiveTab("info")}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        activeTab === "info" ? theme.tabActive : theme.tabInactive
                      }`}
                    >
                      Info
                    </button>
                    <button
                      onClick={() => setActiveTab("logs")}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        activeTab === "logs" ? theme.tabActive : theme.tabInactive
                      }`}
                    >
                      Logs ({logs.length})
                    </button>
                  </div>

                  <div className="relative flex-1 min-h-0 overflow-y-auto pr-1">
                    <AnimatePresence mode="wait">
                      {activeTab === "info" ? (
                        <motion.div
                          key="info"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-6"
                        >
                          <div>
                            <p className={`text-xs font-semibold mb-2 ${theme.subtleText}`}>Vehicle Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {vehicleFields.map(([label, value]) => (
                                <Field key={label} label={label} value={value} />
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className={`text-xs font-semibold mb-2 ${theme.subtleText}`}>Registration & Compliance</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {registrationFields.map(([label, value]) => (
                                <Field key={label} label={label} value={value} />
                              ))}
                            </div>
                            {truck.remarks && (
                              <div className={`mt-3 p-4 rounded-xl border ${theme.fieldBg}`}>
                                <p className={`text-xs mb-1 ${theme.subtleText}`}>Remarks</p>
                                <p className={`text-sm whitespace-pre-wrap ${theme.titleText}`}>{truck.remarks}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="logs"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.15 }}
                          className={`rounded-xl border overflow-x-auto ${theme.rowBorder}`}
                        >
                          <table className="w-full min-w-[640px] text-sm">
                            <thead>
                              <tr className={`border-b ${theme.tableHeadBg}`}>
                                {LOG_COLUMNS.map(({ label, key }) => (
                                  <th
                                    key={label}
                                    onClick={() => handleSort(key)}
                                    className={`px-3 py-2.5 text-left ${key ? "cursor-pointer select-none" : ""}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {label}
                                      {key && sortConfig.key === key && (
                                        sortConfig.direction === "asc" ? (
                                          <ArrowUpIcon className="w-3.5 h-3.5" />
                                        ) : (
                                          <ArrowDownIcon className="w-3.5 h-3.5" />
                                        )
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sortedLogs.map((log, i) => {
                                const helpersList = getHelpers(log);
                                return (
                                  <tr key={i} className={`border-b last:border-0 ${theme.rowBorder} ${theme.rowHover}`}>
                                    <td className="px-3 py-2.5">{log.bay || "—"}</td>
                                    <td className="px-3 py-2.5">{log.driver || "—"}</td>
                                    <td className="px-3 py-2.5">{helpersList.length > 0 ? helpersList.join(", ") : "—"}</td>
                                    <td className="px-3 py-2.5">{log.purpose || "—"}</td>
                                    <td className="px-3 py-2.5">{formatDate(log.date)}</td>
                                    <td className="px-3 py-2.5">{log.timeIn || "—"}</td>
                                    <td className="px-3 py-2.5">{log.timeOut || "—"}</td>
                                    <td className="px-3 py-2.5">{formatDate(log.timeOutDate)}</td>
                                  </tr>
                                );
                              })}

                              {sortedLogs.length === 0 && (
                                <tr>
                                  <td colSpan={8} className={`px-3 py-8 text-center ${theme.subtleText}`}>
                                    No Time In / Time Out logs for this vehicle yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* PROFILE PREVIEW */}
              <AnimatePresence>
                {showProfile && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative w-full max-w-sm sm:max-w-md h-auto"
                    >
                      <img src={imageSrc} alt="Vehicle large" className="w-full h-auto object-cover rounded-2xl shadow-2xl" />
                      <button
                        onClick={() => setShowProfile(false)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 text-white flex items-center justify-center text-lg"
                      >
                        ✕
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* HIDDEN EXPORT LAYOUT — physical sticker sheet, brand colors intentionally
                  independent of app theme since this is a printed artifact */}
              <div
                ref={exportRef}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: "0",
                  width: "297mm",
                  height: "210mm",
                  background: "#ffffff",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: "15mm",
                  padding: "15mm",
                  boxSizing: "border-box",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {[1, 2, 3, 4].map((_, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#ffffff",
                      border: "5px solid #173597",
                      borderRadius: "20px",
                      padding: "22px 22px 28px 22px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "22px",
                        background: "linear-gradient(90deg, #173597, #1f4bc1, #30880c, #1f4bc1, #173597)",
                      }}
                    />

                    <img
                      src="/logo11.png"
                      alt="Watermark"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "65%",
                        opacity: 0.04,
                        pointerEvents: "none",
                      }}
                    />

                    <div style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "12px", zIndex: 2 }}>
                      <img src="/logo11.png" alt="Logo" style={{ height: "45px" }} />
                      <div style={{ fontSize: "0.95rem", fontWeight: "bold", letterSpacing: "2px", color: "#173597" }}>
                        OFFICIAL VEHICLE IDENTIFICATION
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginTop: "10px", zIndex: 2 }}>
                      <div style={{ fontSize: "3rem", fontWeight: "900", letterSpacing: "5px", color: "#1f4bc1" }}>
                        {truck.controlId || "—"}
                      </div>
                      <div style={{ fontSize: "1rem", marginTop: "6px", fontWeight: "600", color: "#30880c" }}>
                        {truck.clientName || "Client Name"}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "15px", zIndex: 2 }}>
                      <div style={{ fontSize: "0.7rem", color: "#555", maxWidth: "110px" }}>
                        Scan QR to verify authenticity
                      </div>
                      <QRCodeCanvas
                        value={`Control ID: ${truck.controlId || truck.plateNumber}`}
                        size={85}
                        bgColor="#ffffff"
                        fgColor="#173597"
                        level="H"
                      />
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "40px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        letterSpacing: "1.5px",
                        color: "#173597",
                      }}
                    >
                      SERIAL NO: {`VMVAS-${truck.controlId || "0000"}-${new Date().getFullYear()}`}
                    </div>
                  </div>
                ))}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}