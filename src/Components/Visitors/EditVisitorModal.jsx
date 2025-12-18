// src/Components/Visitors/EditVisitorModal.jsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function EditVisitorModal({ isOpen, onClose, visitor, onChange, onSubmit }) {
  if (!visitor) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-30" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center gap-2 p-4 bg-yellow-500 text-white rounded-t-2xl">
                <Dialog.Title className="text-lg font-semibold">Edit Visitor</Dialog.Title>
              </div>
              <div className="p-6 text-gray-700">
                <form onSubmit={onSubmit} className="space-y-3">
                  <input type="text" name="visitorName" placeholder="Full Name" value={visitor.visitorName || ""} onChange={onChange} className="border p-2 w-full rounded" required />
                  <input type="text" name="company" placeholder="Company / From" value={visitor.company || ""} onChange={onChange} className="border p-2 w-full rounded" />
                  <input type="text" name="personToVisit" placeholder="Person to Visit" value={visitor.personToVisit || ""} onChange={onChange} className="border p-2 w-full rounded" />
                  <input type="text" name="purpose" placeholder="Purpose" value={visitor.purpose || ""} onChange={onChange} className="border p-2 w-full rounded" />

                  <div className="grid md:grid-cols-2 gap-3">
                    <select name="idType" value={visitor.idType || ""} onChange={onChange} className="border p-2 w-full rounded" required>
                      <option value="">Select ID Type</option>
                      <option value="PhilHealth ID">PhilHealth ID</option>
                      <option value="SSS ID">SSS ID</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="TIN ID">TIN ID</option>
                      <option value="Other">Other</option>
                    </select>
                    <input type="text" name="idNumber" placeholder="ID Number" value={visitor.idNumber || ""} onChange={onChange} className="border p-2 w-full rounded" required />
                  </div>

                  <select name="badgeNumber" value={visitor.badgeNumber || ""} onChange={onChange} className="border p-2 w-full rounded" required>
                    <option value="">Select Badge Number</option>
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>

                  <div className="grid md:grid-cols-2 gap-3">
                    <select name="vehicleMode" value={visitor.vehicleMode || "On Foot"} onChange={onChange} className="border p-2 w-full rounded">
                      <option>On Foot</option>
                      <option>Truck</option>
                      <option>Company Vehicle</option>
                      <option>Private Car</option>
                      <option>Motorcycle</option>
                      <option>Other</option>
                    </select>

                    {visitor.vehicleMode !== "On Foot" && (
                      <input type="text" name="vehicleDetails" placeholder="Vehicle Details" value={visitor.vehicleDetails || ""} onChange={onChange} className="border p-2 w-full rounded" />
                    )}
                  </div>

                  <input type="date" name="date" value={visitor.date ? new Date(visitor.date).toISOString().split("T")[0] : ""} onChange={onChange} className="border p-2 w-full rounded" />

                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition">Save</button>
                  </div>
                </form>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
