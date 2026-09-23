// src/Components/Sections/Request.jsx
import { motion } from "framer-motion";
import { Truck, CalendarCheck, ArrowUpRight } from "lucide-react";

const cards = [
  {
    code: "OP-01",
    title: "Register Truck",
    desc: "Register your truck to start scheduling pickups and deliveries.",
    icon: Truck,
    btnText: "Register Truck",
    link: "/register-truck",
    status: "LOGIN REQUIRED",
    accent: "#059669",
    requiresLogin: true,
  },
  {
    code: "OP-02",
    title: "Set Appointment",
    desc: "Visit our office to inquire or schedule an appointment conveniently.",
    icon: CalendarCheck,
    btnText: "Set Appointment",
    link: "/appointment",
    status: "NO LOGIN NEEDED",
    accent: "#2563EB",
    requiresLogin: false,
  },
];

export default function Request({ onLoginClick }) {
  return (
    <section id="Request" className="relative bg-white py-24 px-6 overflow-hidden">
      {/* Same quiet blueprint grid as About — keeps sections feeling like one system */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0B1220 1px, transparent 1px), linear-gradient(90deg, #0B1220 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-[11px] tracking-[0.25em] text-[#0B1220]/60 border border-[#0B1220]/10 rounded-full"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          GET STARTED
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-extrabold uppercase leading-[1.05] text-[#0B1220] text-3xl sm:text-4xl lg:text-5xl mb-16"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Register a truck, or set an appointment
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 text-left">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="group relative rounded-xl border border-[#0B1220]/10 bg-white overflow-hidden transition-shadow duration-300 hover:shadow-[0_16px_40px_-16px_rgba(11,18,32,0.25)]"
              >
                {/* Ticket header strip */}
                <div className="flex items-center justify-between px-6 sm:px-7 pt-6">
                  <span
                    className="text-xs tracking-[0.2em] text-[#94A3B8]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {card.code}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.15em] px-2.5 py-1 rounded-full border"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: card.accent,
                      borderColor: `${card.accent}33`,
                      backgroundColor: `${card.accent}0D`,
                    }}
                  >
                    {card.status}
                  </span>
                </div>

                <div className="px-6 sm:px-7 pt-5">
                  <span
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-5"
                    style={{ backgroundColor: `${card.accent}14`, color: card.accent }}
                  >
                    <Icon size={20} />
                  </span>

                  <h3
                    className="text-xl sm:text-2xl font-bold text-[#0B1220] mb-2"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-[#475569] text-sm sm:text-base leading-relaxed mb-8">
                    {card.desc}
                  </p>
                </div>

                {/* Perforated tear line */}
                <div className="relative px-0">
                  <div
                    className="w-full h-px"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, rgba(11,18,32,0.15) 0 6px, transparent 6px 12px)",
                    }}
                  />
                  <span className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-white border border-[#0B1220]/10" />
                  <span className="absolute -right-2.5 -top-2.5 w-5 h-5 rounded-full bg-white border border-[#0B1220]/10" />
                </div>

                <div className="px-6 sm:px-7 py-6">
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (!card.requiresLogin) {
                        window.open(card.link, "_blank");
                      } else {
                        onLoginClick(card.link);
                      }
                    }}
                    className="group/btn inline-flex items-center gap-1.5 font-semibold text-sm sm:text-base text-white px-5 py-2.5 rounded-md transition-colors"
                    style={{ backgroundColor: card.accent }}
                  >
                    {card.btnText}
                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                    />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}