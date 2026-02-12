// src/Components/Modals/LoginModal.jsx
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginModal({
  isOpen,
  onClose,
  onLogin,
  email,
  setEmail,
  password,
  setPassword,
  error,
  message,
  loading, // 🔥 new prop
}) {

  const [showPassword, setShowPassword] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Wrapper */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-[100svh] items-center justify-center p-4">

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
                className="
                  w-full 
                  max-w-sm sm:max-w-md
                  bg-white 
                  rounded-3xl 
                  shadow-2xl 
                  p-6 sm:p-8
                "
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >

                {/* Logo */}
                <motion.div
                  className="flex justify-center mb-5"
                  variants={itemVariants}
                >
                  <img
                    src="/logo9.png"
                    alt="Logo"
                    className="
                      h-24 
                      sm:h-32 
                      md:h-40 
                      object-contain
                    "
                  />
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="
                    text-2xl sm:text-3xl 
                    font-bold 
                    mb-3 
                    text-gray-800 
                    text-center
                  "
                  variants={itemVariants}
                >
                  Welcome Back
                </motion.h2>

                {message && (
                  <motion.p
                    className="text-gray-500 mb-4 text-center text-sm sm:text-base font-medium"
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
                  <input
  type="text"
  placeholder="Email or Username"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
className="
  border border-gray-300 
  rounded-xl 
  px-4 py-3 
  text-sm sm:text-base
  text-black
  placeholder-gray-400
  focus:outline-none 
  focus:ring-2 focus:ring-blue-400
  transition
"
/>


                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="
  w-full 
  border border-gray-300 
  rounded-xl 
  px-4 py-3 pr-12 
  text-sm sm:text-base
  text-black
  placeholder-gray-400
  focus:outline-none 
  focus:ring-2 focus:ring-blue-400
  transition
"

                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {error && (
  <motion.div
    variants={itemVariants}
    className="
      bg-red-50 
      border border-red-400 
      text-red-700 
      px-4 py-3 
      rounded-xl 
      text-sm 
      text-center
      font-medium
      shadow-sm
    "
  >
    ⚠ {error}
  </motion.div>
)}



                  <motion.button
  type="submit"
  whileHover={{ scale: loading ? 1 : 1.05 }}
  whileTap={{ scale: loading ? 1 : 0.95 }}
  className={`
    bg-blue-600 
    text-white 
    py-3 
    rounded-xl 
    font-semibold 
    text-sm sm:text-base
    hover:bg-blue-700 
    transition
    flex items-center justify-center
    ${loading ? "cursor-not-allowed opacity-70" : ""}
  `}
  variants={itemVariants}
  disabled={loading} // 🔥 disable while loading
>
  {loading ? (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      ></path>
    </svg>
  ) : (
    "Log In"
  )}
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
