// src/Components/Request/BulkApprovalModal.jsx
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function BulkApprovalModal({
  isOpen,
  onClose,
  selectedBulk,
  bulkStats,
  bulkApprove,
  approveBtn,
  cancelBtn,
  theme,
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${theme.modalBg}`}>
              <div className={`px-6 py-5 border-b flex items-center gap-3 ${theme.modalHeaderBg}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.iconBadge}`}>
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                </span>
                <div>
                  <Dialog.Title className="text-lg font-bold">Confirm Bulk Approval</Dialog.Title>
                  <p className={`text-xs ${theme.subtleText}`}>
                    You're about to approve {selectedBulk.length} request{selectedBulk.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className={`rounded-xl border p-4 mb-5 space-y-1 text-sm ${theme.innerPanelBg} ${theme.detailText}`}>
                  {bulkStats.appointment > 0 && <p>Appointments: {bulkStats.appointment}</p>}
                  {bulkStats.truck > 0 && <p>Trucks: {bulkStats.truck}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={bulkApprove}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold transition ${approveBtn}`}
                  >
                    <CheckIcon className="h-4 w-4" />
                    Confirm
                  </button>
                  <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl font-medium transition ${cancelBtn}`}>
                    Cancel
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}