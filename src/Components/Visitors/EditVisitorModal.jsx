// src/Components/Visitors/EditVisitorModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

export default function EditVisitorModal({ isOpen, onClose, visitor, onChange, onSubmit, darkMode = true }) {
  if (!visitor) return null;

  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerBg: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white",
        inputBg: "bg-gray-800 text-gray-100 border-gray-700",
        btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black",
        btnSecondary: "border text-gray-100 hover:bg-gray-700",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerBg: "bg-gradient-to-r from-indigo-400 to-indigo-200 text-gray-900",
        inputBg: "bg-gray-100 text-gray-900 border-gray-300",
        btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSecondary: "border text-gray-900 hover:bg-gray-100",
        neonGlow: "hover:shadow-[0_0_12px_#00ff66] focus:shadow-[0_0_12px_#00ff66]",
      };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-2xl shadow-2xl transition-all ${theme.modalBg}`}>
                
                {/* Header */}
                <div className={`flex items-center gap-2 p-4 ${theme.headerBg} rounded-t-2xl`}>
                  <Dialog.Title className="text-lg font-semibold">Edit Visitor</Dialog.Title>
                  <button onClick={onClose} className="ml-auto hover:opacity-80 transition">✕</button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-6 space-y-3">
                  <motion.input
                    type="text"
                    name="visitorName"
                    placeholder="Full Name"
                    value={visitor.visitorName || ""}
                    onChange={onChange}
                    required
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  />

                  <motion.input
                    type="text"
                    name="company"
                    placeholder="Company / From"
                    value={visitor.company || ""}
                    onChange={onChange}
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

                  <motion.input
                    type="text"
                    name="personToVisit"
                    placeholder="Person to Visit"
                    value={visitor.personToVisit || ""}
                    onChange={onChange}
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

                  <motion.input
                    type="text"
                    name="purpose"
                    placeholder="Purpose"
                    value={visitor.purpose || ""}
                    onChange={onChange}
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

                  <div className="grid md:grid-cols-2 gap-3">
                    <motion.select
                      name="idType"
                      value={visitor.idType || ""}
                      onChange={onChange}
                      required
                      className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    >
                      <option value="">Select ID Type</option>
                      <option value="PhilHealth ID">PhilHealth ID</option>
                      <option value="SSS ID">SSS ID</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="TIN ID">TIN ID</option>
                      <option value="Other">Other</option>
                    </motion.select>

                    <motion.input
                      type="text"
                      name="idNumber"
                      placeholder="ID Number"
                      value={visitor.idNumber || ""}
                      onChange={onChange}
                      required
                      className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    />
                  </div>

                  <motion.select
                    name="badgeNumber"
                    value={visitor.badgeNumber || ""}
                    onChange={onChange}
                    required
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  >
                    <option value="">Select Badge Number</option>
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                  </motion.select>

                  <div className="grid md:grid-cols-2 gap-3">
                    <motion.select
                      name="vehicleMode"
                      value={visitor.vehicleMode || "On Foot"}
                      onChange={onChange}
                      className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                    >
                      <option>On Foot</option>
                      <option>Truck</option>
                      <option>Company Vehicle</option>
                      <option>Private Car</option>
                      <option>Motorcycle</option>
                      <option>Other</option>
                    </motion.select>

                    {visitor.vehicleMode !== "On Foot" && (
                      <motion.input
                        type="text"
                        name="vehicleDetails"
                        placeholder="Vehicle Details"
                        value={visitor.vehicleDetails || ""}
                        onChange={onChange}
                        className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                      />
                    )}
                  </div>

                  <motion.input
                    type="date"
                    name="date"
                    value={visitor.date ? new Date(visitor.date).toISOString().split("T")[0] : ""}
                    onChange={onChange}
                    className={`border p-2 w-full rounded ${theme.inputBg} ${theme.neonGlow}`}
                  />

                  <div className="flex justify-end gap-2 mt-4">
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
                      Save
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
