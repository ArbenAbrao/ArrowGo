import { useState, useEffect, useMemo } from "react";
import {
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

import ViewTruckModal from "../Components/Trucks/ViewTruckModal";
import TruckManagementLayout from "../Components/Trucks/TruckManagementLayout";
import AddTruckModal from "../Components/Trucks/AddTruckModal";
import RegisterTruckModal from "../Components/Trucks/RegisterTruckModal";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";
import CompleteTrucksListModal from "../Components/Trucks/CompleteTrucksListModal";

export default function VehicleManagement({ darkMode }) {
  /* ================= STATES ================= */
  const [trucks, setTrucks] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterDate, setFilterDate] = useState(null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompleteListModalOpen, setIsCompleteListModalOpen] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTruck, setViewTruck] = useState(null);

  /* ================= FORMS ================= */
  const [registerForm, setRegisterForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
    brandName: "",
    model: "",
    fuelType: "",
    displacement: "",
    payloadCapacity: "",
    branchRegistered: "",
  });

  const [addForm, setAddForm] = useState({
    id: "",
    plateNumber: "",
    truckType: "",
    clientName: "",
    branchRegistered: "",
    bay: "",
    driver: "",
    purpose: "",
    date: null,
    timeIn: null,
  });

  /* ================= CONSTANTS ================= */
  const ITEMS_PER_PAGE = 7;

  const allBays = Array.from({ length: 10 }, (_, i) =>
    [`${i + 1}a`, `${i + 1}b`]
  ).flat();

  const occupiedBays = useMemo(
    () => trucks.filter((t) => !t.timeOut).map((t) => t.bay),
    [trucks]
  );

  /* ================= FETCH ================= */
  useEffect(() => {
    // Get trucks
    axios
      .get("http://192.168.254.126:5000/api/clients")
      .then((res) => setTrucks(res.data.sort((a, b) => a.id - b.id)))
      .catch(console.error);

    // Get clients
    axios
      .get("http://192.168.254.126:5000/api/clients")
      .then((res) => setClients(res.data))
      .catch(console.error);

    // Get branches
    axios
      .get("http://192.168.254.126:5000/api/branches")
      .then((res) => setBranches(res.data))
      .catch(console.error);
  }, []);

  

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    let data = [...trucks];

    // Branch filter
    if (selectedBranch) {
      data = data.filter((t) => t.branchRegistered === selectedBranch);
    }

    // Client filter
    if (selectedClient) {
      data = data.filter(
  (t) =>
    t.clientName?.trim().toLowerCase() ===
    selectedClient.trim().toLowerCase()
);

    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((t) =>
        `${t.id} ${t.clientName} ${t.branchRegistered} ${t.truckType} ${t.plateNumber}`
          .toLowerCase()
          .includes(term)
      );
    }

    // Sort
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
  }, [trucks, selectedClient, selectedBranch, searchTerm, sortConfig]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const data = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, selectedBranch, searchTerm]);

  /* ================= HANDLERS ================= */
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((t) => t.id));
  };

  const deleteTruck = async (id) => {
    if (!window.confirm("Delete this truck?")) return;
    await axios.delete(`http://192.168.254.126:5000/api/clients/${id}`);
    setTrucks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://192.168.254.126:5000s/api/register-truck", registerForm);
    setIsRegisterModalOpen(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://192.168.254.126:5000/api/add-truck", addForm);
    setIsAddModalOpen(false);
  };

  const exportCompleteCSV = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      trucks
        .map((t) =>
          [
            t.clientName,
            t.truckType,
            t.plateNumber,
            t.bay,
            t.driver,
            t.purpose,
          ].join(",")
        )
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "complete_trucks.csv";
    link.click();
  };

  const theme = darkMode
    ? {
        pageBg: "bg-gray-900 text-gray-100",
        tableHeader: "bg-gray-800 text-cyan-300",
        rowHover: "hover:bg-cyan-500/10",
      }
    : {
        pageBg: "bg-white text-gray-900",
        tableHeader: "bg-gray-100",
        rowHover: "hover:bg-indigo-50",
      };

  /* ================= UI ================= */
  return (
    <div className={`p-6 min-h-screen ${theme.pageBg}`}>
      <TruckManagementLayout
        darkMode={darkMode}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        setIsRegisteredModalOpen={setIsRegisteredModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
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
      <div className="hidden md:block overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm border">
          <thead className={theme.tableHeader}>
            <tr>
              <th className="p-2 text-center">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={selectedIds.length === data.length && data.length > 0}
                />
              </th>

              {[{ label: "ID", key: "id" },
                { label: "Client", key: "clientName" },
                { label: "Branch", key: "branchRegistered" },
                { label: "Type", key: "truckType" },
                { label: "Plate", key: "plateNumber" },
              ].map(({ label, key }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="p-2 cursor-pointer text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    {label}
                    {sortConfig.key === key &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      ))}
                  </div>
                </th>
              ))}

              <th className="p-2 text-center">QR</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((t) => (
              <tr key={t.id} className={theme.rowHover}>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={() => toggleSelect(t.id)}
                  />
                </td>
                <td className="border p-2">{t.id}</td>
                <td className="border p-2">{t.clientName}</td>
                <td className="border p-2">{t.branchRegistered}</td>
                <td className="border p-2">{t.truckType}</td>
                <td className="border p-2">{t.plateNumber}</td>
                <td className="border p-2 text-center">
                  <img
                    src={`/api/clients/${t.id}/qrcode`}
                    alt={`QR code for truck ${t.plateNumber}`}
                    className="w-10 mx-auto cursor-pointer hover:scale-110 transition"
                    onClick={() => {
                      setViewTruck(t);
                      setViewOpen(true);
                    }}
                  />
                </td>
                <td className="border p-2 text-center">
                  <button onClick={() => deleteTruck(t.id)}>
                    <TrashIcon className="w-5 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">
        {data.map((t) => (
          <div key={t.id} className="border rounded-xl p-4 shadow bg-white dark:bg-zinc-900">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Plate</p>
                <p className="font-semibold">{t.plateNumber}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(t.id)}
                onChange={() => toggleSelect(t.id)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p>{t.clientName}</p>
              </div>
              <div>
                <p className="text-gray-500">Branch</p>
                <p>{t.branchRegistered}</p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p>{t.truckType}</p>
              </div>
              <div>
                <p className="text-gray-500">ID</p>
                <p>{t.id}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <img
                src={`/api/clients/${t.id}/qrcode`}
                alt={`QR code for truck`}
                className="w-12 cursor-pointer hover:scale-110 transition"
                onClick={() => {
                  setViewTruck(t);
                  setViewOpen(true);
                }}
              />

              <button
                onClick={() => deleteTruck(t.id)}
                className="p-2 rounded-lg bg-red-50 text-red-600"
              >
                <TrashIcon className="w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">
        <span>
          Page <b>{currentPage}</b> of <b>{totalPages || 1}</b>
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-4 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ViewTruckModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        truck={viewTruck}
        darkMode={darkMode}
      />

      <AddTruckModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        form={addForm}
        onChange={handleAddChange}
        clients={clients}
        bays={allBays}
        occupiedBays={occupiedBays}
        darkMode={darkMode}
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
