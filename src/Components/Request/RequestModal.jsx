// src/Components/Request/RequestModal.jsx
import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon, XMarkIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function RequestModal({
  isOpen,
  onClose,
  selectedRequest,
  approve,
  reject,
  approveBtn,
  rejectBtn,
  cancelBtn,
  theme,
}) {
  const req = selectedRequest;
  const name = req ? (req.type === "truck" ? req.data.clientName : req.data.visitorName) : null;
  const branch = req ? (req.type === "truck" ? req.data.branchRegistered : req.data.branch) : null;

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
                  <Dialog.Title className="text-lg font-bold">Review Request</Dialog.Title>
                  <p className={`text-xs ${theme.subtleText}`}>Approve or reject this request</p>
                </div>
              </div>

              <div className="p-6">
                {req && (
                  <div className={`rounded-xl border p-4 mb-5 ${theme.innerPanelBg}`}>
                    <p className={`text-xs mb-1 ${theme.subtleText}`}>
                      {req.type === "truck" ? "Client" : "Visitor"}
                    </p>
                    <p className={`text-base font-semibold ${theme.titleText}`}>{name || "—"}</p>
                    {branch && <p className={`text-xs mt-0.5 ${theme.subtleText}`}>Branch: {branch}</p>}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => approve(req)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold transition ${approveBtn}`}
                  >
                    <CheckIcon className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => reject(req.id, req.type)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold transition ${rejectBtn}`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Reject
                  </button>
                </div>
                <button onClick={onClose} className={`mt-3 w-full py-2.5 rounded-xl font-medium transition ${cancelBtn}`}>
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}