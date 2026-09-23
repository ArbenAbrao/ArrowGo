import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircleIcon, NoSymbolIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ModalFrame, ROLE_TONE, initialsOf } from "./accountsUi";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

export default function ConfirmModal({ open, account, action, darkMode = true, onClose, onSuccess }) {
  const acc = account || {};
  const [submitting, setSubmitting] = useState(false);

  const variant = action === "delete" ? "delete" : acc.is_active ? "disable" : "enable";

  const copy = {
    delete: {
      title: "Delete Account",
      message: `This permanently deletes ${acc.first_name || "this"} ${
        acc.last_name || "account"
      }'s account and their login history. This can't be undone.`,
      confirmLabel: "Delete Account",
      icon: TrashIcon,
      tone: "t-rose",
      btn: "ac-btn-danger",
    },
    disable: {
      title: "Disable Account",
      message: `${acc.first_name || "This user"} ${
        acc.last_name || ""
      } will be signed out and won't be able to log in until you re-enable their account.`,
      confirmLabel: "Disable Account",
      icon: NoSymbolIcon,
      tone: "t-amber",
      btn: "ac-btn-warn",
    },
    enable: {
      title: "Enable Account",
      message: `${acc.first_name || "This user"} ${acc.last_name || ""} will be able to log in again right away.`,
      confirmLabel: "Enable Account",
      icon: CheckCircleIcon,
      tone: "t-em",
      btn: "ac-btn-primary",
    },
  }[variant];

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    // Close immediately — don't wait for the network round-trip. Keeps
    // the UI from feeling stuck if the request is slow, and avoids a
    // double-submit window while the leave transition plays out.
    onClose();

    try {
      if (action === "delete") {
        await axios.delete(`${API_URL}/api/admin/accounts/${acc.id}`);
      } else {
        await axios.put(`${API_URL}/api/admin/accounts/${acc.id}/status`, {
          is_active: acc.is_active ? 0 : 1,
        });
      }

      toast.success("Action successful");
      onSuccess();
    } catch (err) {
      // Only surface an error if the request genuinely failed — a 404 here
      // usually just means the account was already removed elsewhere.
      if (err.response && err.response.status !== 404) {
        console.error(err.response?.data || err);
        toast.error("Action failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = `${acc.first_name || ""} ${acc.last_name || ""}`.trim();

  return (
    <ModalFrame
      open={open}
      onClose={onClose}
      darkMode={darkMode}
      size="sm"
      icon={copy.icon}
      tone={copy.tone}
      title={copy.title}
      subtitle={fullName ? `For ${fullName}` : undefined}
      footer={
        <>
          <button type="button" onClick={onClose} className="ac-btn ac-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={confirm} className={`ac-btn ${copy.btn}`}>
            {copy.confirmLabel}
          </button>
        </>
      }
    >
      {fullName && (
        <div className="ac-summary mb-4">
          <span className="ac-avatar" aria-hidden="true">
            {initialsOf(acc.first_name, acc.last_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="ac-name">{fullName}</p>
            <p className="ac-idsub">@{acc.username}</p>
          </div>
          {acc.role && <span className={`ac-badge ${ROLE_TONE[acc.role] || ROLE_TONE.User}`}>{acc.role}</span>}
        </div>
      )}
      <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
        {copy.message}
      </p>
    </ModalFrame>
  );
}