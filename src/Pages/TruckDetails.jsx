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

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const FRONTEND_URL = window.location.origin;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientRes = await axios.get(`/api/clients`);
        const foundClient = clientRes.data.find((c) => c.plateNumber === plateNumber);
        if (!foundClient) {
          alert("Client not found!");
          navigate("/trucks");
          return;
        }
        setClient(foundClient);

        const trucksRes = await axios.get(`/api/trucks`);
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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading)
    return <p className="p-6 text-center text-gray-700 text-lg">Loading...</p>;
  if (!client) return null;

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gradient-to-r from-green-400 via-blue-300 to-green-200">
      {/* LOGO + CLIENT ID */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 md:gap-12">
        <img
          src="/logo9.jpg"
          alt="Logo"
          className="w-40 md:w-48 h-auto"
          style={{ filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))" }}
        />
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 text-center md:text-left drop-shadow-sm">
          Client ID: {client.id}
        </h1>
      </div>

      {/* PROFILE CARD */}
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center w-full md:w-1/3 bg-gray-50 p-4 rounded-xl shadow-inner">
          <QRCodeCanvas
            id={`truck-qr-${client.plateNumber}`}
            value={`${FRONTEND_URL}/truck-details/${client.plateNumber}`}
            size={200}
            className="mb-4"
          />
          <button
            onClick={() => {
              const canvas = document.getElementById(`truck-qr-${client.plateNumber}`);
              const pngUrl = canvas.toDataURL("image/png");
              const a = document.createElement("a");
              a.href = pngUrl;
              a.download = `${client.plateNumber}_QR.png`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition w-full"
          >
            Download QR
          </button>
        </div>

        <div className="flex-1 w-full bg-white p-6 rounded-xl shadow-lg flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-800">{client.plateNumber}</h2>
          <p className="text-gray-600"><span className="font-semibold">Truck Name:</span> {client.clientName}</p>
          <p className="text-gray-600"><span className="font-semibold">Truck Type:</span> {client.truckType}</p>
          <p className="text-gray-600"><span className="font-semibold">Plate Number:</span> {client.plateNumber}</p>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 drop-shadow-sm">
          History
        </h2>
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="bg-gradient-to-r from-green-400 to-blue-400 text-white sticky top-0">
              <tr>
                {["Bay","Driver","Purpose","Date","In","Out","Out Date"].map(h => (
                  <th
                    key={h}
                    onClick={() => handleSort(h.toLowerCase())}
                    className="px-4 py-3 cursor-pointer select-none text-lg font-semibold drop-shadow-sm"
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="even:bg-gray-50 odd:bg-white hover:bg-green-100 transition-colors"
                  >
                    <td className="px-4 py-3 border text-gray-800 font-medium">{log.bay}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">{log.driver}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">{log.purpose}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">{log.timeIn}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">{log.timeOut || "-"}</td>
                    <td className="px-4 py-3 border text-gray-800 font-medium">
                      {log.timeOutDate ? new Date(log.timeOutDate).toLocaleDateString() : "-"}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 text-gray-800 font-medium rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 rounded hover:bg-gray-300 ${
                currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 text-gray-800 font-medium rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
