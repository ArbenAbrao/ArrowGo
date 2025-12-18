import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function EditTruckModal({
  open,
  onClose,
  truck,
  onChange,
  onSubmit,
  bays,
  occupiedBays,
}) {
  if (!truck) return null;

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
                className="flex items-center gap-2 p-4 bg-yellow-400 text-white rounded-t-2xl"
              >
                <PencilIcon className="w-6 h-6" />
                <Dialog.Title className="text-lg font-semibold">Edit Truck</Dialog.Title>
                <button onClick={onClose} className="ml-auto hover:text-gray-200 transition">
                  ✕
                </button>
              </motion.div>

              {/* Form */}
              <form onSubmit={onSubmit} className="p-6 space-y-3">
                {[
                  <input
                    key="driver"
                    name="driver"
                    value={truck.driver}
                    onChange={onChange}
                    placeholder="Driver"
                    className="border p-2 w-full rounded"
                  />,
                  <input
                    key="purpose"
                    name="purpose"
                    value={truck.purpose}
                    onChange={onChange}
                    placeholder="Purpose"
                    className="border p-2 w-full rounded"
                  />,
                  <select
                    key="bay"
                    name="bay"
                    value={truck.bay}
                    onChange={onChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="">Select Bay</option>
                    {bays.map((b) => (
                      <option
                        key={b}
                        value={b}
                        disabled={occupiedBays.includes(b) && b !== truck.bay}
                      >
                        {b}
                      </option>
                    ))}
                  </select>,
                ].map((field, i) => (
                  <motion.div
                    key={i}
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.05 }}
                  >
                    {field}
                  </motion.div>
                ))}

                {/* Actions */}
                <motion.div
                  className="flex justify-end gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
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
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Save
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
