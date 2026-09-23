import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LogIn, LogOut, User, Truck, ArrowRight } from "lucide-react";

// Add these once, in index.html <head> (or your global font import):
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">

const images = [
  "/Truck1.jpg",
  "/Truck2.jpg",
  "/Truck3.jpg",
  "/Truck4.jpg",
  "/Truck5.jpg",
  "/Truck6.jpg",
  "/Truck7.jpg",
];

const SLIDE_DURATION = 5000;
const headline = ["WORLD CLASS", "LOGISTICS SYSTEM"];

function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("en-PH", { hour12: false });
}

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [entryType, setEntryType] = useState("visitor"); // alternates: visitor | vehicle
  const prefersReducedMotion = useReducedMotion();
  const clock = useLiveClock();

  const goTo = useCallback((i) => setIndex(i % images.length), []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [index]);

  useEffect(() => {
    const id = setInterval(() => {
      setEntryType((prev) => (prev === "visitor" ? "vehicle" : "visitor"));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const scrollToAppointment = () => {
    const section = document.getElementById("Request");
    if (!section) return;
    const y = section.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[#0B1220]">

      {/* Carousel layer */}
      <div className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            <motion.img
              src={images[index]}
              alt=""
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: prefersReducedMotion ? 1 : 1.08 }}
              transition={{ duration: SLIDE_DURATION / 1000 + 1, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060A12]/85 via-[#0B1220]/70 to-[#060A12]/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060A12] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-5xl text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-[11px] sm:text-xs tracking-[0.25em] text-[#94A3B8] bg-white/[0.04] border border-white/10 backdrop-blur rounded-full"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          HELLO, WE PROVIDE
        </motion.span>

        <h1
          className="font-extrabold uppercase leading-[0.95] mb-6 text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em" }}
        >
          {headline.map((line, i) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.12, duration: 0.7, ease: "easeOut" }}
              className={`block ${i === 1 ? "text-[#22C58B]" : ""}`}
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className="text-sm sm:text-base md:text-lg text-[#94A3B8] max-w-xl sm:max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Time in/time out management for staff, visitors, and vehicles —
          with live monitoring and operational analytics in one warehouse platform.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={scrollToAppointment}
          className="group relative inline-flex items-center gap-2 bg-[#2563EB] px-7 sm:px-9 py-3.5 sm:py-4 rounded-md font-semibold text-sm sm:text-base tracking-wide text-white overflow-hidden transition-colors hover:bg-[#3B74F0]"
        >
          Set Appointment
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </motion.button>
      </div>

      {/* Signature element: live gate log */}
      <div className="relative z-10 w-full max-w-3xl px-6 pb-8 sm:pb-10">
        <div
          className="flex items-center justify-between mb-3 text-[10px] tracking-[0.2em] text-[#94A3B8]"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            GATE LOG
          </span>
          <span className="text-white/50">WAREHOUSE ACCESS</span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/10 rounded-lg overflow-hidden border border-white/10 backdrop-blur">
          <div className="bg-[#0B1220]/70 px-4 py-3 sm:px-6 sm:py-4">
            <div
              className="flex items-center gap-1.5 mb-1.5 text-[10px] tracking-[0.2em] text-[#22C58B]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <LogIn size={12} /> TIME IN
            </div>
            <div
              className="text-lg sm:text-2xl text-white tabular-nums"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {clock}
            </div>
          </div>
          <div className="bg-[#0B1220]/70 px-4 py-3 sm:px-6 sm:py-4">
            <div
              className="flex items-center gap-1.5 mb-1.5 text-[10px] tracking-[0.2em] text-[#2563EB]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <LogOut size={12} /> TIME OUT
            </div>
            <div
              className="text-lg sm:text-2xl text-[#5B6A82] tabular-nums"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              — — : — — : — —
            </div>
          </div>
        </div>

        {/* Cycling entry type + scan sweep */}
        <div className="flex items-center gap-3 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={entryType}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] tracking-wide text-[#94A3B8]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {entryType === "visitor" ? (
                <User size={13} className="text-[#22C58B]" />
              ) : (
                <Truck size={13} className="text-[#2563EB]" />
              )}
              {entryType === "visitor" ? "VISITOR CHECK-IN" : "VEHICLE CHECK-IN"}
            </motion.div>
          </AnimatePresence>

          <div className="relative flex-1 h-px bg-white/10 overflow-hidden">
            {!prefersReducedMotion && (
              <motion.span
                className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                initial={{ left: "-10%" }}
                animate={{ left: "110%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
        </div>

        {/* Slide progress segments — carousel nav */}
        <div className="flex gap-1.5 mt-5">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="relative h-[3px] flex-1 rounded-full bg-white/10 overflow-hidden"
            >
              {i === index && (
                <motion.span
                  key={index}
                  className="absolute inset-y-0 left-0 bg-[#94A3B8]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                />
              )}
              {i < index && <span className="absolute inset-0 bg-[#94A3B8]" />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}