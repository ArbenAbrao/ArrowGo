import { motion } from "framer-motion";
import { Warehouse, Truck, Boxes, Send } from "lucide-react";

const manifest = [
  {
    code: "WH-01",
    title: "Warehousing",
    desc: "Secure, scalable storage that adapts to demand.",
    icon: Warehouse,
  },
  {
    code: "TR-02",
    title: "Transportation",
    desc: "Seamless movement across the full supply chain.",
    icon: Truck,
  },
  {
    code: "IN-03",
    title: "Inventory Management",
    desc: "Real-time visibility into stock and flow.",
    icon: Boxes,
  },
  {
    code: "DS-04",
    title: "Distribution",
    desc: "Reliable delivery, timed to your operations.",
    icon: Send,
  },
];

export default function About() {
  return (
    <section id="about" className="relative w-full bg-white py-24 px-6 overflow-hidden">
      {/* Faint blueprint grid — industrial texture, kept very quiet */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0B1220 1px, transparent 1px), linear-gradient(90deg, #0B1220 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-[11px] tracking-[0.25em] text-[#0B1220]/60 border border-[#0B1220]/10 rounded-full"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          ABOUT ARROWGO
        </motion.span>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl font-extrabold uppercase leading-[1.05] text-[#0B1220] text-3xl sm:text-4xl lg:text-5xl mb-16"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          <span className="text-[#059669]">Arrowgo-Logistics Inc.</span> is
          committed to providing comprehensive third-party logistics solutions
        </motion.h2>

        {/* Content grid */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">

          {/* LEFT — narrative + stat */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <p className="text-[#475569] leading-relaxed mb-10">
              From seamless transportation and warehousing to inventory
              management and distribution, our services streamline your
              supply chain and eliminate operational bottlenecks — so your
              business can focus on growth, not logistics.
            </p>

            <div className="flex items-end gap-4 pt-8 border-t border-[#0B1220]/10">
              <span
                className="text-6xl sm:text-7xl font-extrabold text-[#2563EB] leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                10+
              </span>
              <span
                className="text-xs tracking-[0.15em] text-[#94A3B8] mb-2 uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Years delivering<br />end-to-end logistics
              </span>
            </div>
          </motion.div>

          {/* RIGHT — service manifest */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div
              className="mb-4 text-[10px] tracking-[0.25em] text-[#0B1220]/50"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              SERVICE MANIFEST
            </div>

            <div className="border-t border-[#0B1220]/10">
              {manifest.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.code}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                    className="group flex items-center gap-4 sm:gap-6 py-5"
                    style={{
                      borderBottom: "1px dashed rgba(11,18,32,0.15)",
                    }}
                  >
                    <span
                      className="text-xs text-[#94A3B8] w-12 shrink-0"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {item.code}
                    </span>

                    <span className="flex items-center justify-center w-9 h-9 rounded-md bg-[#0B1220]/[0.03] text-[#0B1220]/70 shrink-0 transition-colors group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB]">
                      <Icon size={16} />
                    </span>

                    <div className="min-w-0">
                      <div className="font-semibold text-[#0B1220] text-sm sm:text-base">
                        {item.title}
                      </div>
                      <div className="text-[#94A3B8] text-xs sm:text-sm truncate">
                        {item.desc}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Field note — pulled from the warehousing paragraph */}
            <motion.blockquote
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 pl-4 border-l-2 border-[#059669] text-sm sm:text-base text-[#475569] leading-relaxed"
            >
              Secure, scalable, and strategically located storage that
              adapts to your operations — inventory protected and ready
              for distribution exactly when you need it.
            </motion.blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
}