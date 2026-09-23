// newviewmodal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import AddTruckModal from "./AddTruckModal";
import OutInTruckGrid from "./OutInTruckGrid";
import PaginationControls from "./PaginationControls";
import CompleteTrucksListModal from "./CompleteTrucksListModal";

export default function NewViewModal({ onClose, darkMode }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";

  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [bays, setBays] = useState([]);

  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);
const [selectedClient, setSelectedClient] = useState("");
const [drivers, setDrivers] = useState([]);

 const [addForm, setAddForm] = useState({
  id: "",
  clientId: "",
  vehicleId: "",
  plateNumber: "",
  truckType: "",
  clientName: "",
  branchRegistered: "",
  destinationBranch: "",
  bay: "",
  driver: "",
  helpers: [""], // ✅ // ✅ ADD THIS
  purpose: "",
  date: null,
  timeOut: null,
  timeOutDate: null, // ✅ ADD THIS
  timeIn: null,
});
  
const exportCompleteCSV = () => {
  const rows = trucks.sort((a, b) => new Date(a.date) - new Date(b.date));

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
          t.date ? new Date(t.date).toLocaleDateString("en-US") : "",
          t.timeIn || "",
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const occupiedBays = trucks.filter((t) => !t.timeOut).map((t) => t.bay);
// active outbound trucks = already timeout but not yet timein
const isOnTrip = (t) => !t.timeIn;
const activeTrucks = trucks.filter(isOnTrip);
 /* ================= FETCH DATA ================= */

  const fetchDrivers = async () => {
  try {
    const res = await axios.get(
      "http://192.168.254.148:5000/api/drivers"
    );
    setDrivers(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const fetchTrucksNewView = async () => {
    try {
      const res = await axios.get("http://192.168.254.148:5000/api/trucks");

setTrucks(
  res.data.map((t) => ({
    ...t,
    clientId: t.clientId || t.client?.id,
    activeTrucks: t.clientId
      ? [t.clientId]
      : t.client?.id
      ? [t.client.id]
      : [],
  }))
);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get(
        "http://192.168.254.148:5000/api/clients"
      );

      const clientsWithVehicleId = res.data.map((client) => ({
        ...client,
        vehicleId: `VI-${client.id.toString().padStart(4, "0")}`,
      }));

      setClients(clientsWithVehicleId);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };

  const fetchBranchesAndBays = async () => {
    try {
      const branchRes = await axios.get(
        "http://192.168.254.148:5000/api/branches"
      );
      setBranches(branchRes.data);

      const bayRes = await axios.get(
        "http://192.168.254.148:5000/api/bays"
      );

      const formatted = bayRes.data.map((b) => ({
        id: b.id,
        name: b.bayName,
        branchName: b.branchName,
      }));

      setBays(formatted);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchTrucksNewView();
    fetchClients();
    fetchBranchesAndBays();
    fetchDrivers(); // ✅ ADD THIS

  }, []);

  /* ================= FILTERS ================= */

  const filteredTrucks = trucks
  .filter((truck) => truck.timeOut && !truck.timeIn)
    .filter((truck) =>
      selectedBranch ? truck.destinationBranch === selectedBranch : true
    )
    .filter((truck) => {
      const matchesDate = filterDate
        ? new Date(truck.date).toDateString() ===
          new Date(filterDate).toDateString()
        : true;

      const matchesSearch =
        truck.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.truckType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (truck.driver &&
          truck.driver.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesDate && matchesSearch;
    });

  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);

  const paginatedTrucks = filteredTrucks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= HANDLERS ================= */

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
  const selectedClient = clients.find((c) => c.clientName === value);

  return {
    ...prev,
    clientName: value,
    clientId: selectedClient?.id || "",
    vehicleId: "",        // reset
    id: "",               // reset ID
    truckType: "",
    plateNumber: "",
  };
}
      return { ...prev, [name]: value };
    });
  };

  const handleAddSubmit = async (e) => {
  e.preventDefault();

  try {
    const now = new Date();

    const payload = {
      ...addForm,
      timeOut: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeOutDate: now.toLocaleDateString("en-CA"), // ✅ ADD THIS
    };

    await axios.post(
      "http://192.168.254.148:5000/api/add-truck-newview",
      payload
    );

      fetchTrucksNewView();

      setAddForm({
  id: "",
  plateNumber: "",
  truckType: "",
  clientName: "",
  branchRegistered: "",
  destinationBranch: "",
  bay: "",
  driver: "",
  helpers: [""], // ✅// ✅ ADD THIS
  purpose: "",
  date: null,
  timeOut: null,
  timeOutDate: null, // ✅ ADD
  timeIn: null,
});

      setIsAddModalOpen(false);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };

  /* ================= OUT-IN LOGIC ================= */

  const handleOutInAction = async (truck, action) => {
    try {
      const now = new Date();

      if (action === "TIME_OUT") {
        const timeout = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const timeOutDate = now.toLocaleDateString("en-CA");

        await axios.put(
          `http://192.168.254.148:5000/api/trucks/${truck.id}/timeout`,
          { timeOut: timeout, timeOutDate }
        );

        setTrucks((prev) =>
          prev.map((t) =>
            t.id === truck.id ? { ...t, timeOut: timeout, timeOutDate } : t
          )
        );
      }

      if (action === "TIME_IN") {
        const date = now.toLocaleDateString("en-CA");

        const timeIn = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await axios.put(
          `http://192.168.254.148:5000/api/trucks/${truck.id}/timein`,
          { date, timeIn }
        );

        setTrucks((prev) =>
          prev.map((t) => (t.id === truck.id ? { ...t, date, timeIn } : t))
        );
      }
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };


  /* ================= UI ================= */

  const containerBg = darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-900";


 return (
  <div className={`p-4 sm:p-6 min-h-screen ${containerBg}`}>
        
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
    <img
      src="/logo22.png"
      alt="Logo"
      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
    />
    <h1
      className={`text-2xl font-bold ${
        darkMode
          ? "text-cyan-400 drop-shadow-lg"
          : "text-green-500 drop-shadow-lg"
      }`}
    >
      Time-in & Time-out Management
    </h1>
  </div>

        <div
  className={`flex border rounded-full overflow-hidden text-sm h-9
    ${darkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-100"}
  `}
>
  {/* INBOUND */}
  <button
    onClick={onClose}
    className={`px-4 sm:px-6 transition font-medium
      ${
        darkMode
          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }
    `}
  >
    Inbound
  </button>

  {/* OUTBOUND */}
  <button
    className={`px-4 sm:px-6 transition font-medium
      ${
        darkMode
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }
    `}
  >
    Outbound
  </button>
</div>
      </div>

      {/* FILTER BAR */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <input
          type="text"
          placeholder="Search truck, plate, client, driver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full sm:w-72 px-3 py-2 rounded-lg border text-sm ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900"
          }`}
        />

        <select
          value={selectedBranch || ""}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className={`px-3 py-2 rounded-md text-sm ${
            darkMode
              ? "bg-gray-800 text-gray-300 border border-gray-700"
              : "bg-gray-50 text-gray-900 border border-gray-300"
          }`}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {(userRole === "Admin" || userRole === "IT" || userRole === "User") && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2 rounded-md text-sm ${
              darkMode
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Create Outbound
          </button>
        )}

        <button
  onClick={() => setIsCompleteListModalOpen(true)}
  className={`px-4 py-2 rounded-md text-sm ${
    darkMode
      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
      : "bg-indigo-500 hover:bg-indigo-600 text-white"
  }`}
>
  Completed Vehicle List
</button>
      </div>


<AnimatePresence>
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.25 }}
  >
    <OutInTruckGrid
      paginatedTrucks={paginatedTrucks}
      clients={clients}
      darkMode={darkMode}
      userRole={userRole}
      handleOutInAction={handleOutInAction}
    />
  </motion.div>
</AnimatePresence>

      <PaginationControls
        darkMode={darkMode}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
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
  mode="OUT_IN" // ✅ ADD THIS
/>
      <AddTruckModal
  open={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  onSubmit={handleAddSubmit}
  form={addForm}
  onChange={handleAddChange}
  clients={clients}
  bays={bays}
  drivers={drivers} // ADD THIS
  darkMode={darkMode}
  occupiedBays={occupiedBays} // ✅ ADD THIS
  activeTrucks={activeTrucks}
  mode="TIME_OUT"
/>
    </div> 
  );
  }