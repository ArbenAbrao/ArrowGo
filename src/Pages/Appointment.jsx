// src/Pages/Appointment.jsx
import React, { useState, Fragment, useEffect } from "react";
import axios from "axios";
import { UserIcon, CalendarDaysIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Appointment() {
  const [form, setForm] = useState({
    visitorName: "",
    company: "",
    personToVisit: "",
    purpose: "",
    date: "",
    appointmentRequest: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFooter(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const pending = JSON.parse(localStorage.getItem("pendingRequests")) || [];

  pending.push({
    id: Date.now(),
    type: "appointment",
    data: form,
  });

  localStorage.setItem("pendingRequests", JSON.stringify(pending));

  setIsModalOpen(true);
  setForm({
    visitorName: "",
    company: "",
    personToVisit: "",
    purpose: "",
    date: "",
    appointmentRequest: true,
  });
};


  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6 relative"
      style={{
        backgroundImage: "url('/Truck1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Appointment Card */}
        <div className="bg-white bg-opacity-95 shadow-lg rounded-3xl p-8 max-w-xl w-full relative transition-transform duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm">
          
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img src="/logo4.png" alt="Logo" className="h-16 w-16 object-contain" />
          </div>

          {/* Company Name */}
          <h2 className="text-center text-green-800 font-bold text-xl mb-4">
            ArrowGo Logistics Inc.
          </h2>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <UserIcon className="w-10 h-10 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Appointment Request Form
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="relative">
              <input
                type="text"
                name="visitorName"
                value={form.visitorName}
                onChange={handleChange}
                placeholder=" "
                className="peer w-full border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
                required
              />
              <label className="absolute left-0 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder=" "
                className="peer w-full border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
              />
              <label className="absolute left-0 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Company
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                name="personToVisit"
                value={form.personToVisit}
                onChange={handleChange}
                placeholder=" "
                className="peer w-full border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
                required
              />
              <label className="absolute left-0 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Person To Visit
              </label>
            </div>

            <div className="relative flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-gray-700" />
              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder=" "
                className="peer flex-1 border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
                required
              />
              <label className="absolute left-7 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Purpose
              </label>
            </div>

            <div className="relative flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-700" />
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="peer flex-1 border-b-2 border-gray-300 focus:border-green-500 outline-none py-2"
                required
              />
              <label className="absolute left-7 -top-3.5 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base transition-all">
                Date of Visit
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              Submit Appointment Request
            </button>
          </form>

          {/* Success Modal */}
          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-50" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl transition-all">
                      <h3 className="text-lg font-bold text-gray-900">Appointment Submitted ✅</h3>
                      <p className="mt-2 text-gray-500">
                        Your appointment request has been successfully submitted. Please wait for confirmation.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="mt-4 px-4 py-2 rounded-xl text-white font-semibold shadow-md transition-all duration-300 transform hover:scale-105 bg-green-600 hover:bg-green-700"
                      >
                        Close
                      </button>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>

        {/* Footer */}
        <footer
          className={`mt-10 w-full bg-white bg-opacity-90 backdrop-blur-md text-gray-700 rounded-xl shadow-inner transition-all duration-700 transform ${
            showFooter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">

            <div>
              <h3 className="font-bold text-green-700 mb-2">Location</h3>
              <p>
                Warehouse A & B<br />
                New Bypass Road Angliongto, Mamay Road,<br />
                Buhangin District,<br />
                Davao City
              </p>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">Operating Hours</h3>
              <p>
                Mon-Fri: 8:30 am - 5:30 pm<br />
                Sat: 8:00 am - 2:00 pm<br />
                Sun: Closed
              </p>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">Call Us</h3>
              <p>
                (082) 238 2263<br />
                Sales: (082) 238 2263
              </p>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">Social Media</h3>
              <div className="flex gap-3 mt-1">
                <a href="#" className="text-green-700 hover:text-green-900 transition-transform transform hover:scale-110">
                  <FaFacebookF size={18} />
                </a>
                <a href="#" className="text-pink-500 hover:text-pink-700 transition-transform transform hover:scale-110">
                  <FaInstagram size={18} />
                </a>
                <a href="#" className="text-blue-500 hover:text-blue-700 transition-transform transform hover:scale-110">
                  <FaTwitter size={18} />
                </a>
              </div>
            </div>
          </div> 

          <div className="border-t border-gray-200 mt-4 pt-2 text-center text-gray-500 text-xs sm:text-sm rounded-b-xl">
            &copy; {new Date().getFullYear()} ArrowGo Logistics Inc. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
