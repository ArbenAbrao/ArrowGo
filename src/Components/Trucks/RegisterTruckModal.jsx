import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TruckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterTruckModal({ open, onClose, form, onChange, onSubmit }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const inputVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
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
                className="flex items-center gap-2 p-4 bg-green-500 text-white rounded-t-2xl"
              >
                <TruckIcon className="w-6 h-6" />
                <Dialog.Title className="text-lg font-semibold">Register Truck</Dialog.Title>
                <button onClick={onClose} className="ml-auto hover:text-gray-200 transition">
                  ✕
                </button>
              </motion.div>

              {/* Form */}
              <form onSubmit={onSubmit} className="p-6 space-y-4">
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
                    onChange={onChange}
                    placeholder="Plate Number"
                    required
                    className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </motion.div>

{/* Truck Type Custom Dropdown */}
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
    className="w-full border p-2 rounded text-left bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
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
                    onChange={onChange}
                    placeholder="Client Name"
                    required
                    className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </motion.div>

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
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-green-500 text-white rounded"
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
  );
}
