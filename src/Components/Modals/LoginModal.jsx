// src/Components/Modals/LoginModal.jsx
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaSignInAlt,
} from "react-icons/fa";

import BrandLogo from "../Brand/BrandLogo";

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
  loading,
  darkMode = true, // pass Welcome's darkMode state in so the modal always matches the page
}) {
  const [showPassword, setShowPassword] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  // Same token family as Welcome.jsx's `theme` object — keeps the modal
  // visually identical to the page it's launched from, in either mode.
  const theme = darkMode
    ? {
        panel: "bg-slate-950/95 border-white/10",
        titleText: "text-slate-100",
        bodyText: "text-slate-400",
        subtleText: "text-slate-500",
        inputBg: "bg-slate-900/60 border-slate-700 focus:border-emerald-500/60",
        inputText: "text-slate-100 placeholder-slate-500",
        closeBtn: "text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border-white/10",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        eyeToggle: "text-slate-500 hover:text-slate-100",
        linkText: "text-slate-500 hover:text-emerald-400",
        blobEmerald: "bg-emerald-500/25",
        blobBlue: "bg-blue-500/25",
        errorBg: "bg-red-500/10 border-red-500/25 text-red-300",
      }
    : {
        panel: "bg-white/95 border-slate-200",
        titleText: "text-slate-900",
        bodyText: "text-slate-600",
        subtleText: "text-slate-500",
        inputBg: "bg-slate-50 border-slate-200 focus:border-emerald-500/60",
        inputText: "text-slate-900 placeholder-slate-400",
        closeBtn: "text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        eyeToggle: "text-slate-500 hover:text-slate-700",
        linkText: "text-slate-500 hover:text-emerald-600",
        blobEmerald: "bg-emerald-400/20",
        blobBlue: "bg-blue-400/20",
        errorBg: "bg-red-50 border-red-200 text-red-600",
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
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
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
                className="relative w-full max-w-sm sm:max-w-md"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                {/* Ambient glow — same emerald/blue pairing as the page background */}
                <motion.div
                  animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className={`absolute -top-16 -left-16 w-56 h-56 rounded-full blur-[70px] -z-10 ${theme.blobBlue}`}
                />
                <motion.div
                  animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
                  className={`absolute -bottom-16 -right-10 w-64 h-64 rounded-full blur-[80px] -z-10 ${theme.blobEmerald}`}
                />

                <div
                  className={`relative rounded-[32px] border backdrop-blur-2xl shadow-2xl px-6 py-8 sm:px-9 sm:py-10 overflow-hidden transition-colors duration-300 ${theme.panel}`}
                >
                  {/* Glass edge highlight — emerald instead of neutral white, matches the page's accent */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className={`absolute right-5 top-5 p-2 rounded-full border transition ${theme.closeBtn}`}
                  >
                    <FaTimes size={15} />
                  </button>

                  {/* Brand mark — same gate glyph used in the Welcome header/footer */}
                  <motion.div className="relative flex flex-col items-center gap-3 mb-7" variants={itemVariants}>
                    <BrandLogo
                      badgeClassName={`flex h-14 w-14 rounded-2xl border ${theme.iconBadge}`}
                      glyphClassName="w-7 h-7"
                      imgClassName="w-full h-full p-2.5"
                    />
                    <p className={`text-[11px] tracking-[3px] uppercase ${theme.subtleText}`}>
                      Gate Control Access
                    </p>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    className={`relative page-title text-xl sm:text-2xl font-bold text-center ${theme.titleText}`}
                    variants={itemVariants}
                  >
                    Welcome Back
                  </motion.h3>

                  <motion.p className={`relative mt-2 text-center text-sm ${theme.bodyText}`} variants={itemVariants}>
                    {message || "Sign in to reach the live dashboard."}
                  </motion.p>

                  {/* Form */}
                  <motion.form onSubmit={onLogin} className="relative flex flex-col gap-4 mt-7" variants={itemVariants}>
                    <div className="relative">
                      <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.subtleText}`} />
                      <input
                        type="text"
                        placeholder="Email or Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        className={`w-full border rounded-xl pl-12 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${theme.inputBg} ${theme.inputText}`}
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.subtleText}`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className={`w-full border rounded-xl pl-12 pr-12 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${theme.inputBg} ${theme.inputText}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${theme.eyeToggle}`}
                        >
                          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <a
                          href="mailto:support@vmvas.com?subject=Password%20reset%20request"
                          className={`text-xs font-medium transition ${theme.linkText}`}
                        >
                          Forgot password?
                        </a>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        variants={itemVariants}
                        className={`border px-4 py-3 rounded-xl text-sm text-center font-medium ${theme.errorBg}`}
                      >
                        ⚠ {error}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.97 }}
                      disabled={loading}
                      className={`btn-shine py-3 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 transition ${
                        loading ? "cursor-not-allowed opacity-70" : ""
                      }`}
                      variants={itemVariants}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {loading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <>
                            <FaSignInAlt size={14} />
                            Log In
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.form>

                  <motion.p className={`relative text-center text-[11px] mt-6 tracking-wide ${theme.subtleText}`} variants={itemVariants}>
                    Protected gate access · VMVAS
                  </motion.p>
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}