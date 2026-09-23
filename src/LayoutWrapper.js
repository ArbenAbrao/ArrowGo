import axios from "axios";

// src/LayoutWrapper.js
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useLoader } from "./Context/LoaderContext";
import { useNavigate } from "react-router-dom";

/* Components */
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";
import PageLoader from "./Components/PageLoader";

/* Pages */
import Welcome from "./Pages/Welcome";
import Dashboard from "./Pages/Dashboard";
import Trucks from "./Pages/Trucks";
import Visitors from "./Pages/Visitors";
import Appointment from "./Pages/Appointment";
import Request from "./Pages/Request";
import Accounts from "./Pages/Accounts";
import TruckRequest from "./Pages/TruckRequest";
import TruckDetails from "./Pages/TruckDetails";
import Settings from "./Pages/Settings";
import Branches from "./Pages/Branches";
import VehicleManagement from "./Pages/VehicleManagement";
import Walkins from "./Pages/Walkins";
import Drivers from "./Pages/Drivers";
import FleetMonitoring from "./Pages/FleetMonitoring";

// Keep these in sync with the widths used in Components/Header.jsx
// (isCollapsed ? 76 : 248)
const SIDEBAR_WIDTH_COLLAPSED = 76;
const SIDEBAR_WIDTH_EXPANDED = 248;

export default function LayoutWrapper() {
  const navigate = useNavigate();

  const location = useLocation();
  const { setLoading } = useLoader();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const isSpecialPage =
    location.pathname === "/" ||
    location.pathname === "/appointment" ||
    location.pathname === "/truck-request" ||
    location.pathname === "/walkins" ||
    location.pathname.startsWith("/truck-details");
    

  /* ===============================
     HANDLE WINDOW RESIZE
  =============================== */
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);

      if (!desktop) setIsCollapsed(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ===============================
     DARK MODE HANDLER
  =============================== */
  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* ===============================
     ROUTE LOADER (DESKTOP ONLY)
  =============================== */
  useEffect(() => {
    if (!isDesktop) return;

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading, isDesktop]);

  /* ===============================
   AUTO LOGOUT AFTER 15 MINUTES
================================ */
useEffect(() => {
  const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes
  let inactivityTimer;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
      localStorage.removeItem("user");
localStorage.removeItem("sessionToken");
localStorage.removeItem("isLoggedIn");

alert("Session expired due to inactivity");

navigate("/", { replace: true });
    }, INACTIVITY_TIME);
  };

  const events = ["mousemove", "keydown", "click", "scroll"];

  events.forEach((event) => window.addEventListener(event, resetTimer));

  resetTimer(); // start timer

  return () => {
    events.forEach((event) =>
      window.removeEventListener(event, resetTimer)
    );
    clearTimeout(inactivityTimer);
  };
}, [navigate]);



/* ===============================
   HEARTBEAT (UPDATE ONLINE STATUS)
================================ */
useEffect(() => {
  const token = localStorage.getItem("sessionToken");

  if (!token) return;

  const interval = setInterval(() => {
    axios.post(
      "http://192.168.254.131:5000/api/heartbeat",
      {},
      {
        headers: {
          "x-session-token": token,
        },
      }
    ).catch(() => {});
  }, 60000); // every 1 minute

  return () => clearInterval(interval);
}, []);

  /* ===============================
     SPECIAL PUBLIC PAGES
  =============================== */
  if (isSpecialPage) {
    return (
      <div className="overflow-x-hidden w-full">
        <AnimatePresence mode="sync">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Welcome />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/truck-request" element={<TruckRequest />} />
            <Route
              path="/truck-details/:plateNumber"
              element={<TruckDetails />}
            />
            <Route path="/walkins" element={<Walkins />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  /* ===============================
     MAIN LAYOUT
  =============================== */
  return (
    <>
      {isDesktop && (
        <PageLoader
          darkMode={darkMode}
          sidebarWidth={isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}
        />
      )}

      <div
        className={`flex min-h-screen w-full overflow-x-hidden ${
          darkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <Header
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isDesktop={isDesktop}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <motion.div
          className="flex-1 min-h-screen min-w-0 relative"
          animate={{
            marginLeft: isDesktop
              ? isCollapsed
                ? SIDEBAR_WIDTH_COLLAPSED
                : SIDEBAR_WIDTH_EXPANDED
              : 0,
          }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
        >
          <AnimatePresence mode="sync">
            <Routes location={location} key={location.pathname}>
              <Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={["user", "admin", "client", "it"]}>
      <Dashboard darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

<Route
  path="/trucks"
  element={
    <ProtectedRoute allowedRoles={["user", "admin", "client", "it"]}>
      <Trucks darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

<Route
  path="/visitors"
  element={
    <ProtectedRoute allowedRoles={["user", "admin", "client", "it"]}>
      <Visitors darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

<Route
  path="/requests"
  element={
    <ProtectedRoute allowedRoles={["admin", "it"]}>
      <Request darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

<Route
  path="/vehicle-management"
  element={
    <ProtectedRoute allowedRoles={["admin", "client", "it"]}>
      <VehicleManagement darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

<Route
  path="/fleet-monitoring"
  element={
    <ProtectedRoute allowedRoles={["admin", "it"]}>
      <FleetMonitoring darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

              <Route
                path="/branches"
                element={
                  <ProtectedRoute allowedRoles={["it"]}>
                    <Branches darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />
              <Route
  path="/drivers"
  element={
    <ProtectedRoute allowedRoles={["it"]}>
      <Drivers darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

              <Route
                path="/accounts"
                element={
                  <ProtectedRoute allowedRoles={["it"]}>
                    <Accounts darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
  path="/settings"
  element={
    <ProtectedRoute allowedRoles={["user", "admin", "client", "it"]}>
      <Settings darkMode={darkMode} />
    </ProtectedRoute>
  }
/>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>

          <Footer darkMode={darkMode} />
        </motion.div>
      </div>
    </>
  );
}