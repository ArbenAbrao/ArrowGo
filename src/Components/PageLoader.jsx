// src/Components/PageLoader.jsx
import { useLoader } from "../Context/LoaderContext";
import logo from "../assets/arrowgo-logo.png";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_MESSAGES = [
  "ESTABLISHING UPLINK",
  "SYNCING FLEET DATA",
  "VERIFYING ROUTES",
  "LOADING DASHBOARD",
];

export default function PageLoader({ darkMode, sidebarWidth = 250 }) {
  const { loading } = useLoader();
  const [visible, setVisible] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [visible]);

  if (!loading && !visible) return null;

  const accentBlue = "#2563EB";
  const accentGreen = "#059669";
  const bg = darkMode ? "#0f172a" : "#ffffff";
  const textColor = darkMode ? "#e2e8f0" : "#0f172a";
  const mutedColor = darkMode ? "#64748b" : "#94a3b8";
  const gridLine = darkMode ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.05)";

  const overlayStyle = {
    position: "fixed",
    top: 0,
    bottom: 0,
    right: 0,
    left: `${sidebarWidth}px`,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: bg,
    color: textColor,
    transition: "opacity 0.3s ease",
    opacity: loading ? 1 : 0,
    overflow: "hidden",
  };

  return (
    <div style={overlayStyle}>
      {/* faint background grid */}
      <div
        className="loader-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: "42px 42px",
          maskImage:
            "radial-gradient(circle at center, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 0%, transparent 75%)",
        }}
      />

      {/* scan frame with logo */}
      <div className="loader-frame">
        <div
          className="loader-ring"
          style={{ borderColor: accentBlue }}
        />
        <div
          className="loader-ring loader-ring-delay"
          style={{ borderColor: accentGreen }}
        />
        <div
          className="loader-scan-beam"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentBlue}, transparent)`,
          }}
        />

        {["tl", "tr", "bl", "br"].map((corner) => (
          <span
            key={corner}
            className={`loader-corner loader-corner-${corner}`}
            style={{ borderColor: accentBlue }}
          />
        ))}

        <img src={logo} alt="ArrowGo Logo" className="loader-logo" />
      </div>

      {/* wordmark */}
      <h2
        style={{
          margin: 0,
          marginTop: "22px",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          fontSize: "22px",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        ArrowGo <span style={{ color: mutedColor }}>Logistics Inc.</span>
      </h2>

      {/* gate-log style status ticker */}
      <div
        style={{
          marginTop: "10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.5px",
          color: accentBlue,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          minHeight: "16px",
        }}
      >
        <span style={{ color: mutedColor }}>{">"}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={statusIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {STATUS_MESSAGES[statusIndex]}
          </motion.span>
        </AnimatePresence>
        <span className="loader-cursor">_</span>
      </div>

      {/* indeterminate progress bar */}
      <div
        className="loader-progress-track"
        style={{
          backgroundColor: darkMode
            ? "rgba(148,163,184,0.15)"
            : "rgba(15,23,42,0.08)",
        }}
      >
        <div
          className="loader-progress-fill"
          style={{
            background: `linear-gradient(90deg, ${accentBlue}, ${accentGreen})`,
          }}
        />
      </div>

      <style>{`
        .loader-frame {
          position: relative;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader-logo {
          width: 52px;
          height: auto;
          position: relative;
          z-index: 2;
          animation: loader-breathe 2.2s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(37,99,235,0.35));
        }

        .loader-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1.5px solid;
          opacity: 0.6;
          animation: loader-ring-pulse 2s ease-out infinite;
        }

        .loader-ring-delay {
          animation-delay: 1s;
        }

        .loader-scan-beam {
          position: absolute;
          top: 0;
          left: 6px;
          right: 6px;
          height: 2px;
          opacity: 0.8;
          animation: loader-scan 2.4s linear infinite;
        }

        .loader-corner {
          position: absolute;
          width: 14px;
          height: 14px;
          opacity: 0.85;
          animation: loader-corner-pulse 2.2s ease-in-out infinite;
        }
        .loader-corner-tl {
          top: -6px;
          left: -6px;
          border-top: 2px solid;
          border-left: 2px solid;
        }
        .loader-corner-tr {
          top: -6px;
          right: -6px;
          border-top: 2px solid;
          border-right: 2px solid;
        }
        .loader-corner-bl {
          bottom: -6px;
          left: -6px;
          border-bottom: 2px solid;
          border-left: 2px solid;
        }
        .loader-corner-br {
          bottom: -6px;
          right: -6px;
          border-bottom: 2px solid;
          border-right: 2px solid;
        }

        .loader-progress-track {
          margin-top: 20px;
          width: 220px;
          height: 3px;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }

        .loader-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          border-radius: 999px;
          animation: loader-sweep 1.6s ease-in-out infinite;
        }

        .loader-cursor {
          animation: loader-blink 1s steps(1) infinite;
        }

        @keyframes loader-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }

        @keyframes loader-ring-pulse {
          0% { transform: scale(0.75); opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes loader-scan {
          0% { top: 4px; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 92px; opacity: 0; }
        }

        @keyframes loader-corner-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @keyframes loader-sweep {
          0% { left: -40%; }
          100% { left: 100%; }
        }

        @keyframes loader-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-logo,
          .loader-ring,
          .loader-scan-beam,
          .loader-corner,
          .loader-progress-fill,
          .loader-cursor {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}