// src/Components/PageLoader.jsx
import { useLoader } from "../Context/LoaderContext";
import logo from "../assets/arrowgo-logo.png";
import { useEffect, useState } from "react";


 export default function PageLoader({ darkMode, sidebarWidth = 250 }) {
  const { loading } = useLoader();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!loading && !visible) return null;


  
  const overlayStyle = {
    position: "fixed",
    top: 0,
    bottom: 0,
    right: 0,
    left: `${sidebarWidth}px`, // dynamic width
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: darkMode ? "#0f172a" : "#ffffff",
    color: darkMode ? "#d1d5db" : "#111827",
    transition: "opacity 0.3s ease",
    opacity: loading ? 1 : 0,
  };
  

  return (
    <div style={overlayStyle}>
      {/* Logo */}
      <img
        src={logo}
        alt="ArrowGo Logo"
        style={{
          width: "110px",
          marginBottom: "18px",
          animation: "fadeIn 0.6s ease",
        }}
      />

      {/* Labels */}
      <h2
        style={{
          margin: 0,
          fontWeight: "600",
          fontSize: "20px",
          letterSpacing: "0.5px",
        }}
      >
        ArrowGo-Logistics Inc.
      </h2>

      <p
        style={{
          marginTop: "6px",
          opacity: 0.7,
          fontSize: "14px",
        }}
      >
        Loading, please wait...
      </p>

      {/* Car Loader */}
      <div className="car-container">
        <div className="car">
          <div className="window"></div>
          <div className="cargo-details"></div>
          <div className="door"></div>
          <div className="lights"></div>
        </div>
        <div className="wheels wheels1"></div>
        <div className="wheels wheels2"></div>
        <div className="street"></div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .car-container {
          position: relative;
          width: 110px;
          height: 110px;
          margin-top: 25px;
        }

        .car {
          position: absolute;
          width: 48px;
          height: 28px;
          left: 20px;
          top: 40px;
          background-color: ${darkMode ? "#3b82f6" : "#1f4fd8"};
          border-top: 2px solid ${darkMode ? "#2563eb" : "#1740a5"};
          animation: bounce 0.4s infinite;
          box-shadow: ${
            darkMode
              ? "0 0 18px rgba(59,130,246,0.6)"
              : "0 4px 10px rgba(0,0,0,0.08)"
          };
          border-radius: 4px;
        }

        @keyframes bounce {
          0% { top: 40px; }
          50% { top: 38px; }
        }

        .car::before {
          content: "";
          position: absolute;
          width: 70px;
          height: 4px;
          background-color: ${darkMode ? "#1e293b" : "rgb(46,46,81)"};
          bottom: -2px;
        }

        .car::after {
          content: "";
          position: absolute;
          width: 20px;
          height: 22px;
          right: -20px;
          bottom: 2px;
          background-color: #e5e5e5;
          clip-path: polygon(0% 0%, 50% 0, 100% 60%, 100% 100%, 0% 100%);
        }

        .window {
          position: absolute;
          width: 12px;
          height: 8px;
          right: -16px;
          top: 6px;
          background-color: #7ebfe2;
          clip-path: polygon(0% 0%, 40% 0, 100% 100%, 0% 100%);
        }

        .wheels {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #bcbcbc;
          border: 2px solid #040404;
          bottom: 30px;
          left: 30px;
          animation: rotation 0.3s linear infinite;
        }

        .wheels2 { left: 75px; }

        @keyframes rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cargo-details {
          position: absolute;
          width: 44px;
          height: 4px;
          background-color: #6cc24a;
          left: 4px;
          top: 3px;
          box-shadow:
            0px 7px #6cc24a,
            0px 14px #6cc24a,
            0px 21px #6cc24a;
        }

        .door {
          position: absolute;
          width: 2px;
          height: 2px;
          background-color: black;
          right: -7px;
          bottom: 12px;
        }

        .lights {
          position: absolute;
          width: 3px;
          height: 6px;
          background-color: #ffedbf;
          right: -20px;
          bottom: 0;
          animation: lighting1 1.5s infinite ease-in-out;
        }

        @keyframes lighting1 {
          0% { background-color: #ffedbf; }
          50% { background-color: #ffc800; }
        }

        .street {
          position: absolute;
          height: 2px;
          width: 18px;
          background-color: ${darkMode ? "#64748b" : "black"};
          bottom: 30px;
          left: 0;
          box-shadow: 22px 0, 44px 0, 66px 0, 88px 0;
          animation: motion 2s linear infinite;
        }

        @keyframes motion {
          from { left: 0; }
          to { left: -110px; }
        }
      `}</style>
    </div>
  );
}
