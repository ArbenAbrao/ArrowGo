// src/Components/Modals/LogoutModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { FaSignOutAlt } from "react-icons/fa";

export default function LogoutModal({ isOpen, onClose, onConfirm, darkMode = true }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  // Same token family as Welcome.jsx / LoginModal.jsx
  const theme = darkMode
    ? {
        panel: "bg-slate-950/95 border-white/10",
        titleText: "text-slate-100",
        bodyText: "text-slate-400",
        cancelBtn: "border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600",
        warnBadge: "bg-amber-500/10 border-amber-500/25 text-amber-400",
        blobEmerald: "bg-emerald-500/20",
        blobBlue: "bg-blue-500/20",
      }
    : {
        panel: "bg-white/95 border-slate-200",
        titleText: "text-slate-900",
        bodyText: "text-slate-600",
        cancelBtn: "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400",
        warnBadge: "bg-amber-50 border-amber-200 text-amber-600",
        blobEmerald: "bg-emerald-400/15",
        blobBlue: "bg-blue-400/15",
      };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <motion.div
                className="relative w-full max-w-sm"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                {/* Ambient glow — same emerald/blue pairing as the rest of the app */}
                <motion.div
                  animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className={`absolute -top-14 -left-14 w-48 h-48 rounded-full blur-[70px] -z-10 ${theme.blobBlue}`}
                />
                <motion.div
                  animate={{ x: [0, -12, 0], y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
                  className={`absolute -bottom-14 -right-10 w-52 h-52 rounded-full blur-[80px] -z-10 ${theme.blobEmerald}`}
                />

                <div
                  className={`relative rounded-[28px] border backdrop-blur-2xl shadow-2xl px-7 py-9 overflow-hidden transition-colors duration-300 ${theme.panel}`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

                  <motion.div className="relative flex flex-col items-center gap-4" variants={itemVariants}>
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${theme.warnBadge}`}>
                      <FaSignOutAlt size={20} />
                    </span>

                    <Dialog.Title className={`page-title text-xl font-bold ${theme.titleText}`}>
                      Confirm Logout
                    </Dialog.Title>

                    <p className={`text-sm leading-6 ${theme.bodyText}`}>
                      You'll be signed out of the gate control dashboard.
                      <br />
                      Are you sure you want to continue?
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="relative flex gap-3 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onClose}
                      className={`flex-1 px-5 py-3 rounded-xl border font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${theme.cancelBtn}`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onConfirm}
                      className="btn-shine flex-1 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    >
                      <span>Log Out</span>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}