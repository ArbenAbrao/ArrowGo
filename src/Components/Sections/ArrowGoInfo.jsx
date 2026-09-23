import { motion, AnimatePresence } from "framer-motion";
import { Compass, Eye, BadgeCheck } from "lucide-react";

const pillars = [
  {
    number: "01",
    title: "Our Mission and Thrust",
    icon: Compass,
    desc: "In order to achieve our vision, our mission is to provide innovative and superior logistics solutions to our valuable clients — focusing on efficiency, safety, and customer satisfaction.",
    accent: "#059669",
  },
  {
    number: "02",
    title: "Our Vision",
    icon: Eye,
    desc: "We aim to be a leading logistics provider nationwide, known for reliability, innovation, and excellence in customer service.",
    accent: "#2563EB",
  },
  {
    number: "03",
    title: "Quality Policy",
    icon: BadgeCheck,
    desc: "ArrowGo believes in continuous improvement — in both its resources and services — to consistently deliver high-quality logistics solutions.",
    accent: "#059669",
  },
];

export default function ArrowGoInfo({ rotatingWords, currentWordIndex }) {
  return (
    <section id="arrowgo" className="relative bg-white py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0B1220 1px, transparent 1px), linear-gradient(90deg, #0B1220 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-[11px] tracking-[0.25em] text-[#0B1220]/60 border border-[#0B1220]/10 rounded-full"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            WHO WE ARE
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-extrabold uppercase leading-[1.05] mb-6 text-[#0B1220] text-3xl sm:text-4xl md:text-5xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            We are ArrowGo, we{" "}
            <span className="inline-block text-[#059669]" style={{ minWidth: "8ch" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[currentWordIndex]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block"
                >
                  {rotatingWords[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            solutions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[#475569] text-base md:text-lg max-w-2xl mx-auto"
          >
            ArrowGo Logistics combines years of experience with excellent
            customer service to deliver tailor-made logistics and warehouse
            solutions.
          </motion.p>
        </div>

        {/* Pillars */}
        <div className="grid md:grid-cols-3">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                className={`px-6 md:px-8 py-8 md:py-0 ${
                  i !== 0 ? "md:border-l md:border-[#0B1220]/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="text-3xl font-extrabold"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: pillar.accent,
                    }}
                  >
                    {pillar.number}
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md"
                    style={{ backgroundColor: `${pillar.accent}14`, color: pillar.accent }}
                  >
                    <Icon size={16} />
                  </span>
                </div>

                <h3
                  className="text-xl md:text-2xl font-bold mb-3 text-[#0B1220]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-[#475569] text-sm md:text-base leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}