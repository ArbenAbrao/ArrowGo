// src/Components/Modals/LoginModal.jsx
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginModal({ isOpen, onClose, onLogin, email, setEmail, password, setPassword, error, message }) {
  const [showPassword, setShowPassword] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Blurred overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0 backdrop-blur-none"
          enterTo="opacity-100 backdrop-blur-sm"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 backdrop-blur-sm"
          leaveTo="opacity-0 backdrop-blur-none"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <motion.div
                className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl relative"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                {/* Logo */}
                <motion.div
                  className="flex justify-center mb-6"
                  variants={itemVariants}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 12 }}
                >
                  <img
                    src="/logo5.png"
                    alt="Logo"
                    className="h-44 w-44 object-contain"
                  />
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-3xl font-bold mb-3 text-gray-800 text-center"
                  variants={itemVariants}
                >
                  Welcome Back
                </motion.h2>

                {message && (
                  <motion.p
                    className="text-gray-500 mb-4 text-center font-medium"
                    variants={itemVariants}
                  >
                    {message}
                  </motion.p>
                )}

                {/* Form */}
                <motion.form
                  onSubmit={onLogin}
                  className="flex flex-col gap-4"
                  variants={itemVariants}
                >
                  <motion.input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 shadow-sm text-gray-800 font-medium placeholder-gray-400 transition"
                    variants={itemVariants}
                  />

                  {/* Password with toggle */}
                  <motion.div className="relative" variants={itemVariants}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 shadow-sm text-gray-800 font-medium placeholder-gray-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </motion.div>

                  {error && <motion.p className="text-red-500 text-sm text-center" variants={itemVariants}>{error}</motion.p>}

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all duration-300"
                    variants={itemVariants}
                  >
                    Log In
                  </motion.button>
                </motion.form>

                <motion.button
                  onClick={onClose}
                  className="mt-4 text-sm text-gray-500 hover:underline block mx-auto"
                  variants={itemVariants}
                >
                  Cancel
                </motion.button>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
