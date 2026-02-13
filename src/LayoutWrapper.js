// src/LayoutWrapper.js
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useLoader } from "./Context/LoaderContext";

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
import Accounts from "./Pages/Accounts";
import TruckRequest from "./Pages/TruckRequest";
import TruckDetails from "./Pages/TruckDetails";
import Settings from "./Pages/Settings";
import Branches from "./Pages/Branches";
import VehicleManagement from "./Pages/VehicleManagement";

export default function LayoutWrapper() {
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
    location.pathname.startsWith("/truck-details");

  /* ===============================
     HANDLE WINDOW RESIZE
  =============================== */
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);

      if (!desktop) {
        setIsCollapsed(false);
      }
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
    if (!isDesktop) return; // ❌ No loader on small screens

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);

    return () => clearTimeout(timer);
  }, [location.pathname, setLoading, isDesktop]);

  /* ===============================
     SPECIAL PUBLIC PAGES
  =============================== */
  if (isSpecialPage) {
    return (
      <>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Welcome />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/truck-request" element={<TruckRequest />} />
            <Route
              path="/truck-details/:plateNumber"
              element={<TruckDetails />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </>
    );
  }

  /* ===============================
     MAIN LAYOUT
  =============================== */
  return (
    <>
      <div
        className={`flex min-h-screen ${
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
          className="flex-1 min-h-screen relative"
          animate={{
            marginLeft: isDesktop ? (isCollapsed ? 70 : 240) : 0,
          }}
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["User", "Admin", "IT"]}>
                    <Dashboard darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/trucks"
                element={
                  <ProtectedRoute allowedRoles={["User", "Admin", "IT"]}>
                    <Trucks darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/visitors"
                element={
                  <ProtectedRoute allowedRoles={["User", "Admin", "IT"]}>
                    <Visitors darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/requests"
                element={
                  <ProtectedRoute allowedRoles={["Admin", "IT"]}>
                    <Request darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vehicle-management"
                element={
                  <ProtectedRoute allowedRoles={["Admin", "IT"]}>
                    <VehicleManagement darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/branches"
                element={
                  <ProtectedRoute allowedRoles={["IT"]}>
                    <Branches darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/accounts"
                element={
                  <ProtectedRoute allowedRoles={["IT"]}>
                    <Accounts darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["User", "Admin", "IT"]}>
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
