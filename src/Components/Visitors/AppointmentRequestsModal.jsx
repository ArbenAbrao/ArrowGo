import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BellIcon,
  XMarkIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function AppointmentRequestsModal({
  isOpen,
  onClose,
  appointmentRequests = [],
  acceptAppointment,
  processingId,
  darkMode = true,
}) {
  /* ================= LOCAL STATES ================= */
  const [filterDate, setFilterDate] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [toast, setToast] = useState(null);
  const [openDates, setOpenDates] = useState({});
  const [openBranches, setOpenBranches] = useState({});

  const isDesktop =
    typeof window !== "undefined" && window.innerWidth >= 640;

  /* ================= HELPERS ================= */
  const normalizeDate = (v) =>
    v ? new Date(v).toISOString().split("T")[0] : "";

  const readableDate = (v) =>
    new Date(v).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  /* ================= BRANCH OPTIONS ================= */
  const branchOptions = useMemo(() => {
    return [...new Set(appointmentRequests.map((a) => a.branch).filter(Boolean))];
  }, [appointmentRequests]);

  /* ================= FILTER + GROUP ================= */
  const groupedAppointments = useMemo(() => {
    const approved = appointmentRequests.filter(
      (a) => String(a.status).toLowerCase() === "approved"
    );

    const filtered = approved.filter((a) => {
      const matchDate = filterDate
        ? normalizeDate(a.date) === normalizeDate(filterDate)
        : true;

      const q = search.toLowerCase();
      const matchSearch =
        a.visitor_name.toLowerCase().includes(q) ||
        a.person_to_visit.toLowerCase().includes(q);

      const matchBranch = selectedBranch
        ? a.branch === selectedBranch
        : true;

      return matchDate && matchSearch && matchBranch;
    });

    const grouped = filtered.reduce((acc, item) => {
      const key = normalizeDate(item.date);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  }, [appointmentRequests, filterDate, search, selectedBranch]);

  /* ================= ACTION ================= */
  const handleAccept = (raw) => {
    acceptAppointment({
      ...raw,
      visitorName: raw.visitor_name,
      personToVisit: raw.person_to_visit,
      timeIn: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeOut: "",
    });

    setToast("Appointment accepted • Time-in recorded ✅");
    setTimeout(() => setToast(null), 2200);
  };

  /* ================= ACCORDION ================= */
  const toggleDate = (key) => {
    if (isDesktop) return;
    setOpenDates((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleBranch = (key) => {
    setOpenBranches((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ================= THEME ================= */
  const theme = darkMode
    ? { modal: "bg-gray-900 text-gray-100", card: "bg-gray-800" }
    : { modal: "bg-white text-gray-900", card: "bg-gray-100" };

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="fixed inset-0 flex justify-center pt-16">
            <Dialog.Panel
              className={`w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden ${theme.modal}`}
            >
              {/* HEADER */}
              <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <BellIcon className="w-6 h-6" />
                    <h2 className="text-lg font-semibold">
                      Approved Appointments
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-black/20"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* FILTERS */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 opacity-70" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search visitor or person"
                      className="w-full pl-9 py-2 rounded-lg bg-black/20 border border-white/20"
                    />
                  </div>

                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 opacity-70" />
                    <DatePicker
                      selected={filterDate}
                      onChange={setFilterDate}
                      placeholderText="Filter date"
                      className="w-full pl-9 py-2 rounded-lg bg-black/20 border border-white/20"
                    />
                  </div>

                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/20 border border-white/20"
                  >
                    <option value="">All Branches</option>
                    {branchOptions.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>

                  {(filterDate || selectedBranch) && (
                    <button
                      onClick={() => {
                        setFilterDate(null);
                        setSelectedBranch("");
                      }}
                      className="rounded-lg bg-yellow-400/30"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* BODY */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {Object.entries(groupedAppointments).map(
                  ([dateKey, items]) => {
                    const isOpen = openDates[dateKey];

                    const branches = items.reduce((acc, i) => {
                      const b = i.branch || "Unknown Branch";
                      acc[b] = acc[b] || [];
                      acc[b].push(i);
                      return acc;
                    }, {});

                    return (
                      <div key={dateKey} className="space-y-4">
                        {/* DATE HEADER */}
                        <button
                          onClick={() => toggleDate(dateKey)}
                          className="w-full flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold uppercase opacity-80">
                              {readableDate(dateKey)}
                            </h3>

                            {!isDesktop && (
                              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20">
                                🏢 {Object.keys(branches).length} Branch
                                {Object.keys(branches).length > 1 && "es"}
                              </span>
                            )}
                          </div>

                          {!isDesktop && (
                            <ChevronDownIcon
                              className={`w-5 h-5 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>

                        {/* DESKTOP */}
                        {isDesktop && (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {items.map((raw) => (
                              <div
                                key={raw.id}
                                className={`rounded-xl p-5 ${theme.card}`}
                              >
                                <h4 className="font-semibold text-lg">
                                  {raw.visitor_name}
                                </h4>
                                <p className="text-sm opacity-80">
                                  Visiting: {raw.person_to_visit}
                                </p>
                                {/* BADGES */}
                                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                                      <span className="px-3 py-1 rounded-full bg-blue-500/20">
                                        📅 {readableDate(raw.date)}
                                      </span>

                                      <span className="px-3 py-1 rounded-full bg-purple-500/20">
                                        ⏰ {raw.schedule_time}
                                      </span>

                                      <span className="px-3 py-1 rounded-full bg-emerald-500/20">
                                        🏢 {raw.branch || "Unknown Branch"}
                                      </span>
                                    </div>
                                <button
                                  onClick={() => handleAccept(raw)}
                                  className="mt-4 w-full py-2 rounded-lg bg-green-500 text-black"
                                >
                                  Time In
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* MOBILE → BRANCH ACCORDION */}
                        {!isDesktop && (
                          <AnimatePresence>
                            {isOpen &&
                              Object.entries(branches).map(
                                ([branch, list]) => {
                                  const key = `${dateKey}-${branch}`;
                                  const open = openBranches[key];

                                  return (
                                    <motion.div
                                      key={key}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="ml-3"
                                    >
                                      <button
                                        onClick={() => toggleBranch(key)}
                                        className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-purple-500/10"
                                      >
                                        <span className="text-sm">
                                          🏢 {branch}
                                        </span>
                                        <ChevronDownIcon
                                          className={`w-4 h-4 transition-transform ${
                                            open ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      <AnimatePresence>
                                        {open && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="grid gap-4 mt-3"
                                          >
                                            {list.map((raw) => (
                                              <div
                                                key={raw.id}
                                                className={`rounded-xl p-5 ${theme.card}`}
                                              >
                                                <h4 className="font-semibold">
                                                  {raw.visitor_name}
                                                </h4>
                                                <p className="text-sm opacity-80">
                                                  Visiting:{" "}
                                                  {raw.person_to_visit}
                                                </p>
                                                {/* BADGES */}
                                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                                      <span className="px-3 py-1 rounded-full bg-blue-500/20">
                                        📅 {readableDate(raw.date)}
                                      </span>

                                      <span className="px-3 py-1 rounded-full bg-purple-500/20">
                                        ⏰ {raw.schedule_time}
                                      </span>

                                      <span className="px-3 py-1 rounded-full bg-emerald-500/20">
                                        🏢 {raw.branch || "Unknown Branch"}
                                      </span>
                                    </div>
                                                <button
                                                  onClick={() =>
                                                    handleAccept(raw)
                                                  }
                                                  className="mt-4 w-full py-2 rounded-lg bg-green-500 text-black"
                                                >
                                                  Time In
                                                </button>
                                              </div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  );
                                }
                              )}
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-5 right-5 bg-green-600 px-6 py-3 rounded-xl text-white"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
