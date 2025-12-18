import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TruckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function AddTruckModal({
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  clients,
  bays,
  occupiedBays,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 p-4 bg-blue-600 text-white rounded-t-2xl"
              >
                <TruckIcon className="w-6 h-6" />
                <Dialog.Title className="text-lg font-semibold">Add Truck</Dialog.Title>
                <button onClick={onClose} className="ml-auto hover:text-gray-200 transition">
                  ✕
                </button>
              </motion.div>

              {/* Form */}
              <form onSubmit={onSubmit} className="p-6 space-y-4">

                {/* Client Dropdown */}
                <motion.div
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.05 }}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setDropdownOpen(dropdownOpen === "client" ? null : "client")
                    }
                    className="w-full border p-2 rounded text-left text-black flex justify-between items-center"
                  >
                    {form.clientName || "Select Client"}
                    <ChevronDownIcon
                      className={`w-5 h-5 ml-2 transition-transform ${
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
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 max-h-60 overflow-y-auto"
                      >
                        {[...new Set(clients.map(c => c.clientName))].map((c, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-100 hover:bg-green-100 rounded cursor-pointer text-black text-sm"
                            onClick={() => {
                              onChange({ target: { name: "clientName", value: c } });
                              setDropdownOpen(null);
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Truck ID Dropdown */}
                <motion.div
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <button
                    type="button"
                    disabled={!form.clientName}
                    onClick={() =>
                      setDropdownOpen(dropdownOpen === "truckId" ? null : "truckId")
                    }
                    className="w-full border p-2 rounded text-left text-black disabled:opacity-50 flex justify-between items-center"
                  >
                    {form.id || "Select Truck ID"}
                    <ChevronDownIcon
                      className={`w-5 h-5 ml-2 transition-transform ${
                        dropdownOpen === "truckId" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen === "truckId" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 max-h-60 overflow-y-auto"
                      >
                        {clients
                          .filter(c => c.clientName === form.clientName)
                          .map((truck, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 hover:bg-green-100 rounded cursor-pointer text-black text-sm"
                              onClick={() => {
                                onChange({ target: { name: "id", value: truck.id } });
                                onChange({ target: { name: "truckType", value: truck.truckType } });
                                onChange({ target: { name: "plateNumber", value: truck.plateNumber } });
                                setDropdownOpen(null);
                              }}
                            >
                              {truck.id}
                            </span>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Truck Type */}
                <motion.input
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.15 }}
                  readOnly
                  value={form.truckType || ""}
                  placeholder="Truck Type"
                  className="border p-2 w-full rounded bg-gray-100 text-black"
                />

                {/* Plate Number */}
                <motion.input
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  readOnly
                  value={form.plateNumber || ""}
                  placeholder="Plate Number"
                  className="border p-2 w-full rounded bg-gray-100 text-black"
                />

                {/* Bay Dropdown */}
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
                      setDropdownOpen(dropdownOpen === "bay" ? null : "bay")
                    }
                    className="w-full border p-2 rounded text-left text-black flex justify-between items-center"
                  >
                    {form.bay || "Select Bay"}
                    <ChevronDownIcon
                      className={`w-5 h-5 ml-2 transition-transform ${
                        dropdownOpen === "bay" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen === "bay" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 p-2 flex flex-wrap gap-2 max-h-60 overflow-y-auto"
                      >
                        {bays.map(b => {
                          const upper = b.toUpperCase();
                          const occupied = occupiedBays.includes(b);
                          return (
                            <span
                              key={b}
                              className={`px-3 py-1 rounded cursor-pointer text-black text-sm ${
                                occupied
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : "bg-gray-100 hover:bg-green-100"
                              }`}
                              onClick={() => {
                                if (!occupied) {
                                  onChange({ target: { name: "bay", value: upper } });
                                  setDropdownOpen(null);
                                }
                              }}
                            >
                              {upper} {occupied && "(OCCUPIED)"}
                            </span>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Driver */}
                <motion.input
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  name="driver"
                  value={form.driver}
                  onChange={onChange}
                  placeholder="Driver"
                  required
                  className="border p-2 w-full rounded text-black"
                />

                {/* Purpose */}
                <motion.input
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.35 }}
                  name="purpose"
                  value={form.purpose}
                  onChange={onChange}
                  placeholder="Purpose"
                  className="border p-2 w-full rounded text-black"
                />

                {/* Action Buttons */}
                <motion.div
                  className="flex justify-end gap-3 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 border rounded text-black"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Add
                  </motion.button>
                </motion.div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
