import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API = `${process.env.REACT_APP_API_URL}/api`;

const emptyBranchForm = { name: "" };
const emptyClientForm = { branchId: "", name: "" };
const emptyBayForm = { branchId: "", name: "" };

/* ================= HELPERS ================= */
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const sameId = (a, b) => String(a) === String(b);
const byName = (a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true });
const parseBayNames = (raw = "") =>
  raw
    .split(/[,\n]/)
    .map((b) => b.trim())
    .filter(Boolean);

// The clients endpoint returns the branch *name*; use branch_id when it's there.
const clientInBranch = (client, branch) =>
  client.branch_id != null ? sameId(client.branch_id, branch.id) : client.branch === branch.name;

/* ================= STYLES =================
   Same VMVAS palette as before: blue-600 (#2563EB) and emerald-600 (#059669)
   on the slate scale. Every color below is a Tailwind slate/blue/emerald/red
   value, so nothing new is introduced. */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');
.vmvas-heading { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em; }

.bm {
  --panel:#FFFFFF; --side:#F8FAFC; --sunken:#F1F5F9; --hover:#F8FAFC; --thumb:#FFFFFF;
  --border:#E2E8F0; --border-soft:#F1F5F9;
  --ink:#0F172A; --text:#334155; --muted:#64748B; --faint:#94A3B8;
  --input-bg:#FFFFFF; --input-border:#E2E8F0;
  --blue:#2563EB; --blue-500:#3B82F6; --blue-tint:#EFF6FF; --blue-line:#DBEAFE; --blue-ink:#1D4ED8; --blue-ring:rgba(37,99,235,.18);
  --em:#059669; --em-tint:#ECFDF5; --em-line:#D1FAE5; --em-ink:#047857;
  --red:#DC2626; --red-tint:#FEF2F2; --red-line:#FECACA;
  --active-bg:#FFFFFF; --active-line:rgba(37,99,235,.28);
  --door-a:#F1F5F9; --door-b:#E2E8F0; --slat:rgba(15,23,42,.055);
  --overlay:rgba(15,23,42,.6);
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow:0 1px 2px rgba(15,23,42,.04), 0 16px 40px -16px rgba(15,23,42,.14);
  --shadow-lg:0 24px 60px -18px rgba(15,23,42,.35);
}
.bm-dark {
  --panel:rgba(15,23,42,.7); --side:rgba(2,6,23,.45); --sunken:rgba(30,41,59,.6); --hover:rgba(30,41,59,.45); --thumb:#334155;
  --border:#1E293B; --border-soft:rgba(30,41,59,.7);
  --ink:#F1F5F9; --text:#CBD5E1; --muted:#94A3B8; --faint:#64748B;
  --input-bg:rgba(30,41,59,.7); --input-border:#334155;
  --blue:#3B82F6; --blue-500:#3B82F6; --blue-tint:rgba(59,130,246,.1); --blue-line:rgba(59,130,246,.22); --blue-ink:#60A5FA; --blue-ring:rgba(59,130,246,.28);
  --em:#10B981; --em-tint:rgba(16,185,129,.1); --em-line:rgba(16,185,129,.25); --em-ink:#34D399;
  --red:#F87171; --red-tint:rgba(239,68,68,.1); --red-line:rgba(239,68,68,.28);
  --active-bg:rgba(59,130,246,.1); --active-line:rgba(59,130,246,.3);
  --door-a:#1E293B; --door-b:#0F172A; --slat:rgba(255,255,255,.04);
  --overlay:rgba(2,6,23,.7);
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 50px -20px rgba(0,0,0,.65);
  --shadow-lg:0 30px 70px -20px rgba(0,0,0,.8);
}
.bm *, .bm *::before, .bm *::after { box-sizing:border-box; }
.bm button { font-family:inherit; cursor:pointer; }
.bm :focus-visible { outline:2px solid var(--blue-500); outline-offset:2px; }
.bm-num { font-variant-numeric:tabular-nums; }
.bm-muted { color:var(--muted); }
.bm-scroll { scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

/* ---------- buttons ---------- */
.bm-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:12px;
  border:1px solid transparent; font-size:14px; font-weight:600; white-space:nowrap;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease, filter .15s ease, box-shadow .15s ease; }
.bm-btn:disabled { opacity:.6; cursor:not-allowed; }
.bm-btn-sm { height:36px; padding:0 14px; font-size:13px; }
.bm-btn-primary { color:#fff; background:linear-gradient(180deg,#10B981 0%,#059669 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 18px -8px rgba(5,150,105,.6); }
.bm-dark .bm-btn-primary { color:#020617; background:linear-gradient(180deg,#34D399 0%,#059669 100%); }
.bm-btn-primary:hover:not(:disabled) { filter:brightness(1.07); }
.bm-btn-secondary { color:var(--text); background:transparent; border-color:var(--input-border); }
.bm-btn-secondary:hover:not(:disabled) { background:var(--hover); border-color:var(--faint); }
.bm-btn-secondary.is-danger:hover:not(:disabled) { color:var(--red); background:var(--red-tint); border-color:var(--red-line); }
.bm-btn-danger { color:#fff; background:linear-gradient(180deg,#EF4444 0%,#DC2626 100%); box-shadow:0 8px 18px -8px rgba(220,38,38,.55); }
.bm-btn-danger:hover:not(:disabled) { filter:brightness(1.07); }

.bm-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; border:0;
  background:transparent; color:var(--faint); transition:background-color .15s ease, color .15s ease, opacity .15s ease; }
.bm-icon-btn:hover { color:var(--blue-ink); background:var(--blue-tint); }
.bm-icon-btn.is-danger:hover { color:var(--red); background:var(--red-tint); }

/* ---------- inputs ---------- */
.bm-field { position:relative; }
.bm-field > svg { position:absolute; left:13px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--faint); pointer-events:none; }
.bm-input { width:100%; height:42px; padding:0 14px; border-radius:12px; border:1px solid var(--input-border); background:var(--input-bg);
  color:var(--ink); font:inherit; font-size:14px; outline:none; transition:border-color .15s ease, box-shadow .15s ease; }
.bm-input::placeholder { color:var(--faint); }
.bm-input:focus { border-color:var(--blue-500); box-shadow:0 0 0 3px var(--blue-ring); }
.bm-input.with-icon { padding-left:38px; }
textarea.bm-input { height:auto; padding:12px 14px; resize:none; line-height:1.5; }
.bm-label { display:block; font-size:13.5px; font-weight:600; margin-bottom:6px; color:var(--ink); }

/* ---------- workspace shell ---------- */
.bm-shell { position:relative; background:var(--panel); border:1px solid var(--border); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
.bm-shell::before { content:""; position:absolute; left:0; right:0; top:0; height:2px; z-index:2;
  background:linear-gradient(90deg,#2563EB 0%,#3B82F6 45%,#10B981 100%); }
.bm-grid { display:grid; grid-template-columns:minmax(0,1fr); }
@media (min-width:1024px) { .bm-grid { grid-template-columns:316px minmax(0,1fr); min-height:36rem; } }
.bm-side { background:var(--side); border-bottom:1px solid var(--border); }
@media (min-width:1024px) { .bm-side { border-bottom:0; border-right:1px solid var(--border); } }
.bm-side-list { max-height:19rem; overflow-y:auto; }
@media (min-width:1024px) { .bm-side-list { max-height:38rem; } }

.bm-branch { display:flex; align-items:center; gap:12px; width:100%; text-align:left; padding:9px 10px; border-radius:14px;
  border:1px solid transparent; background:transparent; color:inherit; transition:background-color .15s ease, border-color .15s ease, box-shadow .15s ease; }
.bm-branch:hover { background:var(--hover); }
.bm-branch.is-active { background:var(--active-bg); border-color:var(--active-line); box-shadow:var(--shadow-sm); }
.bm-branch-tile { display:flex; flex:none; align-items:center; justify-content:center; width:38px; height:38px; border-radius:11px;
  background:var(--blue-tint); border:1px solid var(--blue-line); color:var(--blue-ink); transition:all .15s ease; }
.bm-branch.is-active .bm-branch-tile { color:#fff; border-color:transparent; background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);
  box-shadow:0 6px 14px -6px rgba(37,99,235,.7); }
.bm-branch-name { display:block; font-size:14px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bm-branch-meta { display:block; font-size:12px; color:var(--muted); margin-top:1px; }

/* ---------- segmented tabs ---------- */
.bm-seg { display:inline-flex; padding:4px; border-radius:14px; background:var(--sunken); border:1px solid var(--border-soft); }
.bm-seg-btn { position:relative; z-index:0; display:inline-flex; align-items:center; gap:8px; height:34px; padding:0 14px; border:0; border-radius:10px;
  background:transparent; font-size:13.5px; font-weight:600; color:var(--muted); transition:color .15s ease; }
.bm-seg-btn:hover { color:var(--ink); }
.bm-seg-btn.is-active { color:var(--ink); }
.bm-seg-thumb { position:absolute; inset:0; z-index:-1; border-radius:10px; background:var(--thumb); box-shadow:var(--shadow-sm); border:1px solid var(--border-soft); }
.bm-pill { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:20px; padding:0 7px; border-radius:999px;
  background:var(--sunken); color:var(--muted); font-size:11.5px; font-weight:600; }
.bm-seg-btn.is-active .bm-pill { background:var(--blue-tint); color:var(--blue-ink); }
.bm-side .bm-pill { background:var(--sunken); }

/* ---------- bay tiles: a dock door with a threshold and a name plate ---------- */
.bm-bay-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(164px, 1fr)); gap:14px; }
.bm-bay { position:relative; border:1px solid var(--border); border-radius:14px; overflow:hidden; background:var(--panel);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.bm-bay:hover { transform:translateY(-2px); border-color:var(--blue-line); box-shadow:0 14px 28px -16px rgba(37,99,235,.35); }
.bm-bay-door { position:relative; height:64px; background-color:var(--door-b);
  background-image:repeating-linear-gradient(to bottom, var(--slat) 0, var(--slat) 2px, transparent 2px, transparent 6px), linear-gradient(180deg, var(--door-a), var(--door-b)); }
.bm-bay-door::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:linear-gradient(90deg,#2563EB,#10B981); }
.bm-bay-label { display:flex; align-items:center; justify-content:space-between; gap:4px; padding:6px 6px 6px 14px; min-height:46px; }
.bm-bay-name { font-size:14px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bm-bay-del { opacity:0; }
.bm-bay:hover .bm-bay-del, .bm-bay:focus-within .bm-bay-del, .bm-bay-del:focus-visible { opacity:1; }
@media (hover:none) { .bm-bay-del { opacity:1; } }

/* ---------- client list ---------- */
.bm-list { border:1px solid var(--border); border-radius:16px; overflow:hidden; background:var(--panel); }
.bm-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--border-soft); transition:background-color .15s ease; }
.bm-row:last-child { border-bottom:0; }
.bm-row:hover { background:var(--hover); }
.bm-avatar { display:flex; flex:none; align-items:center; justify-content:center; width:34px; height:34px; border-radius:999px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); font-size:11px; font-weight:600; }

/* ---------- misc ---------- */
.bm-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:52px 24px;
  border:1px dashed var(--input-border); border-radius:16px; background:var(--side); }
.bm-empty-icon { display:flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:14px; margin-bottom:14px;
  background:var(--blue-tint); border:1px solid var(--blue-line); color:var(--blue-ink); }
.bm-chip { display:inline-block; max-width:100%; padding:3px 10px; border-radius:999px; background:var(--blue-tint); border:1px solid var(--blue-line);
  color:var(--blue-ink); font-size:12px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bm-skel { background:var(--sunken); border-radius:12px; animation:bm-pulse 1.4s ease-in-out infinite; }
@keyframes bm-pulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }
@media (prefers-reduced-motion: reduce) { .bm-skel { animation:none; } .bm *, .bm *::before { transition-duration:0s !important; } }

/* ---------- dialogs ---------- */
.bm-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px;
  background:var(--overlay); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
.bm-dialog { width:100%; max-width:448px; max-height:calc(100vh - 32px); overflow-y:auto; border-radius:20px; border:1px solid var(--border);
  background:var(--dialog, #fff); color:var(--ink); box-shadow:var(--shadow-lg); }
.bm-dark .bm-dialog { --dialog:#0F172A; }
.bm-dialog-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:20px 24px; border-bottom:1px solid var(--border); background:var(--side); }
.bm-dialog-head.is-danger { background:var(--red-tint); }
.bm-dialog-icon { display:flex; flex:none; align-items:center; justify-content:center; width:44px; height:44px; border-radius:14px;
  background:var(--blue-tint); border:1px solid var(--blue-line); color:var(--blue-ink); }
.is-danger .bm-dialog-icon { background:var(--red-tint); border-color:var(--red-line); color:var(--red); }
.bm-dialog-body { padding:24px; }
`;

/* ================= THEME (header + page shell, unchanged from the original) ================= */
function getTheme(darkMode) {
  return darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
        btnPrimary:
          "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110",
      }
    : {
        pageBg: "bg-[#F7F9FC] text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
      };
}

/* ================= PAGE ================= */
export default function Branches({ darkMode }) {
  /* ---------- state ---------- */
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [tab, setTab] = useState("bays"); // "bays" | "clients"
  const [branchSearch, setBranchSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [bayModalOpen, setBayModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "branch"|"client"|"bay", id, label }

  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [bayForm, setBayForm] = useState(emptyBayForm);
  const [editingBranchId, setEditingBranchId] = useState(null);

  const [savingBranch, setSavingBranch] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [savingBay, setSavingBay] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ---------- fetch (API calls unchanged) ---------- */
  const fetchData = async () => {
    try {
      const [b, c, ba] = await Promise.all([
        axios.get(`${API}/branches`),
        axios.get(`${API}/branch-clients`),
        axios.get(`${API}/bays`),
      ]);

      const formattedBays = (ba.data || []).map((bay) => ({
        id: bay.id,
        name: bay.bayName,
        branch_id: bay.branch_id,
        branchName: bay.branchName,
      }));

      setBranches(b.data || []);
      setClients(c.data || []);
      setBays(formattedBays);
      setLoadError(false);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    fetchData();
  };

  /* ---------- derived ---------- */
  const stats = useMemo(
    () => ({
      totalBranches: branches.length,
      totalClients: clients.length,
      totalBays: bays.length,
    }),
    [branches, clients, bays]
  );

  const sortedBranches = useMemo(() => [...branches].sort(byName), [branches]);

  const counts = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      map[b.id] = {
        clients: clients.filter((c) => clientInBranch(c, b)).length,
        bays: bays.filter((bay) => sameId(bay.branch_id, b.id)).length,
      };
    });
    return map;
  }, [branches, clients, bays]);

  const railBranches = useMemo(() => {
    const term = branchSearch.trim().toLowerCase();
    return term ? sortedBranches.filter((b) => (b.name || "").toLowerCase().includes(term)) : sortedBranches;
  }, [sortedBranches, branchSearch]);

  // Falls back to the first branch if nothing is selected or the selection was deleted.
  const activeBranch = useMemo(
    () => branches.find((b) => sameId(b.id, selectedBranchId)) ?? sortedBranches[0] ?? null,
    [branches, sortedBranches, selectedBranchId]
  );

  const activeBays = useMemo(
    () => (activeBranch ? bays.filter((bay) => sameId(bay.branch_id, activeBranch.id)).sort(byName) : []),
    [bays, activeBranch]
  );

  const activeClients = useMemo(
    () => (activeBranch ? clients.filter((c) => clientInBranch(c, activeBranch)).sort(byName) : []),
    [clients, activeBranch]
  );

  const shownBays = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    return term ? activeBays.filter((bay) => (bay.name || "").toLowerCase().includes(term)) : activeBays;
  }, [activeBays, itemSearch]);

  const shownClients = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    return term ? activeClients.filter((c) => (c.name || "").toLowerCase().includes(term)) : activeClients;
  }, [activeClients, itemSearch]);

  const selectBranch = (id) => {
    setSelectedBranchId(id);
    setItemSearch("");
  };

  const changeTab = (next) => {
    setTab(next);
    setItemSearch("");
  };

  /* ---------- branch CRUD ---------- */
  const openAddBranchModal = () => {
    setEditingBranchId(null);
    setBranchForm(emptyBranchForm);
    setBranchModalOpen(true);
  };

  const openEditBranchModal = (b) => {
    setEditingBranchId(b.id);
    setBranchForm({ name: b.name });
    setBranchModalOpen(true);
  };

  const submitBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) return;
    setSavingBranch(true);
    try {
      if (editingBranchId) {
        await axios.put(`${API}/branches/${editingBranchId}`, branchForm);
        toast.success("Branch updated");
      } else {
        await axios.post(`${API}/branches`, branchForm);
        toast.success("Branch added");
      }
      setBranchModalOpen(false);
      setBranchForm(emptyBranchForm);
      setEditingBranchId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save branch.");
    } finally {
      setSavingBranch(false);
    }
  };

  /* ---------- client CRUD ---------- */
  const openAddClientModal = () => {
    setClientForm({ ...emptyClientForm, branchId: activeBranch ? String(activeBranch.id) : "" });
    setClientModalOpen(true);
  };

  const submitClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.branchId) return;
    setSavingClient(true);
    try {
      await axios.post(`${API}/branch-clients`, {
        name: clientForm.name,
        branch_id: clientForm.branchId,
      });
      toast.success("Client added");
      setClientModalOpen(false);
      setSelectedBranchId(clientForm.branchId);
      setClientForm(emptyClientForm);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add client.");
    } finally {
      setSavingClient(false);
    }
  };

  /* ---------- bay CRUD (bulk endpoint) ---------- */
  const openAddBayModal = () => {
    setBayForm({ ...emptyBayForm, branchId: activeBranch ? String(activeBranch.id) : "" });
    setBayModalOpen(true);
  };

  const submitBay = async (e) => {
    e.preventDefault();
    if (!bayForm.name.trim() || !bayForm.branchId) return;

    const bayNames = parseBayNames(bayForm.name);
    if (bayNames.length === 0) return;

    setSavingBay(true);
    try {
      const { data } = await axios.post(`${API}/bays/bulk`, {
        branch_id: bayForm.branchId,
        names: bayNames,
      });
      setBayModalOpen(false);
      setSelectedBranchId(bayForm.branchId);
      setBayForm(emptyBayForm);
      fetchData();
      toast.success(data?.message || "Bays added");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add bays.");
    } finally {
      setSavingBay(false);
    }
  };

  /* ---------- delete (unified) ---------- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const path =
        deleteTarget.type === "branch" ? "branches" : deleteTarget.type === "client" ? "branch-clients" : "bays";
      await axios.delete(`${API}/${path}/${deleteTarget.id}`);
      toast.success(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const theme = getTheme(darkMode);
  const bayNamePreview = parseBayNames(bayForm.name);

  /* ================= UI ================= */
  return (
    <MotionConfig reducedMotion="user">
      <div className={`bm ${darkMode ? "bm-dark" : ""} min-h-screen p-4 sm:p-6 lg:p-8 transition-colors ${theme.pageBg}`}>
        <style>{styles}</style>

        <Toaster
          position="top-right"
          toastOptions={{
            style: darkMode
              ? { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" }
              : { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
          }}
        />

        {/* ===== PAGE HEADER (original) ===== */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={`flex items-center gap-1.5 text-xs mb-3 ${theme.subtleText}`}>
            <span>Settings</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className={theme.titleText}>Branch Management</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
                <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
              </span>
              <div>
                <h1 className={`vmvas-heading text-2xl sm:text-[28px] font-bold leading-tight ${theme.titleText}`}>
                  Branch Management
                </h1>
                <p className={`text-sm mt-1 ${theme.subtleText}`}>
                  Manage branches, clients, and warehouse bays across your network.
                </p>
                <p className={`text-xs mt-2 font-medium ${theme.subtleText}`}>
                  {stats.totalBranches} branch{stats.totalBranches !== 1 ? "es" : ""} · {stats.totalClients} client
                  {stats.totalClients !== 1 ? "s" : ""} · {stats.totalBays} active bay{stats.totalBays !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              onClick={openAddBranchModal}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.btnPrimary}`}
            >
              <PlusIcon className="w-4 h-4" />
              Add Branch
            </button>
          </div>
        </motion.div>

        {loadError && (
          <div
            role="alert"
            className={`mt-5 flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm ${
              darkMode ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            <span className="flex-1">Couldn't load branch data. Check your connection and try again.</span>
            <button type="button" onClick={retryLoad} className="bm-btn bm-btn-secondary bm-btn-sm is-danger">
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* ===== WORKSPACE ===== */}
        <div className="bm-shell mt-6">
          <div className="bm-grid">
            {/* ---- BRANCH LIST ---- */}
            <aside className="bm-side" aria-label="Branches">
              <div className="px-4 pb-3 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="vmvas-heading text-[15px] font-bold" style={{ color: "var(--ink)" }}>
                    Branches
                  </h2>
                  <span className="bm-pill bm-num">{branches.length}</span>
                </div>
                <SearchField value={branchSearch} onChange={setBranchSearch} placeholder="Search branches…" label="Search branches" />
              </div>

              <div className="bm-side-list bm-scroll px-2 pb-3">
                {loading ? (
                  <div className="space-y-2 px-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="bm-skel h-[58px]" />
                    ))}
                  </div>
                ) : railBranches.length === 0 ? (
                  <p className="bm-muted px-3 py-8 text-center text-sm">
                    {branches.length === 0 ? "No branches yet." : "No branches match your search."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {railBranches.map((b) => {
                      const isActive = activeBranch && sameId(activeBranch.id, b.id);
                      const c = counts[b.id] || { clients: 0, bays: 0 };
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            className={`bm-branch ${isActive ? "is-active" : ""}`}
                            aria-current={isActive ? "true" : undefined}
                            onClick={() => selectBranch(b.id)}
                          >
                            <span className="bm-branch-tile">
                              <BuildingOffice2Icon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="bm-branch-name">{b.name}</span>
                              <span className="bm-branch-meta bm-num">
                                {plural(c.bays, "bay")}, {plural(c.clients, "client")}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            {/* ---- BRANCH DETAIL ---- */}
            <section className="min-w-0" aria-label={activeBranch ? `${activeBranch.name} details` : "Branch details"}>
              {loading ? (
                <div className="space-y-4 p-6 sm:p-8">
                  <div className="bm-skel h-8 w-64" />
                  <div className="bm-skel h-5 w-44" />
                  <div className="bm-skel mt-6 h-11 w-full" />
                  <div className="bm-bay-grid pt-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bm-skel h-[112px]" />
                    ))}
                  </div>
                </div>
              ) : !activeBranch ? (
                <div className="p-6 sm:p-8">
                  <div className="bm-empty">
                    <span className="bm-empty-icon">
                      <BuildingOffice2Icon className="h-6 w-6" />
                    </span>
                    <h2 className="vmvas-heading text-lg font-bold" style={{ color: "var(--ink)" }}>
                      No branches yet
                    </h2>
                    <p className="bm-muted mt-1.5 max-w-sm text-sm">
                      Add your first branch, then assign clients and bays to it.
                    </p>
                    <button type="button" className="bm-btn bm-btn-primary mt-5" onClick={openAddBranchModal}>
                      <PlusIcon className="h-4 w-4" />
                      Add Branch
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8">
                  {/* branch heading */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2
                        className="vmvas-heading break-words text-[24px] font-bold leading-tight sm:text-[28px]"
                        style={{ color: "var(--ink)" }}
                      >
                        {activeBranch.name}
                      </h2>
                      <p className="bm-muted bm-num mt-1.5 text-sm">
                        {plural(activeBays.length, "bay")} and {plural(activeClients.length, "client")} at this branch.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="bm-btn bm-btn-secondary bm-btn-sm" onClick={() => openEditBranchModal(activeBranch)}>
                        <PencilIcon className="h-4 w-4" />
                        Rename
                      </button>
                      <button
                        type="button"
                        className="bm-btn bm-btn-secondary bm-btn-sm is-danger"
                        onClick={() => setDeleteTarget({ type: "branch", id: activeBranch.id, label: activeBranch.name })}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* toolbar */}
                  <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="bm-seg self-start" role="tablist" aria-label="Branch sections">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "bays"}
                        className={`bm-seg-btn ${tab === "bays" ? "is-active" : ""}`}
                        onClick={() => changeTab("bays")}
                      >
                        {tab === "bays" && <motion.span layoutId="bm-seg-thumb" className="bm-seg-thumb" transition={{ duration: 0.2 }} />}
                        <Squares2X2Icon className="h-4 w-4" />
                        Bays
                        <span className="bm-pill bm-num">{activeBays.length}</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "clients"}
                        className={`bm-seg-btn ${tab === "clients" ? "is-active" : ""}`}
                        onClick={() => changeTab("clients")}
                      >
                        {tab === "clients" && <motion.span layoutId="bm-seg-thumb" className="bm-seg-thumb" transition={{ duration: 0.2 }} />}
                        <UsersIcon className="h-4 w-4" />
                        Clients
                        <span className="bm-pill bm-num">{activeClients.length}</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="sm:w-64">
                        <SearchField
                          value={itemSearch}
                          onChange={setItemSearch}
                          placeholder={tab === "bays" ? "Search bays…" : "Search clients…"}
                          label={tab === "bays" ? "Search bays" : "Search clients"}
                        />
                      </div>
                      <button
                        type="button"
                        className="bm-btn bm-btn-primary"
                        onClick={tab === "bays" ? openAddBayModal : openAddClientModal}
                      >
                        <PlusIcon className="h-4 w-4" />
                        {tab === "bays" ? "Add Bays" : "Add Client"}
                      </button>
                    </div>
                  </div>

                  {/* content */}
                  <motion.div
                    key={`${activeBranch.id}-${tab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="mt-6"
                    role="tabpanel"
                  >
                    {tab === "bays" ? (
                      activeBays.length === 0 ? (
                        <EmptyState
                          icon={WrenchScrewdriverIcon}
                          title={`No bays at ${activeBranch.name} yet`}
                          text="Add the bays trucks load and unload at. You can paste a whole list at once."
                          actionLabel="Add Bays"
                          onAction={openAddBayModal}
                        />
                      ) : shownBays.length === 0 ? (
                        <p className="bm-muted py-12 text-center text-sm">No bays match "{itemSearch.trim()}".</p>
                      ) : (
                        <div className="bm-bay-grid">
                          <AnimatePresence initial={false}>
                            {shownBays.map((bay) => (
                              <motion.div
                                layout
                                key={bay.id}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.16 }}
                                className="bm-bay"
                              >
                                <div className="bm-bay-door" aria-hidden="true" />
                                <div className="bm-bay-label">
                                  <span className="bm-bay-name" title={bay.name}>
                                    {bay.name}
                                  </span>
                                  <button
                                    type="button"
                                    className="bm-icon-btn bm-bay-del is-danger"
                                    aria-label={`Delete ${bay.name}`}
                                    title="Delete bay"
                                    onClick={() => setDeleteTarget({ type: "bay", id: bay.id, label: bay.name })}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )
                    ) : activeClients.length === 0 ? (
                      <EmptyState
                        icon={UsersIcon}
                        title={`No clients at ${activeBranch.name} yet`}
                        text="Add the clients that are served from this branch."
                        actionLabel="Add Client"
                        onAction={openAddClientModal}
                      />
                    ) : shownClients.length === 0 ? (
                      <p className="bm-muted py-12 text-center text-sm">No clients match "{itemSearch.trim()}".</p>
                    ) : (
                      <ul className="bm-list">
                        {shownClients.map((c) => (
                          <li key={c.id} className="bm-row">
                            <span className="bm-avatar" aria-hidden="true">
                              {getInitials(c.name)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold" style={{ color: "var(--ink)" }} title={c.name}>
                              {c.name}
                            </span>
                            <button
                              type="button"
                              className="bm-icon-btn is-danger"
                              aria-label={`Delete ${c.name}`}
                              title="Delete client"
                              onClick={() => setDeleteTarget({ type: "client", id: c.id, label: c.name })}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ===== ADD / RENAME BRANCH ===== */}
        <AnimatePresence>
          {branchModalOpen && (
            <Dialog
              onClose={() => setBranchModalOpen(false)}
              icon={BuildingOffice2Icon}
              title={editingBranchId ? "Rename Branch" : "New Branch"}
              subtitle={editingBranchId ? "Update this branch's name" : "Add a branch to the network"}
            >
              <form onSubmit={submitBranch} className="space-y-4">
                <div>
                  <label className="bm-label" htmlFor="branch-name">
                    Branch Name
                  </label>
                  <input
                    id="branch-name"
                    required
                    autoFocus
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ name: e.target.value })}
                    placeholder="e.g. Makati Branch"
                    className="bm-input"
                  />
                </div>
                <DialogFooter
                  onCancel={() => setBranchModalOpen(false)}
                  saving={savingBranch}
                  submitLabel={editingBranchId ? "Update Branch" : "Save Branch"}
                />
              </form>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ===== ADD CLIENT ===== */}
        <AnimatePresence>
          {clientModalOpen && (
            <Dialog onClose={() => setClientModalOpen(false)} icon={UsersIcon} title="New Client" subtitle="Attach a client to a branch">
              <form onSubmit={submitClient} className="space-y-4">
                <div>
                  <label className="bm-label" htmlFor="client-branch">
                    Branch
                  </label>
                  <select
                    id="client-branch"
                    required
                    value={clientForm.branchId}
                    onChange={(e) => setClientForm({ ...clientForm, branchId: e.target.value })}
                    className="bm-input"
                  >
                    <option value="">Select Branch</option>
                    {sortedBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="bm-label" htmlFor="client-name">
                    Client Name
                  </label>
                  <input
                    id="client-name"
                    required
                    autoFocus
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="e.g. Arrowgo Logistics"
                    className="bm-input"
                  />
                </div>
                <DialogFooter onCancel={() => setClientModalOpen(false)} saving={savingClient} submitLabel="Add Client" />
              </form>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ===== ADD BAYS (bulk-capable) ===== */}
        <AnimatePresence>
          {bayModalOpen && (
            <Dialog
              onClose={() => setBayModalOpen(false)}
              icon={WrenchScrewdriverIcon}
              title="New Bays"
              subtitle="Add one or more bays to a branch"
            >
              <form onSubmit={submitBay} className="space-y-4">
                <div>
                  <label className="bm-label" htmlFor="bay-branch">
                    Branch
                  </label>
                  <select
                    id="bay-branch"
                    required
                    value={bayForm.branchId}
                    onChange={(e) => setBayForm({ ...bayForm, branchId: e.target.value })}
                    className="bm-input"
                  >
                    <option value="">Select Branch</option>
                    {sortedBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="bm-label !mb-0" htmlFor="bay-names">
                      Bay Name(s)
                    </label>
                    <span className="bm-muted bm-num text-xs">{bayNamePreview.length} to add</span>
                  </div>
                  <textarea
                    id="bay-names"
                    required
                    autoFocus
                    rows={4}
                    value={bayForm.name}
                    onChange={(e) => setBayForm({ ...bayForm, name: e.target.value })}
                    placeholder={"Bay 1, Bay 2, Bay 3\nor one per line — paste a whole list at once"}
                    className="bm-input"
                  />
                  <p className="bm-muted mt-1.5 text-xs">
                    Separate names with commas or new lines. Duplicates already on this branch are skipped automatically.
                  </p>
                  {bayNamePreview.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {bayNamePreview.slice(0, 12).map((n, i) => (
                        <span key={`${n}-${i}`} className="bm-chip">
                          {n}
                        </span>
                      ))}
                      {bayNamePreview.length > 12 && (
                        <span className="bm-muted self-center text-xs">+{bayNamePreview.length - 12} more</span>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter onCancel={() => setBayModalOpen(false)} saving={savingBay} submitLabel="Add Bays" />
              </form>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ===== DELETE CONFIRMATION (unified) ===== */}
        <AnimatePresence>
          {deleteTarget && (
            <Dialog
              onClose={() => setDeleteTarget(null)}
              icon={TrashIcon}
              tone="danger"
              title={`Delete ${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)}`}
              subtitle="This action cannot be undone"
            >
              <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--sunken)", border: "1px solid var(--border)" }}>
                <p className="bm-muted text-xs">Selected {deleteTarget.type}</p>
                <p className="mt-0.5 text-base font-semibold" style={{ color: "var(--ink)" }}>
                  {deleteTarget.label}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-5">
                <button type="button" onClick={() => setDeleteTarget(null)} className="bm-btn bm-btn-secondary">
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} disabled={deleting} className="bm-btn bm-btn-danger">
                  {deleting
                    ? "Deleting…"
                    : `Delete ${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)}`}
                </button>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ============================================================
   PRESENTATIONAL COMPONENTS
   Kept in this file so it's a single paste-in — safe to lift into
   /components if other pages need them.
   ============================================================ */

function SearchField({ value, onChange, placeholder, label }) {
  return (
    <div className="bm-field">
      <MagnifyingGlassIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="bm-input with-icon"
      />
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div className="bm-empty">
      <span className="bm-empty-icon">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <p className="bm-muted mt-1.5 max-w-sm text-sm">{text}</p>
      <button type="button" className="bm-btn bm-btn-secondary mt-5" onClick={onAction}>
        <PlusIcon className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function Dialog({ onClose, icon: Icon, title, subtitle, tone, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="bm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bm-dialog"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div className={`bm-dialog-head ${tone === "danger" ? "is-danger" : ""}`}>
          <div className="flex items-center gap-3">
            <span className="bm-dialog-icon">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="vmvas-heading text-lg font-bold leading-tight" style={{ color: "var(--ink)" }}>
                {title}
              </h2>
              {subtitle && <p className="bm-muted mt-0.5 text-xs">{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="bm-icon-btn" onClick={onClose} aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="bm-dialog-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function DialogFooter({ onCancel, saving, submitLabel }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="bm-btn bm-btn-secondary">
        Cancel
      </button>
      <button type="submit" disabled={saving} className="bm-btn bm-btn-primary">
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}