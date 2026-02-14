import { useEffect, useState } from "react";
import axios from "axios";

export default function useRequestAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("https://tmvasm.arrowgo-logistics.com/api/requests/analytics");
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
