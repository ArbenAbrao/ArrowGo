import React, { useState, Fragment } from "react";
import {
  UserIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Appointment() {
  const [form, setForm] = useState({
    visitorName: "",
    company: "",
    personToVisit: "",
    purpose: "",
    date: "",
    appointmentRequest: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pending = JSON.parse(localStorage.getItem("pendingRequests")) || [];
    pending.push({ id: Date.now(), type: "appointment", data: form });
    localStorage.setItem("pendingRequests", JSON.stringify(pending));
    setIsModalOpen(true);
    setForm({ visitorName: "", company: "", personToVisit: "", purpose: "", date: "", appointmentRequest: true });
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
      className="min-h-screen flex flex-col relative bg-gray-50 pb-24" // add bottom padding for footer
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
        className="relative z-10 flex flex-col items-center p-4 sm:p-6"
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
            <UserIcon className="w-8 h-8 text-green-700" />
            <h1 className="text-xl font-semibold text-gray-800">
              Appointment Request
            </h1>
          </div>

          <motion.form onSubmit={handleSubmit} className="space-y-4" variants={containerVariants}>
            {/* Visitor Name */}
            <motion.div className="relative" variants={itemVariants}>
              <input
                type="text"
                name="visitorName"
                value={form.visitorName}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-0 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Full Name
              </label>
            </motion.div>

            {/* Company */}
            <motion.div className="relative" variants={itemVariants}>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-0 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Company
              </label>
            </motion.div>

            {/* Person to Visit */}
            <motion.div className="relative" variants={itemVariants}>
              <input
                type="text"
                name="personToVisit"
                value={form.personToVisit}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-0 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Person To Visit
              </label>
            </motion.div>

            {/* Purpose */}
            <motion.div className="relative flex items-center gap-2" variants={itemVariants}>
              <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                className="peer flex-1 border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-7 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Purpose
              </label>
            </motion.div>

            {/* Date */}
            <motion.div className="relative flex items-center gap-2" variants={itemVariants}>
              <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="peer flex-1 border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
              />
              <label className="absolute left-7 -top-0.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm">
                Date
              </label>
            </motion.div>

            <motion.button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all text-base"
              whileTap={{ scale: 0.97 }}
              variants={itemVariants}
            >
              Submit
            </motion.button>
          </motion.form>

          {/* Modal */}
          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
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
                      Appointment Submitted ✅
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm">
                      Please wait for confirmation.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(false)}
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
