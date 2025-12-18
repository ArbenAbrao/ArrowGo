import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import ProtectedRoute from "./Components/ProtectedRoute";

import Welcome from "./Pages/Welcome";
import Dashboard from "./Pages/Dashboard";
import Trucks from "./Pages/Trucks";
import Visitors from "./Pages/Visitors";
import Appointment from "./Pages/Appointment";

function LayoutWrapper() {
  const location = useLocation();
  const isWelcomePage = location.pathname === "/";
  const isAppointmentPage = location.pathname === "/appointment";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pages without sidebar
  if (isWelcomePage || isAppointmentPage) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Pages with sidebar
  return (
    <>
      {/* Sidebar / Header */}
      <Header
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDesktop={isDesktop}
      />

      {/* Main content */}
      <div className="min-h-screen bg-gray-50">
  <motion.div
    layout
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    style={{ marginLeft: isDesktop ? (isCollapsed ? 70 : 240) : 0 }}
  >
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trucks" element={<ProtectedRoute><Trucks /></ProtectedRoute>} />
          <Route path="/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Footer />
      </motion.div>
    </AnimatePresence>
  </motion.div>
</div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}
