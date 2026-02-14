import React, { useState, Fragment, useEffect } from "react";
import { TruckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import axios from "axios";

const API = "https://tmvasbackend.arrowgo-logistics.com/api"; // your backend

export default function TruckRequest() {
  const [form, setForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
    brandName: "",
    model: "",
    fuelType: "",
    displacement: "",
    payloadCapacity: "",
    branch: "",
    branchId: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);

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

  const fuelOptions = ["Diesel", "Electric", "Gasoline"];

  // ================= FETCH BRANCHES & CLIENTS =================
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
      const filtered = res.data.filter((c) => c.branch_id === parseInt(branchId));
      setClients(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchClients(form.branchId);
    setForm((prev) => ({ ...prev, clientName: "" }));
  }, [form.branchId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/truck-requests", form);
      setIsSubmitted(true);
      setForm({
        plateNumber: "",
        truckType: "",
        clientName: "",
        brandName: "",
        model: "",
        fuelType: "",
        displacement: "",
        payloadCapacity: "",
        branch: "",
        branchId: "",
      });
    } catch (err) {
      alert("Failed to submit request");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderInput = (name, type = "text") => (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required
        placeholder=" "
        className="peer w-full border-b-2 py-2 text-gray-800 outline-none focus:border-green-600 bg-transparent transition-colors"
      />
      <label className="absolute left-0 text-gray-500 text-sm pointer-events-none transition-all duration-300 ease-out
        peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
        peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm">
        {name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}
      </label>
    </div>
  );

  const renderSelect = (name, options) => (
    <div className="relative">
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        required
        className="peer w-full border-b-2 py-2 text-gray-800 outline-none focus:border-green-600 bg-transparent appearance-none transition-colors"
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <label className="absolute left-0 text-gray-500 text-sm pointer-events-none transition-all duration-300 ease-out
        peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
        peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm">
        {name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}
      </label>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
    </div>
  );

  // ================= Branch Dropdown =================
  const renderBranchDropdown = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(dropdownOpen === "branch" ? null : "branch")}
        className="w-full border-b-2 py-2 text-gray-800 outline-none focus:border-green-600 bg-transparent flex justify-between items-center"
      >
        {form.branch || "Select Branch"}
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${dropdownOpen === "branch" ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {dropdownOpen === "branch" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-auto"
          >
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setForm({ ...form, branch: b.name, branchId: b.id, clientName: "" });
                  setDropdownOpen(null);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-green-100"
              >
                {b.name}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ================= Client Dropdown =================
  const renderClientDropdown = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(dropdownOpen === "client" ? null : "client")}
        className="w-full border-b-2 py-2 text-gray-800 outline-none focus:border-green-600 bg-transparent flex justify-between items-center"
      >
        {form.clientName || "Select Client"}
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${dropdownOpen === "client" ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {dropdownOpen === "client" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-auto"
          >
            {clients.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setForm({ ...form, clientName: c.name });
                  setDropdownOpen(null);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-green-100"
              >
                {c.name}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col relative pb-24"
      style={{
        backgroundImage: "url('/Truck1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <motion.div
        className="relative z-10 flex-1 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="bg-white bg-opacity-95 shadow-2xl rounded-3xl p-6 w-full max-w-3xl transform hover:scale-105 transition-transform duration-300"
          variants={itemVariants}
        >
          {/* Logo & Header */}
          <div className="flex justify-center mb-2">
            <img src="/logo4.png" alt="Logo" className="h-14 w-14" />
          </div>
          <h2 className="text-center text-green-800 font-bold text-lg mb-3">
            ArrowGo Logistics Inc.
          </h2>
          <div className="flex items-center gap-2 mb-5 justify-center">
            <TruckIcon className="w-8 h-8 text-green-700" />
            <h1 className="text-xl font-semibold text-gray-800">
              Truck Registration Request
            </h1>
          </div>

          {/* Form */}
          <motion.form
  onSubmit={handleSubmit}
  className="space-y-6"
  variants={containerVariants}
>
  {/* Row 1: Branch + Client */}
  <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={itemVariants}>
    {renderBranchDropdown()}
    {renderClientDropdown()}
  </motion.div>

  {/* Row 2: Plate Number + Truck Type */}
  <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={itemVariants}>
    {renderInput("plateNumber")}
    {renderSelect("truckType", truckOptions)}
  </motion.div>

  {/* Row 3: Brand Name + Model */}
  <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={itemVariants}>
    {renderInput("brandName")}
    {renderInput("model")}
  </motion.div>

  {/* Row 4: Displacement + Payload */}
  <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={itemVariants}>
    {renderInput("displacement", "number")}
    {renderInput("payloadCapacity")}
  </motion.div>

  {/* Row 5: Fuel Type (full width) */}
  <motion.div variants={itemVariants}>
    {renderSelect("fuelType", fuelOptions)}
  </motion.div>

  {/* Submit Button */}
  <motion.button
    type="submit"
    className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
    whileTap={{ scale: 0.97 }}
    variants={itemVariants}
  >
    Submit Truck Request
  </motion.button>
</motion.form>


          {/* Confirmation Modal */}
          <Transition appear show={isSubmitted} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsSubmitted(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-50" />
              </Transition.Child>

              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="bg-white p-5 rounded-xl text-center shadow-xl">
                    <h3 className="font-bold text-lg text-green-700">
                      Truck Request Submitted ✅
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm">
                      Please wait for confirmation.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Close
                    </button>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="fixed bottom-0 w-full bg-white bg-opacity-95 py-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
      >
        <div className="flex justify-center gap-6">
          <FaFacebookF className="text-green-700 text-lg" />
          <FaInstagram className="text-pink-500 text-lg" />
          <FaTwitter className="text-blue-500 text-lg" />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          © {new Date().getFullYear()} ArrowGo Logistics Inc.
        </p>
      </motion.footer>
    </div>
  );
}
