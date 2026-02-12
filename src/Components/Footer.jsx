import { motion } from "framer-motion";

function Footer({ darkMode }) {
  return (
    <footer className="relative z-10">
      {/* Animated Green Gradient for Light Mode */}
      {!darkMode && (
        <motion.div
          className="absolute inset-0 z-0"
          animate={{
            backgroundPosition: ["0% 0%", "0% 100%", "0% 0%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background: "linear-gradient(to bottom, #2931c9, #2931c9)",
            backgroundSize: "100% 200%",
          }}
        />
      )}

      <div
        className={`relative z-10 py-2 border-t shadow-sm ${
          darkMode
            ? "bg-gray-900 text-gray-300 border-gray-700"
            : "text-white border-green-300/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 text-center text-xs sm:text-sm">
          © {new Date().getFullYear()}{" "}
          <span
            className={`font-semibold ${
              darkMode ? "text-gray-100" : "text-white"
            }`}
          >
            Arrowgo-Logistics Inc.
          </span>
          . All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
