import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowPathIcon, CheckIcon, LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ModalFrame, PasswordField } from "./accountsUi";

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

const requirements = [
  { label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 1 uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least 1 number", test: (pw) => /[0-9]/.test(pw) },
  { label: "At least 1 special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const isValidPassword = (pw) => requirements.every((r) => r.test(pw));

export default function ChangePasswordModal({ open, account, darkMode = true, onClose, onSuccess }) {
  const acc = account || {};
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ next: false, confirm: false });

  const handleValidation = () => {
    const newErrors = {
      next: !isValidPassword(passwords.next),
      confirm: passwords.next !== passwords.confirm || passwords.confirm === "",
    };
    setErrors(newErrors);
    return !newErrors.next && !newErrors.confirm;
  };

  const resetAndClose = () => {
    setPasswords({ next: "", confirm: "" });
    setErrors({ next: false, confirm: false });
    onClose();
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!handleValidation() || !acc.id) return;
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/admin/accounts/${acc.id}/reset-password`, {
        newPassword: passwords.next,
      });
      toast.success("Password updated");
      onSuccess();
      resetAndClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>?";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPasswords({ next: pw, confirm: pw });
    setErrors({ next: false, confirm: false });
  };

  const strength = requirements.filter((r) => r.test(passwords.next)).length;
  const strengthTone = strength <= 2 ? "on-rose" : strength <= 4 ? "on-amber" : "on-em";

  return (
    <ModalFrame
      open={open}
      onClose={resetAndClose}
      darkMode={darkMode}
      size="md"
      icon={LockClosedIcon}
      tone="t-sky"
      title="Change Password"
      subtitle={`For ${acc.first_name || ""} ${acc.last_name || ""}`.trim()}
      footer={
        <>
          <button type="button" onClick={resetAndClose} className="ac-btn ac-btn-secondary">
            Cancel
          </button>
          <button type="submit" form="change-password-form" disabled={loading} className="ac-btn ac-btn-primary">
            {loading ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <form onSubmit={submit} id="change-password-form" className="space-y-5">
        <div>
          <PasswordField
            id="cp-new"
            label="New Password"
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            onBlur={handleValidation}
            show={showPasswords.next}
            onToggle={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })}
            invalid={errors.next}
          />

          {/* Strength meter */}
          <div className="ac-meter mt-3" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} className={passwords.next && i < strength ? strengthTone : ""} />
            ))}
          </div>

          {/* Requirements */}
          <ul className="ac-reqs mt-3">
            {requirements.map((req) => {
              const met = req.test(passwords.next);
              return (
                <li key={req.label} className={met ? "is-met" : ""}>
                  {met ? <CheckIcon /> : <XMarkIcon style={{ opacity: 0.4 }} />}
                  <span>{req.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <PasswordField
            id="cp-confirm"
            label="Confirm Password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            onBlur={handleValidation}
            show={showPasswords.confirm}
            onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            invalid={errors.confirm}
          />
          {errors.confirm && (
            <p className="ac-msg is-error" role="alert">
              Passwords do not match
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={generatePassword} className="ac-chip-btn">
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Generate Password
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}