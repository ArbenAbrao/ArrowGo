import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

function Header() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    window.dispatchEvent(
      new CustomEvent("sidebar-collapse", { detail: newState })
    );
  };

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isDesktop || mobileOpen) && (
          <motion.aside
            initial={{ x: mobileOpen ? "-100%" : 0 }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25 }}
            className={`fixed top-0 left-0 h-full z-50 bg-green-600 border-r border-green-700/30 flex flex-col py-6 transition-all duration-300 ${
              isCollapsed ? "w-[70px]" : "w-[240px]"
            }`}
          >
            {isDesktop && (
              <button
                onClick={toggleCollapse}
                className="absolute top-4 right-4 text-white hover:text-green-200 text-xl"
              >
                <i
                  className={`fas ${
                    isCollapsed ? "fa-chevron-right" : "fa-chevron-left"
                  }`}
                ></i>
              </button>
            )}

            <div className="px-4 mb-10 mt-4">
              {!isCollapsed ? (
                <h1 className="text-xl font-bold text-white whitespace-nowrap">
                  ArrowGo Logistics Inc.
                </h1>
              ) : (
                <h1 className="text-2xl font-bold text-white text-center">AG</h1>
              )}
            </div>

            <nav className="flex flex-col mt-4 space-y-6 text-gray-100">
              {[
                { icon: "fa-tachometer-alt", label: "Dashboard", path: "/dashboard" },
                { icon: "fa-truck", label: "Trucks", path: "/trucks" },
                { icon: "fa-user", label: "Visitors", path: "/visitors" },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.path}
                  className="flex items-center gap-4 px-5 hover:text-green-200 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <i className={`fas ${item.icon} text-xl`}></i>
                  {!isCollapsed && <span className="text-lg">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-5 left-5 text-gray-100 hover:text-green-200 text-3xl z-50"
        >
          <i className="fas fa-bars"></i>
        </button>
      )}
    </>
  );
}

export default Header;
