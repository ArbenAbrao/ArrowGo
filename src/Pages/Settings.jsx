import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  KeyIcon,
  MapPinIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

const TABS = [
  { id: "account", label: "Account", desc: "Profile details", icon: UserIcon },
  { id: "security", label: "Security", desc: "Password and session", icon: ShieldCheckIcon },
  { id: "activity", label: "Activity", desc: "Your recent sign-ins", icon: ClockIcon },
  { id: "system", label: "System", desc: "Connection and diagnostics", icon: CpuChipIcon, privileged: true },
];

const ROLE_TONE = { Admin: "t-sky", IT: "t-amber", Client: "t-slate", User: "t-em" };

const PASSWORD_RULES = [
  { label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 1 uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least 1 number", test: (pw) => /[0-9]/.test(pw) },
  { label: "At least 1 special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/* ================= HELPERS ================= */
const initialsOf = (first = "", last = "") =>
  `${(first || "").trim()[0] || ""}${(last || "").trim()[0] || ""}`.toUpperCase() || "?";

const formatDate = (d) =>
  new Date(d).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const timeAgo = (d) => {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const steps = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = diff;
  for (const [amount, unit] of steps) {
    if (Math.abs(value) < amount) return rtf.format(Math.round(value), unit);
    value /= amount;
  }
  return "";
};

const statusLabel = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "Unknown");

function parseUserAgent(ua = "") {
  let browser = "Unknown browser";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os };
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

const copyWithToast = async (text, label) => {
  const ok = await copyText(text);
  if (ok) toast.success(`${label} copied`);
  else toast.error("Copy failed");
};

/* ================= STYLES =================
   Same emerald + slate system as the other Settings pages. */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');
.vmvas-heading { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em; }

.st {
  --panel:#FFFFFF; --panel-solid:#FFFFFF; --side:#F8FAFC; --sunken:#F1F5F9; --hover:#F8FAFC;
  --border:#E2E8F0; --border-soft:#F1F5F9;
  --ink:#0F172A; --text:#334155; --muted:#64748B; --faint:#94A3B8;
  --input-bg:#FFFFFF; --input-border:#CBD5E1;
  --em:#10B981; --em-tint:#ECFDF5; --em-line:#A7F3D0; --em-ink:#047857; --em-soft:rgba(16,185,129,.08);
  --focus-line:#34D399; --focus-ring:rgba(52,211,153,.35); --focus-outline:#059669;
  --rose:#E11D48; --rose-tint:#FFF1F2; --rose-line:#FECDD3;
  --amber-soft:rgba(245,158,11,.07);
  --t-em-bg:#ECFDF5; --t-em-ink:#047857;
  --t-sky-bg:#F0F9FF; --t-sky-ink:#0369A1;
  --t-amber-bg:#FFFBEB; --t-amber-ink:#B45309;
  --t-rose-bg:#FFF1F2; --t-rose-ink:#BE123C;
  --t-slate-bg:#F1F5F9; --t-slate-ink:#475569;
  --dialog:#FFFFFF; --overlay:rgba(0,0,0,.6);
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow:0 1px 2px rgba(15,23,42,.04), 0 16px 40px -16px rgba(15,23,42,.14);
  --shadow-lg:0 24px 60px -18px rgba(15,23,42,.35);
}
.st-dark {
  --panel:rgba(15,23,42,.7); --panel-solid:#0B1224; --side:rgba(2,6,23,.45); --sunken:rgba(30,41,59,.6); --hover:rgba(30,41,59,.45);
  --border:#1E293B; --border-soft:rgba(30,41,59,.7);
  --ink:#F1F5F9; --text:#CBD5E1; --muted:#94A3B8; --faint:#64748B;
  --input-bg:rgba(30,41,59,.7); --input-border:#334155;
  --em-tint:rgba(16,185,129,.1); --em-line:rgba(16,185,129,.25); --em-ink:#34D399; --em-soft:rgba(16,185,129,.09);
  --focus-line:rgba(16,185,129,.6); --focus-ring:rgba(16,185,129,.3); --focus-outline:#34D399;
  --rose:#FB7185; --rose-tint:rgba(244,63,94,.1); --rose-line:rgba(244,63,94,.28);
  --t-em-bg:rgba(16,185,129,.15); --t-em-ink:#34D399;
  --t-sky-bg:rgba(14,165,233,.15); --t-sky-ink:#38BDF8;
  --t-amber-bg:rgba(245,158,11,.15); --t-amber-ink:#FBBF24;
  --t-rose-bg:rgba(244,63,94,.15); --t-rose-ink:#FB7185;
  --t-slate-bg:#1E293B; --t-slate-ink:#94A3B8;
  --dialog:#0F172A;
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 50px -20px rgba(0,0,0,.65);
  --shadow-lg:0 30px 70px -20px rgba(0,0,0,.8);
}
.st *, .st *::before, .st *::after { box-sizing:border-box; }
.st button { font-family:inherit; cursor:pointer; }
.st :focus-visible { outline:2px solid var(--focus-outline); outline-offset:2px; }
.st-num { font-variant-numeric:tabular-nums; }
.st-muted { color:var(--muted); }
.st-scroll { scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

/* tones + badges */
.t-em { background:var(--t-em-bg); color:var(--t-em-ink); }
.t-sky { background:var(--t-sky-bg); color:var(--t-sky-ink); }
.t-amber { background:var(--t-amber-bg); color:var(--t-amber-ink); }
.t-rose { background:var(--t-rose-bg); color:var(--t-rose-ink); }
.t-slate { background:var(--t-slate-bg); color:var(--t-slate-ink); }
.st-badge { display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 10px; border-radius:999px; font-size:12px; font-weight:600; white-space:nowrap; }
.st-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.st-badge.has-icon { padding:0 10px 0 8px; }
.st-badge.has-icon::before { display:none; }
.st-badge.is-live::before { animation:st-pulse 1.8s ease-in-out infinite; }
@keyframes st-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(.8); } }

/* buttons */
.st-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:12px;
  border:1px solid transparent; font-size:14px; font-weight:600; white-space:nowrap;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease, filter .15s ease; }
.st-btn:disabled { opacity:.55; cursor:not-allowed; }
.st-btn-sm { height:36px; padding:0 14px; font-size:13px; }
.st-btn-primary { color:#fff; background:linear-gradient(180deg,#10B981 0%,#059669 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 18px -8px rgba(5,150,105,.6); }
.st-dark .st-btn-primary { color:#020617; background:linear-gradient(180deg,#34D399 0%,#059669 100%); }
.st-btn-danger { color:#fff; background:linear-gradient(180deg,#F43F5E 0%,#E11D48 100%); box-shadow:0 8px 18px -8px rgba(225,29,72,.55); }
.st-dark .st-btn-danger { color:#020617; background:linear-gradient(180deg,#FB7185 0%,#E11D48 100%); }
.st-btn-primary:hover:not(:disabled), .st-btn-danger:hover:not(:disabled) { filter:brightness(1.07); }
.st-btn-secondary { color:var(--text); background:transparent; border-color:var(--input-border); }
.st-btn-secondary:hover:not(:disabled) { background:var(--hover); border-color:var(--faint); }
.st-btn-secondary.is-danger:hover:not(:disabled) { color:var(--rose); background:var(--rose-tint); border-color:var(--rose-line); }
.st-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; border:0; background:transparent;
  color:var(--faint); transition:background-color .15s ease, color .15s ease; }
.st-icon-btn:hover { color:var(--em-ink); background:var(--em-tint); }
.st-icon-btn.is-plain:hover { color:var(--ink); background:var(--sunken); }

/* inputs */
.st-label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:var(--ink); }
.st-field { position:relative; }
.st-input { width:100%; height:42px; padding:0 14px; border-radius:12px; border:1px solid var(--input-border); background:var(--input-bg);
  color:var(--ink); font:inherit; font-size:14px; outline:none; transition:border-color .15s ease, box-shadow .15s ease; }
.st-input::placeholder { color:var(--faint); }
.st-input:focus { border-color:var(--focus-line); box-shadow:0 0 0 3px var(--focus-ring); }
.st-input:disabled { opacity:.6; cursor:not-allowed; background:var(--sunken); }
.st-input.has-trail { padding-right:44px; }
.st-input.is-invalid { border-color:var(--rose); }
.st-input.is-invalid:focus { box-shadow:0 0 0 3px var(--rose-line); }
.st-trail { position:absolute; right:5px; top:50%; transform:translateY(-50%); }
.st-msg { display:flex; align-items:center; gap:6px; margin-top:6px; font-size:12.5px; }
.st-msg.is-error { color:var(--rose); }
.st-msg.is-ok { color:var(--em-ink); }

/* shell + hero */
.st-shell { position:relative; background:var(--panel); border:1px solid var(--border); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
.st-banner { height:92px; background:linear-gradient(110deg,#10B981 0%,#14B8A6 55%,#0891B2 100%); position:relative; }
.st-banner::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 10% 0%, rgba(255,255,255,.3), transparent 48%); }
.st-hero { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px; padding:0 24px 22px; }
.st-avatar-lg { display:flex; flex:none; align-items:center; justify-content:center; width:84px; height:84px; margin-top:-42px; border-radius:26px;
  background:var(--em-tint); border:4px solid var(--panel-solid); color:var(--em-ink); font-size:28px; font-weight:700; box-shadow:var(--shadow-sm); position:relative; }

/* nav */
.st-nav { display:flex; gap:6px; padding:8px; overflow-x:auto; }
@media (min-width:1280px) { .st-nav { flex-direction:column; overflow:visible; padding:10px; position:sticky; top:1.5rem; } }
.st-nav-item { display:flex; flex:none; align-items:center; gap:12px; min-width:170px; padding:9px 12px 9px 10px; text-align:left; border-radius:14px; border:1px solid transparent;
  background:transparent; color:inherit; transition:background-color .15s ease, border-color .15s ease; }
@media (min-width:1280px) { .st-nav-item { min-width:0; width:100%; } }
.st-nav-item:hover { background:var(--hover); }
.st-nav-item.is-active { background:var(--em-soft); border-color:var(--em-line); }
.st-nav-tile { display:flex; flex:none; align-items:center; justify-content:center; width:36px; height:36px; border-radius:11px; background:var(--sunken); color:var(--muted); transition:all .15s ease; }
.st-nav-item.is-active .st-nav-tile { color:#fff; background:linear-gradient(135deg,#10B981,#059669); box-shadow:0 6px 14px -6px rgba(5,150,105,.7); }
.st-dark .st-nav-item.is-active .st-nav-tile { color:#020617; }
.st-nav-name { display:block; font-size:14px; font-weight:600; color:var(--ink); }
.st-nav-desc { display:block; font-size:12px; color:var(--muted); margin-top:1px; }

/* content */
.st-section-head { display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:12px; padding:22px 24px 0; }
.st-section-body { padding:20px 24px 24px; }
.st-card { border:1px solid var(--border); border-radius:16px; background:var(--panel); }
.st-card + .st-card { margin-top:16px; }
.st-card-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; }
.st-card-head + .st-dl, .st-card-head + .st-card-body { border-top:1px solid var(--border-soft); }
.st-card-body { padding:16px 18px; }
.st-tile { display:flex; flex:none; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; }

.st-fields { display:grid; grid-template-columns:minmax(0,1fr); gap:12px; }
@media (min-width:640px) { .st-fields { grid-template-columns:repeat(2,minmax(0,1fr)); } }
.st-fieldbox { display:flex; align-items:flex-start; gap:12px; padding:14px; border:1px solid var(--border); border-radius:16px; background:var(--panel); min-width:0; transition:border-color .15s ease; }
.st-fieldbox.is-editing { border-color:var(--em-line); background:var(--em-soft); }
.st-fieldtile { display:flex; flex:none; align-items:center; justify-content:center; width:36px; height:36px; border-radius:11px; background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); }
.st-fieldlabel { font-size:12px; color:var(--muted); margin-bottom:3px; }
.st-fieldvalue { font-size:14.5px; font-weight:600; color:var(--ink); overflow-wrap:anywhere; }

.st-dl { margin:0; }
.st-dl-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:13px 18px; border-bottom:1px solid var(--border-soft); }
.st-dl-row:last-child { border-bottom:0; }
.st-dl-row dt { flex:none; font-size:13px; color:var(--muted); }
.st-dl-row dd { margin:0; min-width:0; text-align:right; font-size:14px; font-weight:600; color:var(--ink); overflow-wrap:anywhere; }
.st-code { display:inline-block; max-width:100%; padding:3px 9px; border-radius:8px; background:var(--sunken); border:1px solid var(--border); font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; font-weight:500; overflow-wrap:anywhere; }

.st-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.st-stat { padding:14px 16px; border:1px solid var(--border); border-radius:16px; background:var(--panel); }
.st-stat-value { font-size:24px; font-weight:700; line-height:1.1; color:var(--ink); }
.st-stat-label { margin-top:3px; font-size:12.5px; color:var(--muted); }

.st-list { border:1px solid var(--border); border-radius:16px; overflow:hidden; background:var(--panel); }
.st-log { display:grid; grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"status date" "dev dev" "loc loc"; gap:8px 12px; align-items:center; padding:14px 18px; border-bottom:1px solid var(--border-soft); }
.st-log:last-child { border-bottom:0; }
.st-log.is-flagged { background:var(--amber-soft); }
.st-log-status { grid-area:status; display:flex; flex-wrap:wrap; gap:6px; }
.st-log-date { grid-area:date; text-align:right; }
.st-log-dev { grid-area:dev; }
.st-log-loc { grid-area:loc; }
.st-line { display:flex; align-items:center; gap:8px; min-width:0; font-size:13px; color:var(--muted); }
.st-line svg { width:15px; height:15px; flex:none; color:var(--faint); }
.st-line span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
@media (min-width:1280px) {
  .st-log { grid-template-columns:150px minmax(0,1.2fr) minmax(0,1fr) 150px; grid-template-areas:"status dev loc date"; column-gap:16px; }
}

.st-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:48px 24px; border:1px dashed var(--input-border); border-radius:16px; background:var(--side); }
.st-empty-icon { display:flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; margin-bottom:14px; background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); }
.st-skel { background:var(--sunken); border-radius:12px; animation:st-skel 1.4s ease-in-out infinite; }
@keyframes st-skel { 0%,100% { opacity:1; } 50% { opacity:.55; } }
@media (prefers-reduced-motion: reduce) { .st-skel, .st-badge.is-live::before { animation:none; } .st *, .st *::before { transition-duration:0s !important; } }

/* dialogs */
.st-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:16px; background:var(--overlay); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
.st-dialog { display:flex; flex-direction:column; width:100%; max-width:448px; max-height:calc(100vh - 32px); border-radius:20px; border:1px solid var(--border); background:var(--dialog); color:var(--ink); box-shadow:var(--shadow-lg); overflow:hidden; }
.st-dialog.is-sm { max-width:400px; }
.st-dialog-head { display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--border); background:var(--side); }
.st-dialog-body { flex:1; overflow-y:auto; padding:22px 24px; }
.st-dialog-foot { display:flex; justify-content:flex-end; gap:12px; padding:16px 24px; border-top:1px solid var(--border); background:var(--side); }
.st-meter { display:flex; gap:4px; }
.st-meter i { flex:1; height:5px; border-radius:999px; background:var(--sunken); border:1px solid var(--border-soft); transition:background-color .2s ease; }
.st-meter i.on-rose { background:#F43F5E; border-color:transparent; }
.st-meter i.on-amber { background:#F59E0B; border-color:transparent; }
.st-meter i.on-em { background:#10B981; border-color:transparent; }
.st-reqs { display:grid; gap:7px; margin:0; padding:0; list-style:none; font-size:12.5px; }
.st-reqs li { display:flex; align-items:center; gap:8px; color:var(--muted); transition:color .15s ease; }
.st-reqs li.is-met { color:var(--em-ink); }
.st-reqs li svg { width:15px; height:15px; flex:none; }
`;

/* ================= MAIN COMPONENT ================= */
export default function Settings({ darkMode }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    branch: "",
    role: "",
    id: "",
  });

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });

  const [activity, setActivity] = useState({ items: [], status: "idle" }); // idle | loading | ready | error
  const [visibleLogs, setVisibleLogs] = useState(8);
  const [conn, setConn] = useState({ status: "idle", ms: null, message: "" }); // idle | checking | ok | error
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  /* ================= FETCH FULL USER FROM BACKEND ================= */
  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }
    if (!storedUser) {
      navigate("/", { replace: true });
      return;
    }

    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/accounts/${storedUser.id}`);
        setUser(data);
        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || "",
          username: data.username || "",
          branch: data.branch || "",
          role: data.role || "",
          id: data.id,
        });
      } catch (err) {
        toast.error("Failed to load account info");
        console.error(err);
      }
    };

    fetchUser();
  }, [navigate]);

  /* ================= NETWORK STATUS ================= */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ================= SIGN-IN ACTIVITY ================= */
  const userId = user?.id;

  const loadActivity = useCallback(async () => {
    setActivity((a) => ({ ...a, status: "loading" }));
    try {
      const { data } = await axios.get(`${API_URL}/api/login-logs`);
      setActivity({ items: Array.isArray(data) ? data : [], status: "ready" });
    } catch (err) {
      console.error(err);
      setActivity((a) => ({ ...a, status: "error" }));
    }
  }, []);

  useEffect(() => {
    if (userId) loadActivity();
  }, [userId, loadActivity]);

  const myLogs = useMemo(() => {
    if (!user) return [];
    const lower = (v) => String(v || "").trim().toLowerCase();
    const ids = [user.username, user.email].filter(Boolean).map(lower);
    const fullName = lower(`${user.first_name || ""} ${user.last_name || ""}`);
    return activity.items
      .filter((log) => {
        if (String(log.user_id ?? log.account_id ?? "") === String(user.id)) return true;
        if (log.username_or_email) return ids.includes(lower(log.username_or_email));
        return Boolean(log.name) && lower(log.name) === fullName;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [activity.items, user]);

  const logStats = useMemo(
    () => ({
      success: myLogs.filter((l) => l.status === "SUCCESS").length,
      failed: myLogs.filter((l) => l.status === "FAILED").length,
      suspicious: myLogs.filter((l) => l.is_suspicious).length,
    }),
    [myLogs]
  );

  const lastSignIn = useMemo(() => myLogs.find((l) => l.status === "SUCCESS") || null, [myLogs]);

  /* ================= API CONNECTION TEST (System tab) ================= */
  const testConnection = useCallback(async () => {
    if (!API_URL) {
      setConn({ status: "error", ms: null, message: "REACT_APP_API_URL isn't set." });
      return;
    }
    setConn({ status: "checking", ms: null, message: "" });
    const started = performance.now();
    try {
      await axios.get(`${API_URL}/api/accounts/${userId}`, { timeout: 8000 });
      setConn({ status: "ok", ms: Math.round(performance.now() - started), message: "" });
    } catch (err) {
      const code = err.response?.status;
      setConn({
        status: "error",
        ms: null,
        message: code
          ? `The server responded with ${code}.`
          : err.code === "ECONNABORTED"
          ? "The request timed out after 8 seconds."
          : "Couldn't reach the server.",
      });
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "system" && userId) testConnection();
  }, [activeTab, userId, testConnection]);

  /* ================= LOADING STATE ================= */
  const theme = darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        titleText: "text-slate-100",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        subtleText: "text-slate-500",
      }
    : {
        pageBg: "bg-slate-50 text-slate-700",
        titleText: "text-slate-900",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        subtleText: "text-slate-500",
      };

  const isPrivileged = user ? ["Admin", "IT"].includes(user.role) : false;
  const visibleTabs = TABS.filter((t) => !t.privileged || isPrivileged);
  const currentTab = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0];

  const pageHeader = (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className={`flex items-center gap-1.5 text-xs mb-3 ${theme.subtleText}`}>
        <span>Settings</span>
        <ChevronRightIcon className="w-3 h-3" />
        <span className={theme.titleText}>{currentTab?.label || "Account"}</span>
      </div>

      <div className="flex items-start gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
          <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
        </span>
        <div>
          <h1 className={`vmvas-heading text-2xl sm:text-[28px] font-bold leading-tight ${theme.titleText}`}>Settings</h1>
          <p className={`text-sm mt-1 ${theme.subtleText}`}>Manage your account, security and sign-in activity.</p>
        </div>
      </div>
    </motion.div>
  );

  if (!user) {
    return (
      <div className={`st ${darkMode ? "st-dark" : ""} min-h-screen p-4 sm:p-6 transition-colors ${theme.pageBg}`}>
        <style>{styles}</style>
        {pageHeader}
        <div className="mt-6 space-y-4">
          <div className="st-skel h-[168px]" />
          <div className="st-skel h-[360px]" />
        </div>
      </div>
    );
  }

  /* ================= UPDATE PROFILE ================= */
  const dirty = profile.email !== (user.email || "") || profile.username !== (user.username || "");

  const startEditing = () => {
    setProfile((p) => ({ ...p, email: user.email || "", username: user.username || "" }));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setProfile((p) => ({ ...p, email: user.email || "", username: user.username || "" }));
    setIsEditing(false);
  };

  const handleProfileSave = async () => {
    const email = profile.email.trim();
    const username = profile.username.trim();

    if (!username || /\s/.test(username)) {
      toast.error("Username is required and can't contain spaces");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    const payload = { ...profile, email, username };

    setSavingProfile(true);
    try {
      await axios.put(`${API_URL}/api/accounts/${user.id}`, payload);

      const updatedUser = { ...user, ...payload };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfile(payload);

      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswords({ current: "", next: "", confirm: "" });
    setShowPasswords({ current: false, next: false, confirm: false });
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const { current, next, confirm } = passwords;

    if (next !== confirm) {
      toast.error("New password and confirm password must match");
      return;
    }
    if (current === next) {
      toast.error("New password cannot be the same as current password");
      return;
    }
    if (!PASSWORD_RULES.every((r) => r.test(next))) {
      toast.error("Password does not meet strength requirements");
      return;
    }

    setSavingPassword(true);
    try {
      await axios.put(`${API_URL}/api/accounts/${user.id}/change-password`, {
        currentPassword: current,
        newPassword: next,
      });

      toast.success("Password updated successfully");
      closePasswordModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed");
      console.error(err);
    } finally {
      setSavingPassword(false);
    }
  };

  const signOut = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const { browser, os } = parseUserAgent(typeof navigator !== "undefined" ? navigator.userAgent : "");

  const copyDiagnostics = () => {
    const lines = [
      `API endpoint: ${API_URL || "(not set)"}`,
      `Connection: ${conn.status === "ok" ? `OK (${conn.ms} ms)` : conn.status === "error" ? `Error - ${conn.message}` : conn.status}`,
      `Build mode: ${process.env.NODE_ENV}`,
      `Browser: ${browser}`,
      `OS: ${os}`,
      `Screen: ${window.screen.width}x${window.screen.height}`,
      `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `Language: ${navigator.language}`,
      `Online: ${online ? "yes" : "no"}`,
      `User: ${user.username} (#${user.id}, ${user.role})`,
    ];
    copyWithToast(lines.join("\n"), "Diagnostics");
  };

  const pwChecks = PASSWORD_RULES.map((r) => ({ label: r.label, met: r.test(passwords.next) }));
  const pwScore = pwChecks.filter((c) => c.met).length;
  const pwTone = pwScore <= 2 ? "on-rose" : pwScore <= 4 ? "on-amber" : "on-em";
  const pwMismatch = passwords.confirm.length > 0 && passwords.next !== passwords.confirm;

  /* ================= RENDER ================= */
  return (
    <MotionConfig reducedMotion="user">
      <div className={`st ${darkMode ? "st-dark" : ""} min-h-screen p-4 sm:p-6 transition-colors ${theme.pageBg}`}>
        <style>{styles}</style>

        <Toaster
          position="top-right"
          toastOptions={{
            style: darkMode
              ? { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" }
              : { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
          }}
        />

        {pageHeader}

        {/* PROFILE HERO */}
        <div className="st-shell mt-6">
          <div className="st-banner" />
          <div className="st-hero">
            <div className="st-avatar-lg" aria-hidden="true">
              {initialsOf(user.first_name, user.last_name)}
            </div>
            <div className="min-w-0 flex-1 pt-3">
              <h2 className="vmvas-heading break-words text-[22px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
                {fullName}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className={`st-badge ${ROLE_TONE[user.role] || ROLE_TONE.User}`}>{user.role}</span>
                {user.branch && (
                  <span className="st-badge has-icon t-slate">
                    <BuildingOffice2Icon className="h-3.5 w-3.5" />
                    {user.branch}
                  </span>
                )}
              </div>
            </div>
            <button type="button" className="st-btn st-btn-secondary st-btn-sm is-danger" onClick={() => setShowSignOut(true)}>
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[248px_minmax(0,1fr)]">
          {/* NAV */}
          <nav className="st-shell st-nav st-scroll" role="tablist" aria-label="Settings sections">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = t.id === currentTab.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`st-nav-item ${active ? "is-active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <span className="st-nav-tile">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="st-nav-name">{t.label}</span>
                    <span className="st-nav-desc">{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* PANEL */}
          <section className="st-shell min-w-0" role="tabpanel">
            <motion.div key={currentTab.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              {/* ---------- ACCOUNT ---------- */}
              {currentTab.id === "account" && (
                <>
                  <div className="st-section-head">
                    <div>
                      <h2 className="vmvas-heading text-[19px] font-bold" style={{ color: "var(--ink)" }}>
                        Account Information
                      </h2>
                      <p className="st-muted mt-1 text-sm">
                        {isPrivileged
                          ? "Update your contact details. Name, branch and role are managed by an administrator."
                          : "Your details are managed by an Admin or IT account."}
                      </p>
                    </div>

                    {isPrivileged &&
                      (!isEditing ? (
                        <button type="button" className="st-btn st-btn-secondary st-btn-sm" onClick={startEditing}>
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button type="button" className="st-btn st-btn-secondary st-btn-sm" onClick={cancelEditing} disabled={savingProfile}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="st-btn st-btn-primary st-btn-sm"
                            onClick={handleProfileSave}
                            disabled={savingProfile || !dirty}
                          >
                            {savingProfile ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="st-section-body">
                    <div className="st-fields">
                      <Field icon={IdentificationIcon} label="Full Name" editing={isEditing} hint={isEditing ? "Name can only be changed by an administrator." : undefined}>
                        {isEditing ? (
                          <input className="st-input" value={`${profile.firstName} ${profile.lastName}`} disabled aria-label="Full name" />
                        ) : (
                          fullName
                        )}
                      </Field>

                      <Field
                        icon={EnvelopeIcon}
                        label="Email"
                        editing={isEditing}
                        onCopy={!isEditing && user.email ? () => copyWithToast(user.email, "Email") : undefined}
                      >
                        {isEditing ? (
                          <input
                            className="st-input"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            aria-label="Email"
                            autoComplete="email"
                          />
                        ) : (
                          user.email || "—"
                        )}
                      </Field>

                      <Field
                        icon={UserIcon}
                        label="Username"
                        editing={isEditing}
                        onCopy={!isEditing && user.username ? () => copyWithToast(user.username, "Username") : undefined}
                      >
                        {isEditing ? (
                          <input
                            className="st-input"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            aria-label="Username"
                            autoComplete="username"
                          />
                        ) : (
                          user.username || "—"
                        )}
                      </Field>

                      <Field icon={BuildingOffice2Icon} label="Branch">
                        {user.branch || "—"}
                      </Field>

                      <Field icon={ShieldCheckIcon} label="Role">
                        <span className={`st-badge ${ROLE_TONE[user.role] || ROLE_TONE.User}`}>{user.role}</span>
                      </Field>

                      <Field icon={IdentificationIcon} label="ID" onCopy={() => copyWithToast(String(user.id), "Account ID")}>
                        <span className="st-num">{user.id}</span>
                      </Field>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" className="st-btn st-btn-secondary" onClick={() => setShowPasswordModal(true)}>
                        <KeyIcon className="h-4 w-4" />
                        Change Password
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ---------- SECURITY ---------- */}
              {currentTab.id === "security" && (
                <>
                  <div className="st-section-head">
                    <div>
                      <h2 className="vmvas-heading text-[19px] font-bold" style={{ color: "var(--ink)" }}>
                        Security Settings
                      </h2>
                      <p className="st-muted mt-1 text-sm">Keep your account protected and review where you're signed in.</p>
                    </div>
                  </div>

                  <div className="st-section-body">
                    <div className="st-card">
                      <div className="st-card-head">
                        <div className="flex items-center gap-3.5">
                          <span className="st-tile t-em">
                            <KeyIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                              Password
                            </h3>
                            <p className="st-muted mt-0.5 text-[13px]">Use at least 8 characters with upper and lower case, a number and a symbol.</p>
                          </div>
                        </div>
                        <button type="button" className="st-btn st-btn-secondary st-btn-sm" onClick={() => setShowPasswordModal(true)}>
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div className="st-card">
                      <div className="st-card-head">
                        <div className="flex items-center gap-3.5">
                          <span className="st-tile t-sky">
                            <DevicePhoneMobileIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                              Current session
                            </h3>
                            <p className="st-muted mt-0.5 text-[13px]">The browser you're using right now.</p>
                          </div>
                        </div>
                        <span className={`st-badge ${online ? "t-em is-live" : "t-rose"}`}>{online ? "Online" : "Offline"}</span>
                      </div>
                      <dl className="st-dl">
                        <div className="st-dl-row">
                          <dt>Signed in as</dt>
                          <dd>@{user.username}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Browser</dt>
                          <dd>{browser}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Operating system</dt>
                          <dd>{os}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Last sign-in</dt>
                          <dd>
                            {activity.status === "loading" && !lastSignIn ? (
                              <span className="st-muted font-medium">Checking…</span>
                            ) : lastSignIn ? (
                              <>
                                {formatDate(lastSignIn.created_at)}
                                <span className="st-muted block text-xs font-medium">{timeAgo(lastSignIn.created_at)}</span>
                              </>
                            ) : (
                              <span className="st-muted font-medium">Not available</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="st-card">
                      <div className="st-card-head">
                        <div className="flex items-center gap-3.5">
                          <span className="st-tile t-rose">
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                              Sign out
                            </h3>
                            <p className="st-muted mt-0.5 text-[13px]">Ends your session in this browser.</p>
                          </div>
                        </div>
                        <button type="button" className="st-btn st-btn-secondary st-btn-sm is-danger" onClick={() => setShowSignOut(true)}>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---------- ACTIVITY ---------- */}
              {currentTab.id === "activity" && (
                <>
                  <div className="st-section-head">
                    <div>
                      <h2 className="vmvas-heading text-[19px] font-bold" style={{ color: "var(--ink)" }}>
                        Sign-in Activity
                      </h2>
                      <p className="st-muted mt-1 text-sm">Recent sign-in attempts on your account. Report anything you don't recognise.</p>
                    </div>
                    <button
                      type="button"
                      className="st-btn st-btn-secondary st-btn-sm"
                      onClick={loadActivity}
                      disabled={activity.status === "loading"}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${activity.status === "loading" ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="st-section-body">
                    <div className="st-stats">
                      <div className="st-stat">
                        <p className="st-stat-value vmvas-heading st-num">{activity.status === "ready" ? logStats.success : "—"}</p>
                        <p className="st-stat-label">Successful</p>
                      </div>
                      <div className="st-stat">
                        <p className="st-stat-value vmvas-heading st-num">{activity.status === "ready" ? logStats.failed : "—"}</p>
                        <p className="st-stat-label">Failed</p>
                      </div>
                      <div className="st-stat">
                        <p className="st-stat-value vmvas-heading st-num">{activity.status === "ready" ? logStats.suspicious : "—"}</p>
                        <p className="st-stat-label">Suspicious</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      {activity.status === "loading" && activity.items.length === 0 ? (
                        <div className="space-y-3">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="st-skel h-[58px]" />
                          ))}
                        </div>
                      ) : activity.status === "error" && activity.items.length === 0 ? (
                        <div className="st-empty">
                          <span className="st-empty-icon">
                            <ExclamationCircleIcon className="h-6 w-6" />
                          </span>
                          <h3 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
                            Couldn't load sign-in activity
                          </h3>
                          <p className="st-muted mt-1.5 max-w-sm text-sm">Check your connection and try again.</p>
                          <button type="button" className="st-btn st-btn-secondary mt-5" onClick={loadActivity}>
                            <ArrowPathIcon className="h-4 w-4" />
                            Retry
                          </button>
                        </div>
                      ) : myLogs.length === 0 ? (
                        <div className="st-empty">
                          <span className="st-empty-icon">
                            <ClockIcon className="h-6 w-6" />
                          </span>
                          <h3 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
                            No sign-in activity yet
                          </h3>
                          <p className="st-muted mt-1.5 max-w-sm text-sm">Your sign-ins will show up here.</p>
                        </div>
                      ) : (
                        <>
                          <ul className="st-list">
                            {myLogs.slice(0, visibleLogs).map((log) => (
                              <li key={log.id} className={`st-log ${log.is_suspicious ? "is-flagged" : ""}`}>
                                <div className="st-log-status">
                                  {log.status === "SUCCESS" ? (
                                    <span className="st-badge has-icon t-em">
                                      <CheckCircleIcon className="h-4 w-4" />
                                      Success
                                    </span>
                                  ) : log.status === "FAILED" ? (
                                    <span className="st-badge has-icon t-rose">
                                      <XCircleIcon className="h-4 w-4" />
                                      Failed
                                    </span>
                                  ) : (
                                    <span className="st-badge has-icon t-slate">
                                      <ExclamationCircleIcon className="h-4 w-4" />
                                      {statusLabel(log.status)}
                                    </span>
                                  )}
                                  {log.is_suspicious ? <span className="st-badge t-amber">Suspicious</span> : null}
                                </div>

                                <div className="st-log-date">
                                  <p className="st-num text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                                    {formatDate(log.created_at)}
                                  </p>
                                  <p className="st-muted text-xs">{timeAgo(log.created_at)}</p>
                                </div>

                                <div className="st-line st-log-dev">
                                  <DevicePhoneMobileIcon />
                                  <span title={log.device || ""}>{log.device || "-"}</span>
                                </div>

                                <div className="st-line st-log-loc">
                                  <MapPinIcon />
                                  <span title={log.location || ""}>{log.location || "-"}</span>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {myLogs.length > visibleLogs && (
                            <div className="mt-4 flex justify-center">
                              <button type="button" className="st-btn st-btn-secondary st-btn-sm" onClick={() => setVisibleLogs((n) => n + 8)}>
                                Show more ({myLogs.length - visibleLogs} remaining)
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ---------- SYSTEM (Admin / IT) ---------- */}
              {currentTab.id === "system" && (
                <>
                  <div className="st-section-head">
                    <div>
                      <h2 className="vmvas-heading text-[19px] font-bold" style={{ color: "var(--ink)" }}>
                        System
                      </h2>
                      <p className="st-muted mt-1 text-sm">Check the connection to the server and copy details for troubleshooting.</p>
                    </div>
                    <button type="button" className="st-btn st-btn-secondary st-btn-sm" onClick={copyDiagnostics}>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Copy Diagnostics
                    </button>
                  </div>

                  <div className="st-section-body">
                    <div className="st-card">
                      <div className="st-card-head">
                        <div className="flex items-center gap-3.5">
                          <span className="st-tile t-em">
                            <CpuChipIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                              API connection
                            </h3>
                            <p className="st-muted mt-0.5 text-[13px]">Requests from this app go to the endpoint below.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="st-btn st-btn-secondary st-btn-sm"
                          onClick={testConnection}
                          disabled={conn.status === "checking"}
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${conn.status === "checking" ? "animate-spin" : ""}`} />
                          Test Connection
                        </button>
                      </div>
                      <dl className="st-dl">
                        <div className="st-dl-row">
                          <dt>Endpoint</dt>
                          <dd>
                            <span className="st-code">{API_URL || "Not set"}</span>
                          </dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Status</dt>
                          <dd>
                            {conn.status === "ok" && (
                              <span className="st-badge t-em is-live st-num">Connected · {conn.ms} ms</span>
                            )}
                            {conn.status === "checking" && <span className="st-badge t-slate">Checking…</span>}
                            {conn.status === "error" && <span className="st-badge t-rose">Unreachable</span>}
                            {conn.status === "idle" && <span className="st-badge t-slate">Not checked</span>}
                          </dd>
                        </div>
                      </dl>
                      {conn.status === "error" && (
                        <div className="st-card-body" style={{ borderTop: "1px solid var(--border-soft)" }}>
                          <p className="st-msg is-error" style={{ marginTop: 0 }} role="alert">
                            <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                            {conn.message}
                            {!API_URL ? " Add it to your .env file and restart npm start." : " Check that the backend is running and the IP in .env is current."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="st-card">
                      <div className="st-card-head">
                        <div className="flex items-center gap-3.5">
                          <span className="st-tile t-sky">
                            <DevicePhoneMobileIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                              Environment
                            </h3>
                            <p className="st-muted mt-0.5 text-[13px]">Details about this browser and build.</p>
                          </div>
                        </div>
                      </div>
                      <dl className="st-dl">
                        <div className="st-dl-row">
                          <dt>Build mode</dt>
                          <dd>{process.env.NODE_ENV}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Browser</dt>
                          <dd>{browser}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Operating system</dt>
                          <dd>{os}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Screen</dt>
                          <dd className="st-num">
                            {window.screen.width} × {window.screen.height}
                          </dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Timezone</dt>
                          <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Language</dt>
                          <dd>{navigator.language}</dd>
                        </div>
                        <div className="st-dl-row">
                          <dt>Network</dt>
                          <dd>{online ? "Online" : "Offline"}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </section>
        </div>

        {/* ================= CHANGE PASSWORD MODAL ================= */}
        <AnimatePresence>
          {showPasswordModal && (
            <Modal onClose={closePasswordModal} label="Change Password">
              <ModalHead icon={KeyIcon} tone="t-sky" title="Change Password" subtitle="Choose a new password for your account" onClose={closePasswordModal} />
              <form onSubmit={submitPassword} className="flex min-h-0 flex-1 flex-col">
                <div className="st-dialog-body st-scroll space-y-5">
                  <PasswordInput
                    id="currentPassword"
                    label="Current Password"
                    value={passwords.current}
                    onChange={(v) => setPasswords({ ...passwords, current: v })}
                    show={showPasswords.current}
                    onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    autoComplete="current-password"
                    autoFocus
                    required
                  />

                  <div>
                    <PasswordInput
                      id="newPassword"
                      label="New Password"
                      value={passwords.next}
                      onChange={(v) => setPasswords({ ...passwords, next: v })}
                      show={showPasswords.next}
                      onToggle={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })}
                      required
                    />

                    <div className="st-meter mt-3" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <i key={i} className={passwords.next && i < pwScore ? pwTone : ""} />
                      ))}
                    </div>

                    <ul className="st-reqs mt-3">
                      {pwChecks.map((c) => (
                        <li key={c.label} className={c.met ? "is-met" : ""}>
                          {c.met ? <CheckIcon /> : <XMarkIcon style={{ opacity: 0.4 }} />}
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <PasswordInput
                      id="confirmPassword"
                      label="Confirm Password"
                      value={passwords.confirm}
                      onChange={(v) => setPasswords({ ...passwords, confirm: v })}
                      show={showPasswords.confirm}
                      onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      invalid={pwMismatch}
                      required
                    />
                    {pwMismatch && (
                      <p className="st-msg is-error" role="alert">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        Passwords don't match
                      </p>
                    )}
                  </div>
                </div>

                <div className="st-dialog-foot">
                  <button type="button" className="st-btn st-btn-secondary" onClick={closePasswordModal}>
                    Cancel
                  </button>
                  <button type="submit" className="st-btn st-btn-primary" disabled={savingPassword}>
                    {savingPassword ? "Updating…" : "Update"}
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* ================= SIGN OUT CONFIRM ================= */}
        <AnimatePresence>
          {showSignOut && (
            <Modal onClose={() => setShowSignOut(false)} label="Sign out" small>
              <ModalHead
                icon={ArrowRightOnRectangleIcon}
                tone="t-rose"
                title="Sign out?"
                subtitle="You'll need to sign in again to continue"
                onClose={() => setShowSignOut(false)}
              />
              <div className="st-dialog-body">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  This ends your session in this browser. Other devices aren't affected.
                </p>
              </div>
              <div className="st-dialog-foot">
                <button type="button" className="st-btn st-btn-secondary" onClick={() => setShowSignOut(false)}>
                  Cancel
                </button>
                <button type="button" className="st-btn st-btn-danger" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ============================================================
   PRESENTATIONAL COMPONENTS
   Kept in this file so it's a single paste-in.
   ============================================================ */

function Field({ icon: Icon, label, hint, editing, onCopy, children }) {
  return (
    <div className={`st-fieldbox ${editing ? "is-editing" : ""}`}>
      <span className="st-fieldtile">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="st-fieldlabel">{label}</p>
        <div className="st-fieldvalue">{children}</div>
        {hint && <p className="st-muted mt-1.5 text-xs">{hint}</p>}
      </div>
      {onCopy && (
        <button type="button" className="st-icon-btn" onClick={onCopy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
          <ClipboardDocumentIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, show, onToggle, invalid, autoComplete = "new-password", autoFocus, required }) {
  return (
    <div>
      <label className="st-label" htmlFor={id}>
        {label}
      </label>
      <div className="st-field">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={invalid || undefined}
          className={`st-input has-trail ${invalid ? "is-invalid" : ""}`}
        />
        <button type="button" className="st-icon-btn is-plain st-trail" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Modal({ onClose, label, small, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="st-overlay"
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
        className={`st-dialog ${small ? "is-sm" : ""}`}
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

function ModalHead({ icon: Icon, tone, title, subtitle, onClose }) {
  return (
    <div className="st-dialog-head">
      <span className={`st-tile ${tone}`} style={{ width: 44, height: 44, borderRadius: 14 }}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="vmvas-heading truncate text-[17px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        {subtitle && <p className="st-muted mt-0.5 truncate text-xs">{subtitle}</p>}
      </div>
      <button type="button" className="st-icon-btn is-plain" onClick={onClose} aria-label="Close">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}