import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTruck,
  FaUser,
  FaTachometerAlt,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import LogoutModal from "../Components/Modals/LogoutModal";

function Header({ isCollapsed, setIsCollapsed, isDesktop }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const toggleCollapse = () => {
    if (isDesktop) setIsCollapsed(!isCollapsed);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLogoutModalOpen(false);
    navigate("/", { replace: true });
  };

  const navItems = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/dashboard" },
    { icon: <FaTruck />, label: "Trucks", path: "/trucks" },
    { icon: <FaUser />, label: "Visitors", path: "/visitors" },
    { icon: <FaClipboardList />, label: "Requests", path: "/requests" }, // ✅ Request.jsx
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isDesktop || mobileOpen) && (
          <motion.aside
            initial={{ x: isDesktop ? 0 : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full z-50 bg-green-600 flex flex-col py-10 shadow-lg"
            style={{ width: isCollapsed ? 70 : 240 }}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              {isCollapsed ? (
                <img src="/logo7.png" alt="Logo" className="w-10 h-10" />
              ) : (
                <img
                  src="/logo5-white.png"
                  alt="Logo"
                  className="w-32 h-auto"
                />
              )}

              {isDesktop && (
                <button
                  onClick={toggleCollapse}
                  className="mt-4 w-12 h-6 bg-white/20 rounded-full relative"
                >
                  <span
                    className="absolute top-1 left-1 w-4 h-4 bg-green-600 rounded-full transition-all"
                    style={{ transform: isCollapsed ? "translateX(24px)" : "" }}
                  />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 text-white flex-1 mt-6">
              {navItems.map((item, i) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={i}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center transition-all
                      ${isCollapsed ? "justify-center py-3" : "px-5 py-3 gap-4"}
                      ${active ? "bg-green-700" : "hover:bg-green-700/60"}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}

              <div className="flex-1" />

              {/* Logout */}
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className={`flex items-center hover:bg-green-700/60 transition-all
                  ${isCollapsed ? "justify-center py-3" : "px-5 py-3 gap-4"}`}
              >
                <FaSignOutAlt className="text-xl" />
                {!isCollapsed && <span>Log Out</span>}
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Menu Button */}
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-5 left-5 z-50 text-3xl text-white"
        >
          <FaBars />
        </button>
      )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

export default Header;
