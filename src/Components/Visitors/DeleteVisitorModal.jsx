// src/Components/Visitors/DeleteVisitorModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function DeleteVisitorModal({ isOpen, onClose, onConfirm }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-30" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="p-6 text-center">
                <Dialog.Title className="text-lg font-semibold text-gray-800">Delete Visitor?</Dialog.Title>
                <p className="mt-2 text-gray-600">Are you sure you want to delete this visitor?</p>
                <div className="mt-4 flex justify-center gap-4">
                  <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Cancel</button>
                  <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">Delete</button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
