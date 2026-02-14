import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";

export default function ViewTruckModal({ open, onClose, truck, darkMode = false }) {
  const [logs, setLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [activeTab, setActiveTab] = useState("info");
  const [showProfile, setShowProfile] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const exportRef = useRef(null); // <-- Ref for export

  const FRONTEND_URL = window.location.origin;
  const defaultTruckImage = "/images/truck-placeholder.png";

  useEffect(() => {
    if (!open) setShowActions(false);
  }, [open]);

  useEffect(() => {
    if (!truck) return;
    const fetchTruckLogs = async () => {
      try {
        const res = await axios.get("https://tmvasm.arrowgo-logistics.com/api/trucks");
        const truckLogs = res.data.filter(t => t.plateNumber === truck.plateNumber);
        setLogs(truckLogs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTruckLogs();
  }, [truck]);

  useEffect(() => {
    if (!truck) return;
    if (!truck.clientTruckId) {
      const fetchClientId = async () => {
        try {
          const res = await axios.get("https://tmvasm.arrowgo-logistics.com/api/clients");
          const client = res.data.find(c => c.plateNumber === truck.plateNumber);
          if (client) truck.clientTruckId = client.id;
        } catch (err) {
          console.error("Failed to fetch client ID:", err);
        }
      };
      fetchClientId();
    }
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
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (!truck) return null;

  const truckDetailsURL = `${FRONTEND_URL}/truck-details/${truck.plateNumber}`;
  const imageSrc = imagePreview || truck.imageUrl || defaultTruckImage;

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const truckId = truck.clientTruckId;
      if (!truckId) throw new Error("Client ID is missing");
      const formData = new FormData();
      formData.append("truckImage", file);
      const res = await axios.put(
        `https://tmvasm.arrowgo-logistics.com/api/clients/${truckId}/upload-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data?.imageUrl) setImagePreview(res.data.imageUrl);
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
    const canvas = await html2canvas(exportRef.current, { scale: 3 }); // higher resolution
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `Truck_${truck.clientTruckId || truck.plateNumber}.png`;
    link.click();
  };

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        rowEven: "bg-gray-800",
        rowOdd: "bg-gray-900",
        rowHover: "hover:bg-cyan-500/20",
        tableHeader: "bg-gray-800 text-cyan-300 border-b border-cyan-400/40",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        rowEven: "bg-gray-50",
        rowOdd: "bg-white",
        rowHover: "hover:bg-indigo-50",
        tableHeader: "bg-gray-100 text-gray-900 border-b border-gray-300",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
      };

  const tableRowVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const clientDetails = [
    ["Client Name", truck.clientName],
    ["Client ID", truck.clientTruckId],
    ["Branch Registered", truck.branchRegistered || "—"],
    ["Truck Type", truck.truckType],
    ["Plate Number", truck.plateNumber],
    ["Brand", truck.brandName || "—"],
    ["Model", truck.model || "—"],
    ["Fuel Type", truck.fuelType || "—"],
    ["Displacement", truck.displacement || "—"],
    ["Payload Capacity", truck.payloadCapacity || "—"],
  ];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-5xl lg:max-w-6xl rounded-2xl shadow-2xl overflow-hidden ${theme.modalBg}`}
              >
                {/* HEADER */}
                <div className={`flex justify-between items-center px-4 sm:px-6 py-3 ${theme.headerBg}`}>
                  <h2 className="text-xl sm:text-2xl font-bold">Truck Profile</h2>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleExportPNG}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      Export PNG
                    </button>
                    <button onClick={onClose} className="text-2xl font-bold">✕</button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-4">
                  {/* LEFT: Profile + QR */}
                  <div className="flex flex-row items-start justify-center gap-6 w-full lg:flex-col lg:items-center lg:justify-center lg:w-1/3">
                    {/* Profile */}
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs text-gray-500 lg:hidden">Truck Photo</p>
                      <div
                        onClick={() => setShowActions((prev) => !prev)}
                        className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl overflow-hidden border shadow relative flex-shrink-0 cursor-pointer"
                      >
                        <img src={imageSrc} alt="Truck Profile" className="w-full h-full object-cover" />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm z-10">
                            Uploading...
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div
                          className={`
                            absolute inset-0 z-20 bg-black/40
                            flex flex-col items-center justify-center gap-2
                            transition-opacity
                            ${showActions ? "opacity-100" : "opacity-0"}
                            lg:opacity-0 lg:hover:opacity-100
                          `}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImageClick(); }}
                            className="px-3 py-1 bg-white text-gray-900 rounded text-xs sm:text-sm font-semibold active:scale-95"
                          >
                            Upload Photo
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
                            className="px-3 py-1 bg-white text-gray-900 rounded text-xs sm:text-sm font-semibold active:scale-95"
                          >
                            See Profile
                          </button>
                        </div>
                      </div>

                      {/* Client ID */}
                      {truck.clientTruckId && (
                        <p className="mt-1 text-sm text-gray-400 lg:block hidden">Client ID: {truck.clientTruckId}</p>
                      )}
                    </div>

                    {/* QR */}
                    <div className="flex flex-col items-center gap-2 mt-4 lg:mt-0">
                      <p className="text-xs text-gray-500 lg:hidden">Truck QR Code</p>
                      <a href={truckDetailsURL} target="_blank" rel="noopener noreferrer">
                        <QRCodeCanvas value={truckDetailsURL} size={100} />
                      </a>
                      {truck.clientTruckId && (
                        <p className="text-xs text-gray-400 mt-1 lg:block hidden">Client ID: {truck.clientTruckId}</p>
                      )}
                      <a
                        href={truckDetailsURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`lg:block hidden mt-2 px-4 py-2 rounded ${theme.btnPrimary} transition text-sm text-center`}
                      >
                        View Full Details
                      </a>
                    </div>
                  </div>

                  {/* RIGHT: Tabs */}
                  <div className="flex-1 flex flex-col gap-4 w-full lg:w-2/3">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab("info")}
                        className={`px-4 py-2 font-semibold flex-shrink-0 ${
                          activeTab === "info"
                            ? "border-b-2 border-indigo-500 dark:border-cyan-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Info
                      </button>
                      <button
                        onClick={() => setActiveTab("logs")}
                        className={`px-4 py-2 font-semibold flex-shrink-0 ${
                          activeTab === "logs"
                            ? "border-b-2 border-indigo-500 dark:border-cyan-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Logs
                      </button>
                    </div>

                    {/* Animated Tab Content */}
                    <div className="relative mt-4 w-full flex-1 min-h-[300px] overflow-hidden">
                      {/* INFO */}
                      <motion.div
                        key="info"
                        animate={{ x: activeTab === "info" ? 0 : "-100%" }}
                        initial={{ x: activeTab === "info" ? 0 : "-100%" }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="absolute top-0 left-0 w-full h-full overflow-y-auto"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {clientDetails.map(([label, value]) => (
                            <div
                              key={label}
                              className={`p-3 rounded-lg border ${
                                darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <p className="text-gray-400 text-sm">{label}</p>
                              <p className="font-semibold text-lg break-words">{value || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* LOGS */}
                      <motion.div
                        key="logs"
                        animate={{ x: activeTab === "logs" ? 0 : "100%" }}
                        initial={{ x: activeTab === "logs" ? 0 : "100%" }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="absolute top-0 left-0 w-full h-full overflow-x-auto overflow-y-auto"
                      >
                        <table className="w-full min-w-[600px] text-sm">
                          <thead className={`${theme.tableHeader} sticky top-0 z-10`}>
                            <tr>
                              {["Bay", "Driver", "Purpose", "Date", "In", "Out", "Out Date"].map((h) => (
                                <th
                                  key={h}
                                  onClick={() => handleSort(h.toLowerCase().replace(/\s+/g, ""))}
                                  className="border px-3 py-2 cursor-pointer select-none"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedLogs.map((log, i) => (
                              <motion.tr
                                key={i}
                                variants={tableRowVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`${i % 2 === 0 ? theme.rowEven : theme.rowOdd} ${theme.rowHover}`}
                              >
                                <td className="border px-3 py-2">{log.bay}</td>
                                <td className="border px-3 py-2">{log.driver}</td>
                                <td className="border px-3 py-2">{log.purpose}</td>
                                <td className="border px-3 py-2">{log.date ? new Date(log.date).toLocaleDateString() : "-"}</td>
                                <td className="border px-3 py-2">{log.timeIn || "-"}</td>
                                <td className="border px-3 py-2">{log.timeOut || "-"}</td>
                                <td className="border px-3 py-2">{log.timeOutDate ? new Date(log.timeOutDate).toLocaleDateString() : "-"}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    </div>

                    <button
                      onClick={onClose}
                      className={`w-full mt-4 py-2 rounded ${theme.btnPrimary} transition`}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* PROFILE PREVIEW MODAL */}
                {showProfile && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative w-full max-w-sm sm:max-w-md h-auto"
                    >
                      <img
                        src={imageSrc}
                        alt="Truck Profile Large"
                        className="w-full h-auto object-cover rounded-xl shadow-lg"
                      />
                      <button
                        onClick={() => setShowProfile(false)}
                        className="absolute top-2 right-2 text-white text-2xl font-bold"
                      >
                        ✕
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* HIDDEN EXPORT LAYOUT */}
                <div
                  ref={exportRef}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    top: "0",
                    width: "210mm",
                    height: "297mm",
                    background: "#fff",
                    padding: "40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: "12px",
                    boxSizing: "border-box",
                  }}
                >
                  <img
                    src="/logo11.png"
                    alt="Logo"
                    style={{ width: "120px", height: "120px", objectFit: "contain", marginBottom: "32px" }}
                  />
                  <h2 style={{ fontSize: "3.8rem", fontWeight: "bold", textAlign: "center", marginBottom: "16px" }}>
                    {truck.clientName || '("Client Name")'}
                  </h2>
                  <div style={{ fontSize: "2.5rem", fontWeight: "bold", textAlign: "center", marginBottom: "32px" }}>
                    Vehicle ID
                  </div>
                  <div style={{ fontSize: "4.5rem", fontWeight: "bold", textAlign: "center", marginBottom: "32px" }}>
                    {truck.clientTruckId || "—"}
                  </div>
                  <div style={{ fontSize: "4.5rem", fontWeight: "bold", textAlign: "center", marginBottom: "32px" }}>
                  </div><div style={{ fontSize: "4.5rem", fontWeight: "bold", textAlign: "center", marginBottom: "32px" }}>
                  </div>
                  <div style={{ display: "flex", gap: "40px", justifyContent: "center", alignItems: "center" }}>
                    <img
                      src={imagePreview || truck.imageUrl || "/images/truck-placeholder.png"}
                      alt="Truck"
                      style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "12px", border: "1px solid #ccc" }}
                    />
                    <QRCodeCanvas
                      value={`${FRONTEND_URL}/truck-details/${truck.plateNumber}`}
                      size={200}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Dialog>
    </Transition>
  );
}
