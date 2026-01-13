import React, { useState } from "react";
import { TruckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

export default function TruckRequest() {
  const [form, setForm] = useState({
    plateNumber: "",
    truckType: "",
    clientName: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const truckOptions = [
    "EV Truck",
    "4-Wheel Truck",
    "6-Wheel Truck",
    "8-Wheel Truck",
    "10-Wheel Truck",
    "Trailer Truck",
    "Wing Van",
    "Dump Truck",
    "Refrigerated Truck",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pending = JSON.parse(localStorage.getItem("pendingRequests")) || [];

    pending.push({
      id: Date.now(),
      type: "truck",
      data: form,
    });

    localStorage.setItem("pendingRequests", JSON.stringify(pending));

    setIsSubmitted(true);
    setForm({ plateNumber: "", truckType: "", clientName: "" });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div
      className="min-h-screen flex flex-col relative pb-24"
      style={{
        backgroundImage: "url('/Truck1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="bg-white bg-opacity-95 shadow-2xl rounded-3xl p-6 max-w-md w-full transform hover:scale-105 transition-transform duration-300"
          variants={itemVariants}
        >
          {/* Logo */}
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

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={containerVariants}
          >
            {/* Plate Number */}
            <motion.div className="relative" variants={itemVariants}>
              <input
                type="text"
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-0 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Plate Number
              </label>
            </motion.div>

           {/* Truck Type Dropdown */}
<motion.div className="relative" variants={itemVariants}>
  <button
    type="button"
    onClick={() => setDropdownOpen(!dropdownOpen)}
    className="w-full border-b-2 py-2 text-left text-gray-900 font-medium" // darker text
  >
    {form.truckType || "Select Truck Type"}
  </button>

  <AnimatePresence>
    {dropdownOpen && (
      <motion.div
        className="absolute top-full left-0 bg-white border rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 z-50 max-h-48 overflow-y-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {truckOptions.map((type, i) => (
          <span
            key={i}
            onClick={() => {
              setForm({ ...form, truckType: type });
              setDropdownOpen(false);
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-green-100 rounded cursor-pointer text-sm text-gray-900 font-medium"
          >
            {type}
          </span>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>


            {/* Client Name */}
            <motion.div className="relative" variants={itemVariants}>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-0 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Client Name
              </label>
            </motion.div>

            <motion.button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all text-base"
              whileTap={{ scale: 0.97 }}
              variants={itemVariants}
            >
              Submit Truck Request
            </motion.button>
          </motion.form>

          {/* Success Modal */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <motion.div
                  className="bg-white p-6 rounded-xl z-50 text-center"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <h3 className="font-bold text-green-700">Request Submitted ✅</h3>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Fixed Footer */}
      <motion.footer
        className="fixed bottom-0 left-0 w-full bg-white bg-opacity-95 shadow-md flex flex-col items-center justify-center py-3 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7 } }}
      >
        <div className="flex justify-center gap-6">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.2 }} className="text-green-700 text-lg">
              <FaFacebookF />
            </motion.button>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.2 }} className="text-pink-500 text-lg">
              <FaInstagram />
            </motion.button>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.2 }} className="text-blue-500 text-lg">
              <FaTwitter />
            </motion.button>
          </a>
        </div>
        <p className="text-center text-xs text-gray-500 mt-1">
          © {new Date().getFullYear()} ArrowGo Logistics Inc.
        </p>
      </motion.footer>
    </div>
  );
}
