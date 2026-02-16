// src/Components/Request/useRequests.js
import { useState, useEffect } from "react";
import axios from "axios";

export default function useRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedBulk, setSelectedBulk] = useState([]);

  const loadRequests = async () => {
    try {
      const resTruck = await axios.get("http://192.168.100.206:5000/api/truck-requests");
      const resAppointment = await axios.get("http://192.168.100.206:5000/api/appointment-requests");

      const formattedTruck = resTruck.data.map(r => ({
        id: r.id,
        type: "truck",
        data: {
          plateNumber: r.plate_number,
          truckType: r.truck_type,
          clientName: r.client_name,
          brandName: r.brand_name,
          model: r.model,
          fuelType: r.fuel_type,
          displacement: r.displacement,
          payloadCapacity: r.payload_capacity,
          branchRegistered: r.branch,
        },
        timestamp: r.created_at,
      }));

      const formattedAppointments = resAppointment.data.map(r => ({
        id: r.id,
        type: "appointment",
        data: {
          visitorName: r.visitor_name,
          company: r.company,
          personToVisit: r.person_to_visit,
          purpose: r.purpose,
          date: r.date,
          scheduleTime: r.schedule_time,
          branch: r.branch,
        },
        timestamp: r.created_at,
      }));

      setRequests([...formattedTruck, ...formattedAppointments]);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  /* ================= APPROVE ================= */
  const approve = async (req) => {
    try {
      if (req.type === "truck") {
        await axios.put(`http://192.168.100.206:5000/api/truck-requests/${req.id}/approve`);
        await axios.post("http://192.168.100.206:5000/api/register-truck", req.data);
      }

      if (req.type === "appointment") {
        // ✅ ONLY approve appointment
        await axios.put(`http://192.168.100.206:5000/api/appointment-requests/${req.id}/approve`);
        // ❌ NO visitors insert here anymore
      }

      setRequests(prev => prev.filter(r => r.id !== req.id));
      setSelectedBulk(prev => prev.filter(id => id !== req.id));
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    }
  };

  /* ================= REJECT ================= */
  const reject = async (id, type) => {
    try {
      if (type === "truck") {
        await axios.put(`http://192.168.100.206:5000/api/truck-requests/${id}/reject`);
      } else {
        await axios.put(`http://192.168.100.206:5000/api/appointment-requests/${id}/reject`);
      }
      loadRequests();
    } catch (err) {
      console.error(err);
      alert("Rejection failed");
    }
  };

  /* ================= BULK APPROVE ================= */
  const bulkApprove = async () => {
    for (let id of selectedBulk) {
      const req = requests.find(r => r.id === id);
      if (req) await approve(req);
    }
    setSelectedBulk([]);
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    requests,
    selectedBulk,
    setSelectedBulk,
    approve,
    reject,
    bulkApprove,
  };
}
