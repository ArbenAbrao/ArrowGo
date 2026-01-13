// src/Components/Visitors/DeleteVisitorModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";

export default function DeleteVisitorModal({ isOpen, onClose, onConfirm, darkMode = true }) {
  const theme = darkMode
    ? {
        modalBg: "bg-gray-900 text-gray-100",
        headerText: "text-red-400",
        btnCancel: "border text-gray-100 hover:bg-gray-700",
        btnDelete: "bg-red-600 hover:bg-red-700 text-white",
        neonGlow: "hover:shadow-[0_0_12px_#ff0033] focus:shadow-[0_0_12px_#ff0033]",
      }
    : {
        modalBg: "bg-white text-gray-900",
        headerText: "text-red-600",
        btnCancel: "border text-gray-900 hover:bg-gray-100",
        btnDelete: "bg-red-500 hover:bg-red-600 text-white",
        neonGlow: "hover:shadow-[0_0_12px_#ff0033] focus:shadow-[0_0_12px_#ff0033]",
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
              <Dialog.Panel className={`w-full max-w-sm transform overflow-hidden rounded-2xl shadow-2xl transition-all ${theme.modalBg}`}>
                
                {/* Header */}
                <div className="p-6 text-center">
                  <Dialog.Title className={`text-lg font-semibold ${theme.headerText}`}>Delete Visitor?</Dialog.Title>
                  <p className="mt-2 text-sm text-gray-400">Are you sure you want to delete this visitor?</p>

                  {/* Buttons */}
                  <div className="mt-4 flex justify-center gap-4">
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded ${theme.btnCancel} ${theme.neonGlow}`}
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      onClick={onConfirm}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded ${theme.btnDelete} ${theme.neonGlow}`}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
