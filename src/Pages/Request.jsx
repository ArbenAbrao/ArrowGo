// src/Pages/Request.jsx
import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import RegisteredTrucksModal from "../Components/Trucks/RegisteredTrucksModal";

export default function Request() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);

  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem("pendingRequests")) || [];
    setRequests(pending);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  // ✅ APPROVE REQUEST
  const approve = async (req) => {
    try {
      if (req.type === "appointment") {
        const appointmentVisitor = {
          visitorName: req.data.visitorName,
          company: req.data.company || "",
          personToVisit: req.data.personToVisit,
          purpose: req.data.purpose,
          idType: "",
          idNumber: "",
          badgeNumber: "",
          vehicleMode: "On Foot",
          vehicleDetails: "",
          date: req.data.date,
          timeIn: "",
          timeOut: "",
          appointmentRequest: true,
        };

        await axios.post(
          "http://localhost:5000/api/visitors/add",
          appointmentVisitor
        );
      }

      if (req.type === "truck") {
        // POST to register-truck endpoint
        const truckPayload = {
          plateNumber: req.data.plateNumber,
          truckType: req.data.truckType,
          clientName: req.data.clientName,
        };

        await axios.post(
          "http://localhost:5000/api/register-truck",
          truckPayload
        );

        // Refresh clients list
        fetchClients();

        // Open Registered Trucks modal automatically
        setIsRegisteredModalOpen(true);
      }

      // Remove approved request
      removeRequest(req.id);
      closeModal();
    } catch (err) {
      console.error("Approval failed", err);
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  const reject = (id) => {
    removeRequest(id);
    closeModal();
  };

  const removeRequest = (id) => {
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    localStorage.setItem("pendingRequests", JSON.stringify(updated));
  };

  const appointmentRequests = requests.filter((r) => r.type === "appointment");
  const truckRequests = requests.filter((r) => r.type === "truck");

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Pending Requests
      </h1>

      {/* APPOINTMENT REQUESTS */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Appointment Requests
        </h2>

        {appointmentRequests.length === 0 ? (
          <p className="text-gray-500">No pending appointment requests</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {appointmentRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => openModal(req)}
                className="cursor-pointer bg-white shadow-lg rounded-xl p-5 hover:shadow-2xl transition"
              >
                <p className="text-xs font-bold text-blue-600 uppercase">
                  Appointment
                </p>
                <p className="text-lg font-bold">{req.data.visitorName}</p>
                <p className="text-gray-600">
                  Person: {req.data.personToVisit}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {req.data.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TRUCK REQUESTS */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-green-700">
          Truck Requests
        </h2>

        {truckRequests.length === 0 ? (
          <p className="text-gray-500">No pending truck requests</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {truckRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => openModal(req)}
                className="cursor-pointer bg-white shadow-lg rounded-xl p-5 hover:shadow-2xl transition"
              >
                <p className="text-xs font-bold text-green-600 uppercase">
                  Truck
                </p>
                <p className="text-lg font-bold">{req.data.plateNumber}</p>
                <p className="text-gray-600">
                  Type: {req.data.truckType}
                </p>
                <p className="text-gray-600">
                  Client: {req.data.clientName}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 bg-black bg-opacity-40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
              <Dialog.Title className="text-lg font-bold mb-4">
                Approve Request
              </Dialog.Title>

              <p className="font-semibold">
                {selectedRequest?.data?.visitorName ||
                  selectedRequest?.data?.plateNumber}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => approve(selectedRequest)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(selectedRequest.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg"
                >
                  Reject
                </button>
              </div>

              <button
                onClick={closeModal}
                className="mt-4 w-full border py-2 rounded-lg"
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
