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
  activeTrucks,
  darkMode = true,
  mode
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

    // Automatically set the current time as Time Out
    const timeOut = new Date().toISOString(); // You can format it if needed

    onSubmit({
      ...form,
      timeOut, // <-- added automatically
    });

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
                  <Dialog.Title className="text-lg font-semibold">
                    Create Time Out
                  </Dialog.Title>
                  <button onClick={onClose} className="ml-auto hover:opacity-80 transition">✕</button>
                </motion.div>

                {/* Form (same as your previous modal, unchanged) */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* ... all dropdowns and inputs as in your original code ... */}

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
                      Add
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
            Truck added successfully! 🚚
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}