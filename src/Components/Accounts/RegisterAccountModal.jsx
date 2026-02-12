import { HiEye, HiEyeOff } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function RegisterAccountModal({
  isOpen,
  onClose,
  handleChange,
  handleSubmit,
  showPassword,
  setShowPassword,
  formData,
  generatePassword,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-xl relative space-y-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
              Register Account
            </h2>

            {/* Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
              <input
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Email & Username */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />

            {/* Role and Branch Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Admin">IT</option>

              </select>

              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="Marilao">Marilao</option>
                <option value="Taguig">Taguig</option>
                <option value="Palawan">Palawan</option>
                <option value="Cebu">Cebu</option>
                <option value="Davao">Davao</option>

              </select>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </span>

              <button
                type="button"
                onClick={() => {
                  const generated = generatePassword(12);
                  handleChange({ target: { name: "password", value: generated } });
                  handleChange({ target: { name: "confirmPassword", value: generated } });
                }}
                className="absolute right-0 top-full mt-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Generate Password
              </button>
            </div>

            {/* Confirm Password */}
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />

            <button
              type="submit"
              className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              Register
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
