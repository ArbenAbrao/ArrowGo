import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion, MotionConfig } from "framer-motion";
import {
  UserPlusIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import AccountsTable from "../Components/Accounts/AccountsTable";
import LoginHistory from "../Components/Accounts/LoginHistory";
import RegisterAccountModal from "../Components/Accounts/RegisterAccountModal";
import { AccountsStyles } from "../Components/Accounts/accountsUi";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  role: "User",
  branch: "Marilao",
  password: "",
  confirmPassword: "",
};

export default function Accounts({ darkMode }) {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("accounts"); // "accounts" | "logins"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [currentPageAccounts, setCurrentPageAccounts] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ---------- Fetch Data ----------
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/accounts`);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data.sort((a, b) => (a.first_name || "").localeCompare(b.first_name || "")));
    } catch (error) {
      console.error(error);
      toast.error("Could not load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login-logs`);
      if (!res.ok) throw new Error("Failed to fetch login logs");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load login history");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLogs();
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchLogs()]);
    setRefreshing(false);
  };

  // ---------- Handlers ----------
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await fetch(`${API_URL}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create account");

      const newAccount = await res.json();
      toast.success("Account created");

      setAccounts((prev) =>
        [newAccount, ...prev].sort((a, b) => (a.first_name || "").localeCompare(b.first_name || ""))
      );

      setFormData(EMPTY_FORM);
      setIsModalOpen(false);
      setCurrentPageAccounts(1);
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const generatePassword = (length = 12) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_-";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.is_active).length;
    const online = accounts.filter((a) => a.is_online).length;
    return { total, active, online };
  }, [accounts]);

  // ---------- Styles ----------
  // Header + page shell keep the original tokens (slate-950/900 surfaces, emerald accent).
  const theme = darkMode
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

  return (
    <MotionConfig reducedMotion="user">
      <div className={`ac ${darkMode ? "ac-dark" : ""} min-h-screen p-4 sm:p-6 transition-colors ${theme.pageBg}`}>
        <AccountsStyles />

        <Toaster
          position="top-right"
          toastOptions={{
            style: darkMode
              ? { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" }
              : { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
          }}
        />

        {/* HEADER (original) */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className={`flex items-center gap-1.5 text-xs mb-3 ${theme.subtleText}`}>
            <span>Settings</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className={theme.titleText}>Accounts & Logs</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBadge}`}>
                <img src="/logo22.png" alt="Logo" className="h-6 w-6 object-contain" />
              </span>
              <div>
                <h1 className={`vmvas-heading text-2xl sm:text-[28px] font-bold leading-tight ${theme.titleText}`}>
                  Accounts & Logs
                </h1>
                <p className={`text-sm mt-1 ${theme.subtleText}`}>Manage Accounts across your network.</p>
                <p className={`text-xs mt-0.5 ${theme.subtleText}`}>
                  {stats.total} account{stats.total !== 1 ? "s" : ""} · {stats.active} active · {stats.online} online
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold sm:ml-auto transition ${theme.btnPrimary}`}
            >
              <UserPlusIcon className="w-4 h-4" />
              Register Account
            </motion.button>
          </div>
        </motion.div>

        {/* WORKSPACE */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="ac-shell has-line mt-6"
        >
          <div className="ac-tabbar">
            <div className="ac-seg" role="tablist" aria-label="Accounts sections">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "accounts"}
                className={`ac-seg-btn ${tab === "accounts" ? "is-active" : ""}`}
                onClick={() => setTab("accounts")}
              >
                {tab === "accounts" && (
                  <motion.span layoutId="ac-seg-thumb" className="ac-seg-thumb" transition={{ duration: 0.2 }} />
                )}
                <UserGroupIcon className="h-4 w-4" />
                Accounts
                <span className="ac-pill ac-num">{stats.total}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "logins"}
                className={`ac-seg-btn ${tab === "logins" ? "is-active" : ""}`}
                onClick={() => setTab("logins")}
              >
                {tab === "logins" && (
                  <motion.span layoutId="ac-seg-thumb" className="ac-seg-thumb" transition={{ duration: 0.2 }} />
                )}
                <ClockIcon className="h-4 w-4" />
                Login History
                <span className="ac-pill ac-num">{logs.length}</span>
              </button>
            </div>

            <button type="button" className="ac-btn ac-btn-secondary ac-btn-sm" onClick={refreshAll} disabled={refreshing}>
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} role="tabpanel">
            {tab === "accounts" ? (
              <AccountsTable
                accounts={accounts}
                setAccounts={setAccounts}
                darkMode={darkMode}
                currentPage={currentPageAccounts}
                setCurrentPage={setCurrentPageAccounts}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                refreshAccounts={fetchAccounts}
                loading={loadingAccounts}
              />
            ) : (
              <LoginHistory
                logs={logs}
                darkMode={darkMode}
                currentPage={currentPageLogs}
                setCurrentPage={setCurrentPageLogs}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                loading={loadingLogs}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Register Modal */}
        <RegisterAccountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          formData={formData}
          generatePassword={generatePassword}
          darkMode={darkMode}
        />
      </div>
    </MotionConfig>
  );
}