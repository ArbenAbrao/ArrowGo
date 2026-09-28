// src/Components/Modals/ForgotPasswordModal.jsx
import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaArrowLeft,
  FaPaperPlane,
  FaKey,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaShieldAlt,
} from "react-icons/fa";

import BrandLogo from "../Brand/BrandLogo";
import { useToast } from "../../Context/ToastContext";

const API_URL = process.env.REACT_APP_API_URL;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds
const STEP_FLOW = ["email", "otp", "reset"];
const STEP_ICONS = { email: FaEnvelope, otp: FaKey, reset: FaLock };

// Subtle film-grain texture layered over the glass panel at very low opacity
// with a blend mode, so it reads as tactile noise rather than a visible
// pattern. Keeps the panel from feeling like a flat CSS gradient.
const NOISE_BG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>";

function getPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: "Very weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-blue-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

// Live checklist shown under the new-password field — clearer for users than
// a strength bar alone, since it says exactly what's still missing.
const PASSWORD_CHECKS = [
  { key: "length", label: "8+ characters", test: (p) => p.length >= 8 },
  { key: "case", label: "Upper & lowercase", test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { key: "number", label: "A number", test: (p) => /\d/.test(p) },
  { key: "symbol", label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin, darkMode = true }) {
  const { showToast } = useToast();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState("email"); // email | otp | reset | success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef([]);
  const passwordStrength = getPasswordStrength(newPassword);
  const currentStepIndex = STEP_FLOW.indexOf(step);

  const confirmState = !confirmPassword
    ? null
    : confirmPassword === newPassword
    ? "match"
    : newPassword.startsWith(confirmPassword) || confirmPassword.startsWith(newPassword)
    ? "typing" // still could resolve into a match — don't flag it yet
    : "mismatch";

  const handleCapsLockCheck = (e) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  // Reset all local state after the modal finishes closing, so re-opening
  // it always starts a fresh flow instead of showing a stale step.
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep("email");
        setEmail("");
        setOtp(Array(OTP_LENGTH).fill(""));
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setCapsLockOn(false);
        setError("");
        setCooldown(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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
        otpBox: "bg-slate-900/60 border-slate-700 text-slate-100 focus:border-emerald-500/60",
        gridLine: "rgba(255,255,255,0.05)",
        routeLine: "rgba(52,211,153,0.4)",
        logoPunch: "bg-slate-950",
        trackBg: "bg-slate-800",
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
        otpBox: "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/60",
        gridLine: "rgba(15,23,42,0.05)",
        routeLine: "rgba(16,185,129,0.35)",
        logoPunch: "bg-white",
        trackBg: "bg-slate-200",
        borderGlow: "from-white/70 via-white/10 to-emerald-500/25",
      };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };
  const otpContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const otpItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.7 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  };

  const requestOtp = useCallback(
    async (isResend = false) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/forgot-password/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            // Unregistered email — not something more typing fixes, so
            // surface it as a toast instead of the inline form error.
            showToast(data.message || "No account found with that email.", "error");
          } else {
            setError(data.message || "Something went wrong. Please try again.");
          }
          return;
        }
        setCooldown(RESEND_COOLDOWN);
        if (!isResend) {
          setStep("otp");
          setTimeout(() => otpRefs.current[0]?.focus(), 350);
        } else {
          showToast("A new code is on its way.", "success");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    },
    [email, showToast]
  );

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    requestOtp(false);
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i++) next[i] = pasted[i] || "";
      return next;
    });
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpRefs.current[lastIndex]?.focus();
  };

  const handleVerifyOtp = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const code = otp.join("");
      if (code.length !== OTP_LENGTH) {
        setError("Enter the full 6-digit code.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/forgot-password/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: code }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Invalid or expired code.");
          setOtp(Array(OTP_LENGTH).fill(""));
          otpRefs.current[0]?.focus();
          return;
        }
        setResetToken(data.resetToken);
        setStep("reset");
      } catch (err) {
        console.error(err);
        setError("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    },
    [otp, email]
  );

  // Auto-submit the moment all six digits are filled — one less tap for the
  // common case where the code was typed or pasted in full.
  useEffect(() => {
    if (step === "otp" && otp.every((d) => d !== "") && !loading) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not reset password.");
        return;
      }
      setStep("success");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    email: "Forgot Password",
    otp: "Check your email",
    reset: "Set a new password",
    success: "Password reset",
  };

  const stepSubtitles = {
    email: "Enter your account email and we'll send you a reset code.",
    reset: "Choose a new password for your account.",
    success: "You can now sign in with your new password.",
  };

  const renderInlineError = (key) => (
    <AnimatePresence>
      {error && (
        <motion.div
          key={key}
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
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

                    <motion.button
                      type="button"
                      onClick={onClose}
                      aria-label="Close password reset dialog"
                      whileHover={{ rotate: 90, scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute right-5 top-5 p-2 rounded-full border transition-colors ${theme.closeBtn}`}
                    >
                      <FaTimes size={15} />
                    </motion.button>

                    {step !== "email" && step !== "success" && (
                      <motion.button
                        type="button"
                        onClick={() => {
                          setError("");
                          setStep(step === "reset" ? "otp" : "email");
                        }}
                        aria-label="Go back"
                        whileHover={{ x: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className={`absolute left-5 top-5 p-2 rounded-full border transition-colors ${theme.closeBtn}`}
                      >
                        <FaArrowLeft size={13} />
                      </motion.button>
                    )}

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

                    {/* Connected, icon-based stepper — completed steps check off,
                        the active step pulses, so the flow reads at a glance */}
                    {step !== "success" && (
                      <div className="relative mb-6">
                        <div className="flex items-center">
                          {STEP_FLOW.map((s, i) => {
                            const Icon = STEP_ICONS[s];
                            const isDone = i < currentStepIndex;
                            const isCurrent = i === currentStepIndex;
                            return (
                              <Fragment key={s}>
                                <div className="relative flex items-center justify-center">
                                  <motion.div
                                    animate={{ scale: isCurrent ? 1.08 : 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                                      isDone
                                        ? "border-emerald-400 bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950"
                                        : isCurrent
                                        ? `${theme.iconBadge} ring-4 ring-emerald-500/15`
                                        : `border-transparent ${theme.trackBg} ${theme.subtleText}`
                                    }`}
                                  >
                                    {isCurrent && !reduceMotion && (
                                      <motion.span
                                        className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                                        animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                                      />
                                    )}
                                    {isDone ? <FaCheck size={12} /> : <Icon size={12} />}
                                  </motion.div>
                                </div>
                                {i < STEP_FLOW.length - 1 && (
                                  <div
                                    className={`relative mx-1.5 h-[2px] flex-1 overflow-hidden rounded-full ${theme.trackBg}`}
                                  >
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                      initial={false}
                                      animate={{ width: i < currentStepIndex ? "100%" : "0%" }}
                                      transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                  </div>
                                )}
                              </Fragment>
                            );
                          })}
                        </div>
                        <p className={`mt-2.5 text-center text-[10px] tracking-wide ${theme.subtleText}`}>
                          Step {currentStepIndex + 1} of {STEP_FLOW.length}
                        </p>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <h3 className={`relative page-title text-xl sm:text-2xl font-bold text-center ${theme.titleText}`}>
                          {stepTitles[step]}
                        </h3>
                        <p className={`relative mt-2 text-center text-sm px-2 ${theme.bodyText}`}>
                          {step === "otp" ? (
                            <>
                              Enter the 6-digit code sent to{" "}
                              <span className={`font-semibold ${theme.titleText}`}>{email}</span>
                            </>
                          ) : (
                            stepSubtitles[step]
                          )}
                        </p>

                        {/* STEP: EMAIL */}
                        {step === "email" && (
                          <form onSubmit={handleEmailSubmit} className="relative flex flex-col gap-4 mt-7">
                            <div className="relative group">
                              <FaEnvelope
                                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${theme.subtleText} group-focus-within:text-emerald-400`}
                              />
                              <motion.input
                                type="email"
                                placeholder="you@arrowgo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                whileFocus={{ scale: 1.01 }}
                                className={`w-full border rounded-xl pl-12 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${theme.inputBg} ${theme.inputText} ${theme.inputShadow}`}
                              />
                              <span className="pointer-events-none absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent origin-center scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
                            </div>

                            {renderInlineError("fp-error-email")}

                            <SubmitButton loading={loading} icon={<FaPaperPlane size={13} />} label="Send Reset Code" />
                          </form>
                        )}

                        {/* STEP: OTP */}
                        {step === "otp" && (
                          <form onSubmit={handleVerifyOtp} className="relative flex flex-col gap-5 mt-7">
                            <motion.div
                              className="flex justify-center gap-2 sm:gap-3"
                              onPaste={handleOtpPaste}
                              variants={otpContainerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {otp.map((digit, i) => (
                                <motion.input
                                  key={i}
                                  ref={(el) => (otpRefs.current[i] = el)}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleOtpChange(i, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                  variants={otpItemVariants}
                                  className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all duration-200 ${theme.otpBox} ${theme.inputShadow} ${
                                    digit ? "scale-[1.04] border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" : ""
                                  }`}
                                />
                              ))}
                            </motion.div>

                            {renderInlineError("fp-error-otp")}

                            <SubmitButton loading={loading} icon={<FaKey size={13} />} label="Verify Code" />

                            <div className="flex flex-col items-center gap-1.5">
                              <p className={`text-[11px] ${theme.subtleText}`}>Didn't get it? Check your spam folder.</p>
                              <button
                                type="button"
                                disabled={cooldown > 0 || loading}
                                onClick={() => requestOtp(true)}
                                className={`group flex items-center justify-center gap-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.linkText}`}
                              >
                                {cooldown > 0 ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 14 14" className="-rotate-90 shrink-0">
                                      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                                      <circle
                                        cx="7"
                                        cy="7"
                                        r="5.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 5.5}
                                        strokeDashoffset={2 * Math.PI * 5.5 * (1 - cooldown / RESEND_COOLDOWN)}
                                      />
                                    </svg>
                                    Resend in {cooldown}s
                                  </>
                                ) : (
                                  <>
                                    <FaRedo size={11} className="transition-transform duration-500 group-hover:rotate-180" />
                                    Resend code
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* STEP: RESET */}
                        {step === "reset" && (
                          <form onSubmit={handleResetPassword} className="relative flex flex-col gap-4 mt-7">
                            <div>
                              <div className="relative group">
                                <FaLock
                                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${theme.subtleText} group-focus-within:text-emerald-400`}
                                />
                                <motion.input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="New password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  onKeyDown={handleCapsLockCheck}
                                  onKeyUp={handleCapsLockCheck}
                                  required
                                  autoFocus
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

                              <AnimatePresence>
                                {newPassword && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="flex items-center gap-2 mt-2.5 px-1">
                                      <div className={`h-1 flex-1 rounded-full overflow-hidden ${theme.trackBg}`}>
                                        <motion.div
                                          className={`h-full rounded-full ${STRENGTH_META[passwordStrength].color}`}
                                          initial={false}
                                          animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                                          transition={{ duration: 0.3 }}
                                        />
                                      </div>
                                      <span className={`text-[11px] whitespace-nowrap ${theme.subtleText}`}>
                                        {STRENGTH_META[passwordStrength].label}
                                      </span>
                                    </div>
                                    <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 px-1">
                                      {PASSWORD_CHECKS.map((check) => {
                                        const passed = check.test(newPassword);
                                        return (
                                          <div
                                            key={check.key}
                                            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                                              passed ? "text-emerald-400" : theme.subtleText
                                            }`}
                                          >
                                            <FaCheckCircle size={10} className={passed ? "opacity-100" : "opacity-30"} />
                                            {check.label}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="relative group">
                              <FaLock
                                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${theme.subtleText} group-focus-within:text-emerald-400`}
                              />
                              <motion.input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                whileFocus={{ scale: 1.01 }}
                                className={`w-full border rounded-xl pl-12 pr-11 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors ${theme.inputBg} ${theme.inputText} ${theme.inputShadow}`}
                              />
                              <span className="pointer-events-none absolute -bottom-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent origin-center scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
                              <AnimatePresence mode="wait">
                                {confirmState === "match" && (
                                  <motion.span
                                    key="match"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
                                  >
                                    <FaCheckCircle size={15} />
                                  </motion.span>
                                )}
                                {confirmState === "mismatch" && (
                                  <motion.span
                                    key="mismatch"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400"
                                  >
                                    <FaTimesCircle size={15} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>

                            {renderInlineError("fp-error-reset")}

                            <SubmitButton loading={loading} icon={<FaLock size={13} />} label="Reset Password" />
                          </form>
                        )}

                        {/* STEP: SUCCESS */}
                        {step === "success" && (
                          <div className="relative flex flex-col items-center gap-5 mt-7">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                              {[0, 1].map((ring) => (
                                <motion.span
                                  key={ring}
                                  className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                                  initial={{ scale: 0.6, opacity: 0.8 }}
                                  animate={{ scale: 1.6, opacity: 0 }}
                                  transition={{ duration: 1.6, repeat: 2, delay: ring * 0.8, ease: "easeOut" }}
                                />
                              ))}
                              {!reduceMotion &&
                                [...Array(6)].map((_, i) => {
                                  const angle = (i / 6) * Math.PI * 2;
                                  const radius = 46;
                                  return (
                                    <motion.span
                                      key={i}
                                      className={`absolute h-1.5 w-1.5 rounded-full ${
                                        i % 2 === 0 ? "bg-emerald-400" : "bg-blue-400"
                                      }`}
                                      style={{ left: "50%", top: "50%" }}
                                      initial={{ x: -3, y: -3, opacity: 0, scale: 0 }}
                                      animate={{
                                        x: Math.cos(angle) * radius - 3,
                                        y: Math.sin(angle) * radius - 3,
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0.5],
                                      }}
                                      transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                                    />
                                  );
                                })}
                              <div className="relative w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                                  <motion.path
                                    d="M8 17 L14 23 L24 10"
                                    stroke="#10b981"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                  />
                                </svg>
                              </div>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              type="button"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                onClose();
                                onBackToLogin?.();
                              }}
                              className="group relative overflow-hidden btn-shine w-full py-3 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 text-slate-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.55)] hover:shadow-[0_14px_36px_-8px_rgba(16,185,129,0.7)] transition-shadow"
                            >
                              <span className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/3 bg-white/25 skew-x-[-20deg] -translate-x-[150%] group-hover:translate-x-[350%] transition-transform duration-700 ease-out" />
                              <span className="relative">Back to Login</span>
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <motion.p
                      className={`relative mt-7 flex items-center justify-center gap-1.5 text-center text-[11px] tracking-wide ${theme.subtleText}`}
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

function SubmitButton({ loading, icon, label }) {
  return (
    <motion.button
      type="submit"
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
            {icon}
            {label}
          </>
        )}
      </span>
    </motion.button>
  );
}