import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TruckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";

export default function RegisterTruckModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  darkMode = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66] focus:outline-none",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        dropdownBg: "bg-white text-gray-900",
        dropdownHover: "hover:bg-indigo-50",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66] focus:outline-none",
      };

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
                  <TruckIcon className="w-6 h-6" />
                  <Dialog.Title className="text-lg font-semibold">Register Truck</Dialog.Title>
                  <button onClick={onClose} className="ml-auto hover:opacity-80 transition">✕</button>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Plate Number */}
                  <motion.input
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.05 }}
                    type="text"
                    name="plateNumber"
                    value={form.plateNumber}
                    onChange={onChange}
                    placeholder="Plate Number"
                    required
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

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
                      className={`w-full border p-2 rounded text-left ${theme.inputBg} ${theme.neonGlow} flex justify-between items-center`}
                    >
                      {form.truckType || "Select Truck Type"}
                      <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`absolute z-50 w-full rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 max-h-60 overflow-y-auto ${theme.dropdownBg}`}
                        >
                          {truckOptions.map((type, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded cursor-pointer text-sm ${theme.dropdownHover}`}
                              onClick={() => {
                                onChange({ target: { name: "truckType", value: type } });
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
                  <motion.input
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.15 }}
                    type="text"
                    name="clientName"
                    value={form.clientName}
                    onChange={onChange}
                    placeholder="Client Name"
                    required
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

                  {/* QR Code */}
                  {form.plateNumber && (
                    <div className="flex flex-col items-center mt-4">
                      <QRCodeCanvas
                        value={`http://localhost:3000/truck/${form.plateNumber}`}
                        size={180}
                      />
                      <p className="mt-2 text-gray-400 text-sm">Scan to view truck details</p>
                    </div>
                  )}

                  {/* Actions */}
                  <motion.div
                    className="flex justify-end gap-3 mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
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
                      Register
                    </motion.button>
                  </motion.div>
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
            Truck registered successfully! 🚚
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
