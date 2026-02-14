import { useState } from "react";
import axios from "axios";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { motion } from "framer-motion";

export default function ChangePasswordModal({ account, onClose, onSuccess }) {
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ next: false, confirm: false });

  const isValidPassword = (pw) => {
    return (
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[a-z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw)
    );
  };

  const handleValidation = () => {
    const newErrors = {
      next: !isValidPassword(passwords.next),
      confirm: passwords.next !== passwords.confirm || passwords.confirm === "",
    };
    setErrors(newErrors);
    return !newErrors.next && !newErrors.confirm;
  };

  const submit = async () => {
    if (!handleValidation()) return;

    try {
      setLoading(true);
      await axios.put(`https://tmvasm.arrowgo-logistics.com/api/admin/accounts/${account.id}/reset-password`, {
        newPassword: passwords.next,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>?";
    let pw = "";
    for (let i = 0; i < 12; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)];
    }
    setPasswords({ ...passwords, next: pw, confirm: pw });
    setErrors({ next: false, confirm: false });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 text-center">
          Change Password
        </h3>

        {/* New Password */}
        <div className="relative mb-2">
          <input
            type={showPasswords.next ? "text" : "password"}
            placeholder=" "
            className={`peer w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 ${
              errors.next
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-green-500"
            }`}
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            onBlur={handleValidation}
          />
          <label
            className={`absolute left-4 text-gray-400 text-sm transition-all
            ${passwords.next ? "top-1 text-xs text-green-500" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm"}`}
          >
            New Password
          </label>
          <span
            className="absolute right-4 top-3 cursor-pointer text-gray-500 hover:text-green-500"
            onClick={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })}
          >
            {showPasswords.next ? <HiEyeOff /> : <HiEye />}
          </span>
        </div>

        {/* Password Strength Meter */}
        <div className="h-2 rounded-full w-full bg-gray-200 dark:bg-gray-700 mb-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-300 ${
              passwords.next.length === 0
                ? "w-0 bg-transparent"
                : passwords.next.length < 8
                ? "w-1/4 bg-red-500"
                : /[A-Z]/.test(passwords.next) &&
                  /[a-z]/.test(passwords.next) &&
                  /[0-9]/.test(passwords.next) &&
                  /[^A-Za-z0-9]/.test(passwords.next)
                ? "w-full bg-green-600"
                : "w-3/4 bg-yellow-400"
            }`}
          ></div>
        </div>

        {/* Password Requirements */}
        <ul className="text-xs text-gray-500 dark:text-gray-400 mb-4 pl-4 list-disc">
          <li className={passwords.next.length >= 8 ? "text-green-600" : ""}>Minimum 8 characters</li>
          <li className={/[A-Z]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 uppercase letter</li>
          <li className={/[a-z]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 lowercase letter</li>
          <li className={/[0-9]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 number</li>
          <li className={/[^A-Za-z0-9]/.test(passwords.next) ? "text-green-600" : ""}>At least 1 special character</li>
        </ul>

        {/* Confirm Password */}
        <div className="relative mb-4">
          <input
            type={showPasswords.confirm ? "text" : "password"}
            placeholder=" "
            className={`peer w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 ${
              errors.confirm
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-green-500"
            }`}
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            onBlur={handleValidation}
          />
          <label
            className={`absolute left-4 text-gray-400 text-sm transition-all
            ${passwords.confirm ? "top-1 text-xs text-green-500" : "top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm"}`}
          >
            Confirm Password
          </label>
          <span
            className="absolute right-4 top-3 cursor-pointer text-gray-500 hover:text-green-500"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
          >
            {showPasswords.confirm ? <HiEyeOff /> : <HiEye />}
          </span>
        </div>

        {/* Generate Password Button */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={generatePassword}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Password
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={submit}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
