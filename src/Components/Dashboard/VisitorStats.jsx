import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { UserIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import axios from "axios";

const VisitorStats = forwardRef(({ darkMode }, ref) => {
  const [visitors, setVisitors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [openIndex, setOpenIndex] = useState(null); // for mobile accordion

  const fetchStats = async () => {
    try {
      const [visitorRes, appointmentRes] = await Promise.all([
        axios.get("http://192.168.100.206:5000/api/visitors"),
        axios.get("http://192.168.100.206:5000/api/appointment-requests/approved"),
      ]);

      setVisitors(visitorRes.data || []);
      setAppointments(appointmentRes.data || []);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchStats,
  }));

  useEffect(() => {
    fetchStats();
  }, []);

  const totalVisitors = visitors.length;
  const activeVisitors = visitors.filter((v) => !v.timeOut).length;
  const completedVisitors = visitors.filter((v) => v.timeOut).length;

  const approvedAppointments = appointments;
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = approvedAppointments.filter((a) => {
    if (!a.date) return false;
    return new Date(a.date).toISOString().split("T")[0] === todayStr;
  }).length;

  const cardBg = darkMode
    ? "bg-gray-900 text-gray-300"
    : "bg-green-100 text-green-900";

  const stats = [
    { icon: UserIcon, label: "Total Visitors", value: totalVisitors, color: darkMode ? "text-green-400" : "text-green-700", neonColor: darkMode ? "#22c55e" : "#166534" },
    { icon: UserIcon, label: "Active Visitors", value: activeVisitors, color: darkMode ? "text-blue-400" : "text-blue-700", neonColor: darkMode ? "#60a5fa" : "#1e3a8a" },
    { icon: UserIcon, label: "Completed Visitors", value: completedVisitors, color: darkMode ? "text-red-400" : "text-red-700", neonColor: darkMode ? "#f87171" : "#b91c1c" },
    { icon: CalendarIcon, label: "Approved Appointments", value: approvedAppointments.length, color: darkMode ? "text-purple-400" : "text-purple-700", neonColor: darkMode ? "#c084fc" : "#6b21a8" },
    { icon: CalendarIcon, label: "Today's Appointments", value: todaysAppointments, color: darkMode ? "text-cyan-400" : "text-cyan-700", neonColor: darkMode ? "#22d3ee" : "#155e75" },
  ];

  return (
    <div className="w-full">
      {/* Desktop / large screens */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4 auto-rows-fr">
        {stats.map((card, i) => (
          <article
            key={i}
            className={`flex flex-col gap-2 p-4 mb-4 rounded-lg shadow-md ${cardBg} transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg cursor-pointer relative overflow-hidden`}
          >
            <div className="flex items-center gap-2">
              <card.icon className={`w-6 h-6 ${card.color}`} />
              <span className="font-semibold text-sm">{card.label}</span>
            </div>
            <h2 className="text-2xl font-bold">{card.value}</h2>
            <span
              className="absolute bottom-0 left-0 w-full h-1 opacity-0 transition-all duration-300"
              style={{
                boxShadow: `0 0 10px ${card.neonColor}, 0 0 20px ${card.neonColor}`,
                backgroundColor: card.neonColor,
              }}
            />
            <style jsx>{`
              article:hover span {
                opacity: 1;
              }
            `}</style>
          </article>
        ))}
      </div>

      {/* Mobile / small screens */}
      <div className="md:hidden flex flex-col gap-2">
        {stats.map((card, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`rounded-lg shadow-md ${cardBg} overflow-hidden`}>
              {/* Accordion Header */}
              <button
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <span className="font-semibold">{card.label}</span>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>

              {/* Accordion Content */}
              <div
                className="transition-[max-height] duration-500 ease-in-out overflow-hidden"
                style={{
                  maxHeight: isOpen ? "200px" : "0px",
                }}
              >
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                  <h2 className="text-2xl font-bold">{card.value}</h2>
                  <span
                    className="block w-full h-1 mt-2 rounded"
                    style={{
                      boxShadow: `0 0 10px ${card.neonColor}, 0 0 20px ${card.neonColor}`,
                      backgroundColor: card.neonColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VisitorStats;
