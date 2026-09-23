import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeaderSec({ isScrolled, onLoginClick }) {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 w-full z-50"
    >
      <motion.div
        animate={{
          backgroundColor: isScrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
          boxShadow: isScrolled
            ? "0 1px 0 rgba(15,23,42,0.08), 0 8px 24px -12px rgba(15,23,42,0.15)"
            : "0 0 0 rgba(0,0,0,0)",
          backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4"
      >
        {/* Logo — crossfades instead of hard-swapping src */}
        <div className="relative h-16 sm:h-20 md:h-24 lg:h-28 xl:h-28 flex items-center">
          <AnimatePresence mode="wait">
            <motion.img
              key={isScrolled ? "dark" : "white"}
              src={isScrolled ? "/logo9.png" : "/logo9-white.png"}
              alt="Arrowgo Logistics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="h-full w-auto object-contain"
            />
          </AnimatePresence>
        </div>

        {/* LOGIN button */}
        <motion.button
          onClick={onLoginClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            backgroundColor: isScrolled ? "#2563EB" : "#FFFFFF",
            color: isScrolled ? "#FFFFFF" : "#0B1220",
          }}
          transition={{ duration: 0.4 }}
          className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold text-sm sm:text-base"
        >
          Login
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </motion.button>
      </motion.div>
    </motion.header>
  );
}