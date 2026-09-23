import { useEffect, useState } from "react";
import axios from "axios";

// Single source of truth for the API base URL.
// Set VITE_API_URL in your .env file (Vite root) so this never
// needs to be edited again when your WSL2/LAN IP changes.
const API_URL = process.env.REACT_APP_API_URL;

export default function useRequestAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/requests/analytics`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch request analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
}