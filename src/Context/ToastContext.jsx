import { createContext, useContext, useState } from "react";
import Toast from "../Components/Toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, type, message });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 🔥 GLOBAL TOAST */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
      />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
