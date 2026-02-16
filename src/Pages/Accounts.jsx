import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import AccountsTable from "../Components/Accounts/AccountsTable";
import LoginHistory from "../Components/Accounts/LoginHistory";
import RegisterAccountModal from "../Components/Accounts/RegisterAccountModal";

export default function Accounts({ darkMode }) {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "User",
    branch: "Marilao",
    password: "",
    confirmPassword: "",
  });
  const [currentPageAccounts, setCurrentPageAccounts] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch accounts and logs
  const fetchAccounts = async () => {
    try {
      const res = await fetch("http://192.168.100.206:5000/api/accounts");
      const data = await res.json();
      setAccounts(
        data.sort((a, b) =>
          a.first_name.localeCompare(b.first_name)
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://192.168.100.206:5000/api/login-logs");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLogs();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await fetch("http://192.168.100.206:5000/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create account");

      const newAccount = await res.json();
      toast.success("Account created");

      // Add new account in sorted order
      setAccounts((prev) =>
        [newAccount, ...prev].sort((a, b) =>
          a.first_name.localeCompare(b.first_name)
        )
      );

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        role: "User",
        branch: "Marilao",
        password: "",
        confirmPassword: "",
      });

      // Ensure modal closes
      setIsModalOpen(false);

      // Reset to first page if needed
      setCurrentPageAccounts(1);
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const generatePassword = (length = 12) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_-";
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const containerBg = darkMode
    ? "bg-gray-800 text-gray-300"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${containerBg}`}>
      {/* Header */}
      <div className="flex flex-col items-start mb-4 gap-1 sm:gap-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo4.png"
            alt="Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-cyan-400 drop-shadow-lg" : "text-green-500 drop-shadow-lg"
            }`}
          >
            Accounts Management
          </h1>
        </div>
      </div>

      <Toaster />

      {/* Accounts Section */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Accounts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex gap-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          Register Account
        </button>
      </div>

      <AccountsTable
        accounts={accounts}
        setAccounts={setAccounts}
        darkMode={darkMode}
        currentPage={currentPageAccounts}
        setCurrentPage={setCurrentPageAccounts}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        refreshAccounts={fetchAccounts} // ensures latest state after role updates or actions
      />

      {/* Login History */}
      <h2 className="text-lg font-bold mt-6 mb-3">Login History</h2>
      <LoginHistory
        logs={logs}
        darkMode={darkMode}
        currentPage={currentPageLogs}
        setCurrentPage={setCurrentPageLogs}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
      />

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
  );
}
