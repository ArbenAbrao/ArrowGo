// src/App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* Components */
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";

/* Pages */
import Welcome from "./Pages/Welcome";
import Dashboard from "./Pages/Dashboard";
import Trucks from "./Pages/Trucks";
import Visitors from "./Pages/Visitors";
import Appointment from "./Pages/Appointment";
import Request from "./Pages/Request";
import TruckRequest from "./Pages/TruckRequest";
import TruckDetails from "./Pages/TruckDetails";

function LayoutWrapper() {
  const location = useLocation();

  const isWelcomePage = location.pathname === "/";
  const isAppointmentPage = location.pathname === "/appointment";
  const isTruckRequestPage = location.pathname === "/truck-request";
  const isTruckDetails = location.pathname.startsWith("/truck-details");

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // -------- DARK MODE STATE --------
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // -------- HANDLE RESIZE --------
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) setIsCollapsed(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // -------- APPLY THEME TO <html> --------
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

  // -------- PAGES WITHOUT SIDEBAR --------
  if (isWelcomePage || isAppointmentPage || isTruckRequestPage || isTruckDetails) {
    return (
      <AnimatePresence exitBeforeEnter>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Welcome />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/truck-request" element={<TruckRequest />} />
          <Route path="/truck-details/:plateNumber" element={<TruckDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // -------- PAGES WITH SIDEBAR --------
  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-800" : "bg-gray-50"
      }`}
    >
      {/* HEADER / SIDEBAR */}
      <Header
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDesktop={isDesktop}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* MAIN CONTENT */}
      <motion.div
        className="flex-1 min-h-screen transition-colors duration-300 relative"
        style={{
          marginLeft: isDesktop ? (isCollapsed ? 70 : 240) : 0,
        }}
        animate={{
          marginLeft: isDesktop ? (isCollapsed ? 70 : 240) : 0,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        }}
      >
        <AnimatePresence exitBeforeEnter>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trucks"
              element={
                <ProtectedRoute>
                  <Trucks darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visitors"
              element={
                <ProtectedRoute>
                  <Visitors darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <Request darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* FOOTER */}
        <Footer darkMode={darkMode} />
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}
