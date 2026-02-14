import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TruckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";

const API = "https://tmvasm.arrowgo-logistics.com/api";

export default function RegisterTruckModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  darkMode = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg:
          "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
        btnSecondary: "border text-gray-100 hover:bg-gray-700",
        inputBg: "bg-gray-800 text-gray-100 border-gray-700",
        dropdownBg: "bg-gray-800 text-gray-100 border border-gray-700",
        dropdownHover: "hover:bg-green-400/30",
        neonGlow:
          "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66] focus:outline-none",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg:
          "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        dropdownBg: "bg-white text-gray-900 border border-gray-200",
        dropdownHover: "hover:bg-indigo-50",
        neonGlow:
          "focus:ring-2 focus:ring-indigo-400 focus:outline-none",
      };

  const truckOptions = [
    "2-Wheel Motorcycle",
    "3-Wheel Motorcycle (Tricycle)",
    "Big Bike",
    "Sedan",
    "SUV",
    "Van",
    "Pickup Truck",
    "4-Wheel Truck",
    "Closed Van",
    "6-Wheel Truck",
    "8-Wheel Truck",
    "10-Wheel Truck",
    "12-Wheel Truck",
    "Trailer Truck",
    "Semi-Trailer",
    "Low Bed Trailer",
    "Flatbed Trailer",
    "Container Truck",
    "Wing Van",
    "Dump Truck",
    "Refrigerated Truck (Reefer)",
    "Tanker Truck",
    "Cement Mixer Truck",
    "Car Carrier Truck",
    "Heavy Equipment Transporter",
    "Shuttle Van",
  ];

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches`);
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async (branchId) => {
    if (!branchId) return setClients([]);
    try {
      const res = await axios.get(`${API}/branch-clients`);
      const filtered = res.data.filter(
        (c) => c.branch_id === parseInt(branchId)
      );
      setClients(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchClients(form.branchRegisteredId);
    onChange({ target: { name: "clientName", value: "" } });
    // eslint-disable-next-line
  }, [form.branchRegisteredId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-5xl h-[95vh] overflow-y-auto rounded-2xl shadow-2xl ${theme.modalBg}`}
            >
              {/* Header */}
              <div className={`flex items-center gap-2 p-5 ${theme.headerBg}`}>
                <TruckIcon className="w-6 h-6" />
                <h2 className="text-xl font-semibold">
                  Register Vehicle
                </h2>
                <button onClick={onClose} className="ml-auto text-lg">
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Branch + Client */}
                <motion.div
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {/* Branch */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === "branch" ? null : "branch"
                        )
                      }
                      className={`w-full border p-3 rounded-lg text-left ${theme.inputBg} ${theme.neonGlow} flex justify-between items-center text-sm sm:text-base`}
                    >
                      {form.branchRegistered || "Select Branch Registered"}
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${
                          dropdownOpen === "branch" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen === "branch" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute z-50 w-full mt-2 rounded-lg p-2 max-h-60 overflow-y-auto ${theme.dropdownBg}`}
                        >
                          {branches.map((branch) => (
                            <div
                              key={branch.id}
                              className={`px-3 py-2 rounded cursor-pointer text-sm sm:text-base ${theme.dropdownHover}`}
                              onClick={() => {
                                onChange({
                                  target: {
                                    name: "branchRegistered",
                                    value: branch.name,
                                  },
                                });
                                onChange({
                                  target: {
                                    name: "branchRegisteredId",
                                    value: branch.id,
                                  },
                                });
                                setDropdownOpen(null);
                              }}
                            >
                              {branch.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Client */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === "client" ? null : "client"
                        )
                      }
                      className={`w-full border p-3 rounded-lg text-left ${theme.inputBg} ${theme.neonGlow} flex justify-between items-center text-sm sm:text-base`}
                    >
                      {form.clientName || "Select Client"}
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${
                          dropdownOpen === "client" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen === "client" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute z-50 w-full mt-2 rounded-lg p-2 max-h-60 overflow-y-auto ${theme.dropdownBg}`}
                        >
                          {clients.map((c) => (
                            <div
                              key={c.id}
                              className={`px-3 py-2 rounded cursor-pointer text-sm sm:text-base ${theme.dropdownHover}`}
                              onClick={() => {
                                onChange({
                                  target: {
                                    name: "clientName",
                                    value: c.name,
                                  },
                                });
                                setDropdownOpen(null);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Vehicle Type + Plate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <motion.div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === "truckType" ? null : "truckType"
                        )
                      }
                      className={`w-full border p-3 rounded-lg text-left ${theme.inputBg} ${theme.neonGlow} flex justify-between items-center text-sm sm:text-base`}
                    >
                      {form.truckType || "Select Vehicle Type"}
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${
                          dropdownOpen === "truckType" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen === "truckType" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute z-50 w-full mt-2 rounded-lg p-3 max-h-60 overflow-y-auto flex flex-wrap gap-2 ${theme.dropdownBg}`}
                        >
                          {truckOptions.map((type, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded cursor-pointer text-sm sm:text-base ${theme.dropdownHover}`}
                              onClick={() => {
                                onChange({
                                  target: { name: "truckType", value: type },
                                });
                                setDropdownOpen(null);
                              }}
                            >
                              {type}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <input
                    name="plateNumber"
                    value={form.plateNumber}
                    onChange={onChange}
                    placeholder="Plate Number"
                    required
                    className={`border p-3 w-full rounded-lg ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
                  />
                </div>

                {/* Brand + Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    name="brandName"
                    value={form.brandName}
                    onChange={onChange}
                    placeholder="Brand (e.g. Isuzu)"
                    className={`border p-3 rounded-lg ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
                  />
                  <input
                    name="model"
                    value={form.model}
                    onChange={onChange}
                    placeholder="Model"
                    className={`border p-3 rounded-lg ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
                  />
                </div>

                {/* Fuel + Displacement */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {/* Fuel Type Dropdown */}
  <div className="relative">
    <button
      type="button"
      onClick={() =>
        setDropdownOpen(
          dropdownOpen === "fuelType" ? null : "fuelType"
        )
      }
      className={`w-full border p-3 rounded-lg text-left ${theme.inputBg} ${theme.neonGlow} flex justify-between items-center text-sm sm:text-base`}
    >
      {form.fuelType || "Select Fuel Type"}
      <ChevronDownIcon
        className={`w-5 h-5 transition-transform ${
          dropdownOpen === "fuelType" ? "rotate-180" : ""
        }`}
      />
    </button>

    <AnimatePresence>
      {dropdownOpen === "fuelType" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`absolute z-50 w-full mt-2 rounded-lg p-2 max-h-60 overflow-y-auto ${theme.dropdownBg}`}
        >
          {["Diesel", "Gasoline", "Electric Vehicle"].map((fuel) => (
            <div
              key={fuel}
              className={`px-3 py-2 rounded cursor-pointer text-sm sm:text-base ${theme.dropdownHover}`}
              onClick={() => {
                onChange({
                  target: { name: "fuelType", value: fuel },
                });
                setDropdownOpen(null);
              }}
            >
              {fuel}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* Displacement */}
  <input
    name="displacement"
    value={form.displacement}
    onChange={onChange}
    placeholder="Displacement (e.g. 3.0L)"
    className={`border p-3 rounded-lg ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
  />
</div>


                {/* Payload */}
                <input
                  name="payloadCapacity"
                  value={form.payloadCapacity}
                  onChange={onChange}
                  placeholder="Payload Capacity (e.g. 10 Tons)"
                  className={`border p-3 w-full rounded-lg ${theme.inputBg} ${theme.neonGlow} text-sm sm:text-base`}
                />

                {/* QR Code */}
                {form.plateNumber && (
                  <div className="flex flex-col items-center mt-6">
                    <QRCodeCanvas
                      value={`http://localhost:3000/truck/${form.plateNumber}`}
                      size={180}
                    />
                    <p className="mt-3 text-sm opacity-70">
                      Scan to view truck details
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-5 py-2 rounded-lg ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-lg ${theme.btnPrimary}`}
                  >
                    Register
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl text-sm sm:text-base"
          >
            Truck registered successfully 🚚
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
