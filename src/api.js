// src/api.js
// Uses REACT_APP_API_URL from .env.development / .env.production,
// and falls back to the live backend if nothing is set.
const DEFAULT_API = "https://vmvas-backend.arrowgo-logistics.com";

// strip any trailing slashes so `${API_BASE}/api/...` never becomes "//api/..."
export const API_BASE = (process.env.REACT_APP_API_URL || DEFAULT_API).replace(/\/+$/, "");