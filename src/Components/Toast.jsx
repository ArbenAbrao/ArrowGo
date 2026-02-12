import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ type = "success", message, show }) {
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-gray-500";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          className={`
            fixed top-6 right-6
            text-white px-6 py-3 rounded-xl shadow-2xl
            ${bgColor} z-[9999] font-semibold
            min-w-[280px] max-w-sm
          `}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
