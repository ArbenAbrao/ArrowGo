import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCog,
  HiOutlineOfficeBuilding,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineMap,
} from "react-icons/hi";
import LogoutModal from "../Components/Modals/LogoutModal";

// Small helper: crossfades text in/out so labels don't just snap away when the
// sidebar collapses/expands. Renders a <div> so it behaves fine as a flex child.
const FadeText = ({ show, children, className = "" }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -6 }}
        transition={{ duration: 0.16 }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Tooltip for the collapsed rail. Renders into document.body via a portal
// instead of as a sibling inside the sidebar, because the sidebar has
// overflow-hidden (needed to clip the background pattern) which was cutting
// tooltips — and even overflowing label text — off right at the sidebar edge.
const RailTooltip = ({ label, children, className = "" }) => {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleEnter = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    setOpen(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
      className={`relative shrink-0 ${className}`}
    >
      {children}
      {createPortal(
        <div
          style={{ position: "fixed", top: coords.top, left: coords.left }}
          className={`z-[9999] -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800
            px-2.5 py-1.5 text-xs font-medium text-white shadow-xl pointer-events-none
            transition-all duration-150
            ${open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`}
        >
          {label}
        </div>,
        document.body
      )}
    </div>
  );
};

function Header({ isCollapsed, setIsCollapsed, isDesktop, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const touchStartX = useRef(0);

  const toggleCollapse = () => setIsCollapsed((v) => !v);

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
      roles: ["user", "admin", "client", "it"],
      group: "main",
    },
    {
      icon: HiOutlineTruck,
      label: "Vehicle In's & Out's",
      path: "/trucks",
      roles: ["user", "admin", "client", "it"],
      group: "main",
    },
    {
      icon: HiOutlineUser,
      label: "Visitors",
      path: "/visitors",
      roles: ["user", "admin", "client", "it"],
      group: "main",
    },
    {
      icon: HiOutlineTruck,
      label: "Vehicle Management",
      path: "/vehicle-management",
      roles: ["admin", "client", "it"],
      group: "main",
    },
    {
      icon: HiOutlineMap,
      label: "Fleet Monitoring",
      path: "/fleet-monitoring",
      roles: ["admin", "it"],
      group: "main",
    },
     {
      icon: HiOutlineClipboardList,
      label: "Requests",
      path: "/requests",
      roles: ["admin", "it"],
      badge: requestCount,
      group: "main",
    },
    {
      icon: HiOutlineOfficeBuilding,
      label: "Branch / Clients",
      path: "/branches",
      roles: ["it"],
      group: "settings",
    },
    {
      icon: HiOutlineUser,
      label: "Drivers / Helpers",
      path: "/drivers",
      roles: ["it"],
      group: "settings",
    },
    {
      icon: HiOutlineUser,
      label: "Accounts",
      path: "/accounts",
      roles: ["it"],
      group: "settings",
    },
    {
      icon: HiOutlineCog,
      label: "Settings",
      path: "/settings",
      roles: ["user", "admin", "client", "it"],
      group: "settings",
    },
  ];

  const mainItems = navItems.filter((i) => i.group === "main" && i.roles.includes(role));
  const settingsItems = navItems.filter((i) => i.group === "settings" && i.roles.includes(role));
  const isSettingsActive = settingsItems.some((i) => i.path === location.pathname);

  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  // keep the accordion open if the user lands on / navigates to a route inside it
  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
  }, [isSettingsActive]);

  const side = isDesktop ? "left" : "right";

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (!mobileOpen && diff < -50) setMobileOpen(true);
    if (mobileOpen && diff > 50) setMobileOpen(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLogoutModalOpen(false);
    navigate("/", { replace: true });
  };

  const avatarGradient =
    user.role === "Admin"
      ? "from-emerald-400 to-emerald-600"
      : user.role === "User"
      ? "from-blue-400 to-blue-600"
      : user.role === "IT"
      ? "from-rose-400 to-rose-600"
      : "from-slate-400 to-slate-600";

  // ---- shared nav item renderer (main list, settings list, and collapsed rail) ----
  const NavItem = ({ item }) => {
    const active = location.pathname === item.path;
    const Icon = item.icon;

    const link = (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`relative flex items-center overflow-hidden rounded-xl transition-all duration-300 ease-in-out outline-none
          focus-visible:ring-2 focus-visible:ring-sky-400/60
          ${isCollapsed ? "h-11 w-11 mx-auto justify-center" : "h-11 px-3 gap-3"}
          ${
            active
              ? darkMode
                ? "bg-white/10 text-white shadow-inner"
                : "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
              : darkMode
              ? "text-slate-400 hover:text-white hover:bg-white/5"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
      >
        {active && (
          <motion.span
            layoutId="active-pill"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className={`absolute ${
              isCollapsed ? "inset-0 rounded-xl" : "left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
            } ${isCollapsed ? "bg-transparent" : "bg-gradient-to-b from-sky-400 to-emerald-400"}`}
          />
        )}

        <Icon className={`relative shrink-0 text-[19px] transition-colors duration-200 ${active ? "text-sky-300" : ""}`} />

        <FadeText show={!isCollapsed} className="relative min-w-0 flex-1 truncate text-[13.5px] font-medium">
          {item.label}
        </FadeText>

        <FadeText
          show={!isCollapsed && item.badge > 0}
          className="relative shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
        >
          {item.badge}
        </FadeText>

        {isCollapsed && item.badge > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
        )}
      </Link>
    );

    if (!isCollapsed) return link;

    return (
      <RailTooltip label={item.badge > 0 ? `${item.label} (${item.badge})` : item.label}>
        {link}
      </RailTooltip>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
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
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={`fixed top-0 z-50 flex h-full flex-col overflow-hidden
              border-white/5 shadow-2xl transition-[width] duration-300 ease-in-out
              ${side === "left" ? "left-0 border-r" : "right-0 border-l"}
              ${darkMode ? "bg-[#0B1220]" : "text-white"}`}
            style={{ width: isCollapsed ? 76 : 248 }}
            onTouchStart={!isDesktop ? handleTouchStart : undefined}
            onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
          >
            {/* Brand background (light/brand mode only) */}
            {!darkMode && (
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(165deg, #0F2547 0%, #0B3B2E 100%)" }}
              />
            )}

            {/* subtle drifting grid — quiet nod to live vehicle/visitor tracking */}
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
              animate={{ backgroundPosition: ["0px 0px", "22px 22px"] }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex h-full flex-col">
              {/* LOGO + TOGGLE */}
              <div className="flex h-16 items-center gap-2 px-4">
                <RailTooltip label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                  <button
                    onClick={toggleCollapse}
                    className="flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-lg transition hover:bg-white/10 active:scale-95
                      focus-visible:ring-2 focus-visible:ring-sky-400/60 outline-none"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    <img src="/logo7.png" alt="Logo" className="h-7 w-7 shrink-0" />
                  </button>
                </RailTooltip>

                <FadeText
                  show={!isCollapsed}
                  className="truncate text-[13px] font-semibold tracking-wide text-white/90"
                >
                  ArrowGo
                </FadeText>

                {isDesktop && !isCollapsed && (
                  <RailTooltip
                    label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="ml-auto"
                  >
                    <button
                      onClick={toggleCollapse}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                        border border-white/10 bg-white/5 text-white/70 transition
                        hover:bg-white/15 hover:text-white active:scale-95
                        focus-visible:ring-2 focus-visible:ring-sky-400/60 outline-none"
                      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                      <motion.span
                        animate={{
                          rotate:
                            side === "left" ? (isCollapsed ? 180 : 0) : isCollapsed ? 0 : 180,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex items-center justify-center text-sm"
                      >
                        <HiOutlineChevronLeft />
                      </motion.span>
                    </button>
                  </RailTooltip>
                )}
              </div>

              {/* PROFILE CARD */}
              <div
                className={`mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm transition-all
                  ${isCollapsed ? "flex justify-center p-2" : "flex items-center gap-3 p-3"}`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br
                      text-sm font-bold text-white ring-2 ring-white/15 ${avatarGradient}`}
                  >
                    {user.firstName?.charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B1220]" />
                </div>

                <FadeText show={!isCollapsed} className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-[11px] text-white/55">
                    {user.role} • {user.branch}
                  </p>
                </FadeText>
              </div>

              {/* NAV */}
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-2">
                {!isCollapsed && (
                  <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
                    Main Menu
                  </p>
                )}

                <div className="flex flex-col gap-0.5">
                  {mainItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                  ))}
                </div>

                {settingsItems.length > 0 && (
                  <>
                    <div className="my-3 border-t border-white/10" />

                    {isCollapsed ? (
                      // Collapsed rail: flat icons, no accordion (no room for labels)
                      <div className="flex flex-col gap-0.5">
                        {settingsItems.map((item) => (
                          <NavItem key={item.path} item={item} />
                        ))}
                      </div>
                    ) : (
                      // Expanded: accordion group
                      <div>
                        <button
                          onClick={() => setSettingsOpen((v) => !v)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition
                            outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60
                            ${
                              isSettingsActive
                                ? "text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <HiOutlineCog className="text-[15px]" />
                          <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-wider">
                            Settings &amp; Account
                          </span>
                          <motion.span
                            animate={{ rotate: settingsOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[13px] text-white/40"
                          >
                            <HiOutlineChevronDown />
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {settingsOpen && (
                            <motion.div
                              key="settings-panel"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 pt-1">
                                {settingsItems.map((item) => (
                                  <NavItem key={item.path} item={item} />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </nav>

              {/* BOTTOM ACTIONS */}
              <div className="border-t border-white/10 px-2.5 py-2.5">
                {(() => {
                  const themeButton = (
                    <button
                      onClick={() => setDarkMode((v) => !v)}
                      className={`flex h-11 w-full items-center rounded-xl text-white/70 outline-none
                        transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white
                        focus-visible:ring-2 focus-visible:ring-sky-400/60
                        ${isCollapsed ? "justify-center" : "gap-3 px-3"}`}
                    >
                      {darkMode ? (
                        <HiOutlineSun className="text-[18px] text-amber-300 shrink-0" />
                      ) : (
                        <HiOutlineMoon className="text-[18px] text-indigo-200 shrink-0" />
                      )}
                      <FadeText show={!isCollapsed} className="text-[13.5px] font-medium">
                        {darkMode ? "Light Mode" : "Dark Mode"}
                      </FadeText>
                    </button>
                  );
                  return isCollapsed ? (
                    <RailTooltip label="Toggle theme">{themeButton}</RailTooltip>
                  ) : (
                    themeButton
                  );
                })()}

                {(() => {
                  const logoutButton = (
                    <button
                      onClick={() => setIsLogoutModalOpen(true)}
                      className={`flex h-11 w-full items-center rounded-xl text-rose-300 outline-none
                        transition-all duration-300 ease-in-out hover:bg-rose-500/15 hover:text-rose-200
                        focus-visible:ring-2 focus-visible:ring-rose-400/60
                        ${isCollapsed ? "justify-center" : "gap-3 px-3"}`}
                    >
                      <HiOutlineLogout className="text-[18px] shrink-0" />
                      <FadeText show={!isCollapsed} className="text-[13.5px] font-medium">
                        Log Out
                      </FadeText>
                    </button>
                  );
                  return isCollapsed ? (
                    <RailTooltip label="Log out">{logoutButton}</RailTooltip>
                  ) : (
                    logoutButton
                  );
                })()}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MOBILE MENU BUTTON */}
      {!isDesktop && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center
            rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg
            transition hover:shadow-xl active:scale-95"
          aria-label="Open menu"
        >
          <HiOutlineMenu className="text-lg" />
        </button>
      )}
      {!isDesktop && mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed top-4 right-4 z-[60] flex h-10 w-10 items-center justify-center
            rounded-xl bg-slate-800 text-white shadow-lg transition active:scale-95"
          aria-label="Close menu"
        >
          <HiOutlineX className="text-lg" />
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