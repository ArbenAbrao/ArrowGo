import React, { useState, Fragment } from "react";
import {
  UserIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";



export default function Appointment() {
  const [form, setForm] = useState({
  visitorName: "",
  company: "",
  personToVisit: "",
  purpose: "",
  date: "",
  hour: "",
  minute: "",
  ampm: "",
  branch: "",
  appointmentRequest: true,
});


  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };



const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Combine 12-hour time into string
    const formattedTime = `${form.hour}:${form.minute} ${form.ampm}`;

    const res = await axios.post("http://192.168.254.126:5000/api/appointment-requests", {
      visitorName: form.visitorName,
      company: form.company,
      personToVisit: form.personToVisit,
      purpose: form.purpose,
      date: form.date,
      scheduleTime: formattedTime, // now in "hh:mm AM/PM"
      branch: form.branch,
    });

    console.log("Appointment created:", res.data);

    setIsModalOpen(true);

    // Reset form
    setForm({
      visitorName: "",
      company: "",
      personToVisit: "",
      purpose: "",
      date: "",
      hour: "",
      minute: "",
      ampm: "",
      branch: "",
      appointmentRequest: true,
    });
  } catch (err) {
    console.error("Failed to submit appointment", err);
    alert("Failed to submit appointment. Please try again.");
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

  return (
    <div
      className="min-h-screen flex flex-col relative bg-gray-50 pb-40"
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
      placeholder=" "
    />
    <label
      className="absolute left-0 text-gray-500 text-sm pointer-events-none transition-all
        peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
        peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm"
    >
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
    required // <--- add this
    className="peer w-full border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600 transition-colors bg-transparent"
    placeholder=" "
  />
  <label
    className="absolute left-0 text-gray-500 text-sm pointer-events-none transition-all
      peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
      peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
      peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm"
  >
    Company
  </label>
</motion.div>


  {/* Branch */}
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="relative"
  >
    <div className="relative flex items-center gap-2 group">
      <ClipboardDocumentListIcon
        className="w-5 h-5 text-gray-500 group-focus-within:text-green-600 transition-colors"
      />

      <select
        name="branch"
        value={form.branch}
        onChange={handleChange}
        required
        className="peer w-full border-b-2 border-gray-300 py-2 pr-8 text-base text-gray-800 bg-transparent outline-none
          focus:border-green-600 transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled hidden></option>
        <option value="Marilao">Marilao</option>
        <option value="Taguig">Taguig</option>
        <option value="Palawan">Palawan</option>
        <option value="Cebu">Cebu</option>
        <option value="Davao">Davao</option>
      </select>

      <label
        className="absolute left-7 text-gray-500 text-sm pointer-events-none transition-all
          peer-focus:-top-2 peer-focus:text-xs peer-focus:text-green-700
          peer-valid:-top-2 peer-valid:text-xs"
      >
        Branch
      </label>

      {/* Chevron Rotation */}
      <motion.span
        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        initial={{ rotate: 0 }}
        animate={{ rotate: form.branch ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        ▼
      </motion.span>
    </div>
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
      placeholder=" "
    />
    <label
      className="absolute left-0 text-gray-500 text-sm pointer-events-none transition-all
        peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
        peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm"
    >
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
      placeholder=" "
    />
    <label
      className="absolute left-7 text-gray-500 text-sm pointer-events-none transition-all
        peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
        peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
        peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm"
    >
      Purpose
    </label>
  </motion.div>

  {/* Date & Time Row */}
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
  variants={itemVariants}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Date */}
<motion.div className="relative flex items-center gap-2" variants={itemVariants}>
  <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
  <input
    type="text" // <--- use text instead of date
    name="date"
    value={form.date}
    onChange={handleChange}
    required
    className="peer flex-1 border-b-2 py-2 text-base text-gray-800 outline-none focus:border-green-600
               bg-transparent transition-colors duration-300 ease-in-out"
    placeholder=" " // keeps label floating logic
    onFocus={(e) => e.target.type = "date"} // switch to date on focus
    onBlur={(e) => e.target.type = form.date ? "date" : "text"} // revert to text if empty
  />
  <label
    className="absolute left-7 text-gray-400 text-base pointer-events-none
               peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
               peer-focus:-top-0.5 peer-focus:text-green-700 peer-focus:text-sm
               peer-valid:-top-0.5 peer-valid:text-green-700 peer-valid:text-sm
               transition-all duration-300 ease-out"
  >
    Date
  </label>
</motion.div>


{/* Time */}
<motion.div variants={itemVariants} className="space-y-1">
  <label className="text-sm font-medium text-gray-600 ml-1">
    Time
  </label>

  <div className="flex items-center rounded-lg border border-gray-300 bg-white
                  focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">

    {/* Hour */}
    <select
      name="hour"
      value={form.hour}
      onChange={(e) => setForm({ ...form, hour: e.target.value })}
      required
      className="appearance-none bg-transparent px-3 py-2 text-gray-800
                 focus:outline-none w-20 text-center"
    >
      <option value="" disabled>HH</option>
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i} value={i + 1}>
          {String(i + 1).padStart(2, "0")}
        </option>
      ))}
    </select>

    <span className="text-gray-400">:</span>

    {/* Minute (limited to 0,10,20...50) */}
    <select
      name="minute"
      value={form.minute}
      onChange={(e) => setForm({ ...form, minute: e.target.value })}
      required
      className="appearance-none bg-transparent px-3 py-2 text-gray-800
                 focus:outline-none w-20 text-center"
    >
      <option value="" disabled>MM</option>
      {Array.from({ length: 6 }, (_, i) => (
        <option key={i} value={i * 10}>
          {String(i * 10).padStart(2, "0")}
        </option>
      ))}
    </select>

    <div className="h-6 w-px bg-gray-300 mx-1" />

    {/* AM/PM */}
    <select
      name="ampm"
      value={form.ampm}
      onChange={(e) => setForm({ ...form, ampm: e.target.value })}
      required
      className="appearance-none bg-transparent px-3 py-2 text-gray-800
                 focus:outline-none w-20 text-center font-medium"
    >
      <option value="" disabled>AM/PM</option>
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  </div>
</motion.div>

</motion.div>


  {/* Submit Button */}
  <motion.button
    type="submit"
    className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all text-base mb-24"
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
