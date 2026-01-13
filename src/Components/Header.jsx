import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTruck,
  FaUser,
  FaTachometerAlt,
  FaSignOutAlt,
  FaClipboardList,
  FaBars,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import LogoutModal from "../Components/Modals/LogoutModal";

function Header({ isCollapsed, setIsCollapsed, isDesktop, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [hoverLogo, setHoverLogo] = useState(false);
  const touchStartX = useRef(0);

  const toggleCollapse = () => setIsCollapsed((v) => !v);

  // Load request count from localStorage every 3 seconds
  useState(() => {
    const load = () => {
      const r = JSON.parse(localStorage.getItem("pendingRequests")) || [];
      setRequestCount(r.length);
    };
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  });

  const navItems = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/dashboard" },
    { icon: <FaTruck />, label: "Trucks", path: "/trucks" },
    { icon: <FaUser />, label: "Visitors", path: "/visitors" },
    { icon: <FaClipboardList />, label: "Requests", path: "/requests", badge: requestCount },
  ];

  const side = isDesktop ? "left" : "right";

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (!mobileOpen && diff < -50) setMobileOpen(true);
    if (mobileOpen && diff > 50) setMobileOpen(false);
  };

  // ===== LOGOUT FUNCTION =====
    const handleLogoutConfirm = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLogoutModalOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <AnimatePresence>
        {(isDesktop || mobileOpen) && (
          <motion.aside
            initial={{
              x: isDesktop ? (isCollapsed ? -64 : -240) : 240,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { type: "spring", stiffness: 300, damping: 30 },
            }}
            exit={{
              x: isDesktop ? -240 : 240,
              opacity: 0,
              transition: { type: "spring", stiffness: 300, damping: 30 },
            }}
            className={`fixed top-0 z-50 h-full flex flex-col shadow-xl overflow-hidden
              ${darkMode ? "bg-gray-900 text-gray-300" : "text-slate-900"}
              ${side === "left" ? "left-0" : "right-0"}`}
            style={{
              width: isCollapsed ? 64 : 240,
              transition: "width 0.3s ease",
            }}
            onTouchStart={!isDesktop ? handleTouchStart : undefined}
            onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
          >
            {/* Animated Gradient for Light Mode */}
            {!darkMode && (
              <motion.div
                className="absolute inset-0 z-0"
                animate={{ backgroundPosition: ["0% 0%", "0% 100%", "0% 0%"] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "linear-gradient(to bottom, #22c55e, #3b82f6)",
                  backgroundSize: "100% 200%",
                }}
              />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* LOGO ROW */}
              <div
                className="relative flex items-center h-14 px-3"
                onMouseEnter={() => setHoverLogo(true)}
                onMouseLeave={() => setHoverLogo(false)}
              >
                <img
                  src="/logo7.png"
                  alt="Logo"
                  className="w-7 h-7 cursor-pointer"
                  onClick={toggleCollapse}
                />

                {(isDesktop || hoverLogo) && (!isCollapsed || hoverLogo) && (
                  <motion.button
                    onClick={toggleCollapse}
                    className={`absolute w-6 h-6 flex items-center justify-center
                      rounded-md
                      bg-gradient-to-br from-emerald-500/60 to-sky-500/60
                      border border-sky-600/40
                      ${side === "left" ? "right-2" : "left-2"}`}
                  >
                    <motion.span
                      animate={{
                        rotate:
                          side === "left"
                            ? isCollapsed
                              ? 180
                              : 0
                            : isCollapsed
                            ? 0
                            : 180,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-slate-900 text-sm"
                    >
                      ❮
                    </motion.span>
                  </motion.button>
                )}
              </div>

              {/* NAV */}
              <nav className="flex flex-col flex-1 mt-2 text-sm">
                {navItems.map((item, i) => (
                  <div key={i} className="relative">
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center transition
                        ${
                          isCollapsed
                            ? "justify-center py-3"
                            : "px-4 py-3 gap-3 rounded-lg"
                        }
                        ${
                          location.pathname === item.path
                            ? darkMode
                              ? "bg-gradient-to-r from-blue-500/20 to-green-500/20 text-blue-300"
                              : "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-md"
                            : darkMode
                            ? "hover:bg-green-500/10 hover:text-green-300"
                            : "hover:bg-white/25 hover:text-slate-900"
                        }`}
                    >
                      <span className={darkMode ? "text-blue-400" : "text-slate-900"}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </div>
                ))}

                <div className="flex-1" />

                {/* THEME TOGGLE */}
                <button
                  onClick={() => setDarkMode((v) => !v)}
                  className={`flex items-center gap-3 py-3 ${
                    isCollapsed ? "justify-center" : "px-4"
                  } hover:bg-white/25`}
                >
                  {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-white" />}
                  {!isCollapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
                </button>

                {/* LOGOUT */}
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className={`flex items-center py-3 text-red-700 ${
                    isCollapsed ? "justify-center" : "px-4 gap-3"
                  } hover:bg-red-500/20`}
                >
                  <FaSignOutAlt />
                  {!isCollapsed && <span>Log Out</span>}
                </button>
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MOBILE MENU BUTTON */}
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg
            bg-gradient-to-br from-emerald-600 to-sky-600 text-white"
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
