import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCog,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import LogoutModal from "../Components/Modals/LogoutModal";

function Header({ isCollapsed, setIsCollapsed, isDesktop, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [hoverLogo, setHoverLogo] = useState(false);
  const touchStartX = useRef(0);

  const toggleCollapse = () => setIsCollapsed(v => !v);

 const user = JSON.parse(localStorage.getItem("user")) || {};
const role = (user.role || "").trim().toLowerCase();



  // Load request count
  useEffect(() => {
    const load = () => {
      const r = JSON.parse(localStorage.getItem("pendingRequests")) || [];
      setRequestCount(r.length);
    };
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, []);

  const navItems = [
  {
    icon: HiOutlineViewGrid,
    label: "Dashboard",
    path: "/dashboard",
    roles: ["user", "admin", "it"],
    color: "text-white-400",
  },
  {
    icon: HiOutlineTruck,
    label: "Vehicle In's & out's",
    path: "/trucks",
    roles: ["user", "admin", "it"],
    color: "text-white-400",
  },
  {
    icon: HiOutlineUser,
    label: "Visitors",
    path: "/visitors",
    roles: ["user", "admin", "it"],
    color: "text-white-400",
  },
  {
    icon: HiOutlineClipboardList,
    label: "Requests",
    path: "/requests",
    roles: ["admin", "it"],
    badge: requestCount,
    color: "text-white-400",
  },
  {
  icon: HiOutlineTruck,
  label: "Vehicle Management",
  path: "/vehicle-management",
  roles: ["admin", "it"], // 🔐 ONLY Admin & IT
  color: "text-white-400",
},
  {
  icon: HiOutlineOfficeBuilding,
  label: "Branch / Clients",
  path: "/branches",
  roles: ["it"],
  color: "text-white-400",
},
  {
    icon: HiOutlineUser,
    label: "Accounts",
    path: "/accounts",
    roles: ["it"],
    color: "text-white-400",
  },
  {
    icon: HiOutlineCog,
    label: "Settings",
    path: "/settings",
    roles: ["user", "admin", "it"],
    color: "text-white-300",
  },
];


  const side = isDesktop ? "left" : "right";

  const handleTouchStart = e => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = e => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (!mobileOpen && diff < -50) setMobileOpen(true);
    if (mobileOpen && diff > 50) setMobileOpen(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLogoutModalOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(isDesktop || mobileOpen) && (
          <motion.aside
            initial={{ x: isDesktop ? (isCollapsed ? -64 : -240) : 240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isDesktop ? -240 : 240, opacity: 0 }}
            className={`fixed top-0 z-50 h-full flex flex-col shadow-xl overflow-hidden
              ${darkMode ? "bg-gray-900 text-gray-300" : "bg-green-700 text-white"}
              ${side === "left" ? "left-0" : "right-0"}`}
            style={{ width: isCollapsed ? 72 : 240 }}
            onTouchStart={!isDesktop ? handleTouchStart : undefined}
            onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
          >
            {/* Gradient for light mode */}
            {!darkMode && (
              <motion.div
                className="absolute inset-0 z-0"
                style={{
                  background: "linear-gradient(to bottom, #147e3d, #2931c9)",
                  backgroundSize: "100% 100%",
                }}
              />
            )}

            <div className="relative z-10 flex flex-col h-full">
              {/* LOGO + TOGGLE */}
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
                      rounded-md bg-white/20 border border-white/30
                      ${side === "left" ? "right-2" : "left-2"}`}
                  >
                    <motion.span
                      animate={{ rotate: side === "left" ? (isCollapsed ? 180 : 0) : (isCollapsed ? 0 : 180) }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-white text-sm"
                    >
                      ❮
                    </motion.span>
                  </motion.button>
                )}
              </div>

              {/* 🔹 PROFILE CARD */}
{user && (
  <div
    className={`mx-3 mt-2 mb-3 rounded-xl transition-all
      ${darkMode ? "bg-gray-800/70" : "bg-white/20 backdrop-blur"}
      ${
  isCollapsed
    ? "p-2 flex justify-center bg-transparent shadow-none"
    : "p-3 flex items-center gap-3"
}

    `}
  >
    {/* Avatar */}
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center
        text-white font-bold text-lg
        ${
          user.role === "Admin"
            ? "bg-gradient-to-br from-green-400 to-emerald-600"
            : user.role === "User"
            ? "bg-gradient-to-br from-blue-400 to-sky-600"
            : user.role === "IT"
            ? "bg-gradient-to-br from-red-400 to-rose-600"
            : "bg-gray-500"
        }
      `}
    >
      {user.firstName?.charAt(0)} 
    </div>

    {/* Name + Role */}
    {!isCollapsed && (
      <div className="leading-tight">
        <p className="font-semibold text-sm">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs opacity-80">{user.role} • {user.branch}</p>
      </div>
    )}
  </div>
)}

             {/* NAV ITEMS */}
<nav className="flex flex-col flex-1 mt-2 text-sm">

  {/* ===== MAIN MENU LABEL ===== */}
  {!isCollapsed && (
    <div className="flex items-center px-4 py-2 text-xs font-semibold uppercase text-white/70 gap-2">
      <HiOutlineViewGrid className="text-white/50 text-sm" />
      <span>Main Menu</span>
    </div>
  )}

  {/* ===== MAIN MENU ITEMS ===== */}
  {navItems
    .filter(item => item.roles.includes(role) && !["Accounts", "Settings","Branch / Clients"].includes(item.label))
    .map((item, i) => {
      const active = location.pathname === item.path;
      const Icon = item.icon;

      return (
        <div key={i} className="relative group">
          <Link
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center transition
${
  isCollapsed
    ? "h-12 w-full flex items-center justify-center"
    : "px-4 py-3 gap-3 rounded-lg"
}
              ${active
                ? darkMode
                  ? "bg-gradient-to-r from-blue-500/20 to-green-500/20 text-blue-300"
                  : "bg-white/20 shadow-md"
                : darkMode
                  ? "hover:bg-green-500/10"
                  : "hover:bg-white/20"}`}
          >
            <Icon className={`${item.color} text-lg`} />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>

          {/* TOOLTIP ON HOVER */}
          {isCollapsed && (
            <span className="absolute left-full top-1/2 ml-4 -translate-y-1/2
bg-black text-white text-xs px-2 py-1 rounded shadow-lg
opacity-0 group-hover:opacity-100 transition
pointer-events-none whitespace-nowrap z-50"
>
              {item.label}
            </span>
          )}
        </div>
      );
    })}

  {/* ===== DIVIDER ===== */}
  {!isCollapsed && <div className="my-2 border-t border-white/30 mx-4" />}

  {/* ===== SETTINGS & ACCOUNTS LABEL ===== */}
  {!isCollapsed && (
    <div className="flex items-center px-4 py-2 text-xs font-semibold uppercase text-white/70 gap-2">
      <HiOutlineCog className="text-white/50 text-sm" />
      <span>Settings & Account</span>
    </div>
  )}

  {/* ===== SETTINGS & ACCOUNTS ITEMS ===== */}
  {navItems
    .filter(item => item.roles.includes(role) && ["Accounts", "Settings","Branch / Clients"].includes(item.label))
    .map((item, i) => {
      const active = location.pathname === item.path;
      const Icon = item.icon;

      return (
        <div key={i} className="relative group">
          <Link
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center transition
${
  isCollapsed
    ? "h-12 w-full flex items-center justify-center"
    : "px-4 py-3 gap-3 rounded-lg"
}
              ${active
                ? darkMode
                  ? "bg-gradient-to-r from-blue-500/20 to-green-500/20 text-blue-300"
                  : "bg-white/20 shadow-md"
                : darkMode
                  ? "hover:bg-green-500/10"
                  : "hover:bg-white/20"}`}
          >
            <Icon className={`${item.color} text-lg`} />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>

          {/* TOOLTIP ON HOVER */}
          {isCollapsed && (
            <span className="absolute left-full top-1/2 ml-3 -translate-y-1/2
              bg-black text-white text-xs px-2 py-1 rounded
              opacity-0 group-hover:opacity-100 transition
              pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          )}
        </div>
      );
    })}

                {/* ===== BOTTOM ACTIONS ===== */}
<div className="mt-auto pb-2">

  {/* ===== THEME TOGGLE ===== */}
  <div className="relative group">
    <button
      onClick={() => setDarkMode(v => !v)}
      className={`
        w-full h-12
        flex items-center
        ${isCollapsed ? "justify-center" : "px-4 gap-3"}
        hover:bg-white/20
        transition
      `}
    >
      {darkMode ? (
        <HiOutlineSun className="text-yellow-400 text-lg" />
      ) : (
        <HiOutlineMoon className="text-indigo-200 text-lg" />
      )}
      {!isCollapsed && (
        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>

    {/* TOOLTIP */}
    {isCollapsed && (
      <span
        className="
          absolute left-full top-1/2 ml-4 -translate-y-1/2
          bg-black text-white text-xs px-2 py-1 rounded shadow-lg
          opacity-0 group-hover:opacity-100 transition
          pointer-events-none whitespace-nowrap z-50
        "
      >
        Toggle theme
      </span>
    )}
  </div>

  {/* ===== LOGOUT ===== */}
  <div className="relative group">
    <button
      onClick={() => setIsLogoutModalOpen(true)}
      className={`
        w-full h-12
        flex items-center text-red-200
        ${isCollapsed ? "justify-center" : "px-4 gap-3"}
        hover:bg-red-500/20
        transition
      `}
    >
      <HiOutlineLogout className="text-lg" />
      {!isCollapsed && <span>Log Out</span>}
    </button>

    {/* TOOLTIP */}
    {isCollapsed && (
      <span
        className="
          absolute left-full top-1/2 ml-4 -translate-y-1/2
          bg-black text-white text-xs px-2 py-1 rounded shadow-lg
          opacity-0 group-hover:opacity-100 transition
          pointer-events-none whitespace-nowrap z-50
        "
      >
        Log out
      </span>
    )}
  </div>

</div>

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
            bg-gradient-to-br from-blue-600 to-sky-500 text-white"
        >
          <HiOutlineMenu />
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
