import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";

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


function LayoutWrapper() {
  const location = useLocation();

  const isWelcomePage = location.pathname === "/";
  const isAppointmentPage = location.pathname === "/appointment";
  const isTruckRequestPage = location.pathname === "/truck-request";


  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) setIsCollapsed(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

// 🚫 Pages WITHOUT sidebar
  if (isWelcomePage || isAppointmentPage || isTruckRequestPage) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/truck-request" element={<TruckRequest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ✅ Pages WITH sidebar
  return (
    <div className="flex min-h-screen">
      <Header
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDesktop={isDesktop}
      />

      <div
        className="flex-1 bg-gray-50 min-h-screen"
        style={{ marginLeft: isDesktop ? (isCollapsed ? 70 : 240) : 0 }}
      >
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trucks"
            element={
              <ProtectedRoute>
                <Trucks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitors"
            element={
              <ProtectedRoute>
                <Visitors />
              </ProtectedRoute>
            }
          />
            <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Request />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </div>
  );
}

/* ✅ DEFAULT EXPORT (THIS FIXES THE MAIN ERROR) */
export default function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}
