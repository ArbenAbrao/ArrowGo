import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ConfirmModal({ account, action, onClose, onSuccess }) {
  const confirm = async () => {
    // ✅ CLOSE MODAL IMMEDIATELY (CRITICAL FIX)
    onClose();

    try {
      if (action === "delete") {
        await axios.delete(`https://tmvasbackend.arrowgo-logistics.com/api/admin/accounts/${account.id}`);
      } else {
        await axios.put(`https://tmvasbackend.arrowgo-logistics.com/api/admin/accounts/${account.id}/status`, {
          is_active: account.is_active ? 0 : 1,
        });
      }

      toast.success("Action successful");
      onSuccess();
    } catch (err) {
      // ❌ Only show error if the request REALLY failed
      if (err.response && err.response.status !== 404) {
        console.error(err.response?.data || err);
        toast.error("Action failed");
      }
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-sm">
        <h3 className="font-semibold text-lg mb-4">
          {action === "delete"
            ? "Delete this account?"
            : account.is_active
            ? "Disable this account?"
            : "Enable this account?"}
        </h3>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>

          <button
            onClick={confirm}
            className={`px-4 py-2 rounded text-white ${
              action === "delete" ? "bg-red-600" : "bg-yellow-500"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </motion.div>
  );
}
