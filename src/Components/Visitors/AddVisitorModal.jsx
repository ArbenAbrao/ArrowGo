// src/Components/Visitors/AddVisitorModal.jsx
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UserIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function AddVisitorModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  darkMode = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
        btnSecondary: "border text-gray-100 hover:bg-gray-700",
        inputBg: "bg-gray-800 text-gray-100 border-gray-700",
        dropdownBg: "bg-gray-800 text-gray-100",
        dropdownHover: "hover:bg-green-400/30",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        dropdownBg: "bg-white text-gray-900",
        dropdownHover: "hover:bg-indigo-50",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    onClose();
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
          </Transition.Child>

          {/* Modal container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-200"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${theme.modalBg}`}
              >
                {/* Header */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 p-4 ${theme.headerBg} rounded-t-2xl`}
                >
                  <UserIcon className="w-6 h-6" />
                  <Dialog.Title className="text-lg font-semibold">Add Visitor</Dialog.Title>
                  <button onClick={onClose} className="ml-auto hover:opacity-80 transition">
                    ✕
                  </button>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Text Inputs */}
                  {[
                    { name: "visitorName", placeholder: "Full Name", required: true },
                    { name: "company", placeholder: "Company / From" },
                    { name: "personToVisit", placeholder: "Person to Visit" },
                    { name: "purpose", placeholder: "Purpose" },
                  ].map((field, i) => (
                    <motion.input
                      key={i}
                      variants={inputVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.05 }}
                      type="text"
                      name={field.name}
                      value={form[field.name]}
                      onChange={onChange}
                      placeholder={field.placeholder}
                      required={field.required || false}
                      className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    />
                  ))}

                  <div className="grid md:grid-cols-2 gap-3">
                    {/* ID Type Dropdown */}
                    <motion.div
                      variants={inputVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.25 }}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setDropdownOpen(dropdownOpen === "idType" ? null : "idType")
                        }
                        className={`w-full border p-2 rounded text-left flex justify-between items-center ${theme.inputBg} ${theme.neonGlow}`}
                      >
                        {form.idType || "Select ID Type"}
                        <ChevronDownIcon
                          className={`w-5 h-5 ml-2 transition-transform ${
                            dropdownOpen === "idType" ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {dropdownOpen === "idType" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute z-50 w-full rounded shadow-lg mt-1 flex flex-col ${theme.dropdownBg}`}
                          >
                            {["PhilHealth ID", "SSS ID", "Driver's License", "TIN ID", "Other"].map(
                              (type, i) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 rounded cursor-pointer text-sm ${theme.dropdownHover}`}
                                  onClick={() => {
                                    onChange({ target: { name: "idType", value: type } });
                                    setDropdownOpen(null);
                                  }}
                                >
                                  {type}
                                </span>
                              )
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* ID Number */}
                    <motion.input
                      variants={inputVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.3 }}
                      type="text"
                      name="idNumber"
                      value={form.idNumber}
                      onChange={onChange}
                      placeholder="ID Number"
                      required
                      className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    />
                  </div>

                  {/* Branch Dropdown */}
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.35 }}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === "branch" ? null : "branch")
                      }
                      className={`w-full border p-2 rounded text-left flex justify-between items-center ${theme.inputBg} ${theme.neonGlow}`}
                    >
                      {form.branch || "Select Branch"}
                      <ChevronDownIcon
                        className={`w-5 h-5 ml-2 transition-transform ${
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
                          transition={{ duration: 0.2 }}
                          className={`absolute z-50 w-full rounded shadow-lg mt-1 flex flex-col ${theme.dropdownBg}`}
                        >
                          {["Marilao", "Taguig", "Palawan", "Davao", "Cebu"].map(
                            (branchName, i) => (
                              <span
                                key={i}
                                className={`px-3 py-1 rounded cursor-pointer text-sm ${theme.dropdownHover}`}
                                onClick={() => {
                                  onChange({ target: { name: "branch", value: branchName } });
                                  setDropdownOpen(null);
                                }}
                              >
                                {branchName}
                              </span>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Badge Number */}
                  <motion.select
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                    name="badgeNumber"
                    value={form.badgeNumber}
                    onChange={onChange}
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    required
                  >
                    <option value="">Select Badge Number</option>
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </motion.select>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 mt-4">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded ${theme.btnSecondary}`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded ${theme.btnPrimary}`}
                    >
                      Add Visitor
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-medium"
          >
            Visitor added successfully! ✅
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
