import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { LoaderProvider } from "./Context/LoaderContext"; // ✅ LoaderContext
import { ToastProvider } from "./Context/ToastContext";   // ✅ ToastContext

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LoaderProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LoaderProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
