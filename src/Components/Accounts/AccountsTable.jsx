import { useState } from "react";
import toast from "react-hot-toast";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import ChangePasswordModal from "./ChangePasswordModal";
import ConfirmModal from "./ConfirmModal";
import { Pager, ROLES, ROLE_TONE, initialsOf } from "./accountsUi";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

const isDisabled = (acc) => acc.is_active === 0 || acc.is_active === false;

export default function AccountsTable({
  accounts,
  setAccounts,
  darkMode,
  currentPage,
  setCurrentPage,
  ITEMS_PER_PAGE,
  refreshAccounts,
  loading = false,
}) {
  /* ================= FILTER STATES ================= */
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");

  /* ================= FILTER LOGIC ================= */
  const filteredAccounts = accounts.filter((acc) => {
    const searchMatch = `${acc.first_name} ${acc.last_name} ${acc.username} ${acc.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const roleMatch = roleFilter === "All" || acc.role === roleFilter;
    const branchMatch = branchFilter === "All" || acc.branch === branchFilter;

    return searchMatch && roleMatch && branchMatch;
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1;
  const page = Math.min(currentPage, totalPages);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* ================= OTHER STATES ================= */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [updatingRole, setUpdatingRole] = useState({});

  const hasFilters = Boolean(searchTerm || roleFilter !== "All" || branchFilter !== "All");
  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("All");
    setBranchFilter("All");
    setCurrentPage(1);
  };

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

      const res = await fetch(`${API_URL}/api/admin/accounts/${accId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      const data = await res.json();

      setAccounts((prev) => prev.map((a) => (a.id === data.account.id ? data.account : a)));
      toast.success("Role updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole((prev) => ({ ...prev, [accId]: false }));
    }
  };

  const branches = [...new Set(accounts.map((a) => a.branch))].filter(Boolean);

  /* ================= RENDER ================= */
  return (
    <>
      {/* TOOLBAR */}
      <div className="ac-toolbar">
        <div className="ac-field grow">
          <MagnifyingGlassIcon className="ac-lead" />
          <input
            type="search"
            placeholder="Search name, username, email"
            aria-label="Search accounts"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="ac-input has-lead"
          />
        </div>

        <div className="ac-field sel">
          <BuildingOfficeIcon className="ac-lead" />
          <select
            aria-label="Filter by branch"
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="ac-input has-lead"
          >
            <option value="All">All Branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="ac-chev" />
        </div>

        <div className="ac-field sel">
          <ShieldCheckIcon className="ac-lead" />
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="ac-input has-lead"
          >
            <option value="All">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="ac-chev" />
        </div>

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="ac-btn ac-btn-secondary">
            Clear
          </button>
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="ac-skel h-[68px]" />
          ))}
        </div>
      ) : paginatedAccounts.length === 0 ? (
        <div className="ac-empty">
          <span className="ac-empty-icon">
            <UserGroupIcon className="h-6 w-6" />
          </span>
          <h2 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
            {accounts.length === 0 ? "No accounts yet." : "No accounts match these filters."}
          </h2>
          <p className="ac-muted mt-1.5 max-w-sm text-sm">
            {accounts.length === 0
              ? "Register an account to give someone access to the system."
              : "Try adjusting your search or filters."}
          </p>
          {hasFilters && (
            <button type="button" className="ac-btn ac-btn-secondary mt-5" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ac-head is-accounts" aria-hidden="true">
            <span>Account</span>
            <span>Role</span>
            <span>Branch</span>
            <span>Status</span>
            <span>Device</span>
            <span />
          </div>

          <ul>
            {paginatedAccounts.map((acc) => {
              const disabled = isDisabled(acc);
              const fullName = `${acc.first_name || ""} ${acc.last_name || ""}`.trim();
              return (
                <li key={acc.id} className={`ac-row is-accounts ${disabled ? "is-disabled" : ""}`}>
                  <div className="ac-id">
                    <span className="ac-avatar" aria-hidden="true">
                      {initialsOf(acc.first_name, acc.last_name)}
                      {!disabled && acc.is_online ? <span className="ac-dot" /> : null}
                    </span>
                    <div className="min-w-0">
                      <div className="ac-name" title={fullName}>
                        {fullName}
                      </div>
                      <div className="ac-idsub" title={`@${acc.username} · ${acc.email}`}>
                        @{acc.username} · {acc.email}
                      </div>
                    </div>
                  </div>

                  <div className="ac-tags">
                    <div className="ac-cell-role">
                      <label className={`ac-role ${ROLE_TONE[acc.role] || ROLE_TONE.User}`}>
                        <span className="sr-only">Role for {fullName}</span>
                        <select
                          value={acc.role}
                          onChange={(e) => handleRoleChange(acc.id, e.target.value)}
                          disabled={updatingRole[acc.id]}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon />
                      </label>
                    </div>

                    <div className="ac-cell-status">
                      {disabled ? (
                        <span className="ac-badge t-rose">Disabled</span>
                      ) : acc.is_online ? (
                        <span className="ac-badge t-em is-live">Online</span>
                      ) : (
                        <span className="ac-badge t-slate">Offline</span>
                      )}
                    </div>
                  </div>

                  <div className="ac-meta">
                    <div className="ac-cell ac-c-branch">
                      <span className="ac-lab">Branch</span>
                      <span className="ac-strong" title={acc.branch || ""}>
                        {acc.branch || "-"}
                      </span>
                    </div>
                    <div className="ac-cell ac-c-device">
                      <span className="ac-lab">Device</span>
                      <span className="ac-sub" title={acc.last_device || "Unknown"}>
                        {acc.last_device || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="ac-actions">
                    <button
                      type="button"
                      onClick={() => handleChangePassword(acc)}
                      title="Change Password"
                      aria-label={`Change password for ${fullName}`}
                      className="ac-icon-btn is-pw"
                    >
                      <LockClosedIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmAction(acc, "disable")}
                      title={disabled ? "Enable Account" : "Disable Account"}
                      aria-label={`${disabled ? "Enable" : "Disable"} account for ${fullName}`}
                      className={`ac-icon-btn ${disabled ? "is-ok" : "is-warn"}`}
                    >
                      {disabled ? (
                        <CheckCircleIcon className="h-[18px] w-[18px]" />
                      ) : (
                        <NoSymbolIcon className="h-[18px] w-[18px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmAction(acc, "delete")}
                      title="Delete Account"
                      aria-label={`Delete account for ${fullName}`}
                      className="ac-icon-btn is-danger"
                    >
                      <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        total={filteredAccounts.length}
        pageSize={ITEMS_PER_PAGE}
        label={filteredAccounts.length === 1 ? "account" : "accounts"}
        onPage={setCurrentPage}
      />

      {/* Modals */}
      <ChangePasswordModal
        open={isChangePasswordOpen}
        account={selectedAccount}
        darkMode={darkMode}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          setChangePasswordOpen(false);
          refreshAccounts && refreshAccounts();
        }}
      />

      <ConfirmModal
        open={isConfirmOpen}
        account={selectedAccount}
        action={confirmAction}
        darkMode={darkMode}
        onClose={() => setConfirmOpen(false)}
        onSuccess={() => {
          setConfirmOpen(false);
          refreshAccounts && refreshAccounts();
        }}
      />
    </>
  );
}