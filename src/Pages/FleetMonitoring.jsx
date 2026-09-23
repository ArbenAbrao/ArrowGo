import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TruckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

// Single source of truth for the API base URL — same convention used
// across the app (see VehicleManagement.jsx).
const API_URL = process.env.REACT_APP_API_URL;

// Trucks are read from /api/clients (confirmed against trucks.jsx — same
// endpoint VehicleManagement uses), then filtered down to clientName
// "Arrowgo" only, since /api/clients also holds trucks registered for
// other clients that pass through the gate.
const ISSUES_ENDPOINT = `${API_URL}/api/fleet-issues`;

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const priorityMeta = {
  Critical: { tone: "rose", swatch: "#f43f5e" },
  High: { tone: "amber", swatch: "#f59e0b" },
  Medium: { tone: "sky", swatch: "#0ea5e9" },
  Low: { tone: "emerald", swatch: "#10b981" },
};

const initialLogForm = {
  plateNumber: "",
  branchRegistered: "",
  driver: "",
  priority: "Medium",
  issue: "",
  date: new Date().toISOString().slice(0, 10),
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function latestDate(issueList) {
  return issueList.reduce((latest, i) => {
    const d = new Date(i.date);
    if (Number.isNaN(d.getTime())) return latest;
    return !latest || d > latest ? d : latest;
  }, null);
}

export default function FleetMonitoring({ darkMode }) {
  /* ================= STATES ================= */
  const [issues, setIssues] = useState([]);
  const [fleetTrucks, setFleetTrucks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterError, setRosterError] = useState(false);
  const [issuesUnavailable, setIssuesUnavailable] = useState(false);

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState(initialLogForm);
  const [savingLog, setSavingLog] = useState(false);

  const [issueToDelete, setIssueToDelete] = useState(null);

  const [view, setView] = useState("dashboard"); // "dashboard" | "records"
  const [recordsPath, setRecordsPath] = useState([]); // [{ type: "branch"|"truck"|"year"|"month", value }]

  // --- PDF records (Records > Branch > Truck > Year > Month) ---
  const [monthRecords, setMonthRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const fileInputRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const canManage = userRole === "Admin" || userRole === "IT";

  /* ================= FETCH ================= */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const roster = Promise.all([
      axios.get(`${API_URL}/api/clients`),
      axios.get(`${API_URL}/api/branches`),
    ]);

    const issuesRequest = axios.get(ISSUES_ENDPOINT).catch((err) => {
      console.error(err);
      if (!cancelled) setIssuesUnavailable(true);
      return { data: [] };
    });

    Promise.all([roster, issuesRequest])
      .then(([[clientsRes, branchesRes], issuesRes]) => {
        if (cancelled) return;

        const arrowgoTrucks = (clientsRes.data || []).filter((c) =>
          (c.clientName || "").trim().toLowerCase().includes("arrowgo")
        );

        setFleetTrucks(arrowgoTrucks);
        setBranches(branchesRes.data || []);
        setIssues(issuesRes.data || []);
        setRosterError(false);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setRosterError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= DERIVED DATA ================= */
  const stats = useMemo(() => {
    const byPriority = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    let active = 0;
    let fixed = 0;

    issues.forEach((i) => {
      if (byPriority[i.priority] !== undefined) byPriority[i.priority] += 1;
      if (i.status === "Fixed") fixed += 1;
      else active += 1;
    });

    return {
      totalTrucks: fleetTrucks.length,
      totalIssues: issues.length,
      active,
      fixed,
      byPriority,
    };
  }, [issues, fleetTrucks]);

  const issuesByTruck = useMemo(() => {
    const counts = {};
    issues.forEach((i) => {
      counts[i.plateNumber] = (counts[i.plateNumber] || 0) + 1;
    });

    const rows = fleetTrucks.map((t) => ({
      plateNumber: t.plateNumber,
      count: counts[t.plateNumber] || 0,
    }));

    Object.keys(counts).forEach((plate) => {
      if (!rows.find((r) => r.plateNumber === plate)) {
        rows.push({ plateNumber: plate, count: counts[plate] });
      }
    });

    return rows.sort((a, b) => b.count - a.count);
  }, [issues, fleetTrucks]);

  const maxTruckCount = Math.max(1, ...issuesByTruck.map((r) => r.count));

  const filteredIssues = useMemo(() => {
    let data = [...issues];

    if (priorityFilter !== "All") data = data.filter((i) => i.priority === priorityFilter);
    if (statusFilter !== "All") data = data.filter((i) => i.status === statusFilter);
    if (branchFilter) data = data.filter((i) => i.branchRegistered === branchFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((i) =>
        `${i.plateNumber} ${i.driver} ${i.issue} ${i.branchRegistered}`
          .toLowerCase()
          .includes(term)
      );
    }

    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [issues, priorityFilter, statusFilter, branchFilter, searchTerm]);

  const donutTotal = PRIORITIES.reduce((sum, p) => sum + stats.byPriority[p], 0);

  /* ================= RECORDS BROWSER ================= */
  // Branch -> Truck -> Year -> Month -> [issues logged that month]
  const recordsTree = useMemo(() => {
    const tree = {};
    issues.forEach((i) => {
      const d = new Date(i.date);
      if (Number.isNaN(d.getTime())) return;
      const branch = i.branchRegistered || "Unassigned";
      const plate = i.plateNumber || "Unknown";
      const year = d.getFullYear();
      const month = d.getMonth();
      tree[branch] = tree[branch] || {};
      tree[branch][plate] = tree[branch][plate] || {};
      tree[branch][plate][year] = tree[branch][plate][year] || {};
      tree[branch][plate][year][month] = tree[branch][plate][year][month] || [];
      tree[branch][plate][year][month].push(i);
    });
    return tree;
  }, [issues]);

  const selectedBranchName = recordsPath[0]?.value;
  const selectedTruckPlate = recordsPath[1]?.value;
  const selectedYear = recordsPath[2]?.value;
  const selectedMonth = recordsPath[3]?.value;

  const goToRoot = () => setRecordsPath([]);
  const goToDepth = (depth) => setRecordsPath((prev) => prev.slice(0, depth));

  let levelRows = [];
  let onOpenRow = () => {};
  let countHeaderLabel = "Issues";
  let dayIssues = [];

  if (recordsPath.length === 0) {
    countHeaderLabel = "Trucks";
    levelRows = branches
      .map((b) => {
        const name = b.branchName || b.branch || b.name || "Unknown Branch";
        const branchTrucks = fleetTrucks.filter((t) => t.branchRegistered === name);
        const branchIssues = issues.filter((i) => i.branchRegistered === name);
        return {
          key: name,
          name,
          itemCount: branchTrucks.length,
          lastUpdated: latestDate(branchIssues),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    onOpenRow = (row) => setRecordsPath([{ type: "branch", value: row.name }]);
  } else if (recordsPath.length === 1) {
    levelRows = fleetTrucks
      .filter((t) => t.branchRegistered === selectedBranchName)
      .map((t) => {
        const truckIssues = issues.filter((i) => i.plateNumber === t.plateNumber);
        return {
          key: t.plateNumber,
          name: t.plateNumber,
          subLabel: t.truckType,
          itemCount: truckIssues.length,
          lastUpdated: latestDate(truckIssues),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    onOpenRow = (row) => setRecordsPath((prev) => [...prev, { type: "truck", value: row.name }]);
  } else if (recordsPath.length === 2) {
    const truckTree = recordsTree[selectedBranchName]?.[selectedTruckPlate] || {};
    const currentYear = new Date().getFullYear();
    const years = Array.from(new Set([...Object.keys(truckTree).map(Number), currentYear])).sort(
      (a, b) => b - a
    );
    levelRows = years.map((year) => {
      const monthsObj = truckTree[year] || {};
      const yearIssues = Object.values(monthsObj).flat();
      return {
        key: String(year),
        name: String(year),
        itemCount: yearIssues.length,
        lastUpdated: latestDate(yearIssues),
      };
    });
    onOpenRow = (row) => setRecordsPath((prev) => [...prev, { type: "year", value: Number(row.name) }]);
  } else if (recordsPath.length === 3) {
    const yearTree = recordsTree[selectedBranchName]?.[selectedTruckPlate]?.[selectedYear] || {};
    levelRows = MONTH_NAMES.map((label, idx) => {
      const monthIssues = yearTree[idx] || [];
      return {
        key: label,
        name: label,
        monthIndex: idx,
        itemCount: monthIssues.length,
        lastUpdated: latestDate(monthIssues),
      };
    });
    onOpenRow = (row) => setRecordsPath((prev) => [...prev, { type: "month", value: row.monthIndex }]);
  } else if (recordsPath.length === 4) {
    dayIssues = (recordsTree[selectedBranchName]?.[selectedTruckPlate]?.[selectedYear]?.[selectedMonth] || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /* ================= PDF RECORDS (upload / list / view / delete) ================= */
  const fetchMonthRecords = () => {
    if (recordsPath.length !== 4 || !selectedTruckPlate) {
      setMonthRecords([]);
      return;
    }
    setRecordsLoading(true);
    axios
      .get(`${API_URL}/api/fleet-records`, {
        params: { plateNumber: selectedTruckPlate, year: selectedYear, month: selectedMonth },
      })
      .then((res) => setMonthRecords(res.data || []))
      .catch((err) => {
        console.error(err);
        setMonthRecords([]);
      })
      .finally(() => setRecordsLoading(false));
  };

  // Refetch whenever the drilldown path changes (and lands on a month)
  useEffect(() => {
    fetchMonthRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsPath]);

  const uploadPdf = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingRecord(true);
    try {
      const formData = new FormData();
      formData.append("pdfFile", file);
      formData.append("plateNumber", selectedTruckPlate);
      formData.append("branchRegistered", selectedBranchName);
      formData.append("year", selectedYear);
      formData.append("month", selectedMonth);
      formData.append("uploadedBy", storedUser?.name || "");

      await axios.post(`${API_URL}/api/fleet-records`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchMonthRecords();
    } catch (err) {
      console.error("Upload record failed:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to upload PDF.");
    } finally {
      setUploadingRecord(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    uploadPdf(file);
  };

  const viewRecord = (record) => {
    window.open(`${API_URL}/api/fleet-records/${record.id}/view`, "_blank", "noopener,noreferrer");
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Delete "${record.originalName}"? This can't be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/fleet-records/${record.id}`);
      setMonthRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };


  /* ================= HANDLERS ================= */
  const handleTruckSelect = (e) => {
    const plate = e.target.value;
    const match = fleetTrucks.find((t) => t.plateNumber === plate);
    setLogForm((prev) => ({
      ...prev,
      plateNumber: plate,
      branchRegistered: match?.branchRegistered || prev.branchRegistered,
    }));
  };

  const handleLogChange = (e) => {
    const { name, value } = e.target;
    setLogForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitLog = async (e) => {
    e.preventDefault();
    setSavingLog(true);
    try {
      const res = await axios.post(ISSUES_ENDPOINT, { ...logForm, status: "Active" });
      setIssues((prev) => [res.data, ...prev]);
      setIsLogModalOpen(false);
      setLogForm(initialLogForm);
    } catch (err) {
      console.error("Log issue failed:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to log issue. Check the console for details.");
    } finally {
      setSavingLog(false);
    }
  };

  const toggleIssueStatus = async (issue) => {
    const nextStatus = issue.status === "Fixed" ? "Active" : "Fixed";
    try {
      await axios.put(`${ISSUES_ENDPOINT}/${issue.id}`, { status: nextStatus });
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, status: nextStatus } : i))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update issue status.");
    }
  };

  const deleteIssue = async () => {
    if (!issueToDelete) return;
    try {
      await axios.delete(`${ISSUES_ENDPOINT}/${issueToDelete.id}`);
      setIssues((prev) => prev.filter((i) => i.id !== issueToDelete.id));
      setIssueToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete issue.");
    }
  };

  /* ================= THEME ================= */
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
        btnDanger:
          "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:brightness-110",
        donutTrack: "#1e293b",
        trackBg: "bg-slate-800",
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
        donutTrack: "#e2e8f0",
        trackBg: "bg-slate-200",
      };

  const tonePill = {
    emerald: darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    amber: darkMode ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600",
    rose: darkMode ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600",
    sky: darkMode ? "bg-sky-500/15 text-sky-400" : "bg-sky-50 text-sky-600",
  };

  const priorityPill = (priority) => tonePill[priorityMeta[priority]?.tone] || theme.chipMuted;
  const statusPill = (status) => (status === "Fixed" ? tonePill.emerald : tonePill.amber);

  const overviewCards = [
    { label: "Total Trucks", value: stats.totalTrucks, icon: TruckIcon },
    { label: "Total Issues", value: stats.totalIssues, icon: ClipboardDocumentListIcon },
    { label: "Active", value: stats.active, icon: ExclamationTriangleIcon },
    { label: "Fixed", value: stats.fixed, icon: CheckCircleIcon },
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  /* ================= UI ================= */
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
            Fleet Monitoring
          </h1>
          <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
            {stats.totalIssues} issue{stats.totalIssues !== 1 ? "s" : ""} across {stats.totalTrucks} Arrowgo truck
            {stats.totalTrucks !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      {rosterError && (
        <div
          className={`mb-4 rounded-2xl border p-4 text-sm ${
            darkMode ? "border-rose-500/25 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-600"
          }`}
        >
          Couldn't load fleet data. Check your connection and try again.
        </div>
      )}

      {!rosterError && issuesUnavailable && (
        <div className={`mb-4 rounded-2xl border border-transparent p-4 text-sm ${theme.chipMuted}`}>
          Issue tracking isn't connected on the backend yet — showing the Arrowgo truck roster only.
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {overviewCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border p-4 ${theme.panelBg}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${theme.subtleText}`}>{label}</p>
              <Icon className={`w-4 h-4 ${theme.subtleText}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${theme.titleText}`}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setView("dashboard")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            view === "dashboard" ? theme.btnPrimary : theme.btnSecondary
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView("records")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            view === "records" ? theme.btnPrimary : theme.btnSecondary
          }`}
        >
          Records
        </button>
      </div>

      {view === "records" && (
        <div className="mt-4">
          {/* BREADCRUMB + TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center flex-wrap gap-1 text-sm">
              <button
                onClick={goToRoot}
                className={`font-medium ${
                  recordsPath.length === 0 ? theme.titleText : `${theme.subtleText} hover:underline`
                }`}
              >
                Arrowgo Fleet
              </button>
              {recordsPath.map((seg, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <ChevronRightIcon className={`w-3.5 h-3.5 ${theme.subtleText}`} />
                  <button
                    onClick={() => goToDepth(idx + 1)}
                    className={`font-medium ${
                      idx === recordsPath.length - 1 ? theme.titleText : `${theme.subtleText} hover:underline`
                    }`}
                  >
                    {seg.type === "month" ? MONTH_NAMES[seg.value] : seg.value}
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
  {canManage && recordsPath.length === 4 && (
    <>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingRecord}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${theme.btnSecondary}`}
      >
        <DocumentTextIcon className="w-4 h-4" />
        {uploadingRecord ? "Uploading…" : "Attach PDF"}
      </button>
    </>
  )}
</div>
          </div>

          {recordsPath.length < 4 ? (
            <div className={`overflow-x-auto rounded-2xl border ${theme.panelBg}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${theme.tableHeadBg}`}>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-right">{countHeaderLabel}</th>
                    <th className="p-3 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-10 text-center">
                        <p className={theme.subtleText}>Loading fleet data…</p>
                      </td>
                    </tr>
                  ) : levelRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-10 text-center">
                        <FolderIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
                        <p className={theme.subtleText}>No records here yet.</p>
                      </td>
                    </tr>
                  ) : (
                    levelRows.map((row) => (
                      <tr
                        key={row.key}
                        onClick={() => onOpenRow(row)}
                        className={`cursor-pointer border-b last:border-0 ${theme.rowBorder} ${theme.rowHover} transition`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FolderIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="min-w-0">
                              <div className={`font-medium truncate ${theme.titleText}`}>{row.name}</div>
                              {row.subLabel && (
                                <div className={`text-xs truncate ${theme.subtleText}`}>{row.subLabel}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`p-3 text-right ${theme.subtleText}`}>{row.itemCount}</td>
                        <td className={`p-3 text-right ${theme.subtleText}`}>
                          {row.lastUpdated ? formatDate(row.lastUpdated) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {/* ATTACHED PDFs PANEL */}
              <div className={`mb-4 rounded-2xl border ${theme.panelBg}`}>
                <div className={`px-4 py-3 border-b ${theme.rowBorder} flex items-center justify-between`}>
                  <h3 className={`text-sm font-semibold ${theme.titleText}`}>Attached PDFs</h3>
                  <span className={`text-xs ${theme.subtleText}`}>
                    {monthRecords.length} file{monthRecords.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className={`divide-y ${theme.rowBorder}`}>
                  {recordsLoading ? (
                    <p className={`p-4 text-sm ${theme.subtleText}`}>Loading records…</p>
                  ) : monthRecords.length === 0 ? (
                    <p className={`p-4 text-sm ${theme.subtleText}`}>No PDFs attached for this month yet.</p>
                  ) : (
                    monthRecords.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <DocumentTextIcon className="w-4 h-4 shrink-0 text-emerald-500" />
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${theme.titleText}`}>{r.originalName}</p>
                            <p className={`text-xs ${theme.subtleText}`}>
                              {r.uploadedBy ? `${r.uploadedBy} · ` : ""}
                              {formatDate(r.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => viewRecord(r)}
                            className="text-sm font-medium text-emerald-500 hover:underline"
                          >
                            View
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteRecord(r)}
                              className="text-slate-400 hover:text-rose-500 transition"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ISSUES LOGGED THIS MONTH */}
              <div className={`overflow-x-auto rounded-2xl border ${theme.panelBg}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme.tableHeadBg}`}>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Issue</th>
                      <th className="p-3 text-left">Driver</th>
                      <th className="p-3 text-left">Priority</th>
                      <th className="p-3 text-left">Status</th>
                      {canManage && <th className="p-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dayIssues.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="p-10 text-center">
                          <DocumentTextIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
                          <p className={theme.subtleText}>
                            No issues logged for {MONTH_NAMES[selectedMonth]} {selectedYear}.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      dayIssues.map((i) => (
                        <tr key={i.id} className={`border-b last:border-0 ${theme.rowBorder} ${theme.rowHover} transition`}>
                          <td className="p-3 whitespace-nowrap">{formatDate(i.date)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <DocumentTextIcon className={`w-4 h-4 shrink-0 ${theme.subtleText}`} />
                              <span className="truncate">{i.issue}</span>
                            </div>
                          </td>
                          <td className="p-3">{i.driver}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${priorityPill(i.priority)}`}>
                              {i.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill(i.status)}`}>
                              {i.status || "Active"}
                            </span>
                          </td>
                          {canManage && (
                            <td className="p-3">
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => toggleIssueStatus(i)}
                                  className="text-slate-400 hover:text-emerald-500 transition"
                                  title={i.status === "Fixed" ? "Reopen" : "Mark Fixed"}
                                >
                                  {i.status === "Fixed" ? (
                                    <ArrowPathIcon className="w-5 h-5" />
                                  ) : (
                                    <CheckIcon className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setIssueToDelete(i)}
                                  className="text-slate-400 hover:text-rose-500 transition"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {view === "dashboard" && (
        <>
      {/* PRIORITY FILTER CHIPS */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setPriorityFilter("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            priorityFilter === "All" ? theme.btnPrimary : `${theme.chipMuted} border-transparent hover:opacity-80`
          }`}
        >
          All · {stats.totalIssues}
        </button>
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              priorityFilter === p
                ? `${tonePill[priorityMeta[p].tone]} border-current`
                : `${theme.chipMuted} border-transparent hover:opacity-80`
            }`}
          >
            {p} · {stats.byPriority[p]}
          </button>
        ))}
      </div>

      {/* ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* PRIORITY DISTRIBUTION */}
        <div className={`rounded-2xl border p-5 ${theme.panelBg}`}>
          <h2 className={`text-sm font-semibold mb-4 ${theme.titleText}`}>Priority Distribution</h2>
          {loading ? (
            <p className={`text-sm ${theme.subtleText}`}>Loading…</p>
          ) : donutTotal === 0 ? (
            <p className={`text-sm ${theme.subtleText}`}>No issues logged yet.</p>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90">
                  <circle cx="80" cy="80" r={radius} fill="none" stroke={theme.donutTrack} strokeWidth="18" />
                  {PRIORITIES.map((p) => {
                    const count = stats.byPriority[p];
                    if (count === 0) return null;
                    const dash = (count / donutTotal) * circumference;
                    const offset = -(cumulative / donutTotal) * circumference;
                    cumulative += count;
                    return (
                      <circle
                        key={p}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke={priorityMeta[p].swatch}
                        strokeWidth="18"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={offset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${theme.titleText}`}>{donutTotal}</span>
                  <span className={`text-xs ${theme.subtleText}`}>issues</span>
                </div>
              </div>

              <div className="space-y-2 flex-1 min-w-[140px]">
                {PRIORITIES.map((p) => (
                  <div key={p} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: priorityMeta[p].swatch }}
                      />
                      {p}
                    </span>
                    <span className={theme.subtleText}>
                      {stats.byPriority[p]} · {Math.round((stats.byPriority[p] / donutTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ISSUES BY TRUCK */}
        <div className={`rounded-2xl border p-5 ${theme.panelBg}`}>
          <h2 className={`text-sm font-semibold mb-4 ${theme.titleText}`}>Issues by Truck</h2>
          {loading ? (
            <p className={`text-sm ${theme.subtleText}`}>Loading…</p>
          ) : issuesByTruck.length === 0 ? (
            <p className={`text-sm ${theme.subtleText}`}>No trucks on record yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {issuesByTruck.map((row) => (
                <div key={row.plateNumber} className="flex items-center gap-3 text-sm">
                  <span className={`w-20 shrink-0 font-medium truncate ${theme.titleText}`}>{row.plateNumber}</span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${theme.trackBg}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${(row.count / maxTruckCount) * 100}%` }}
                    />
                  </div>
                  <span className={`w-5 text-right ${theme.subtleText}`}>{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTER / SEARCH BAR */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${theme.subtleText}`} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plate, driver, or issue"
            className={`w-full pl-9 pr-3 py-2 rounded-xl border outline-none focus:ring-2 transition text-sm ${theme.inputBg}`}
          />
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className={`rounded-xl border px-3 py-2 outline-none focus:ring-2 transition text-sm ${theme.inputBg}`}
        >
          <option value="">All Branches</option>
          {branches.map((b) => {
            const name = b.branchName || b.branch || b.name || "Unknown Branch";
            return (
              <option key={b.id} value={name}>
                {name}
              </option>
            );
          })}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`rounded-xl border px-3 py-2 outline-none focus:ring-2 transition text-sm ${theme.inputBg}`}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Fixed">Fixed</option>
        </select>

        {canManage && (
          <button
            onClick={() => setIsLogModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition ${theme.btnPrimary}`}
          >
            <PlusIcon className="w-4 h-4" />
            Log Issue
          </button>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className={`hidden md:block mt-4 overflow-x-auto rounded-2xl border ${theme.panelBg}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${theme.tableHeadBg}`}>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Truck</th>
              <th className="p-3 text-left">Driver</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Issue</th>
              <th className="p-3 text-left">Status</th>
              {canManage && <th className="p-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="p-10 text-center">
                  <p className={theme.subtleText}>Loading fleet data…</p>
                </td>
              </tr>
            ) : (
              <>
                {filteredIssues.map((i) => (
                  <tr key={i.id} className={`border-b last:border-0 ${theme.rowBorder} ${theme.rowHover} transition`}>
                    <td className="p-3 whitespace-nowrap">{formatDate(i.date)}</td>
                    <td className="p-3">
                      <div className={`font-medium ${theme.titleText}`}>{i.plateNumber}</div>
                      <div className={`text-xs ${theme.subtleText}`}>{i.branchRegistered}</div>
                    </td>
                    <td className="p-3">{i.driver}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${priorityPill(i.priority)}`}>
                        {i.priority}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">{i.issue}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill(i.status)}`}>
                        {i.status || "Active"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="p-3">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => toggleIssueStatus(i)}
                            className="text-slate-400 hover:text-emerald-500 transition"
                            title={i.status === "Fixed" ? "Reopen" : "Mark Fixed"}
                          >
                            {i.status === "Fixed" ? (
                              <ArrowPathIcon className="w-5 h-5" />
                            ) : (
                              <CheckIcon className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setIssueToDelete(i)}
                            className="text-slate-400 hover:text-rose-500 transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="p-10 text-center">
                      <ClipboardDocumentListIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
                      <p className={theme.subtleText}>
                        {issues.length === 0 ? "No issues logged yet." : "No issues match your filters."}
                      </p>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3 mt-4">
        {loading ? (
          <div className={`text-center py-10 border rounded-2xl ${theme.cardBg}`}>
            <p className={theme.subtleText}>Loading fleet data…</p>
          </div>
        ) : (
          <>
            {filteredIssues.map((i) => (
              <div key={i.id} className={`border rounded-2xl p-4 ${theme.cardBg}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-semibold text-lg ${theme.titleText}`}>{i.plateNumber}</p>
                    <p className={`text-xs ${theme.subtleText}`}>
                      {i.branchRegistered} · {formatDate(i.date)}
                    </p>
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill(i.status)}`}>
                    {i.status || "Active"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${priorityPill(i.priority)}`}>
                    {i.priority}
                  </span>
                </div>

                <p className={`text-sm mt-3 ${theme.subtleText}`}>{i.issue}</p>
                <p className={`text-xs mt-1 ${theme.subtleText}`}>Driver: {i.driver}</p>

                {canManage && (
                  <div className={`flex justify-end gap-3 mt-4 pt-3 border-t ${theme.rowBorder}`}>
                    <button onClick={() => toggleIssueStatus(i)} className="text-slate-400 hover:text-emerald-500 transition">
                      {i.status === "Fixed" ? <ArrowPathIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIssueToDelete(i)} className="text-slate-400 hover:text-rose-500 transition">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredIssues.length === 0 && (
              <div className={`text-center py-10 border rounded-2xl ${theme.cardBg}`}>
                <ClipboardDocumentListIcon className={`w-8 h-8 mx-auto mb-2 ${theme.subtleText}`} />
                <p className={theme.subtleText}>
                  {issues.length === 0 ? "No issues logged yet." : "No issues match your filters."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* ===== LOG ISSUE MODAL ===== */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogModalOpen(false)} />

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
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${theme.titleText}`}>Log Issue</h2>
                    <p className={`text-xs ${theme.subtleText}`}>Record a new fleet issue</p>
                  </div>
                </div>
              </div>

              <form onSubmit={submitLog} className="p-6 space-y-4">
                <div>
                  <label className={`text-sm font-medium block mb-1.5 ${theme.titleText}`}>Truck</label>
                  <select
                    required
                    value={logForm.plateNumber}
                    onChange={handleTruckSelect}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition ${theme.inputBg}`}
                  >
                    <option value="">Select Truck</option>
                    {fleetTrucks.map((t) => (
                      <option key={t.id} value={t.plateNumber}>
                        {t.plateNumber} — {t.branchRegistered}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-sm font-medium block mb-1.5 ${theme.titleText}`}>Driver</label>
                  <input
                    required
                    name="driver"
                    value={logForm.driver}
                    onChange={handleLogChange}
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition ${theme.inputBg}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-sm font-medium block mb-1.5 ${theme.titleText}`}>Priority</label>
                    <select
                      name="priority"
                      value={logForm.priority}
                      onChange={handleLogChange}
                      className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition ${theme.inputBg}`}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm font-medium block mb-1.5 ${theme.titleText}`}>Date</label>
                    <input
                      required
                      type="date"
                      name="date"
                      value={logForm.date}
                      onChange={handleLogChange}
                      className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition ${theme.inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-medium block mb-1.5 ${theme.titleText}`}>Issue</label>
                  <textarea
                    required
                    rows={3}
                    name="issue"
                    value={logForm.issue}
                    onChange={handleLogChange}
                    placeholder="e.g. Starter issue, needs replacement"
                    className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 transition resize-none ${theme.inputBg}`}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingLog}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-60 ${theme.btnPrimary}`}
                  >
                    {savingLog ? "Saving…" : "Log Issue"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== DELETE ISSUE MODAL ===== */}
      <AnimatePresence>
        {issueToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIssueToDelete(null)} />

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
                      darkMode
                        ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                        : "bg-rose-100 border-rose-200 text-rose-600"
                    }`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${theme.titleText}`}>Delete Issue</h2>
                    <p className={`text-xs ${theme.subtleText}`}>This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className={`rounded-xl border p-4 mb-5 ${theme.panelBg}`}>
                  <p className={`text-xs mb-1 ${theme.subtleText}`}>Selected Issue</p>
                  <p className={`text-base font-semibold ${theme.titleText}`}>{issueToDelete.plateNumber}</p>
                  <p className={`text-sm mt-0.5 ${theme.subtleText}`}>{issueToDelete.issue}</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIssueToDelete(null)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteIssue}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition ${theme.btnDanger}`}
                  >
                    Delete Issue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}