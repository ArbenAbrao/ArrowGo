import React, { useState } from "react";

export default function AppointmentLanding() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    vehicleMode: "On Foot", // NEW FIELD
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // SAVE TO LOCALSTORAGE
  const saveAppointment = () => {
    const existing = JSON.parse(localStorage.getItem("appointments_v1")) || [];

    const newAppointment = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      date: form.date,
      time: form.time,
      vehicleMode: form.vehicleMode,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const updated = [...existing, newAppointment];
    localStorage.setItem("appointments_v1", JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveAppointment();
    alert("Your appointment request has been submitted!");
    setForm({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      vehicleMode: "On Foot",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-xl p-8 rounded-2xl">
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
          Book an Appointment
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            />
          </div>

          {/* Vehicle Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              How will you arrive?
            </label>
            <select
              name="vehicleMode"
              value={form.vehicleMode}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            >
              <option value="On Foot">On Foot</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Private Car">Private Car</option>
              <option value="Company Vehicle">Company Vehicle</option>
              <option value="Truck">Truck</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
            <input
              type="date"
              name="date"
              required
              value={form.date}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
            <input
              type="time"
              name="time"
              required
              value={form.time}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-green-600 focus:outline-none"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Submit Appointment
          </button>
        </form>
      </div>
    </div>
  );
}
