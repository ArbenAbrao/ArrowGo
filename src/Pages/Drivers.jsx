import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import axios from "axios";
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API = `${process.env.REACT_APP_API_URL}/api`;

const EMPTY_FORM = {
  employeeId: "",
  name: "",
  phone: "",
  licenseNo: "",
  status: "Active",
  branchId: "",
  clientId: "",
  type: "Driver",
};

const PAGE_SIZE = 10;

// Builds a compact page list with "..." gaps, e.g. [1, "...", 4, 5, 6, "...", 12]
function getPageNumbers(current, total) {
  const delta = 1;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    }
  }
  const withGaps = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) withGaps.push("...");
    withGaps.push(page);
    previous = page;
  }
  return withGaps;
}

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ================= STYLES =================
   Same emerald + slate system as before. Driver = sky, Helper = violet,
   On Trip = amber keep their original pill tones. */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');
.vmvas-heading { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em; }

.dr {
  --panel:#FFFFFF; --panel-solid:#FFFFFF; --side:#F8FAFC; --sunken:#F1F5F9; --hover:#F8FAFC;
  --border:#E2E8F0; --border-soft:#F1F5F9;
  --ink:#0F172A; --text:#334155; --muted:#64748B; --faint:#94A3B8;
  --input-bg:#FFFFFF; --input-border:#CBD5E1;
  --em:#10B981; --em-tint:#ECFDF5; --em-line:#A7F3D0; --em-ink:#047857; --em-soft:rgba(16,185,129,.07);
  --focus-line:#34D399; --focus-ring:rgba(52,211,153,.35); --focus-outline:#059669;
  --rose:#E11D48; --rose-tint:#FFF1F2; --rose-line:#FECDD3;
  --t-em-bg:#ECFDF5; --t-em-ink:#047857;
  --t-sky-bg:#F0F9FF; --t-sky-ink:#0369A1;
  --t-violet-bg:#F5F3FF; --t-violet-ink:#6D28D9;
  --t-amber-bg:#FFFBEB; --t-amber-ink:#B45309;
  --t-slate-bg:#F1F5F9; --t-slate-ink:#475569;
  --overlay:rgba(0,0,0,.6); --dialog:#FFFFFF;
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow:0 1px 2px rgba(15,23,42,.04), 0 16px 40px -16px rgba(15,23,42,.14);
  --shadow-lg:0 24px 60px -18px rgba(15,23,42,.35);
}
.dr-dark {
  --panel:rgba(15,23,42,.7); --panel-solid:#0B1224; --side:rgba(2,6,23,.45); --sunken:rgba(30,41,59,.6); --hover:rgba(30,41,59,.45);
  --border:#1E293B; --border-soft:rgba(30,41,59,.7);
  --ink:#F1F5F9; --text:#CBD5E1; --muted:#94A3B8; --faint:#64748B;
  --input-bg:rgba(30,41,59,.7); --input-border:#334155;
  --em-tint:rgba(16,185,129,.1); --em-line:rgba(16,185,129,.25); --em-ink:#34D399; --em-soft:rgba(16,185,129,.08);
  --focus-line:rgba(16,185,129,.6); --focus-ring:rgba(16,185,129,.3); --focus-outline:#34D399;
  --rose:#FB7185; --rose-tint:rgba(244,63,94,.1); --rose-line:rgba(244,63,94,.28);
  --t-em-bg:rgba(16,185,129,.15); --t-em-ink:#34D399;
  --t-sky-bg:rgba(14,165,233,.15); --t-sky-ink:#38BDF8;
  --t-violet-bg:rgba(139,92,246,.15); --t-violet-ink:#A78BFA;
  --t-amber-bg:rgba(245,158,11,.15); --t-amber-ink:#FBBF24;
  --t-slate-bg:#1E293B; --t-slate-ink:#94A3B8;
  --dialog:#0F172A;
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 50px -20px rgba(0,0,0,.65);
  --shadow-lg:0 30px 70px -20px rgba(0,0,0,.8);
}
.dr *, .dr *::before, .dr *::after { box-sizing:border-box; }
.dr button { font-family:inherit; cursor:pointer; }
.dr :focus-visible { outline:2px solid var(--focus-outline); outline-offset:2px; }
.dr-num { font-variant-numeric:tabular-nums; }
.dr-muted { color:var(--muted); }
.dr-scroll { scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

/* tones (badges + icon chips) */
.t-em { background:var(--t-em-bg); color:var(--t-em-ink); }
.t-sky { background:var(--t-sky-bg); color:var(--t-sky-ink); }
.t-violet { background:var(--t-violet-bg); color:var(--t-violet-ink); }
.t-amber { background:var(--t-amber-bg); color:var(--t-amber-ink); }
.t-slate { background:var(--t-slate-bg); color:var(--t-slate-ink); }
.dr-badge { display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 10px; border-radius:999px; font-size:12px; font-weight:600; white-space:nowrap; }
.dr-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }

/* buttons */
.dr-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:12px;
  border:1px solid transparent; font-size:14px; font-weight:600; white-space:nowrap;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease, filter .15s ease; }
.dr-btn:disabled { opacity:.6; cursor:not-allowed; }
.dr-btn-sm { height:36px; padding:0 14px; font-size:13px; }
.dr-btn-primary { color:#fff; background:linear-gradient(180deg,#10B981 0%,#059669 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 18px -8px rgba(5,150,105,.6); }
.dr-dark .dr-btn-primary { color:#020617; background:linear-gradient(180deg,#34D399 0%,#059669 100%); }
.dr-btn-primary:hover:not(:disabled) { filter:brightness(1.07); }
.dr-btn-secondary { color:var(--text); background:transparent; border-color:var(--input-border); }
.dr-btn-secondary:hover:not(:disabled) { background:var(--hover); border-color:var(--faint); }
.dr-btn-secondary.is-danger:hover:not(:disabled) { color:var(--rose); background:var(--rose-tint); border-color:var(--rose-line); }
.dr-btn-danger { color:#fff; background:linear-gradient(180deg,#F43F5E 0%,#E11D48 100%); box-shadow:0 8px 18px -8px rgba(225,29,72,.55); }
.dr-btn-danger:hover:not(:disabled) { filter:brightness(1.07); }

.dr-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; border:0;
  background:transparent; color:var(--faint); transition:background-color .15s ease, color .15s ease; }
.dr-icon-btn:hover { color:var(--ink); background:var(--sunken); }
.dr-icon-btn.is-view:hover { color:var(--t-em-ink); background:var(--t-em-bg); }
.dr-icon-btn.is-edit:hover { color:var(--t-sky-ink); background:var(--t-sky-bg); }
.dr-icon-btn.is-danger:hover { color:var(--rose); background:var(--rose-tint); }
.dr-copy { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:6px; border:0; background:transparent;
  color:var(--faint); transition:background-color .15s ease, color .15s ease; }
.dr-copy:hover { color:var(--em-ink); background:var(--em-tint); }

/* inputs */
.dr-field { position:relative; }
.dr-field .dr-lead { position:absolute; left:13px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--faint); pointer-events:none; }
.dr-field .dr-chev { position:absolute; right:13px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--faint); pointer-events:none; }
.dr-input { width:100%; height:42px; padding:0 14px; border-radius:12px; border:1px solid var(--input-border); background:var(--input-bg);
  color:var(--ink); font:inherit; font-size:14px; outline:none; transition:border-color .15s ease, box-shadow .15s ease; }
.dr-input::placeholder { color:var(--faint); }
.dr-input:focus { border-color:var(--focus-line); box-shadow:0 0 0 3px var(--focus-ring); }
.dr-input:disabled { opacity:.55; cursor:not-allowed; }
.dr-input.has-lead { padding-left:38px; }
select.dr-input { appearance:none; padding-right:36px; cursor:pointer; }
.dr-label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:var(--ink); }

/* shells */
.dr-shell { position:relative; background:var(--panel); border:1px solid var(--border); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
.dr-shell.has-line::before { content:""; position:absolute; left:0; right:0; top:0; height:2px; z-index:2;
  background:linear-gradient(90deg,#10B981 0%,#14B8A6 55%,#06B6D4 100%); }

/* summary strip (also the quick filters) */
.dr-stats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
@media (min-width:640px) { .dr-stats { grid-template-columns:repeat(4,minmax(0,1fr)); } }
.dr-stat { position:relative; display:flex; align-items:center; gap:14px; padding:18px 20px; text-align:left; border:0; background:transparent;
  color:inherit; transition:background-color .15s ease; }
.dr-stat:nth-child(odd) { border-right:1px solid var(--border); }
.dr-stat:nth-child(-n+2) { border-bottom:1px solid var(--border); }
@media (min-width:640px) {
  .dr-stat, .dr-stat:nth-child(odd), .dr-stat:nth-child(-n+2) { border-right:1px solid var(--border); border-bottom:0; }
  .dr-stat:last-child { border-right:0; }
}
.dr-stat:hover { background:var(--hover); }
.dr-stat.is-active { background:var(--em-soft); }
.dr-stat.is-active::after { content:""; position:absolute; left:20px; right:20px; bottom:0; height:3px; border-radius:3px 3px 0 0; background:var(--em); }
.dr-stat-icon { display:flex; flex:none; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; }
.dr-stat-value { font-size:24px; font-weight:700; line-height:1.1; color:var(--ink); }
.dr-stat-label { font-size:12.5px; color:var(--muted); margin-top:2px; }

/* toolbar */
.dr-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:16px 20px; background:var(--side); border-bottom:1px solid var(--border); }
.dr-toolbar .grow { flex:1 1 240px; }
.dr-toolbar .sel { flex:0 1 180px; min-width:150px; }
@media (max-width:639px) { .dr-toolbar .sel { flex:1 1 100%; } }

/* roster */
.dr-head { display:none; }
.dr-row { display:grid; grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"emp actions" "tags tags" "meta meta"; gap:14px 12px;
  padding:16px 20px; border-bottom:1px solid var(--border-soft); transition:background-color .15s ease; }
.dr-row:last-child { border-bottom:0; }
.dr-row:hover { background:var(--hover); }
.dr-emp { grid-area:emp; display:flex; align-items:center; gap:14px; min-width:0; }
.dr-actions { grid-area:actions; display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.dr-tags { grid-area:tags; display:flex; flex-wrap:wrap; gap:8px; }
.dr-role, .dr-status { display:contents; }
.dr-meta { grid-area:meta; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.dr-assign { display:contents; }
.dr-cell { display:flex; flex-direction:column; min-width:0; }
.dr-lab { font-size:11.5px; color:var(--faint); margin-bottom:2px; }
.dr-strong { font-size:13.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dr-sub { font-size:13px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
@media (min-width:1280px) {
  .dr-head, .dr-row { grid-template-columns:minmax(210px,1.7fr) 88px 124px minmax(150px,1.4fr) 124px 112px; column-gap:16px; align-items:center; }
  .dr-head { display:grid; padding:11px 20px; border-bottom:1px solid var(--border); background:var(--side); font-size:12.5px; font-weight:600; color:var(--muted); }
  .dr-row { grid-template-areas:"emp role status assign phone actions"; padding:14px 20px; }
  .dr-tags, .dr-meta { display:contents; }
  .dr-role { display:flex; grid-area:role; }
  .dr-status { display:flex; grid-area:status; flex-direction:column; align-items:flex-start; gap:5px; }
  .dr-assign { display:flex; grid-area:assign; flex-direction:column; gap:2px; min-width:0; }
  .dr-phone { grid-area:phone; }
  .dr-lab { display:none; }
  .dr-actions { opacity:.85; }
}
.dr-row:hover .dr-actions, .dr-row:focus-within .dr-actions { opacity:1; }

.dr-avatar { position:relative; display:flex; flex:none; align-items:center; justify-content:center; width:42px; height:42px; border-radius:13px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); font-size:13px; font-weight:600; }
.dr-dot { position:absolute; right:-4px; bottom:-4px; width:13px; height:13px; border-radius:50%; background:#10B981; border:2.5px solid var(--panel-solid); }
.dr-dot.is-busy { background:#F59E0B; }
.dr-name { display:block; max-width:100%; padding:0; border:0; background:none; text-align:left; font-size:14.5px; font-weight:600; color:var(--ink);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; transition:color .15s ease; }
.dr-name:hover { color:var(--em-ink); }
.dr-idline { display:flex; align-items:center; gap:4px; margin-top:1px; font-size:12px; color:var(--muted); }

/* footer / pager */
.dr-foot { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:14px 20px; border-top:1px solid var(--border); background:var(--side); }
.dr-page { display:inline-flex; align-items:center; justify-content:center; min-width:36px; height:36px; padding:0 10px; border-radius:10px; border:1px solid var(--input-border);
  background:transparent; color:var(--text); font-size:13.5px; font-weight:600; transition:background-color .15s ease, border-color .15s ease, filter .15s ease; }
.dr-page:hover:not(:disabled):not(.is-current) { background:var(--hover); border-color:var(--faint); }
.dr-page:disabled { opacity:.4; cursor:not-allowed; }
.dr-page.is-current { border-color:transparent; color:#fff; background:linear-gradient(180deg,#10B981,#059669); }
.dr-dark .dr-page.is-current { color:#020617; background:linear-gradient(180deg,#34D399,#059669); }

/* empty + skeleton */
.dr-empty { display:flex; flex-direction:column; align-items:center; text-align:center; margin:24px; padding:56px 24px; border:1px dashed var(--input-border); border-radius:16px; background:var(--side); }
.dr-empty-icon { display:flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; margin-bottom:14px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); }
.dr-skel { background:var(--sunken); border-radius:10px; animation:dr-pulse 1.4s ease-in-out infinite; }
@keyframes dr-pulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }
@media (prefers-reduced-motion: reduce) { .dr-skel { animation:none; } .dr *, .dr *::before { transition-duration:0s !important; } }

/* dialogs */
.dr-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px;
  background:var(--overlay); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
.dr-dialog { width:100%; max-width:448px; max-height:calc(100vh - 32px); overflow-y:auto; border-radius:20px; border:1px solid var(--border);
  background:var(--dialog); color:var(--ink); box-shadow:var(--shadow-lg); }
.dr-dialog.is-wide { max-width:600px; }
.dr-dialog-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:20px 24px; border-bottom:1px solid var(--border); background:var(--side); }
.dr-dialog-head.is-danger { background:var(--rose-tint); }
.dr-dialog-icon { display:flex; flex:none; align-items:center; justify-content:center; width:44px; height:44px; border-radius:14px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); }
.is-danger .dr-dialog-icon { background:var(--rose-tint); border-color:var(--rose-line); color:var(--rose); }
.dr-dialog-body { padding:24px; }
.dr-dialog-foot { display:flex; justify-content:flex-end; gap:12px; padding:16px 24px; border-top:1px solid var(--border); }

/* profile */
.dr-banner { position:relative; height:112px; background:linear-gradient(110deg,#10B981 0%,#14B8A6 55%,#0891B2 100%); }
.dr-banner::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 12% 0%, rgba(255,255,255,.3), transparent 48%); }
.dr-banner-close { position:absolute; top:14px; right:14px; z-index:1; display:flex; align-items:center; justify-content:center; width:34px; height:34px;
  border-radius:10px; border:0; background:rgba(255,255,255,.16); color:#fff; transition:background-color .15s ease; }
.dr-banner-close:hover { background:rgba(255,255,255,.28); }
.dr-profile-avatar { display:flex; align-items:center; justify-content:center; width:80px; height:80px; margin-top:-40px; border-radius:24px;
  background:var(--em-tint); border:4px solid var(--dialog); color:var(--em-ink); font-size:26px; font-weight:700; box-shadow:var(--shadow-sm); position:relative; }
.dr-dl { margin-top:20px; border:1px solid var(--border); border-radius:16px; overflow:hidden; }
.dr-dl-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:13px 16px; border-bottom:1px solid var(--border-soft); }
.dr-dl-row:last-child { border-bottom:0; }
.dr-dl-row dt { font-size:13px; color:var(--muted); flex:none; }
.dr-dl-row dd { margin:0; font-size:14.5px; font-weight:600; color:var(--ink); text-align:right; min-width:0; overflow-wrap:anywhere; }

/* toast */
.dr-toast-wrap { position:fixed; left:0; right:0; top:20px; z-index:9999; display:flex; justify-content:center; pointer-events:none; padding:0 16px; }
.dr-toast { pointer-events:auto; display:flex; align-items:center; gap:10px; padding:11px 18px 11px 14px; border-radius:14px; background:var(--dialog);
  border:1px solid var(--border); box-shadow:var(--shadow-lg); font-size:14px; font-weight:500; color:var(--ink); }
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
        pageBg: "bg-slate-50 text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
        btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
      };
}

/* ================= MAIN COMPONENT ================= */

export default function Drivers({ darkMode }) {
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [quick, setQuick] = useState(""); // "", "Driver", "Helper", "OnTrip"
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewDriver, setViewDriver] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null); // { message, tone: "success" | "error" }
  const toastTimer = useRef(null);

  const [driverForm, setDriverForm] = useState(EMPTY_FORM);

  const showToast = (message, tone = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ================= FETCH ================= */
  const fetchData = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const [b, c, d, t] = await Promise.all([
        axios.get(`${API}/branches`),
        axios.get(`${API}/branch-clients`),
        axios.get(`${API}/drivers`),
        axios.get(`${API}/trucks`), // for availability
      ]);

      setBranches(b.data || []);
      setClients(c.data || []);
      setDrivers(d.data || []);
      setTrucks(t.data || []);
      setFetchError(false);
    } catch (err) {
      console.error(err);
      setFetchError(true);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= AVAILABILITY ================= */
  const busyNames = useMemo(() => {
    const set = new Set();
    trucks.forEach((t) => {
      if (t.timeIn) return; // trip already closed out
      if (t.driver) set.add(t.driver);
      if (t.helper) set.add(t.helper);
    });
    return set;
  }, [trucks]);

  const isBusy = (name) => busyNames.has(name);

  /* ================= CRUD ================= */
  const addDriver = async (e) => {
    e.preventDefault();

    if (driverForm.phone && !/^09\d{9}$/.test(driverForm.phone)) {
      showToast("Invalid PH phone number (must be 11 digits starting with 09)", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/drivers`, {
        name: driverForm.name,
        branch_id: driverForm.branchId,
        client_id: driverForm.clientId,
        type: driverForm.type,
        employee_id: driverForm.employeeId,
        phone: driverForm.phone,
        license_no: driverForm.licenseNo,
        status: driverForm.status,
      });

      setDriverForm(EMPTY_FORM);
      setShowAddModal(false);
      showToast("Employee added");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Failed to add employee", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateDriver = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/drivers/${editingDriver.id}`, {
        employee_id: editingDriver.employee_id,
        name: editingDriver.name,
        phone: editingDriver.phone,
        license_no: editingDriver.license_no,
        status: editingDriver.status,
        branch_id: editingDriver.branch_id,
        client_id: editingDriver.client_id,
        type: editingDriver.type,
      });

      setEditingDriver(null);
      showToast("Employee updated");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Failed to update employee", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API}/drivers/${driverToDelete.id}`);
      setDriverToDelete(null);
      showToast("Employee deleted");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete employee.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Employee ID copied!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
      showToast("Employee ID copied!");
    } catch {
      showToast("Copy failed", "error");
    }

    document.body.removeChild(textarea);
  };

  /* ================= DERIVED DATA ================= */
  const uniqueClients = useMemo(
    () => [...new Map(clients.map((c) => [c.name, c])).values()],
    [clients]
  );

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch = (d.name || "").toLowerCase().includes(term);
      const matchesBranch = filterBranch ? d.branch === filterBranch : true;
      const matchesClient = filterClient ? d.client === filterClient : true;
      const matchesQuick =
        quick === "Driver" || quick === "Helper"
          ? d.type === quick
          : quick === "OnTrip"
          ? busyNames.has(d.name)
          : true;
      return matchesSearch && matchesBranch && matchesClient && matchesQuick;
    });
  }, [drivers, search, filterBranch, filterClient, quick, busyNames]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));

  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDrivers.slice(start, start + PAGE_SIZE);
  }, [filteredDrivers, currentPage]);

  // Jump back to page 1 whenever the active filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterBranch, filterClient, quick]);

  // Keep the page in range if the result set shrinks (e.g. after a delete).
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const total = drivers.length;
    const driversCount = drivers.filter((d) => d.type === "Driver").length;
    const helpersCount = drivers.filter((d) => d.type === "Helper").length;
    const onTripCount = drivers.filter((d) => busyNames.has(d.name)).length;
    return { total, driversCount, helpersCount, onTripCount };
  }, [drivers, busyNames]);

  const hasFilters = Boolean(search || filterBranch || filterClient || quick);
  const clearFilters = () => {
    setSearch("");
    setFilterBranch("");
    setFilterClient("");
    setQuick("");
  };

  const statCells = [
    { key: "", label: "Total Employees", value: stats.total, icon: UserGroupIcon, tone: "t-em" },
    { key: "Driver", label: "Drivers", value: stats.driversCount, icon: TruckIcon, tone: "t-sky" },
    { key: "Helper", label: "Helpers", value: stats.helpersCount, icon: UserIcon, tone: "t-violet" },
    { key: "OnTrip", label: "On Trip", value: stats.onTripCount, icon: MapPinIcon, tone: "t-amber" },
  ];

  const typeTone = (type) => (type === "Helper" ? "t-violet" : "t-sky");
  const statusTone = (status) => (status === "Active" ? "t-em" : "t-slate");
  const availabilityTone = (busy) => (busy ? "t-amber" : "t-em");

  const theme = getTheme(darkMode);

  /* ================= SHARED FORM FIELDS (used by Add + Edit) ================= */
  const renderIdentityFields = (form, setForm, { locked = false } = {}) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InputField
        label="Employee ID"
        value={form.employeeId ?? form.employee_id ?? ""}
        icon={IdentificationIcon}
        onChange={(v) =>
          setForm((prev) => ({
            ...prev,
            [locked ? "employee_id" : "employeeId"]: v,
          }))
        }
        required
      />

      <InputField
        label="Full Name"
        value={form.name ?? ""}
        onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
        required
      />

      <InputField
        label="Phone"
        value={form.phone ?? ""}
        icon={PhoneIcon}
        maxLength={11}
        onChange={(v) => {
          const value = v.replace(/\D/g, "");
          if (value.length <= 11) setForm((prev) => ({ ...prev, phone: value }));
        }}
      />

      <InputField
        label="License No."
        value={(locked ? form.license_no : form.licenseNo) ?? ""}
        maxLength={20}
        onChange={(v) => {
          const value = v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
          setForm((prev) => ({
            ...prev,
            [locked ? "license_no" : "licenseNo"]: value,
          }));
        }}
      />
    </div>
  );

  const viewBusy = viewDriver ? isBusy(viewDriver.name) : false;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`dr ${darkMode ? "dr-dark" : ""} min-h-screen p-4 sm:p-6 transition-colors ${theme.pageBg}`}>
        <style>{styles}</style>

        {/* HEADER (original) */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={`flex items-center gap-1.5 text-xs mb-3 ${theme.subtleText}`}>
            <span>Settings</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className={theme.titleText}>Drivers/Helpers</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
                <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
              </span>
              <div>
                <h1 className={`vmvas-heading text-2xl sm:text-[28px] font-bold leading-tight ${theme.titleText}`}>
                  Drivers & Helpers
                </h1>
                <p className={`text-sm mt-1 ${theme.subtleText}`}>
                  Manage drivers and helpers across your network.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${theme.btnPrimary}`}
            >
              <PlusIcon className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        </motion.div>

        {fetchError && (
          <div
            role="alert"
            className={`mt-5 flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm ${
              darkMode ? "border-rose-500/25 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-600"
            }`}
          >
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            <span className="flex-1">Couldn't load team data. Check your connection and try again.</span>
            <button
              type="button"
              onClick={() => fetchData({ showLoading: true })}
              className="dr-btn dr-btn-secondary dr-btn-sm is-danger"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY — doubles as quick filters */}
        <div className="dr-shell dr-stats mt-6" role="group" aria-label="Quick filters">
          {statCells.map((cell) => {
            const Icon = cell.icon;
            const active = quick === cell.key;
            return (
              <button
                key={cell.label}
                type="button"
                aria-pressed={active}
                className={`dr-stat ${active ? "is-active" : ""}`}
                onClick={() => setQuick(active && cell.key !== "" ? "" : cell.key)}
              >
                <span className={`dr-stat-icon ${cell.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="dr-stat-value vmvas-heading dr-num block">{loading ? "—" : cell.value}</span>
                  <span className="dr-stat-label block">{cell.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ROSTER */}
        <div className="dr-shell has-line mt-4">
          {/* toolbar */}
          <div className="dr-toolbar">
            <div className="dr-field grow">
              <MagnifyingGlassIcon className="dr-lead" />
              <input
                type="search"
                placeholder="Search employee name..."
                aria-label="Search employee name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dr-input has-lead"
              />
            </div>

            <div className="dr-field sel">
              <select
                aria-label="Filter by branch"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="dr-input"
              >
                <option value="">All Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="dr-chev" />
            </div>

            <div className="dr-field sel">
              <select
                aria-label="Filter by client"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="dr-input"
              >
                <option value="">All Client</option>
                {uniqueClients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="dr-chev" />
            </div>

            {hasFilters && (
              <button type="button" onClick={clearFilters} className="dr-btn dr-btn-secondary">
                Clear
              </button>
            )}
          </div>

          {/* body */}
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dr-skel h-[64px]" />
              ))}
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="dr-empty">
              <span className="dr-empty-icon">
                <UserGroupIcon className="h-6 w-6" />
              </span>
              <h2 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
                {drivers.length === 0 ? "No employees yet." : "No employees match these filters."}
              </h2>
              <p className="dr-muted mt-1.5 max-w-sm text-sm">Try adjusting your search or add a new employee.</p>
              <div className="mt-5 flex gap-3">
                {hasFilters && (
                  <button type="button" className="dr-btn dr-btn-secondary" onClick={clearFilters}>
                    Clear
                  </button>
                )}
                <button type="button" className="dr-btn dr-btn-primary" onClick={() => setShowAddModal(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Add Employee
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="dr-head" aria-hidden="true">
                <span>Employee</span>
                <span>Role</span>
                <span>Status</span>
                <span>Assignment</span>
                <span>Phone</span>
                <span />
              </div>

              <AnimatePresence mode="wait">
                <motion.ul
                  key={currentPage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {paginatedDrivers.map((d) => {
                    const busy = isBusy(d.name);
                    return (
                      <li key={d.id} className="dr-row">
                        <div className="dr-emp">
                          <span className="dr-avatar" aria-hidden="true">
                            {initialsOf(d.name)}
                            <span className={`dr-dot ${busy ? "is-busy" : ""}`} />
                          </span>
                          <div className="min-w-0">
                            <button type="button" className="dr-name" title={d.name} onClick={() => setViewDriver(d)}>
                              {d.name}
                            </button>
                            <div className="dr-idline">
                              <span className="truncate">{d.employee_id || "No ID"}</span>
                              {d.employee_id && (
                                <button
                                  type="button"
                                  className="dr-copy"
                                  onClick={() => copyToClipboard(d.employee_id)}
                                  title="Copy Employee ID"
                                  aria-label="Copy Employee ID"
                                >
                                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="dr-tags">
                          <div className="dr-role">
                            <span className={`dr-badge ${typeTone(d.type)}`}>{d.type}</span>
                          </div>
                          <div className="dr-status">
                            <span className={`dr-badge ${statusTone(d.status)}`}>{d.status}</span>
                            <span className={`dr-badge ${availabilityTone(busy)}`}>{busy ? "On Trip" : "Available"}</span>
                          </div>
                        </div>

                        <div className="dr-meta">
                          <div className="dr-assign">
                            <div className="dr-cell">
                              <span className="dr-lab">Branch</span>
                              <span className="dr-strong" title={d.branch || ""}>
                                {d.branch || "-"}
                              </span>
                            </div>
                            <div className="dr-cell">
                              <span className="dr-lab">Client</span>
                              <span className="dr-sub" title={d.client || ""}>
                                {d.client || "-"}
                              </span>
                            </div>
                          </div>
                          <div className="dr-cell dr-phone">
                            <span className="dr-lab">Phone</span>
                            <span className="dr-sub dr-num">{d.phone || "-"}</span>
                          </div>
                        </div>

                        <div className="dr-actions">
                          <button type="button" className="dr-icon-btn is-view" title="View Profile" aria-label={`View profile of ${d.name}`} onClick={() => setViewDriver(d)}>
                            <EyeIcon className="h-[18px] w-[18px]" />
                          </button>
                          <button type="button" className="dr-icon-btn is-edit" title="Edit" aria-label={`Edit ${d.name}`} onClick={() => setEditingDriver(d)}>
                            <PencilSquareIcon className="h-[18px] w-[18px]" />
                          </button>
                          <button type="button" className="dr-icon-btn is-danger" title="Delete" aria-label={`Delete ${d.name}`} onClick={() => setDriverToDelete(d)}>
                            <TrashIcon className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </motion.ul>
              </AnimatePresence>
            </>
          )}

          {/* pagination */}
          {!loading && filteredDrivers.length > 0 && (
            <div className="dr-foot">
              <p className="dr-muted dr-num text-xs">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDrivers.length)} of{" "}
                {filteredDrivers.length} employees
              </p>

              {totalPages > 1 && (
                <nav className="flex items-center gap-1.5" aria-label="Pagination">
                  <button
                    type="button"
                    className="dr-page"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === "..." ? (
                      <span key={`gap-${idx}`} className="dr-muted w-8 text-center text-sm">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`dr-page dr-num ${page === currentPage ? "is-current" : ""}`}
                        aria-current={page === currentPage ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="dr-page"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>

        {/* ADD MODAL */}
        <AnimatePresence>
          {showAddModal && (
            <Modal onClose={() => setShowAddModal(false)} label="Add Employee" wide>
              <DialogHead
                icon={PlusIcon}
                title="Add Employee"
                subtitle="Register a driver or helper"
                onClose={() => setShowAddModal(false)}
              />
              <form onSubmit={addDriver}>
                <div className="dr-dialog-body dr-scroll max-h-[65vh] space-y-4 overflow-y-auto">
                  {renderIdentityFields(driverForm, setDriverForm)}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Type"
                      value={driverForm.type}
                      onChange={(v) => setDriverForm((prev) => ({ ...prev, type: v }))}
                      options={["Driver", "Helper"]}
                    />

                    <SelectField
                      label="Status"
                      value={driverForm.status}
                      onChange={(v) => setDriverForm((prev) => ({ ...prev, status: v }))}
                      options={["Active", "Inactive"]}
                    />

                    <SelectField
                      label="Branch"
                      value={driverForm.branchId}
                      icon={BuildingOffice2Icon}
                      onChange={(v) => setDriverForm((prev) => ({ ...prev, branchId: v, clientId: "" }))}
                      options={[
                        { value: "", label: "Select Branch" },
                        ...branches.map((b) => ({ value: b.id, label: b.name })),
                      ]}
                    />

                    <SelectField
                      label="Client"
                      value={driverForm.clientId}
                      icon={UserGroupIcon}
                      disabled={!driverForm.branchId}
                      onChange={(v) => setDriverForm((prev) => ({ ...prev, clientId: v }))}
                      options={[
                        { value: "", label: "Select Client" },
                        ...clients
                          .filter((c) => Number(c.branch_id) === Number(driverForm.branchId))
                          .map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                </div>

                <div className="dr-dialog-foot">
                  <button type="button" onClick={() => setShowAddModal(false)} className="dr-btn dr-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="dr-btn dr-btn-primary">
                    {submitting ? "Saving…" : "Save Employee"}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {editingDriver && (
            <Modal onClose={() => setEditingDriver(null)} label="Edit Employee" wide>
              <DialogHead
                icon={PencilSquareIcon}
                title="Edit Employee"
                subtitle="Update employee details"
                onClose={() => setEditingDriver(null)}
              />
              <form onSubmit={updateDriver}>
                <div className="dr-dialog-body dr-scroll max-h-[65vh] space-y-4 overflow-y-auto">
                  {renderIdentityFields(editingDriver, setEditingDriver, { locked: true })}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Type"
                      value={editingDriver.type || "Driver"}
                      onChange={(v) => setEditingDriver({ ...editingDriver, type: v })}
                      options={["Driver", "Helper"]}
                    />

                    <SelectField
                      label="Status"
                      value={editingDriver.status || "Active"}
                      onChange={(v) => setEditingDriver({ ...editingDriver, status: v })}
                      options={["Active", "Inactive"]}
                    />

                    <SelectField
                      label="Branch"
                      value={editingDriver.branch_id || ""}
                      icon={BuildingOffice2Icon}
                      onChange={(v) => setEditingDriver({ ...editingDriver, branch_id: v, client_id: "" })}
                      options={[
                        { value: "", label: "Select Branch" },
                        ...branches.map((b) => ({ value: b.id, label: b.name })),
                      ]}
                    />

                    <SelectField
                      label="Client"
                      value={editingDriver.client_id || ""}
                      icon={UserGroupIcon}
                      disabled={!editingDriver.branch_id}
                      onChange={(v) => setEditingDriver({ ...editingDriver, client_id: v })}
                      options={[
                        { value: "", label: "Select Client" },
                        ...clients
                          .filter((c) => Number(c.branch_id) === Number(editingDriver.branch_id))
                          .map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                </div>

                <div className="dr-dialog-foot">
                  <button type="button" onClick={() => setEditingDriver(null)} className="dr-btn dr-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="dr-btn dr-btn-primary">
                    {submitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* VIEW PROFILE MODAL */}
        <AnimatePresence>
          {viewDriver && (
            <Modal onClose={() => setViewDriver(null)} label={`${viewDriver.name} profile`} className="is-profile">
              <div className="dr-banner">
                <button type="button" className="dr-banner-close" onClick={() => setViewDriver(null)} aria-label="Close">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 pb-2 sm:px-7">
                <div className="dr-profile-avatar">
                  {initialsOf(viewDriver.name)}
                  <span className={`dr-dot ${viewBusy ? "is-busy" : ""}`} style={{ width: 16, height: 16, right: -3, bottom: -3, borderColor: "var(--dialog)" }} />
                </div>

                <h2 className="vmvas-heading mt-3 break-words text-[22px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
                  {viewDriver.name}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`dr-badge ${typeTone(viewDriver.type)}`}>{viewDriver.type}</span>
                  <span className={`dr-badge ${statusTone(viewDriver.status)}`}>{viewDriver.status}</span>
                  <span className={`dr-badge ${availabilityTone(viewBusy)}`}>{viewBusy ? "On Trip" : "Available"}</span>
                </div>

                <dl className="dr-dl">
                  <div className="dr-dl-row">
                    <dt>Employee ID</dt>
                    <dd className="flex items-center justify-end gap-1.5">
                      {viewDriver.employee_id || "N/A"}
                      {viewDriver.employee_id && (
                        <button
                          type="button"
                          className="dr-copy"
                          onClick={() => copyToClipboard(viewDriver.employee_id)}
                          title="Copy Employee ID"
                          aria-label="Copy Employee ID"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      )}
                    </dd>
                  </div>
                  <div className="dr-dl-row">
                    <dt>Phone Number</dt>
                    <dd className="dr-num">{viewDriver.phone || "-"}</dd>
                  </div>
                  <div className="dr-dl-row">
                    <dt>License Number</dt>
                    <dd>{viewDriver.license_no || "-"}</dd>
                  </div>
                  <div className="dr-dl-row">
                    <dt>Assigned Branch</dt>
                    <dd>{viewDriver.branch || "-"}</dd>
                  </div>
                  <div className="dr-dl-row">
                    <dt>Client Assignment</dt>
                    <dd>{viewDriver.client || "-"}</dd>
                  </div>
                </dl>
              </div>

              <div className="dr-dialog-foot" style={{ borderTop: 0, paddingTop: 20 }}>
                <button
                  type="button"
                  className="dr-btn dr-btn-secondary"
                  onClick={() => {
                    setEditingDriver(viewDriver);
                    setViewDriver(null);
                  }}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={() => setViewDriver(null)} className="dr-btn dr-btn-primary">
                  Close Profile
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRM MODAL */}
        <AnimatePresence>
          {driverToDelete && (
            <Modal onClose={() => setDriverToDelete(null)} label="Delete Employee">
              <DialogHead
                icon={TrashIcon}
                tone="danger"
                title="Delete Employee"
                subtitle="This action cannot be undone"
                onClose={() => setDriverToDelete(null)}
              />
              <div className="dr-dialog-body">
                <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--sunken)", border: "1px solid var(--border)" }}>
                  <p className="dr-muted text-xs">Selected Employee</p>
                  <p className="mt-0.5 text-base font-semibold" style={{ color: "var(--ink)" }}>
                    {driverToDelete.name}
                  </p>
                  <p className="dr-muted mt-0.5 text-sm">
                    {driverToDelete.employee_id || "No employee ID"} · {driverToDelete.type}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-5">
                  <button type="button" onClick={() => setDriverToDelete(null)} className="dr-btn dr-btn-secondary">
                    Cancel
                  </button>
                  <button type="button" onClick={confirmDeleteDriver} disabled={submitting} className="dr-btn dr-btn-danger">
                    {submitting ? "Deleting…" : "Delete Employee"}
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* TOAST */}
        <div className="dr-toast-wrap" aria-live="polite">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.message}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="dr-toast"
                role="status"
              >
                {toast.tone === "error" ? (
                  <ExclamationCircleIcon className="h-5 w-5 shrink-0" style={{ color: "var(--rose)" }} />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 shrink-0" style={{ color: "var(--em)" }} />
                )}
                <span>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ============================================================
   PRESENTATIONAL COMPONENTS
   Kept in this file so it's a single paste-in — safe to lift into
   /components if other pages need them.
   ============================================================ */

function InputField({ label, value, onChange, icon: Icon, ...props }) {
  return (
    <div>
      <label className="dr-label">{label}</label>
      <div className="dr-field">
        {Icon && <Icon className="dr-lead" />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`dr-input ${Icon ? "has-lead" : ""}`}
          {...props}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, icon: Icon, disabled }) {
  return (
    <div>
      <label className="dr-label">{label}</label>
      <div className="dr-field">
        {Icon && <Icon className="dr-lead" />}
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`dr-input ${Icon ? "has-lead" : ""}`}
        >
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="dr-chev" />
      </div>
    </div>
  );
}

function Modal({ onClose, label, wide, className = "", children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="dr-overlay"
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
        aria-label={label}
        className={`dr-dialog ${wide ? "is-wide" : ""} ${className}`}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function DialogHead({ icon: Icon, title, subtitle, tone, onClose }) {
  return (
    <div className={`dr-dialog-head ${tone === "danger" ? "is-danger" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="dr-dialog-icon">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="vmvas-heading text-lg font-bold leading-tight" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          {subtitle && <p className="dr-muted mt-0.5 text-xs">{subtitle}</p>}
        </div>
      </div>
      <button type="button" className="dr-icon-btn" onClick={onClose} aria-label="Close">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}