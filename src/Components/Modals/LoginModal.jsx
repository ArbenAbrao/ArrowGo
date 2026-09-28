// src/Components/Modals/LoginModal.jsx
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaSignInAlt,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaShieldAlt,
} from "react-icons/fa";

import BrandLogo from "../Brand/BrandLogo";

// Subtle film-grain texture layered over the glass panel at very low opacity
// with a blend mode, so it reads as tactile noise rather than a visible
// pattern. Keeps the panel from feeling like a flat CSS gradient.
const NOISE_BG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>";

export default function LoginModal({
  isOpen,
  onClose,
  onLogin,
  onForgotPassword, // <-- opens ForgotPasswordModal from the parent
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
  const [capsLockOn, setCapsLockOn] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleCapsLockCheck = (e) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
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
        inputShadow: "shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]",
        closeBtn: "text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border-white/10",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        eyeToggle: "text-slate-500 hover:text-slate-100",
        linkText: "text-slate-500 hover:text-emerald-400",
        blobEmerald: "bg-emerald-500/25",
        blobBlue: "bg-blue-500/25",
        errorBg: "bg-red-500/10 border-red-500/25 text-red-300",
        gridLine: "rgba(255,255,255,0.05)",
        routeLine: "rgba(52,211,153,0.4)",
        logoPunch: "bg-slate-950",
        borderGlow: "from-white/15 via-white/0 to-emerald-400/25",
      }
    : {
        panel: "bg-white/95 border-slate-200",
        titleText: "text-slate-900",
        bodyText: "text-slate-600",
        subtleText: "text-slate-500",
        inputBg: "bg-slate-50 border-slate-200 focus:border-emerald-500/60",
        inputText: "text-slate-900 placeholder-slate-400",
        inputShadow: "shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]",
        closeBtn: "text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        eyeToggle: "text-slate-500 hover:text-slate-700",
        linkText: "text-slate-500 hover:text-emerald-600",
        blobEmerald: "bg-emerald-400/20",
        blobBlue: "bg-blue-400/20",
        errorBg: "bg-red-50 border-red-200 text-red-600",
        gridLine: "rgba(15,23,42,0.05)",
        routeLine: "rgba(16,185,129,0.35)",
        logoPunch: "bg-white",
        borderGlow: "from-white/70 via-white/10 to-emerald-500/25",
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />
        </Transition.Child>

        {/* Modal Wrapper */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-[100svh] items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-90 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-250"
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
                  animate={
                    reduceMotion ? {} : { x: [0, 18, -4, 0], y: [0, -12, 4, 0], scale: [1, 1.05, 1] }
                  }
                  transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
                  className={`absolute -top-16 -left-16 w-56 h-56 rounded-full blur-[70px] -z-10 ${theme.blobBlue}`}
                />
                <motion.div
                  animate={
                    reduceMotion ? {} : { x: [0, -16, 6, 0], y: [0, 14, -6, 0], scale: [1, 1.06, 1] }
                  }
                  transition={{ repeat: Infinity, duration: 13, ease: "easeInOut" }}
                  className={`absolute -bottom-16 -right-10 w-64 h-64 rounded-full blur-[80px] -z-10 ${theme.blobEmerald}`}
                />

                {/* Foil-edge gradient border + colored ambient shadow — lifts the
                    card off the page instead of relying on a flat drop shadow */}
                <div
                  className={`relative rounded-[32px] p-px bg-gradient-to-br ${theme.borderGlow} shadow-[0_30px_80px_-25px_rgba(16,185,129,0.45)]`}
                >
                  <div
                    className={`relative rounded-[32px] border backdrop-blur-2xl shadow-2xl px-6 py-8 sm:px-9 sm:py-10 overflow-hidden transition-colors duration-300 ${theme.panel}`}
                  >
                    {/* Fine grain texture for tactile depth */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
                      style={{ backgroundImage: `url("${NOISE_BG}")`, backgroundSize: "140px 140px" }}
                    />

                    {/* Subtle grid texture, spotlighted toward the top of the card */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-60"
                      style={{
                        backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
                        backgroundSize: "26px 26px",
                        maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
                        WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
                      }}
                    />

                    {/* Faint route line watermark — a nod to fleet routing, draws in once on open */}
                    <svg
                      className="absolute -bottom-4 -right-4 w-40 h-40 pointer-events-none"
                      viewBox="0 0 160 160"
                      fill="none"
                    >
                      <motion.path
                        d="M4 140 C 40 140, 40 90, 76 90 S 112 40, 150 30"
                        stroke={theme.routeLine}
                        strokeWidth="2"
                        strokeDasharray="5 6"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.6, delay: 0.3, ease: "easeInOut" }}
                      />
                      <motion.circle
                        cx="150"
                        cy="30"
                        r="4"
                        fill={theme.routeLine}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.4, 1] }}
                        transition={{ delay: 1.8, duration: 0.5 }}
                      />
                    </svg>

                    {/* Top edge — static hairline plus a single shimmer sweep on open */}
                    <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent">
                      <motion.div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
                        initial={{ x: "-120%" }}
                        animate={{ x: "420%" }}
                        transition={{ duration: 1.4, delay: 0.5, ease: "easeInOut" }}
                      />
                    </div>

                    {/* Close button */}
                    <motion.button
                      type="button"
                      onClick={onClose}
                      aria-label="Close login dialog"
                      whileHover={{ rotate: 90, scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute right-5 top-5 p-2 rounded-full border transition-colors ${theme.closeBtn}`}
                    >
                      <FaTimes size={15} />
                    </motion.button>

                    {/* Brand mark — orbiting gradient ring + soft pulse behind the existing logo cycle */}
                    <motion.div className="relative flex flex-col items-center gap-3 mb-7" variants={itemVariants}>
                      <div className="relative flex items-center justify-center h-[72px] w-[72px]">
                        <motion.span
                          className={`absolute -inset-2 rounded-full blur-xl ${theme.blobEmerald}`}
                          animate={reduceMotion ? {} : { opacity: [0.4, 0.75, 0.4], scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                        <motion.span
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "conic-gradient(from 0deg, rgba(52,211,153,0) 0%, rgba(52,211,153,0.9) 35%, rgba(59,130,246,0.9) 55%, rgba(52,211,153,0) 100%)",
                          }}
                          animate={reduceMotion ? {} : { rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                        />
                        <div className={`relative rounded-2xl p-[3px] ${theme.logoPunch}`}>
                          <BrandLogo
                            badgeClassName={`flex h-14 w-14 rounded-2xl border ${theme.iconBadge}`}
                            glyphClassName="w-7 h-7"
                            imgClassName="w-full h-full p-2.5"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        <p className={`text-[10px] font-medium tracking-[3px] uppercase ${theme.subtleText}`}>
                          Gate Control Access
                        </p>
                      </div>
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
                      <motion.div className="relative group" variants={itemVariants}>
                        <FaEnvelope
                          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${theme.subtleText} group-focus-within:text-emerald-400`}
                        />
                        <motion.input
                          type="text"
                          placeholder="Email or Username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="username"
                          whileFocus={{ scale: 1.01 }}
                          className={`w-full border rounded-xl pl-12 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${theme.inputBg} ${theme.inputText} ${theme.inputShadow}`}
                        />
                        <span className="pointer-events-none absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent origin-center scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <div className="relative group">
                          <FaLock
                            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${theme.subtleText} group-focus-within:text-emerald-400`}
                          />
                          <motion.input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleCapsLockCheck}
                            onKeyUp={handleCapsLockCheck}
                            required
                            autoComplete="current-password"
                            whileFocus={{ scale: 1.01 }}
                            className={`w-full border rounded-xl pl-12 pr-12 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${theme.inputBg} ${theme.inputText} ${theme.inputShadow}`}
                          />
                          <span className="pointer-events-none absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent origin-center scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            whileTap={{ scale: 0.85 }}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${theme.eyeToggle}`}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={showPassword ? "eye" : "eye-slash"}
                                initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                                transition={{ duration: 0.18 }}
                                className="flex"
                              >
                                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </motion.span>
                            </AnimatePresence>
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {capsLockOn && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1.5 flex items-center gap-1.5 overflow-hidden pl-1 text-[11px] text-amber-400"
                            >
                              <FaExclamationTriangle size={10} />
                              Caps Lock is on
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <div className="flex justify-end mt-2">
                          {/* opens the OTP-based ForgotPasswordModal */}
                          <button
                            type="button"
                            onClick={onForgotPassword}
                            className={`text-xs font-medium transition-colors ${theme.linkText}`}
                          >
                            Forgot password?
                          </button>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            key="login-error-wrap"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <motion.div
                              key={error}
                              initial={{ x: 0 }}
                              animate={{ x: [0, -6, 6, -4, 4, 0] }}
                              transition={{ duration: 0.4 }}
                              className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl text-sm font-medium ${theme.errorBg}`}
                            >
                              <FaExclamationCircle className="shrink-0" size={14} />
                              <span>{error}</span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        variants={itemVariants}
                        whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                        whileTap={{ scale: loading ? 1 : 0.97 }}
                        disabled={loading}
                        className={`group relative overflow-hidden btn-shine py-3 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-slate-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.55)] transition-shadow hover:shadow-[0_14px_36px_-8px_rgba(16,185,129,0.7)] ${
                          loading ? "cursor-not-allowed opacity-70" : ""
                        }`}
                      >
                        <span className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/3 bg-white/25 skew-x-[-20deg] -translate-x-[150%] group-hover:translate-x-[350%] transition-transform duration-700 ease-out" />
                        <span className="relative flex items-center justify-center gap-2">
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

                    <motion.p
                      className={`relative mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] tracking-wide ${theme.subtleText}`}
                      variants={itemVariants}
                    >
                      <FaShieldAlt size={10} />
                      Protected gate access · VMVAS
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}