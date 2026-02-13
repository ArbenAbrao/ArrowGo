import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

export default function TruckDetails() {
  const { plateNumber } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientRes = await axios.get(`http://192.168.254.126:5000/api/clients`);
        const foundClient = clientRes.data.find((c) => c.plateNumber === plateNumber);
        if (!foundClient) {
          alert("Client not found!");
          navigate("/trucks");
          return;
        }
        setClient(foundClient);

        const trucksRes = await axios.get(`http://192.168.254.126:5000/api/trucks`);
        const truckLogs = trucksRes.data.filter((t) => t.plateNumber === plateNumber);
        setLogs(truckLogs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [plateNumber, navigate]);

  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading)
    return (
      <p className="p-6 text-center text-gray-800 text-lg font-sans">Loading...</p>
    );
  if (!client) return null;

  const imageSrc = client.imageUrl || "/images/truck-placeholder.png";

  const clientDetails = [
    ["Client Name", client.clientName],
    ["Client ID", client.id],
    ["Branch Registered", client.branchRegistered || "—"],
    ["Truck Type", client.truckType],
    ["Plate Number", client.plateNumber],
    ["Brand", client.brandName || "—"],
    ["Model", client.model || "—"],
    ["Fuel Type", client.fuelType || "—"],
    ["Displacement", client.displacement || "—"],
    ["Payload Capacity", client.payloadCapacity || "—"],
  ];

  const totalDrivers = [...new Set(logs.map(l => l.driver))].length;
  const totalLogs = logs.length;

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-r from-green-500 to-blue-400 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 px-4 sm:px-6 md:px-8">
          {/* Text Section */}
          <div className="flex-1 text-center md:text-left">
            <img
              src="/logo9.png"
              alt="Logo"
              className="w-24 sm:w-32 md:w-40 h-auto mb-4 mx-auto md:mx-0"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-lg">
              {client.clientName}
            </h1>
            <p className="mt-2 text-sm sm:text-lg font-semibold">
              Vehicle ID: <span className="font-bold">{client.id.toString().padStart(5, "0")}</span>
            </p>
            <p className="mt-1 text-sm sm:text-lg font-semibold">
              Plate Number: <span>{client.plateNumber}</span>
            </p>

            {/* Stats */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center md:justify-start gap-4 sm:gap-6">
              <div className="bg-white/20 rounded-xl px-4 py-2 shadow-md">
                <p className="text-xs sm:text-sm font-semibold text-white/90">Total Logs</p>
                <p className="font-bold text-lg sm:text-xl text-white">{totalLogs}</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 shadow-md">
                <p className="text-xs sm:text-sm font-semibold text-white/90">Total Drivers</p>
                <p className="font-bold text-lg sm:text-xl text-white">{totalDrivers}</p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 mx-auto">
            <img
              src={imageSrc}
              alt="Truck"
              className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white cursor-pointer"
              onClick={() => setShowProfile(true)}
            />
            <div
              className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 cursor-pointer"
              onClick={() => setShowQR(true)}
            >
              <QRCodeCanvas
                value={`${window.location.origin}/truck-details/${client.plateNumber}`}
                size={50}
              />
            </div>
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="max-w-6xl mx-auto mt-12 px-4 sm:px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {clientDetails.map(([label, value]) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-md p-3 sm:p-5 hover:shadow-xl transition"
          >
            <p className="text-gray-500 text-xs sm:text-sm font-semibold">{label}</p>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900 break-words">
              {value || "—"}
            </p>
          </div>
        ))}
      </div>

      {/* LOGS SECTION */}
      <div className="max-w-6xl mx-auto mt-12 px-4 sm:px-6 md:px-8 mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">Truck Logs</h2>
        <div className="overflow-x-auto rounded-xl shadow-md bg-white">
          <table className="w-full text-left border-collapse min-w-[600px] text-gray-900">
            <thead className="bg-green-500 text-white sticky top-0">
              <tr>
                {["Bay","Driver","Purpose","Date","In","Out","Out Date"].map(h => (
                  <th
                    key={h}
                    onClick={() => handleSort(h.toLowerCase())}
                    className="px-2 sm:px-4 py-2 cursor-pointer font-semibold text-xs sm:text-sm md:text-base"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginatedLogs.map((log, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="even:bg-gray-50 odd:bg-white hover:bg-green-100 transition-shadow shadow-sm"
                  >
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{log.bay}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{log.driver}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{log.purpose}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{log.timeIn}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">{log.timeOut || "-"}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm md:text-base">
                      {log.timeOutDate ? new Date(log.timeOutDate).toLocaleDateString() : "-"}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-4 py-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded hover:bg-gray-300 font-semibold ${
                  currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* TRUCK IMAGE MODAL */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-md sm:max-w-lg h-auto"
            >
              <img
                src={imageSrc}
                alt="Truck Profile Large"
                className="w-full h-auto object-cover rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-2 right-2 text-white text-3xl font-bold"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR CODE MODAL */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-2xl flex items-center justify-center shadow-2xl"
            >
              <QRCodeCanvas
                value={`${window.location.origin}/truck-details/${client.plateNumber}`}
                size={220}
              />
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-2 right-2 text-gray-800 text-3xl font-bold"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
  <footer className="relative z-10">
      {/* Animated Green Gradient for Light Mode */}
      <div
        className={`relative z-10 py-2 border-t shadow-sm `}
      >
        <div className="max-w-7xl mx-auto px-6 text-center text-xs sm:text-sm">
          © {new Date().getFullYear()}{" "}
          <span
            className={`font-semibold `}
          >
            Arrowgo-Logistics Inc.
          </span>
          . All rights reserved.
        </div>
      </div>
    </footer>
    </div>
  );
}
