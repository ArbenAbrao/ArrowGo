import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useInView, animate } from "framer-motion";
import {
  FaTruck,
  FaQrcode,
  FaUserCheck,
  FaClipboardList,
  FaTools,
  FaBell,
  FaSignInAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";

import LoginModal from "../Components/Modals/LoginModal";
import BrandLogo from "../Components/Brand/BrandLogo";
import { useToast } from "../Context/ToastContext";

// Single source of truth for the API base URL.
// Set VITE_API_URL in your .env file (Vite root) so this never
// needs to be edited again when your WSL2/LAN IP changes.
const API_URL = process.env.REACT_APP_API_URL;

// ==========================================================
// CONTENT — VMVAS (Vehicle Monitoring & Visitor Appointment System)
// ==========================================================

const ROTATING_WORDS = ["Monitor", "Verify", "Track", "Secure", "Manage"];

const BRANCHES = ["Marilao", "Taguig", "Palawan", "Davao", "Cebu"];

const truckGallery = [
  { src: "/Truck8.jpg", plate: "L1D508", status: "En Route", gate: "Main Highway" },
  { src: "/Truck9.jpg", plate: "L1D508", status: "Docked", gate: "Bay 7" },
  { src: "/Truck10.jpg", plate: "L1D508", status: "Arriving", gate: "Warehouse Gate" },
  { src: "/Truck11.jpg", plate: "L1D508", status: "Checked In", gate: "Front Gate" },
];

const gateStatus = [
  { name: "Main Gate", status: "Active", detail: "Vehicles queued for check-in", tone: "emerald" },
  { name: "Visitor Entrance", status: "Active", detail: "Appointments checking in", tone: "emerald" },
  { name: "Exit Gate", status: "Monitoring", detail: "Clear, no activity", tone: "blue" },
  { name: "North Gate", status: "Alert", detail: "Unregistered vehicle flagged", tone: "amber" },
];

const stats = [
  { label: "Branches live", value: 5, suffix: "" },
  { label: "Core modules", value: 6, suffix: "" },
  { label: "Gate uptime", value: 98, suffix: "%" },
  { label: "Monitoring", value: 24, suffix: "/7" },
];

// Light-touch credibility strip — real capabilities the system already has,
// not fabricated client logos or numbers we can't back up.
const trustPoints = [
  "Role-based access control",
  "Full audit trail per gate",
  "Branch-level permissions",
  "QR-verified check-ins",
];

// Each card maps to a real page in the app, not a generic feature blurb.
const modules = [
  {
    title: "Vehicle Monitoring",
    subtitle: "Time-in & Time-out",
    icon: <FaTruck size={22} />,
    accent: "from-emerald-400 to-teal-500",
    description:
      "Every registered and visitor vehicle is logged from arrival to departure, with multi-leg hand-offs between branches tracked automatically.",
  },
  {
    title: "Vehicle Management",
    subtitle: "Registry & QR codes",
    icon: <FaClipboardList size={22} />,
    accent: "from-blue-400 to-cyan-500",
    description:
      "One registry per plate: control ID, OR/CR details, renewal status, and a scannable QR code used for gate verification.",
  },
  {
    title: "Visitor Management",
    subtitle: "Appointments & walk-ins",
    icon: <FaUserCheck size={22} />,
    accent: "from-emerald-400 to-blue-500",
    description:
      "Hosts approve appointment requests and log walk-ins with a badge number, ID, and branch, all from one grid.",
  },
  {
    title: "Appointment Booking",
    subtitle: "Public gate pass request",
    icon: <FaQrcode size={22} />,
    accent: "from-cyan-400 to-emerald-500",
    description:
      "Visitors submit a request online and receive a numbered gate pass the moment their host approves it.",
  },
  {
    title: "Fleet Monitoring",
    subtitle: "Issues & maintenance",
    icon: <FaTools size={22} />,
    accent: "from-blue-400 to-emerald-500",
    description:
      "Mechanical issues are logged by priority per truck, with monthly PDF records archived by branch and vehicle.",
  },
  {
    title: "Request Dashboard",
    subtitle: "Approvals in one place",
    icon: <FaBell size={22} />,
    accent: "from-teal-400 to-blue-500",
    description:
      "Appointment and truck requests land in a single queue, reviewable one at a time or approved in bulk.",
  },
];

const workflow = [
  { step: "Request", detail: "Visitor or vehicle submits an appointment online." },
  { step: "Approval", detail: "Host reviews and approves from the dashboard." },
  { step: "QR Generation", detail: "A unique code is issued for the visit." },
  { step: "Gate Verification", detail: "Guard scans the code to confirm identity." },
  { step: "Live Logging", detail: "Entry, location, and dwell time are recorded." },
  { step: "Exit Report", detail: "Departure is logged and the visit is closed out." },
];

// Expanded and varied on purpose — with only 7 entries the rolling feed
// could re-draw the same line twice in view a few refreshes apart, which
// on a "live monitoring" panel reads as fake data. More entries plus the
// dedupe check in the feed effect below fixes that.
const feedPool = [
  { type: "vehicle", text: "Vehicle L1D508 checked in at Main Gate" },
  { type: "visitor", text: "Visitor Maria Santos approved for 3:00 PM" },
  { type: "vehicle", text: "Vehicle L1D204 departed via Exit Gate" },
  { type: "visitor", text: "QR code scanned for appointment #VA-2291" },
  { type: "alert", text: "Unregistered vehicle flagged at North Gate" },
  { type: "visitor", text: "New appointment request from Dela Cruz Trading" },
  { type: "vehicle", text: "Vehicle L1D508 cleared inspection at Bay 3" },
  { type: "vehicle", text: "Vehicle L2A117 checked in at Visitor Entrance" },
  { type: "visitor", text: "Host approved walk-in for Reyes Logistics" },
  { type: "vehicle", text: "Vehicle L3T902 cleared exit inspection" },
  { type: "visitor", text: "Badge #A-1042 issued at Front Gate" },
  { type: "alert", text: "Gate camera offline at Palawan Branch" },
];

const feedIcon = (type) => {
  if (type === "vehicle") return <FaTruck className="text-blue-400" />;
  if (type === "visitor") return <FaUserCheck className="text-emerald-400" />;
  return <FaBell className="text-amber-400" />;
};

const THEME_KEY = "vmvas_theme";

/* ================= ANIMATED COUNTER ================= */
function AnimatedCounter({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const heroRef = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const spotlightX = useTransform(mouseX, (v) => `${v * 100}%`);
  const spotlightY = useTransform(mouseY, (v) => `${v * 100}%`);
  const spotlightBackground = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) => `radial-gradient(500px circle at ${x} ${y}, rgba(16,185,129,0.10), transparent 70%)`
  );

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Theme — persisted separately from the internal app's darkMode toggle,
  // since this page is shown before login and has no shell to inherit it from.
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === "dark";
    } catch {
      // ignore (private browsing / storage disabled)
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Live dashboard state
  const [truckIndex, setTruckIndex] = useState(0);
  const [feed, setFeed] = useState(
    feedPool.slice(0, 4).map((f, i) => ({ ...f, id: i, time: "Just now" }))
  );

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard", { replace: true });
      return;
    }
    setCheckingAuth(false);
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTruckIndex((prev) => (prev + 1) % truckGallery.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Picks a feed entry that isn't already showing in the visible window,
  // so the "LIVE" activity log never visibly repeats the same line twice
  // in a row — the thing that most gave away the mock data before.
  useEffect(() => {
    let counter = 100;
    const t = setInterval(() => {
      setFeed((prev) => {
        const visibleText = new Set(prev.map((f) => f.text));
        let next = feedPool[Math.floor(Math.random() * feedPool.length)];
        let guard = 0;
        while (visibleText.has(next.text) && guard < 10) {
          next = feedPool[Math.floor(Math.random() * feedPool.length)];
          guard++;
        }
        return [{ ...next, id: counter++, time: "Just now" }, ...prev.slice(0, 3)];
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const handleHeroMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernameOrEmail: email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            showToast("Incorrect username/email or password.", "error");
          } else if (response.status === 403) {
            showToast("Your account is disabled.", "error");
          } else {
            showToast(data.message || "Login failed.", "error");
          }
          return;
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("sessionToken", data.user.sessionToken);

        showToast("Welcome back!", "success");
        setIsModalOpen(false);

        if (redirectAfterLogin) {
          window.open(redirectAfterLogin, "_blank");
        } else {
          navigate("/dashboard", { replace: true });
        }
        setRedirectAfterLogin(null);
      } catch (err) {
        console.error(err);
        showToast("Unable to connect to server.", "error");
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate, redirectAfterLogin, showToast]
  );

  if (checkingAuth) return null;

  const currentTruck = truckGallery[truckIndex];
  const marqueeBranches = [...BRANCHES, ...BRANCHES];
  const marqueeGates = [...gateStatus, ...gateStatus];

  // ---------- THEME TOKENS ----------
  // Same token family as the internal pages (Trucks / VehicleManagement /
  // FleetMonitoring): slate-950/900 dark surfaces vs. slate-50/white light
  // surfaces, single emerald accent, semantic color reserved for status.
  const theme = darkMode
    ? {
        pageBg: "bg-slate-950 text-slate-300",
        pageBgHex: "#020617", // matches bg-slate-950, used for the marquee edge fade
        headerBg: "bg-slate-950/70 border-slate-800/80",
        titleText: "text-slate-100",
        bodyText: "text-slate-400",
        subtleText: "text-slate-500",
        mutedText: "text-slate-600",
        rowBorder: "border-slate-800",
        rowBorderStrong: "border-slate-800/80",
        panelBg: "bg-slate-900/60 border-slate-800",
        panelBgSolid: "bg-slate-950/95 border-slate-800",
        innerPanel: "bg-slate-800/50 border-slate-700",
        innerPanelHover: "hover:border-slate-600",
        floatingCardBg: "bg-slate-900/90 border-slate-800",
        pillBg: "bg-slate-900/60 border-slate-800",
        iconBadge: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        btnSecondary: "border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600",
        ctaBg: "bg-gradient-to-br from-slate-900 to-slate-900/40 border-slate-800",
        marqueeBg: "bg-slate-900/40 border-slate-800/80",
        dividerText: "text-slate-700",
        dividerTextMuted: "text-slate-800",
        gridLine: "rgba(255,255,255,.2)",
        blobBlue: "bg-blue-600/15",
        blobEmerald: "bg-emerald-500/15",
        particle: "bg-emerald-300/30",
      }
    : {
        pageBg: "bg-slate-50 text-slate-700",
        pageBgHex: "#f8fafc", // matches bg-slate-50, used for the marquee edge fade
        headerBg: "bg-white/70 border-slate-200",
        titleText: "text-slate-900",
        bodyText: "text-slate-600",
        subtleText: "text-slate-500",
        mutedText: "text-slate-400",
        rowBorder: "border-slate-200",
        rowBorderStrong: "border-slate-200",
        panelBg: "bg-white border-slate-200",
        panelBgSolid: "bg-white/95 border-slate-200",
        innerPanel: "bg-slate-100 border-slate-200",
        innerPanelHover: "hover:border-slate-300",
        floatingCardBg: "bg-white/95 border-slate-200",
        pillBg: "bg-white/70 border-slate-200",
        iconBadge: "bg-emerald-50 border-emerald-200 text-emerald-600",
        btnSecondary: "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400",
        ctaBg: "bg-gradient-to-br from-white to-slate-50 border-slate-200",
        marqueeBg: "bg-white/60 border-slate-200",
        dividerText: "text-slate-300",
        dividerTextMuted: "text-slate-200",
        gridLine: "rgba(15,23,42,.06)",
        blobBlue: "bg-blue-400/10",
        blobEmerald: "bg-emerald-400/10",
        particle: "bg-emerald-500/20",
      };

  const toneStyles = darkMode
    ? {
        emerald: { dot: "bg-emerald-400", text: "text-emerald-300", pill: "bg-emerald-500/15" },
        blue: { dot: "bg-blue-400", text: "text-blue-300", pill: "bg-blue-500/15" },
        amber: { dot: "bg-amber-400", text: "text-amber-300", pill: "bg-amber-500/15" },
      }
    : {
        emerald: { dot: "bg-emerald-500", text: "text-emerald-700", pill: "bg-emerald-100" },
        blue: { dot: "bg-blue-500", text: "text-blue-700", pill: "bg-blue-100" },
        amber: { dot: "bg-amber-500", text: "text-amber-700", pill: "bg-amber-100" },
      };

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
  };

  return (
    <div className={`relative w-full min-h-screen overflow-x-hidden transition-colors duration-300 ${theme.pageBg}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');
        .page-title { font-family: 'Space Grotesk', sans-serif; }

        html { scroll-behavior: smooth; }

        @keyframes vmvas-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes vmvas-marquee-reverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: vmvas-marquee 26s linear infinite;
        }
        .marquee-track-reverse {
          display: flex;
          width: max-content;
          animation: vmvas-marquee-reverse 32s linear infinite;
        }
        .marquee-row:hover .marquee-track,
        .marquee-row:hover .marquee-track-reverse {
          animation-play-state: paused;
        }

        @keyframes vmvas-spin {
          to { transform: rotate(360deg); }
        }
        .spin-border {
          animation: vmvas-spin 6s linear infinite;
        }

        @keyframes vmvas-gradient-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-text {
          background-size: 200% 200%;
          animation: vmvas-gradient-pan 6s ease infinite;
        }

        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine > span { position: relative; z-index: 1; }
        .btn-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,.35), transparent);
          transform: translateX(-130%);
          transition: transform .7s ease;
        }
        .btn-shine:hover::after { transform: translateX(130%); }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .marquee-track-reverse, .spin-border, .gradient-text { animation: none; }
        }
      `}</style>

      {/* SCROLL PROGRESS BAR */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 z-[999]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 80, -50, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.9, 1] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full ${theme.blobBlue} blur-[150px]`}
        />
        <motion.div
          animate={{ x: [0, -90, 60, 0], y: [0, 70, -40, 0], scale: [1, 0.85, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 21, ease: "easeInOut" }}
          className={`absolute bottom-0 right-0 w-[680px] h-[680px] rounded-full ${theme.blobEmerald} blur-[160px]`}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px),linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${theme.particle}`}
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [0, -50, 0], opacity: [0.15, 0.8, 0.15] }}
            transition={{ repeat: Infinity, duration: 6 + Math.random() * 6, delay: Math.random() * 4 }}
          />
        ))}
      </div>

      {/* TOP BAR */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${theme.headerBg}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo
              badgeClassName={`flex h-10 w-10 shrink-0 rounded-2xl border ${theme.iconBadge}`}
              glyphClassName="w-5 h-5"
              imgClassName="w-full h-full p-1.5"
            />
            <span className={`page-title font-bold text-lg ${theme.titleText}`}>VMVAS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/appointment")}
              className={`hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${theme.btnSecondary}`}
            >
              Book an Appointment
            </button>

            {/* THEME TOGGLE */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border overflow-hidden transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${theme.iconBadge}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={darkMode ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center"
                >
                  {darkMode ? <FaMoon size={15} /> : <FaSun size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-shine inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <span className="flex items-center gap-2">
                <FaSignInAlt size={13} />
                Staff Login
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative py-20 lg:py-28 overflow-hidden"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: spotlightBackground }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div
                variants={fadeUp}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-7 ${theme.pillBg}`}
              >
                <FiTrendingUp className="text-emerald-400" size={14} />
                <span className={`text-xs tracking-wide ${theme.bodyText}`}>Live gate intelligence, five branches</span>
              </motion.div>

              <h1 className={`page-title text-5xl lg:text-6xl font-bold leading-[1.05] ${theme.titleText}`}>
                <span className="block h-[1.05em] overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[currentWordIndex]}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {ROTATING_WORDS[currentWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <motion.span
                  variants={fadeUp}
                  className="gradient-text block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent"
                >
                  every vehicle,
                </motion.span>
                <motion.span variants={fadeUp} className="block">
                  every visitor.
                </motion.span>
              </h1>

              <motion.p variants={fadeUp} className={`mt-7 text-lg leading-8 max-w-xl ${theme.bodyText}`}>
                VMVAS is the gate system your team already runs on: appointment
                requests, host approvals, QR check-in, and full arrival-to-exit
                logging across Marilao, Taguig, Palawan, Davao, and Cebu.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mt-9">
                <button
                  onClick={() => navigate("/appointment")}
                  className="btn-shine px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <span>Book an Appointment</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`px-7 py-3.5 rounded-xl border flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${theme.btnSecondary}`}
                >
                  <FaSignInAlt size={14} />
                  Staff Login
                </button>
              </motion.div>

              {/* STAT STRIP */}
              <motion.div
                variants={fadeUp}
                className={`grid grid-cols-4 gap-4 mt-12 max-w-lg border-t pt-7 ${theme.rowBorder}`}
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className={`page-title text-2xl sm:text-3xl font-bold ${theme.titleText}`}>
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                    <p className={`text-[11px] sm:text-xs mt-1 leading-tight ${theme.subtleText}`}>{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT — LIVE DASHBOARD PREVIEW */}
            {/* mb-10/14: gives the bottom-left floating card room to sit below
                the panel instead of chewing into the next section on scroll. */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -6 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-10 md:mb-14"
              style={{ perspective: 1200 }}
            >
              {/* rotating glow border */}
              <div className="absolute -inset-[2px] rounded-3xl overflow-hidden pointer-events-none">
                <div
                  className="spin-border absolute inset-[-50%] opacity-60"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.55) 15%, transparent 30%, transparent 60%, rgba(56,189,248,0.5) 75%, transparent 90%)",
                  }}
                />
              </div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`relative m-[2px] rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-colors duration-300 ${theme.panelBgSolid}`}
              >
                <div className={`flex items-center justify-between px-6 py-5 border-b ${theme.rowBorder}`}>
                  <div>
                    <p className={`text-xs ${theme.subtleText}`}>Gate Control Center</p>
                    <h2 className={`text-xl font-bold page-title ${theme.titleText}`}>Live Monitoring</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                  </div>
                </div>

                <div className="relative p-6 flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentTruck.src}
                      src={currentTruck.src}
                      alt={`Vehicle ${currentTruck.plate}`}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-44 object-cover rounded-2xl shadow-lg shadow-black/30"
                    />
                  </AnimatePresence>

                  <div className="flex items-center justify-between w-full mt-4 text-sm">
                    <span className={theme.subtleText}>
                      Plate <span className={`font-semibold ${theme.titleText}`}>{currentTruck.plate}</span> · {currentTruck.gate}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold">
                      {currentTruck.status}
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-7 space-y-2.5">
                  {gateStatus.map((gate, i) => (
                    <motion.div
                      key={gate.name}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                      whileHover={{ x: 3 }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${theme.innerPanel} ${theme.innerPanelHover}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${toneStyles[gate.tone].dot} animate-pulse`} />
                        <span className={`text-sm font-medium ${theme.titleText}`}>{gate.name}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${toneStyles[gate.tone].pill} ${toneStyles[gate.tone].text}`}
                      >
                        {gate.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating gate pass card */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                whileHover={{ scale: 1.04 }}
                className={`absolute -top-6 -right-5 w-56 rounded-2xl border backdrop-blur-xl p-5 shadow-xl hidden md:block transition-colors duration-300 ${theme.floatingCardBg}`}
              >
                <div className="flex items-center justify-between">
                  <FaQrcode className="text-2xl text-blue-400" />
                  <span className="text-xs text-emerald-500 font-semibold">APPROVED</span>
                </div>
                <h3 className={`mt-4 font-bold ${theme.titleText}`}>Gate Pass</h3>
                <p className={`text-xs mt-1 ${theme.subtleText}`}>Maria Santos · Taguig, 3:00 PM</p>
              </motion.div>

              {/* Floating check-in card — pushed further outside the panel
                  (-bottom-12 -left-8, was -bottom-5 -left-5) so it no longer
                  sits directly on top of the North Gate status row. */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
                whileHover={{ scale: 1.04 }}
                className={`absolute -bottom-12 -left-8 w-56 rounded-2xl border backdrop-blur-xl p-5 shadow-2xl hidden md:block transition-colors duration-300 ${theme.floatingCardBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                    <FaCheckCircle size={16} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${theme.titleText}`}>Gate Check-In</p>
                    <p className={`text-xs ${theme.subtleText}`}>On-time rate</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-500 mt-3">
                  <AnimatedCounter value={98} suffix="%" />
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DUAL MARQUEE */}
      <section className={`relative border-y py-5 overflow-hidden space-y-3 transition-colors duration-300 ${theme.marqueeBg}`}>
        {/* Edge fades — the ticker used to clip mid-word at both sides;
            these dissolve it into the page background instead. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-28 z-10 bg-gradient-to-r to-transparent"
          style={{ backgroundImage: `linear-gradient(to right, ${theme.pageBgHex}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-28 z-10 bg-gradient-to-l to-transparent"
          style={{ backgroundImage: `linear-gradient(to left, ${theme.pageBgHex}, transparent)` }}
        />

        <div className="marquee-row overflow-hidden">
          <div className="marquee-track">
            {marqueeBranches.map((branch, i) => (
              <div key={`${branch}-${i}`} className="flex items-center gap-3 px-8 shrink-0">
                <FaMapMarkerAlt className="text-emerald-500" size={14} />
                <span className={`page-title font-semibold tracking-wide ${theme.titleText}`}>{branch} Branch</span>
                <span className={theme.dividerText}>•</span>
              </div>
            ))}
          </div>
        </div>
        <div className="marquee-row overflow-hidden">
          <div className="marquee-track-reverse">
            {marqueeGates.map((gate, i) => (
              <div key={`${gate.name}-${i}`} className="flex items-center gap-3 px-8 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${toneStyles[gate.tone].dot}`} />
                <span className={`text-sm ${theme.subtleText}`}>
                  {gate.name} <span className={toneStyles[gate.tone].text}>· {gate.status}</span>
                </span>
                <span className={theme.dividerTextMuted}>•</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="relative py-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {trustPoints.map((point) => (
              <motion.span
                key={point}
                variants={fadeUp}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium ${theme.pillBg} ${theme.bodyText}`}
              >
                <FaCheckCircle className="text-emerald-500" size={12} />
                {point}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SYSTEM OVERVIEW */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.span variants={fadeUp} className="text-xs tracking-wide text-emerald-500 font-semibold">
              SYSTEM OVERVIEW
            </motion.span>
            <motion.h2 variants={fadeUp} className={`page-title mt-3 text-4xl lg:text-5xl font-bold ${theme.titleText}`}>
              Six modules, one gate
            </motion.h2>
            <motion.p variants={fadeUp} className={`mt-4 leading-7 ${theme.bodyText}`}>
              This is what your team logs into every day — the same modules,
              shown here as they run behind the login.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12"
          >
            {modules.map((module) => (
              <motion.div
                key={module.title}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                className={`group relative rounded-2xl border p-6 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 ${theme.panelBg}`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${module.accent} text-slate-950 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  {module.icon}
                </div>
                <h3 className={`page-title text-lg font-bold mt-5 ${theme.titleText}`}>{module.title}</h3>
                <p className={`text-xs mt-0.5 ${theme.subtleText}`}>{module.subtitle}</p>
                <p className={`mt-3 text-sm leading-6 ${theme.bodyText}`}>{module.description}</p>
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/0 group-hover:via-emerald-500/50 to-transparent transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`relative py-24 border-t transition-colors duration-300 ${theme.rowBorderStrong}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.span variants={fadeUp} className="text-xs tracking-wide text-emerald-500 font-semibold">
              HOW IT WORKS
            </motion.span>
            <motion.h2 variants={fadeUp} className={`page-title mt-3 text-4xl lg:text-5xl font-bold ${theme.titleText}`}>
              From request to exit
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mt-14 relative">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transformOrigin: "left" }}
              className="hidden lg:block absolute top-6 left-[8%] right-[8%] h-px bg-gradient-to-r from-emerald-500/50 via-slate-500/30 to-blue-500/50"
            />
            {workflow.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center font-black text-slate-950 relative z-10 shadow-lg shadow-emerald-500/20">
                  {index + 1}
                </div>
                <h4 className={`page-title font-bold mt-4 ${theme.titleText}`}>{item.step}</h4>
                <p className={`text-sm mt-1.5 leading-6 ${theme.subtleText}`}>{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE FLEET GALLERY + ACTIVITY FEED */}
      <section className={`relative py-24 border-t transition-colors duration-300 ${theme.rowBorderStrong}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            <motion.span variants={fadeUp} className="text-xs tracking-wide text-emerald-500 font-semibold">
              LIVE FEED
            </motion.span>
            <motion.h2 variants={fadeUp} className={`page-title mt-3 text-4xl lg:text-5xl font-bold ${theme.titleText}`}>
              What's happening right now
            </motion.h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            {/* Gallery */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="lg:col-span-2 grid sm:grid-cols-2 gap-5"
            >
              {truckGallery.map((truck) => (
                <motion.div
                  key={truck.src}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="relative rounded-2xl overflow-hidden border border-slate-800 group"
                >
                  <img
                    src={truck.src}
                    alt={`Vehicle ${truck.plate} — ${truck.status}`}
                    className="w-full h-44 object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{truck.plate}</span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur text-xs font-semibold text-slate-200">
                        {truck.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">{truck.gate}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className={`rounded-2xl border p-5 h-fit transition-colors duration-300 ${theme.panelBg}`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-bold ${theme.titleText}`}>Activity Log</h3>
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  LIVE
                </span>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {feed.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.35 }}
                      whileHover={{ x: 3 }}
                      className={`flex items-start gap-2.5 rounded-xl border p-3.5 transition-colors ${theme.innerPanel} ${theme.innerPanelHover}`}
                    >
                      <div className="mt-0.5">{feedIcon(item.type)}</div>
                      <div className="min-w-0">
                        <p className={`text-sm leading-5 ${theme.bodyText}`}>{item.text}</p>
                        <p className={`text-xs mt-0.5 ${theme.mutedText}`}>{item.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`relative py-24 border-t transition-colors duration-300 ${theme.rowBorderStrong}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`relative rounded-3xl border px-8 sm:px-14 py-16 text-center overflow-hidden transition-colors duration-300 ${theme.ctaBg}`}
          >
            <motion.div
              animate={{ x: [0, 40, -20, 0], y: [0, -20, 15, 0] }}
              transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
              className="absolute -top-20 left-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"
            />
            <motion.div
              animate={{ x: [0, -40, 20, 0], y: [0, 20, -15, 0] }}
              transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
              className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"
            />

            <h2 className={`relative page-title text-4xl lg:text-5xl font-bold ${theme.titleText}`}>
              Ready to gate-check your first visit?
            </h2>
            <p className={`relative mt-5 max-w-2xl mx-auto leading-7 ${theme.bodyText}`}>
              Book an appointment as a visitor, or sign in to manage vehicles,
              visitors, and fleet issues across every branch.
            </p>
            <div className="relative flex flex-wrap justify-center gap-4 mt-9">
              <button
                onClick={() => navigate("/appointment")}
                className="btn-shine px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <span>Book an Appointment</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className={`px-8 py-3.5 rounded-xl border hover:-translate-y-0.5 active:translate-y-0 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${theme.btnSecondary}`}
              >
                Staff Login
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t transition-colors duration-300 ${theme.rowBorderStrong}`}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <BrandLogo
                  badgeClassName={`flex h-10 w-10 rounded-2xl border ${theme.iconBadge}`}
                  glyphClassName="w-5 h-5"
                  imgClassName="w-full h-full p-1.5"
                />
                <span className={`page-title font-bold text-lg ${theme.titleText}`}>VMVAS</span>
              </div>
              <p className={`text-sm leading-6 ${theme.subtleText}`}>
                Vehicle Monitoring &amp; Visitor Appointment System — one live
                dashboard for every gate, vehicle, and visitor.
              </p>
            </div>

            <div>
              <h3 className={`font-bold mb-4 ${theme.titleText}`}>Modules</h3>
              <ul className={`space-y-2.5 text-sm ${theme.subtleText}`}>
                {modules.map((m) => (
                  <li key={m.title} className="hover:text-emerald-500 transition-colors cursor-default">
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-bold mb-4 ${theme.titleText}`}>Branches</h3>
              <ul className={`space-y-2.5 text-sm ${theme.subtleText}`}>
                {BRANCHES.map((b) => (
                  <li key={b} className="hover:text-emerald-500 transition-colors cursor-default">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-bold mb-4 ${theme.titleText}`}>Contact</h3>
              <div className={`space-y-2.5 text-sm ${theme.subtleText}`}>
                <div className="flex items-center gap-2.5">
                  <FaPhoneAlt size={12} />
                  <span>+63 2 8123 4567</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaEnvelope size={12} />
                  <span>support@vmvas.com</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaMapMarkerAlt size={12} />
                  <span>Metro Manila, Philippines</span>
                </div>
              </div>
              <div className={`flex gap-4 mt-6 text-lg ${theme.subtleText}`}>
                <button type="button" aria-label="Facebook" className="hover:text-emerald-500 hover:-translate-y-0.5 transition">
                  <FaFacebook />
                </button>
                <button type="button" aria-label="Instagram" className="hover:text-emerald-500 hover:-translate-y-0.5 transition">
                  <FaInstagram />
                </button>
                <button type="button" aria-label="LinkedIn" className="hover:text-emerald-500 hover:-translate-y-0.5 transition">
                  <FaLinkedin />
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme.rowBorderStrong}`}>
            <p className={`text-xs ${theme.mutedText}`}>© {new Date().getFullYear()} VMVAS. All Rights Reserved.</p>
            <div className={`flex gap-5 text-xs ${theme.mutedText}`}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <LoginModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onLogin={handleLogin}
  email={email}
  setEmail={setEmail}
  password={password}
  setPassword={setPassword}
  loading={loading}
  darkMode={darkMode}
/>
    </div>
  );
}