import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Import pages
import Dashboard from "./Pages/Dashboard";
import Trucks from "./Pages/Trucks";
import Visitors from "./Pages/Visitors";
import Appointment from "./Pages/Appointment";

// Wrapper component to detect URL
function LayoutWrapper() {
  const location = useLocation();
  const isAppointmentPage = location.pathname === "/appointment";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const collapseListener = (e) => setIsCollapsed(e.detail);
    window.addEventListener("sidebar-collapse", collapseListener);

    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("sidebar-collapse", collapseListener);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // If appointment page → return page without sidebar/header/footer
  if (isAppointmentPage) {
    return (
      <Routes>
        <Route path="/appointment" element={<Appointment />} />
      </Routes>
    );
  }

  // Normal pages → include header, sidebar layout
  return (
    <>
      <Header />

      <div
        className={`transition-all duration-300 ${
          isDesktop ? (isCollapsed ? "ml-[70px]" : "ml-[240px]") : "ml-0"
        }`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trucks" element={<Trucks />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/appointment" element={<Appointment />} />
        </Routes>

        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}

export default App;
