import { motion } from "framer-motion";
import { Warehouse, Ship, Network, FileCheck, PackageOpen, Truck } from "lucide-react";

const services = [
  {
    code: "SVC-01",
    title: "Warehousing / Storage",
    icon: Warehouse,
    frontDesc:
      "Warehousing and storage facilities, backed by full warehouse management, built to grow with your business.",
    backDesc:
      "Reliable utilities, warehouse infrastructure, and an experienced team — available when and how you need them.",
    accent: "#059669",
  },
  {
    code: "SVC-02",
    title: "Sea and Air Forwarding",
    icon: Ship,
    frontDesc:
      "Reliable, cost-effective sea and air freight solutions for any transportation requirement.",
    backDesc:
      "Every client is different, so every shipping solution is tailor-made to fit their specific needs.",
    accent: "#2563EB",
  },
  {
    code: "SVC-03",
    title: "Supply Chain Management",
    icon: Network,
    frontDesc:
      "Fast-paced planning and execution on the transport of goods, built to work in your favor.",
    backDesc:
      "10 years of market experience, put to work as an asset for your business.",
    accent: "#059669",
  },
  {
    code: "SVC-04",
    title: "Customs Brokerage",
    icon: FileCheck,
    frontDesc:
      "Licensed, highly experienced brokers delivering high-quality service on every clearance.",
    backDesc: "We move your goods with honesty, and with greatness.",
    accent: "#2563EB",
  },
  {
    code: "SVC-05",
    title: "Packing and Crating",
    icon: PackageOpen,
    frontDesc:
      "We handle the packing and crating so your team can stay focused on core operations.",
    backDesc: "See the difference for yourself.",
    accent: "#059669",
  },
  {
    code: "SVC-06",
    title: "Trucking and Distribution",
    icon: Truck,
    frontDesc:
      "Trucking and distribution services that keep your business moving and growing.",
    backDesc: "Logistics, beyond expectation.",
    accent: "#2563EB",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative bg-[#F8FAFC] py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0B1220 1px, transparent 1px), linear-gradient(90deg, #0B1220 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-6xl mx-auto text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-[11px] tracking-[0.25em] text-[#0B1220]/60 border border-[#0B1220]/10 rounded-full"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          OUR SERVICES
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-extrabold uppercase leading-[1.05] text-[#0B1220] text-3xl sm:text-4xl lg:text-5xl mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          One-stop-shop logistics
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[#475569] mb-16 max-w-xl mx-auto"
        >
          Six service lines, one platform — hover a card to see how it works.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" style={{ perspective: 1200 }}>
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.code}
                className="w-full h-72 cursor-pointer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-xl bg-white border border-[#0B1220]/10 p-6 flex flex-col items-start text-left shadow-[0_8px_24px_-16px_rgba(11,18,32,0.15)]"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="w-full h-1 rounded-full mb-5" style={{ backgroundColor: `${service.accent}` }} />
                    <span
                      className="text-[10px] tracking-[0.2em] text-[#94A3B8] mb-4"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {service.code}
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-5"
                      style={{ backgroundColor: `${service.accent}14`, color: service.accent }}
                    >
                      <Icon size={20} />
                    </span>
                    <h4
                      className="text-lg font-bold text-[#0B1220] mb-2"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {service.title}
                    </h4>
                    <p className="text-[#475569] text-sm leading-relaxed">{service.frontDesc}</p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-xl p-6 flex flex-col items-start justify-center text-left"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: "#0B1220",
                    }}
                  >
                    <span
                      className="text-[10px] tracking-[0.2em] mb-4"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: service.accent }}
                    >
                      {service.code} — DETAIL
                    </span>
                    <h4
                      className="text-lg font-bold text-white mb-3"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {service.title}
                    </h4>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{service.backDesc}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}