import React, { useState, useEffect, useRef } from "react";

export default function VisitorsHeader({
  darkMode,
  appointmentRequests,
  setIsAppointmentModalOpen,
  setIsAddModalOpen,
  setIsCompleteListModalOpen,
  visitors,
  selectedBranch,
  setSelectedBranch,

  // 🔽 Search props
  searchTerm,
  setSearchTerm,
  inputBg,
}) {
  const [branches, setBranches] = useState([]);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const contentRef = useRef(null);

  // Extract unique branches
  useEffect(() => {
    const uniqueBranches = [
      ...new Set(visitors.map((v) => v.branch).filter(Boolean)),
    ];
    setBranches(uniqueBranches);
  }, [visitors]);

  return (
    <div className="flex flex-col gap-4 mb-16">
      {/* Top row: Logo + Title + Desktop Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <img
            src="/logo4.png"
            alt="Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <h1
            className={`text-2xl font-bold ${
              darkMode
                ? "text-cyan-400 drop-shadow-lg"
                : "text-green-500 drop-shadow-lg"
            }`}
          >
            Visitors Management
          </h1>
        </div>

        {/* 🔍 Desktop Search */}
        <div className="hidden md:block">
          <input
            className={`border p-2 rounded w-64 transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-green-400
              hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
              ${inputBg}`}
            placeholder="Search visitor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 🔍 Mobile Search */}
      <div className="md:hidden">
        <input
          className={`border p-2 rounded w-full transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-green-400
            hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]
            ${inputBg}`}
          placeholder="Search visitor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Buttons & Branch Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-2">
        {/* Mobile accordion toggle */}
        <button
          className={`md:hidden px-4 py-2 rounded-lg transition-all duration-300 flex justify-between items-center
            ${
              darkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          onClick={() => setIsMobileActionsOpen(!isMobileActionsOpen)}
        >
          <span>Actions</span>
          <span
            className={`transform transition-transform ${
              isMobileActionsOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {/* Action buttons & branch filter */}
        <div
          ref={contentRef}
          className="overflow-hidden md:overflow-visible transition-[max-height] duration-500 md:flex md:gap-2"
          style={{
            maxHeight: isMobileActionsOpen
              ? contentRef.current?.scrollHeight + "px"
              : "0px",
          }}
        >
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-2 md:mt-0">
            {/* Appointment Requests */}
            <button
              onClick={() => setIsAppointmentModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-white"
            >
              Appointment Requests ({appointmentRequests.length})
            </button>

            {/* Add Visitor */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white"
            >
              Add Visitor
            </button>

            {/* View Completed Visitors */}
            <button
              onClick={() => setIsCompleteListModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white"
            >
              View Completed Visitors
            </button>

            {/* Branch Filter */}
            <select
              value={selectedBranch || ""}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm
                ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-800"
                }`}
            >
              <option value="">All Branches</option>
              {branches.map((branch, index) => (
                <option key={index} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
