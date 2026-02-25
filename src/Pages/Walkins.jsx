// src/Pages/Walkins.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/outline";
import axios from "axios";

export default function Walkins({ onAddVisitor }) {
  const [form, setForm] = useState({
    visitorName: "",
    company: "",
    personToVisit: "",
    purpose: "",
    idType: "",
    idNumber: "",
    badgeNumber: "",
    branch: "",
    vehicleMode: "On Foot",
    vehicleDetails: "",
    date: "",
  });

  const [showToast, setShowToast] = useState(false);

  const theme = {
    containerBg: "min-h-screen flex items-center justify-center p-4 sm:p-6 bg-cover bg-center",
    cardBg: "bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md",
    headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
    btnPrimary: "bg-green-600 hover:bg-green-700 text-white",
    inputBg: "bg-gray-100 text-gray-900 border-gray-300",
    neonGlow: "hover:shadow-[0_0_8px_#00ff66] focus:shadow-[0_0_8px_#00ff66]",
  };

  const idTypes = ["PhilHealth ID", "SSS ID", "Driver's License", "TIN ID", "Other"];
  const branches = ["Marilao", "Taguig", "Palawan", "Davao", "Cebu"];
  const badgeNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
  const vehicleModes = ["On Foot", "Truck", "Company Vehicle", "Private Car", "Motorcycle", "Other"];

  const inputVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } };
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      const payload = {
        ...form,
        date: form.date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        timeIn: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timeOut: "",
        appointmentRequest: 1,
      };

      const res = await axios.post(
        "https://tmvasbackend.arrowgo-logistics.com/api/visitors/add",
        payload
      );

      if (onAddVisitor) onAddVisitor(res.data);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);

      setForm({
        visitorName: "",
        company: "",
        personToVisit: "",
        purpose: "",
        idType: "",
        idNumber: "",
        badgeNumber: "",
        branch: "",
        vehicleMode: "On Foot",
        vehicleDetails: "",
        date: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to submit walk-in. Please try again.");
    }
  };

  return (
    <div
      className={theme.containerBg}
      style={{ backgroundImage: "url(/truck1.jpg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={theme.cardBg}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/logo4.png" alt="Logo" className="h-12 sm:h-16 w-auto" />
        </div>

        <h2 className="text-center text-green-800 font-bold text-base sm:text-lg mb-2">
          ArrowGo Logistics Inc.
        </h2>

        <div className="flex items-center gap-2 mb-4 justify-center">
          <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-green-700" />
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Walk-ins</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {["visitorName", "company", "personToVisit", "purpose"].map((name, i) => (
            <motion.input
              key={i}
              type="text"
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={name.replace(/([A-Z])/g, " $1")}
              required={name === "visitorName"}
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.05 }}
            />
          ))}

          {/* ID Type + ID Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              name="idType"
              value={form.idType}
              onChange={handleChange}
              required
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
            >
              <option value="">Select ID Type</option>
              {idTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>

            <input
              type="text"
              name="idNumber"
              value={form.idNumber}
              onChange={handleChange}
              placeholder="ID Number"
              required
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
            />
          </div>

          {/* Branch + Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              required
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
            >
              <option value="">Select Branch</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>

            <select
              name="badgeNumber"
              value={form.badgeNumber}
              onChange={handleChange}
              required
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
            >
              <option value="">Select Badge Number</option>
              {badgeNumbers.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Vehicle Mode + Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              name="vehicleMode"
              value={form.vehicleMode}
              onChange={handleChange}
              className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
            >
              {vehicleModes.map((v) => <option key={v}>{v}</option>)}
            </select>

            {form.vehicleMode !== "On Foot" && (
              <input
                type="text"
                name="vehicleDetails"
                value={form.vehicleDetails}
                onChange={handleChange}
                placeholder="Vehicle Details"
                className={`border p-1.5 sm:p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow} text-sm`}
              />
            )}
          </div>


          <div className="flex justify-end mt-3">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all text-base mb-4"
            >
              Add Walk-In
            </button>
          </div>
        </form>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-medium text-sm"
          >
            Walk-in added successfully! ✅
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}