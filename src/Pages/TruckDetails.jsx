import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TruckIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const BACKEND_URL = process.env.REACT_APP_API_URL;

/* ================= HELPERS ================= */

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

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

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

/* ================= THEME ================= */
// Clean, light "profile" theme: white surfaces, soft neutral fields,
// a single emerald accent for status/primary actions. This page is public
// (scanned via QR, no theme toggle available) so it stays fixed to light.
const theme = {
  pageBg: "bg-slate-50 text-slate-600",
  card: "bg-white border border-slate-200 rounded-2xl",
  titleText: "text-slate-900",
  subtleText: "text-slate-500",
  mutedText: "text-slate-400",
  tile: "bg-slate-50 rounded-xl",
  fieldCard: "bg-white border border-slate-200 rounded-xl",
  tableHeadBg: "bg-slate-50 text-slate-400 border-slate-200",
  rowBorder: "border-slate-100",
  rowHover: "hover:bg-slate-50",
  btnPrimary: "bg-emerald-600 text-white hover:bg-emerald-700",
  btnSecondary: "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50",
  chipBg: "bg-slate-100",
};

const tonePill = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

export default function TruckDetails() {
  const { plateNumber } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientRes = await axios.get(`${BACKEND_URL}/api/clients`);
        const normalize = (str) => str?.replace(/\s+/g, "").replace(/-/g, "").toUpperCase();

        const foundClient = clientRes.data.find(
          (c) => normalize(c.plateNumber) === normalize(plateNumber)
        );
        if (!foundClient) {
          alert("Client not found!");
          navigate("/", { replace: true });
          return;
        }
        setClient(foundClient);

        const trucksRes = await axios.get(`${BACKEND_URL}/api/trucks`);
        const truckLogs = trucksRes.data.filter((t) => t.plateNumber === plateNumber);
        setLogs(truckLogs || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load truck details");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [plateNumber, navigate]);

  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortConfig.key) return 0;
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

  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedLogs.length / rowsPerPage) || 1;
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.pageBg}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
          <p className={`text-sm ${theme.subtleText}`}>Loading vehicle details...</p>
        </div>
      </div>
    );
  }
  if (!client) return null;

  const imageSrc = client.imageUrl ? `${BACKEND_URL}${client.imageUrl}` : "/images/truck-placeholder.png";

  const vehicleFields = [
    ["Client Name", client.clientName],
    ["Branch Registered", client.branchRegistered],
    ["Vehicle Type", client.truckType],
    ["Plate Number", client.plateNumber],
    ["Brand", client.brandName],
    ["Model", client.model],
    ["Fuel Type", client.fuelType],
    ["Displacement", client.displacement],
    ["Payload Capacity", client.payloadCapacity],
  ];

  const registrationFields = [
    ["Control ID", client.controlId],
    ["Registered Name", client.registeredName],
    ["OR No.", client.orNo],
    ["CR No.", client.crNo],
    ["AR No.", client.arNo],
    ["Registration Date", formatDate(client.registrationDate)],
    ["Next Renewal Date", formatDate(client.nextRenewalDate)],
    ["Price", client.price !== undefined && client.price !== null && client.price !== "" ? `₱${client.price}` : "—"],
  ];

  const totalDrivers = [...new Set(logs.map((l) => l.driver).filter(Boolean))].length;
  const totalLogs = logs.length;
  const renewal = getRenewalStatus(client.nextRenewalDate);

  const statusPillClass =
    client.status === "Paid" ? tonePill.emerald : "bg-slate-100 text-slate-500";

  const Field = ({ label, value }) => (
    <div className={`p-3.5 ${theme.fieldCard}`}>
      <p className={`text-xs mb-1 ${theme.mutedText}`}>{label}</p>
      <p className={`text-sm font-medium break-words ${theme.titleText}`}>{value || "—"}</p>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans ${theme.pageBg}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .page-title { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 text-sm ${theme.subtleText}`}>
            <TruckIcon className="w-4 h-4 text-emerald-600" />
            Vehicle verification
          </div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusPillClass}`}>
            {client.status || "Not Paid"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-3">
              {/* PROFILE CARD */}
              <div className={`${theme.card} p-6`}>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={imageSrc}
                    alt="Vehicle"
                    onClick={() => setShowProfile(true)}
                    className="w-28 h-28 rounded-2xl object-cover bg-slate-100 cursor-pointer mb-3"
                  />
                  <h1 className={`page-title text-xl font-bold ${theme.titleText}`}>
                    {client.clientName}
                  </h1>
                  <p className={`text-sm mt-0.5 ${theme.subtleText}`}>
                    {client.brandName || "—"} {client.model || ""} · {client.truckType || "—"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs ${theme.chipBg} ${theme.subtleText}`}>
                      Plate {client.plateNumber}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-xs ${theme.chipBg} ${theme.subtleText}`}>
                      {client.branchRegistered || "—"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowQR(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    Show QR code
                  </button>
                </div>
              </div>

              {/* STAT TILES */}
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                <div className={`${theme.tile} p-3.5 lg:flex lg:items-center lg:justify-between`}>
                  <p className={`text-xs flex items-center gap-1 mb-1 lg:mb-0 ${theme.subtleText}`}>
                    <ClipboardDocumentListIcon className="w-3.5 h-3.5" /> Logs
                  </p>
                  <p className={`text-xl font-semibold ${theme.titleText}`}>{totalLogs}</p>
                </div>
                <div className={`${theme.tile} p-3.5 lg:flex lg:items-center lg:justify-between`}>
                  <p className={`text-xs flex items-center gap-1 mb-1 lg:mb-0 ${theme.subtleText}`}>
                    <UsersIcon className="w-3.5 h-3.5" /> Drivers
                  </p>
                  <p className={`text-xl font-semibold ${theme.titleText}`}>{totalDrivers}</p>
                </div>
                <div className={`${theme.tile} p-3.5 lg:flex lg:items-center lg:justify-between`}>
                  <p className={`text-xs mb-1 lg:mb-0 ${theme.subtleText}`}>Renewal</p>
                  <p className={`text-sm font-semibold ${renewal ? tonePill[renewal.tone].split(" ")[1] : theme.titleText}`}>
                    {renewal ? renewal.label : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">
            {/* VEHICLE DETAILS */}
            <div>
              <h2 className={`text-sm font-semibold mb-3 ${theme.titleText}`}>Vehicle details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {vehicleFields.map(([label, value]) => (
                  <Field key={label} label={label} value={value} />
                ))}
              </div>
            </div>

            {/* REGISTRATION */}
            <div>
              <h2 className={`text-sm font-semibold mb-3 ${theme.titleText}`}>Registration &amp; compliance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {registrationFields.map(([label, value]) => (
                  <Field key={label} label={label} value={value} />
                ))}
              </div>
              {client.remarks && (
                <div className={`mt-2.5 p-3.5 ${theme.fieldCard}`}>
                  <p className={`text-xs mb-1 ${theme.mutedText}`}>Remarks</p>
                  <p className={`text-sm whitespace-pre-wrap ${theme.titleText}`}>{client.remarks}</p>
                </div>
              )}
            </div>

            {/* LOGS */}
            <div>
              <h2 className={`text-sm font-semibold mb-3 ${theme.titleText}`}>Time in / time out logs</h2>

              <div className={`${theme.card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[640px] text-sm">
                    <thead>
                      <tr className={`border-b ${theme.tableHeadBg}`}>
                        {LOG_COLUMNS.map(({ label, key }) => (
                          <th
                            key={label}
                            onClick={() => handleSort(key)}
                            className={`px-3 sm:px-4 py-3 font-medium text-xs ${key ? "cursor-pointer select-none" : ""}`}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {key && sortConfig.key === key && (
                                sortConfig.direction === "asc" ? (
                                  <ArrowUpIcon className="w-3 h-3" />
                                ) : (
                                  <ArrowDownIcon className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {paginatedLogs.map((log, i) => {
                          const helpersList = getHelpers(log);
                          return (
                            <motion.tr
                              key={i}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className={`border-b last:border-0 ${theme.rowBorder} ${theme.rowHover} transition-colors`}
                            >
                              <td className="px-3 sm:px-4 py-2.5">{log.bay || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{log.driver || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{helpersList.length > 0 ? helpersList.join(", ") : "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{log.purpose || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{formatDate(log.date)}</td>
                              <td className="px-3 sm:px-4 py-2.5">{log.timeIn || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{log.timeOut || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">{formatDate(log.timeOutDate)}</td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>

                      {paginatedLogs.length === 0 && (
                        <tr>
                          <td colSpan={8} className={`px-4 py-10 text-center text-sm ${theme.subtleText}`}>
                            No time in / time out logs for this vehicle yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {sortedLogs.length > rowsPerPage && (
                  <div className={`flex flex-wrap justify-center items-center gap-2 py-3.5 border-t ${theme.rowBorder}`}>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition ${theme.btnSecondary}`}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => goToPage(i + 1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          currentPage === i + 1 ? theme.btnPrimary : theme.btnSecondary
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition ${theme.btnSecondary}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-400 pt-10 pb-4">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-slate-500">Arrowgo-Logistics Inc.</span>. All rights reserved.
        </div>
      </div>

      {/* PHOTO MODAL */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md h-auto"
            >
              <img src={imageSrc} alt="Vehicle large" className="w-full h-auto object-cover rounded-2xl shadow-xl" />
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white text-slate-600 flex items-center justify-center shadow"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-64 h-64 bg-white rounded-2xl flex items-center justify-center shadow-xl"
            >
              <QRCodeCanvas value={`${window.location.origin}/truck-details/${client.plateNumber}`} size={200} />
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}