// src/Components/Request/RequestModal.jsx
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function RequestModal({ isOpen, onClose, selectedRequest, approve, reject, approveBtn, rejectBtn, cancelBtn }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`rounded-2xl p-6 shadow-xl max-w-md w-full bg-gray-800 text-gray-200`}>
            <Dialog.Title className="text-xl font-semibold mb-4">Review Request</Dialog.Title>
            <div className="flex gap-3">
              <button onClick={() => approve(selectedRequest)} className={`flex-1 py-2 rounded-xl ${approveBtn}`}>Approve</button>
              <button onClick={() => reject(selectedRequest.id)} className={`flex-1 py-2 rounded-xl ${rejectBtn}`}>Reject</button>
            </div>
            <button onClick={onClose} className={`mt-4 w-full py-2 rounded-xl ${cancelBtn}`}>Cancel</button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
