import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiPencil,
  HiLockClosed,
  HiTrash,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import ChangePasswordModal from "./ChangePasswordModal";
import ConfirmModal from "./ConfirmModal";

export default function AccountsTable({
  accounts,
  setAccounts,
  darkMode,
  currentPage,
  setCurrentPage,
  ITEMS_PER_PAGE,
  refreshAccounts,
}) {
  /* ================= FILTER STATES ================= */
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");

  /* ================= FILTER LOGIC ================= */
  const filteredAccounts = accounts.filter((acc) => {
    const searchMatch =
      `${acc.first_name} ${acc.last_name} ${acc.username} ${acc.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const roleMatch = roleFilter === "All" || acc.role === roleFilter;
    const branchMatch =
      branchFilter === "All" || acc.branch === branchFilter;

    return searchMatch && roleMatch && branchMatch;
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(
    filteredAccounts.length / ITEMS_PER_PAGE
  );

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ================= OTHER STATES ================= */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [expandedRoles, setExpandedRoles] = useState({});
  const [updatingRole, setUpdatingRole] = useState({});

  /* ================= HANDLERS ================= */
  const handleChangePassword = (account) => {
    setSelectedAccount(account);
    setChangePasswordOpen(true);
  };

  const handleConfirmAction = (account, action) => {
    setSelectedAccount(account);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleRoleChange = async (accId, newRole) => {
    try {
      setUpdatingRole((prev) => ({ ...prev, [accId]: true }));

      const res = await fetch(`http://192.168.254.126:5000/api/admin/accounts/${accId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      const data = await res.json();

      setAccounts((prev) =>
        prev.map((a) => (a.id === data.account.id ? data.account : a))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update role");
    } finally {
      setUpdatingRole((prev) => ({ ...prev, [accId]: false }));
    }
  };

  const groupedByRole = paginatedAccounts.reduce((acc, account) => {
    const role = account.role || "No Role";
    if (!acc[role]) acc[role] = [];
    acc[role].push(account);
    return acc;
  }, {});

  /* ================= RENDER ================= */
  return (
    <>
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, username, email"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded border w-full sm:w-1/3 ${
            darkMode
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white border-gray-300"
          }`}
        />

        <select
          value={branchFilter}
          onChange={(e) => {
            setBranchFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded border ${
            darkMode
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <option value="All">All Branches</option>
          {[...new Set(accounts.map((a) => a.branch))].map(
            (branch) =>
              branch && (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              )
          )}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded border ${
            darkMode
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
          <option value="IT">IT</option>
        </select>
      </div>

     
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead
            className={
              darkMode
                ? "bg-blue-700 text-white"
                : "bg-blue-300 text-gray-900"
            }
          >
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedAccounts.map((acc, i) => (
              <tr
  key={acc.id}
  className={`border-b transition-colors duration-200 ${
    acc.is_active === 0
      ? "bg-red-400 dark:bg-red-700" // Highlight disabled accounts
      : i % 2 === 0
      ? darkMode
        ? "bg-gray-800 hover:bg-gray-700"
        : "bg-gray-50 hover:bg-gray-100"
      : darkMode
      ? "bg-gray-900 hover:bg-gray-800"
      : "bg-white hover:bg-gray-100"
  }`}
>

                <td className="px-4 py-2">{acc.id}</td>
                <td className="px-4 py-2">
                  {acc.first_name} {acc.last_name}
                </td>
                <td
                  className={`px-4 py-2 ${
                    acc.is_active === 0 ? "opacity-50 line-through" : ""
                  }`}
                >
                  {acc.username}
                </td>
                <td className="px-4 py-2">{acc.email}</td>

                {/* Role Dropdown */}
                <td className="px-4 py-2">
                  <select
                    value={acc.role}
                    onChange={(e) =>
                      handleRoleChange(acc.id, e.target.value)
                    }
                    disabled={updatingRole[acc.id]}
                    className={`border rounded px-2 py-1 text-sm w-full ${
                      darkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white text-gray-900 border-gray-300"
                    }`}
                  >
                    {["Admin", "User", "IT"].map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-2">{acc.branch}</td>
                <td className="px-4 py-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleChangePassword(acc)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 transition"
                  >
                    <HiLockClosed className="w-4 h-4" /> Change Password
                  </button>
                  <button
                    onClick={() => handleConfirmAction(acc, "disable")}
                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
                      acc.is_active
                        ? "bg-yellow-500 hover:bg-yellow-600 text-red-700"
                        : "bg-green-500 hover:bg-green-600 text-green-100"
                    }`}
                  >
                    <HiPencil className="w-4 h-4" />
                    {acc.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleConfirmAction(acc, "delete")}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 transition"
                  >
                    <HiTrash className="w-4 h-4" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Desktop Pagination */}
        <motion.div
          className={`flex items-center justify-between mt-2 px-4 py-2 border rounded ${
            darkMode ? "bg-gray-900/90" : "bg-white/90"
          }`}
        >
          <span className="text-sm opacity-70">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span>
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className={`px-4 py-1.5 rounded-full border text-sm ${
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              Prev
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              className={`px-4 py-1.5 rounded-full border text-sm ${
                currentPage === totalPages || totalPages === 0
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Accordion */}
      <div className="sm:hidden flex flex-col gap-4">
        {Object.entries(groupedByRole).map(([role, accounts]) => (
          <div
            key={role}
            className="shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={() =>
                setExpandedRoles((prev) => ({ ...prev, [role]: !prev[role] }))
              }
              className="w-full flex justify-between items-center px-5 py-4 font-semibold text-left bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition"
            >
              <span className="text-lg">
                {role} ({accounts.length})
              </span>
              {expandedRoles[role] ? (
                <HiChevronUp className="w-6 h-6" />
              ) : (
                <HiChevronDown className="w-6 h-6" />
              )}
            </button>

            <AnimatePresence>
              {expandedRoles[role] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800"
                >
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-md">
                          {acc.first_name} {acc.last_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {acc.id}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm">
                        <span>
                          Username:{" "}
                          <span
                            className={
                              acc.is_active === 0 ? "opacity-50 line-through" : ""
                            }
                          >
                            {acc.username}
                          </span>
                        </span>
                        <span>Email: {acc.email}</span>
                        <span>Branch: {acc.branch}</span>
                        {/* Mobile Role Dropdown (full width, adaptive) */}
                        <span className="w-full">
                          Role:{" "}
                          <select
                            value={acc.role}
                            onChange={(e) =>
                              handleRoleChange(acc.id, e.target.value)
                            }
                            disabled={updatingRole[acc.id]}
                            className={`w-full border rounded px-3 py-2 text-sm ${
                              darkMode
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-gray-900 border-gray-300"
                            }`}
                          >
                            {["Admin", "User", "IT"].map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                      <span
                        className={`self-start px-3 py-1 text-xs font-semibold rounded-full ${
                          acc.is_active ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}
                      >
                        {acc.is_active ? "Active" : "Inactive"}
                      </span>

                      {/* Icon-only action buttons */}
                      <div className="flex gap-3 mt-3 justify-end">
                        <button
                          onClick={() => handleChangePassword(acc)}
                          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow"
                          title="Change Password"
                        >
                          <HiLockClosed className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleConfirmAction(acc, "disable")}
                          className={`p-3 rounded-full transition shadow ${
                            acc.is_active
                              ? "bg-yellow-500 hover:bg-yellow-600 text-red-700"
                              : "bg-green-500 hover:bg-green-600 text-green-100"
                          }`}
                          title={acc.is_active ? "Disable Account" : "Enable Account"}
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleConfirmAction(acc, "delete")}
                          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow"
                          title="Delete Account"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Mobile Pagination */}
        <motion.div
          className={`flex items-center justify-between mt-2 px-4 py-2 border rounded ${
            darkMode ? "bg-gray-900/90" : "bg-white/90"
          }`}
        >
          <span className="text-sm opacity-70">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages || 1}</span>
          </span>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className={`px-4 py-1.5 rounded-full border text-sm ${
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              Prev
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className={`px-4 py-1.5 rounded-full border text-sm ${
                currentPage === totalPages || totalPages === 0
                  ? "opacity-40 cursor-not-allowed"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {isChangePasswordOpen && selectedAccount && (
        <ChangePasswordModal
          account={selectedAccount}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => {
            setChangePasswordOpen(false);
            refreshAccounts && refreshAccounts();
          }}
        />
      )}

      {isConfirmOpen && selectedAccount && (
        <ConfirmModal
          account={selectedAccount}
          action={confirmAction}
          onClose={() => setConfirmOpen(false)}
          onSuccess={() => {
            setConfirmOpen(false);
            refreshAccounts && refreshAccounts();
          }}
        />
      )}
    </>
  );
}
