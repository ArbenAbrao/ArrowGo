// src/Pages/TruckRequest.jsx
import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
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
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFooter(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
  setForm({
    plateNumber: "",
    truckType: "",
    clientName: "",
  });
};

const inputVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};



  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: "url('/Truck1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Content wrapper */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Truck Request Card */}
        <div className="bg-white bg-opacity-95 shadow-lg rounded-3xl p-8 max-w-xl w-full relative transition-transform duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm">
          
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img src="/logo4.png" alt="Logo" className="h-16 w-16 object-contain" />
          </div>

          {/* Company Name */}
          <h2 className="text-center text-green-800 font-bold text-xl mb-4">
            ArrowGo Logistics Inc.
          </h2>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <TruckIcon className="w-10 h-10 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Truck Registration Request
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plate Number */}
            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
            >
              <input
                type="text"
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                placeholder="Plate Number"
                required
                className="w-full border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
              />
            </motion.div>

            {/* Truck Type Dropdown */}
            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="relative w-full"
            >
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full border-b-2 border-gray-300 py-2 text-left focus:outline-none focus:border-green-500"
              >
                {form.truckType || "Select Truck Type"}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 max-h-60 overflow-y-auto"
                  >
                    {truckOptions.map((type, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 hover:bg-green-100 rounded cursor-pointer text-gray-900 text-sm"
                        onClick={() => {
                          setForm({ ...form, truckType: type });
                          setDropdownOpen(false);
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Client Name */}
            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 }}
            >
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="Client Name"
                required
                className="w-full border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
              />
            </motion.div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              Submit Truck Request
            </button>
          </form>

          {/* Success Modal */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50"
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" />
                <motion.div
                  className="bg-white p-6 rounded-2xl max-w-md mx-auto z-50 text-center shadow-2xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                >
                  <h3 className="text-lg font-bold text-gray-900">Truck Request Submitted ✅</h3>
                  <p className="mt-2 text-gray-500">
                    Your truck registration request has been successfully submitted.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 px-4 py-2 rounded-xl text-white font-semibold shadow-md transition-all duration-300 transform hover:scale-105 bg-green-600 hover:bg-green-700"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`w-full bg-white bg-opacity-90 backdrop-blur-md text-gray-700 rounded-xl shadow-inner transition-all duration-700 transform ${
          showFooter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <h3 className="font-bold text-green-700 mb-2">Location</h3>
            <p>
              Warehouse A & B<br />
              New Bypass Road Angliongto, Mamay Road,<br />
              Buhangin District,<br />
              Davao City
            </p>
          </div>

          <div>
            <h3 className="font-bold text-green-700 mb-2">Operating Hours</h3>
            <p>
              Mon-Fri: 8:30 am - 5:30 pm<br />
              Sat: 8:00 am - 2:00 pm<br />
              Sun: Closed
            </p>
          </div>

          <div>
            <h3 className="font-bold text-green-700 mb-2">Call Us</h3>
            <p>
              (082) 238 2263<br />
              Sales: (082) 238 2263
            </p>
          </div>

          <div>
            <h3 className="font-bold text-green-700 mb-2">Social Media</h3>
            <div className="flex gap-3 mt-1">
              <a href="#" className="text-green-700 hover:text-green-900 transition-transform transform hover:scale-110">
                <FaFacebookF size={18} />
              </a>
              <a href="#" className="text-pink-500 hover:text-pink-700 transition-transform transform hover:scale-110">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-transform transform hover:scale-110">
                <FaTwitter size={18} />
              </a>
            </div>
          </div>
        </div> 

        <div className="border-t border-gray-200 mt-4 pt-2 text-center text-gray-500 text-xs sm:text-sm rounded-b-xl">
          &copy; {new Date().getFullYear()} ArrowGo Logistics Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
