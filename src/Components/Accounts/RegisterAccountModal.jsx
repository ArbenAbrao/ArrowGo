import { useMemo } from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { ModalFrame, PasswordField, ROLES } from "./accountsUi";

const BRANCHES = ["Marilao", "Taguig", "Palawan", "Cebu", "Davao"];

const getPasswordStrength = (password = "") => {
  if (!password) return { level: 0, label: "", tone: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.max(1, Math.min(score, 4));
  const meta = {
    1: { label: "Weak", tone: "on-rose" },
    2: { label: "Fair", tone: "on-amber" },
    3: { label: "Good", tone: "on-em" },
    4: { label: "Strong", tone: "on-em" },
  };
  return { level, ...meta[level] };
};

export default function RegisterAccountModal({
  isOpen,
  onClose,
  handleChange,
  handleSubmit: onFormSubmit,
  showPassword,
  setShowPassword,
  formData,
  generatePassword,
  darkMode = true,
}) {
  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const showMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
  const showMatch =
    formData.confirmPassword.length > 0 && formData.password.length > 0 && formData.password === formData.confirmPassword;

  // Success / failure feedback comes from the page's own toast, so the modal
  // no longer shows a second "registered" toast before the request has finished.
  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(e);
  };

  const handleGenerate = () => {
    const generated = generatePassword(12);
    handleChange({ target: { name: "password", value: generated } });
    handleChange({ target: { name: "confirmPassword", value: generated } });
  };

  return (
    <ModalFrame
      open={isOpen}
      onClose={onClose}
      darkMode={darkMode}
      size="lg"
      icon={UserPlusIcon}
      tone="t-em"
      title="Register Account"
      subtitle="Create a new user for the system"
      footer={
        <>
          <button type="button" onClick={onClose} className="ac-btn ac-btn-secondary">
            Cancel
          </button>
          <button type="submit" form="register-account-form" className="ac-btn ac-btn-primary">
            Register Account
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} id="register-account-form">
        {/* Identity */}
        <div>
          <h3 className="ac-section-title">Identity</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="ac-label">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                placeholder="Juan"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="ac-input"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="ac-label">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                placeholder="Dela Cruz"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="ac-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="ac-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="juan@arrowgo.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="ac-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="username" className="ac-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                placeholder="juandelacruz"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="off"
                className="ac-input"
              />
            </div>
          </div>
        </div>

        {/* Access */}
        <div className="ac-section">
          <h3 className="ac-section-title">Access</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="ac-label">
                Role
              </label>
              <div className="ac-field">
                <select id="role" name="role" value={formData.role} onChange={handleChange} required className="ac-input">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="ac-chev" />
              </div>
            </div>
            <div>
              <label htmlFor="branch" className="ac-label">
                Branch
              </label>
              <div className="ac-field">
                <select id="branch" name="branch" value={formData.branch} onChange={handleChange} required className="ac-input">
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="ac-chev" />
              </div>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="ac-section" style={{ paddingTop: 0, borderTop: 0, marginTop: 22 }}>
          <div className="ac-cred">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                Credentials
              </h3>
              <button type="button" onClick={handleGenerate} className="ac-chip-btn">
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <PasswordField
                  id="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  required
                />

                {formData.password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="ac-meter" aria-hidden="true">
                      {[1, 2, 3, 4].map((segment) => (
                        <i key={segment} className={segment <= strength.level ? strength.tone : ""} />
                      ))}
                    </div>
                    <p className="ac-muted mt-1.5 text-xs">Password strength: {strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  invalid={showMismatch}
                  required
                />
                {showMismatch && (
                  <p className="ac-msg is-error" role="alert">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    Passwords don't match
                  </p>
                )}
                {showMatch && (
                  <p className="ac-msg is-ok">
                    <CheckCircleIcon className="h-4 w-4" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </ModalFrame>
  );
}