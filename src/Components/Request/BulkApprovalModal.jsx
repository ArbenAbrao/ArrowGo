// src/Components/Request/BulkApprovalModal.jsx
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function BulkApprovalModal({ isOpen, onClose, selectedBulk, bulkStats, bulkApprove, approveBtn, cancelBtn }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="rounded-2xl p-6 max-w-md w-full bg-gray-800 text-gray-200">
            <Dialog.Title className="text-lg font-semibold mb-4">Confirm Bulk Approval</Dialog.Title>
            <p className="mb-2 text-gray-300">You are about to approve <strong>{selectedBulk.length}</strong> request(s):</p>
            <ul className="mb-4 max-h-40 overflow-y-auto text-sm text-gray-400">
              {bulkStats.appointment > 0 && <li>Appointments: {bulkStats.appointment}</li>}
              {bulkStats.truck > 0 && <li>Trucks: {bulkStats.truck}</li>}
            </ul>
            <div className="flex gap-3">
              <button onClick={bulkApprove} className={`flex-1 py-2 rounded-xl ${approveBtn}`}>Confirm</button>
              <button onClick={onClose} className={`flex-1 py-2 rounded-xl ${cancelBtn}`}>Cancel</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
