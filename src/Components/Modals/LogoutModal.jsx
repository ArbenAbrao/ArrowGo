// src/Components/Modals/LogoutModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

// Sparkle component
const Sparkle = ({ x, y, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
    transition={{ duration: 1, repeat: Infinity, repeatDelay: delay }}
    className="absolute w-1 h-1 bg-white rounded-full"
    style={{ top: y + "%", left: x + "%" }}
  />
);

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 15 },
    },
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Magical blurred overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0 backdrop-blur-none"
          enterTo="opacity-100 backdrop-blur-md"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 backdrop-blur-md"
          leaveTo="opacity-0 backdrop-blur-none"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-90"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-90"
            >
              <motion.div
                className="relative w-full max-w-sm p-6 bg-white rounded-3xl shadow-2xl border border-green-100 overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {/* Magical gradient glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-green-300 via-blue-200 to-purple-300 rounded-3xl opacity-20 blur-3xl -z-10"></div>

                {/* Sparkles */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <Sparkle key={i} x={Math.random() * 100} y={Math.random() * 100} delay={Math.random() * 2} />
                ))}

                <Dialog.Title className="text-2xl font-bold mb-4 text-gray-900 text-center">
                  Confirm Logout
                </Dialog.Title>
                <p className="mb-6 text-gray-700 text-center font-medium">
                  Are you sure you want to log out?
                </p>
                <div className="flex justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(239,68,68,0.6)" }}
                    onClick={onClose}
                    className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34,197,94,0.7)" }}
                    onClick={onConfirm}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all"
                  >
                    Log Out
                  </motion.button>
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
