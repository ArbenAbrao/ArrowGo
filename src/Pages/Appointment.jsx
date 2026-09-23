import React, { useState, useMemo, Fragment } from "react";
import {
  IdentificationIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  TruckIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";

/* ==========================================================
   DESIGN TOKENS
   Subject: a logistics company's visitor/vehicle gate pass.
   The form itself is styled as the physical artifact it
   produces — a gate pass ticket with a live, tearable stub —
   rather than a generic centered card.
   ========================================================== */
const font = {
  display: { fontFamily: "'Oswald', sans-serif" },
  mono: { fontFamily: "'IBM Plex Mono', monospace" },
};

// Single source of truth for the API base URL.
// Set REACT_APP_API_URL in your .env file (frontend root) so this never
// needs to be edited again when your WSL2/LAN IP changes. CRA only
// reads REACT_APP_* env vars, and only at build/dev-server start time,
// so restart 'npm start' after changing .env.
const API_URL = process.env.REACT_APP_API_URL;

const genPassNo = () => String(Math.floor(100000 + Math.random() * 900000));

/* ---------- reusable field shells ---------- */

function TextField({ icon: Icon, label, name, value, onChange, type = "text", mono = false, ...rest }) {
  return (
    <div className="relative flex items-end gap-2 border-b-2 border-[#D8CDB4] focus-within:border-[#C1442D] transition-colors py-2">
      {Icon && <Icon className="w-5 h-5 text-[#9A8E73] mb-1 shrink-0" />}
      <div className="relative flex-1">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          placeholder=" "
          className={`peer w-full bg-transparent outline-none text-[15px] text-[#1B2A47] pt-3 pb-0.5 ${
            mono ? "tracking-wide" : ""
          }`}
          style={mono ? font.mono : undefined}
          {...rest}
        />
        <label
          className="absolute left-0 top-3 text-[#9A8E73] text-[15px] pointer-events-none transition-all duration-200
            peer-focus:top-0 peer-focus:text-[11px] peer-focus:tracking-[0.14em] peer-focus:uppercase peer-focus:text-[#C1442D]
            peer-valid:top-0 peer-valid:text-[11px] peer-valid:tracking-[0.14em] peer-valid:uppercase peer-valid:text-[#6E7C97]"
        >
          {label}
        </label>
      </div>
    </div>
  );
}

function SelectField({ icon: Icon, label, name, value, onChange, options }) {
  return (
    <div className="relative flex items-end gap-2 border-b-2 border-[#D8CDB4] focus-within:border-[#C1442D] transition-colors py-2">
      {Icon && <Icon className="w-5 h-5 text-[#9A8E73] mb-1 shrink-0" />}
      <div className="relative flex-1">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required
          className="peer w-full appearance-none bg-transparent outline-none text-[15px] text-[#1B2A47] pt-3 pb-0.5 pr-6 cursor-pointer"
          style={font.mono}
        >
          <option value="" disabled hidden></option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <label
          className={`absolute left-0 pointer-events-none transition-all duration-200 ${
            value
              ? "top-0 text-[11px] tracking-[0.14em] uppercase text-[#6E7C97]"
              : "top-3 text-[15px] text-[#9A8E73]"
          }`}
        >
          {label}
        </label>
        <motion.span
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9A8E73] pointer-events-none text-xs"
          animate={{ rotate: value ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          ▾
        </motion.span>
      </div>
    </div>
  );
}

export default function Appointment() {
  const [form, setForm] = useState({
    visitorName: "",
    company: "",
    email: "",
    personToVisit: "",
    purpose: "",
    date: "",
    hour: "",
    minute: "",
    ampm: "",
    branch: "",
    appointmentRequest: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passNo, setPassNo] = useState(genPassNo);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (submitted) {
      // a fresh edit starts a new pass
      setSubmitted(false);
      setPassNo(genPassNo());
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedTime = `${form.hour}:${form.minute} ${form.ampm}`;

      const res = await axios.post(`${API_URL}/api/appointment-requests`, {
        visitorName: form.visitorName,
        company: form.company,
        email: form.email,
        personToVisit: form.personToVisit,
        purpose: form.purpose,
        date: form.date,
        scheduleTime: formattedTime,
        branch: form.branch,
      });

      console.log("Appointment created:", res.data);

      setSubmitted(true);
      setConfirmedEmail(form.email);
      setIsModalOpen(true);

      setForm({
        visitorName: "",
        company: "",
        email: "",
        personToVisit: "",
        purpose: "",
        date: "",
        hour: "",
        minute: "",
        ampm: "",
        branch: "",
        appointmentRequest: true,
      });
    } catch (err) {
      console.error("Failed to submit appointment", err);
      alert("Failed to submit appointment. Please try again.");
    }
  };

  // decorative barcode, deterministically "generated" from the pass data
  const barcode = useMemo(() => {
    const seed = `${passNo}${form.visitorName}${form.branch}` || "ARROWGO";
    return Array.from({ length: 34 }, (_, i) => {
      const code = seed.charCodeAt(i % seed.length) || 42;
      return (code % 4) + 1; // bar width 1–4
    });
  }, [passNo, form.visitorName, form.branch]);

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="min-h-screen bg-[#101B31] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="grid lg:grid-cols-[1fr_1.25fr]">
        {/* ================= LEFT — INFO PANEL ================= */}
        <div className="relative flex flex-col justify-between px-6 sm:px-10 lg:px-14 py-12 lg:py-16 lg:min-h-screen overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo22.png" alt="ArrowGo Logistics" className="h-10 w-auto" />
              <span className="text-lg font-semibold tracking-wide">ArrowGo Logistics</span>
            </div>

            <div className="flex items-center gap-2 text-[#E8871E] text-xs tracking-[0.3em] uppercase mb-4" style={font.mono}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8871E]" />
              Visitor &amp; Vehicle Access
            </div>

            <h1 className="text-5xl sm:text-6xl font-semibold leading-[1.05]" style={font.display}>
              Request your
              <span className="block text-[#E8871E]">gate pass.</span>
            </h1>

            <p className="mt-6 text-[#AEB8CC] text-base leading-7 max-w-md">
              Fill out the form and your host will review it. Once approved, your
              pass is ready to scan at the gate — no paperwork, no waiting in the
              guardhouse.
            </p>
          </div>

          {/* duotone photo */}
          <div className="relative mt-10 lg:mt-0">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-52 sm:h-64">
              <img
                src="/Truck11.jpg"
                alt="Visitor checking in at the front gate"
                className="w-full h-full object-cover grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101B31] via-[#101B31]/50 to-[#E8871E]/20 mix-blend-multiply" />
              <div className="absolute inset-0 bg-[#101B31]/25" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white/80" style={font.mono}>
                <TruckIcon className="w-4 h-4" />
                Front Gate · Live Check-In
              </div>
            </div>

            {/* route-dot divider */}
            <div className="flex items-center gap-2 mt-10 text-[#5A6B87]">
              <span className="w-2 h-2 rounded-full bg-[#E8871E]" />
              <span className="flex-1 border-t border-dashed border-[#2A3C63]" />
              <TruckIcon className="w-4 h-4 text-[#E8871E]" />
              <span className="flex-1 border-t border-dashed border-[#2A3C63]" />
              <span className="w-2 h-2 rounded-full bg-[#2F6F5E]" />
            </div>
          </div>
        </div>

        {/* ================= RIGHT — GATE PASS FORM ================= */}
        <div className="flex items-center justify-center px-4 sm:px-10 py-14 lg:py-20">
          <motion.div
            className="w-full max-w-xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="relative rounded-[26px] bg-[#F6F1E7] text-[#1B2A47] shadow-2xl overflow-hidden"
            >
              {/* header strip */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-[#12213D] text-white">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#8FA0C4]" style={font.mono}>
                    Gate Pass Request
                  </p>
                  <p className="text-sm mt-1" style={font.mono}>
                    No. {passNo}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase font-semibold ${
                    submitted ? "bg-[#2F6F5E]/20 text-[#6FCBA9]" : "bg-[#E8871E]/20 text-[#F5B25E]"
                  }`}
                  style={font.mono}
                >
                  {submitted ? "Submitted" : "Pending"}
                </span>
              </div>

              {/* form body */}
              <motion.form onSubmit={handleSubmit} className="px-6 sm:px-8 pt-6 pb-5 space-y-5" variants={containerVariants}>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <TextField
                    icon={IdentificationIcon}
                    label="Full Name"
                    name="visitorName"
                    value={form.visitorName}
                    onChange={handleChange}
                  />
                  <TextField
                    icon={BuildingOffice2Icon}
                    label="Company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <TextField
                    icon={EnvelopeIcon}
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  <p className="text-[11px] text-[#8A7F68] mt-1.5 ml-7">
                    We'll email you the moment your host approves or declines this request.
                  </p>
                </div>

                <SelectField
                  icon={MapPinIcon}
                  label="Branch"
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  options={["Marilao", "Taguig", "Palawan", "Cebu", "Davao"]}
                />

                <TextField
                  icon={UserIcon}
                  label="Person to Visit"
                  name="personToVisit"
                  value={form.personToVisit}
                  onChange={handleChange}
                />

                <TextField
                  icon={ClipboardDocumentListIcon}
                  label="Purpose"
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                />

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <TextField
                    icon={CalendarDaysIcon}
                    label="Date"
                    name="date"
                    type="text"
                    value={form.date}
                    onChange={handleChange}
                    mono
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = form.date ? "date" : "text")}
                  />

                  {/* time */}
                  <div className="relative flex items-end gap-2 border-b-2 border-[#D8CDB4] focus-within:border-[#C1442D] transition-colors py-2">
                    <ClockIcon className="w-5 h-5 text-[#9A8E73] mb-1 shrink-0" />
                    <div className="flex-1 flex items-center gap-1 pt-3 pb-0.5" style={font.mono}>
                      <select
                        name="hour"
                        value={form.hour}
                        onChange={handleChange}
                        required
                        className="bg-transparent outline-none text-[15px] w-9 cursor-pointer"
                      >
                        <option value="" disabled>HH</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {String(i + 1).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#9A8E73]">:</span>
                      <select
                        name="minute"
                        value={form.minute}
                        onChange={handleChange}
                        required
                        className="bg-transparent outline-none text-[15px] w-9 cursor-pointer"
                      >
                        <option value="" disabled>MM</option>
                        {Array.from({ length: 6 }, (_, i) => (
                          <option key={i} value={i * 10}>
                            {String(i * 10).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <select
                        name="ampm"
                        value={form.ampm}
                        onChange={handleChange}
                        required
                        className="bg-transparent outline-none text-[15px] ml-1 cursor-pointer"
                      >
                        <option value="" disabled>--</option>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  className="w-full mt-2 bg-[#C1442D] hover:bg-[#A83A26] text-white py-3 rounded-xl font-semibold tracking-wide shadow-md hover:shadow-lg transition-all"
                >
                  Submit Request
                </motion.button>
              </motion.form>

              {/* perforation */}
              <div className="relative px-6 sm:px-8">
                <div className="border-t border-dashed border-[#C9BFA9]" />
                <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#101B31]" />
                <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#101B31]" />
              </div>

              {/* stub */}
              <div className="px-6 sm:px-8 py-5 bg-[#ECE3D0] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] tracking-[0.1em] uppercase" style={font.mono}>
                  <div>
                    <p className="text-[#8A7F68]">Pass No.</p>
                    <p className="text-[#1B2A47] normal-case tracking-normal text-sm">{passNo}</p>
                  </div>
                  <div>
                    <p className="text-[#8A7F68]">Visitor</p>
                    <p className="text-[#1B2A47] normal-case tracking-normal text-sm">
                      {form.visitorName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8A7F68]">Branch</p>
                    <p className="text-[#1B2A47] normal-case tracking-normal text-sm">
                      {form.branch || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8A7F68]">Schedule</p>
                    <p className="text-[#1B2A47] normal-case tracking-normal text-sm">
                      {form.date && form.hour ? `${form.date} · ${form.hour}:${form.minute || "00"} ${form.ampm}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8A7F68]">Notify</p>
                    <p className="text-[#1B2A47] normal-case tracking-normal text-sm">
                      {form.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-[2px] h-8">
                  {barcode.map((w, i) => (
                    <span
                      key={i}
                      className="bg-[#1B2A47]/70"
                      style={{ width: `${w}px`, height: i % 5 === 0 ? "100%" : "70%" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <p className="text-center text-xs text-[#5A6B87] mt-6" style={font.mono}>
              Present this pass number at the gate for verification.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ================= CONFIRMATION MODAL ================= */}
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
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-90 rotate-6"
              enterTo="opacity-100 scale-100 rotate-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-[#F6F1E7] text-[#1B2A47] p-7 rounded-2xl text-center shadow-2xl w-full max-w-xs border-4 border-[#2F6F5E]">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#2F6F5E]" style={font.mono}>
                  ArrowGo Logistics
                </p>
                <h3 className="font-semibold text-xl text-[#2F6F5E] mt-2" style={font.display}>
                  Pass Submitted
                </h3>
                <p className="text-sm mt-2" style={font.mono}>
                  No. {passNo}
                </p>
                <p className="text-[#5A6B87] mt-3 text-sm">
                  Your host will review this request. We'll email{" "}
                  <span className="text-[#1B2A47] font-medium">{confirmedEmail || "you"}</span> once
                  it's approved or declined.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-5 w-full px-4 py-2.5 bg-[#12213D] text-white rounded-xl hover:bg-[#1B2E52] transition text-sm font-medium"
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5A6B87]" style={font.mono}>
            © {new Date().getFullYear()} ArrowGo Logistics Inc.
          </p>
          <div className="flex gap-5">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#8FA0C4] hover:text-[#E8871E] transition">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#8FA0C4] hover:text-[#E8871E] transition">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#8FA0C4] hover:text-[#E8871E] transition">
              <FaTwitter />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}