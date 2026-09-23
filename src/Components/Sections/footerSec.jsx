import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { motion } from "framer-motion";

const socials = [
  {
    href: "https://www.facebook.com/arrowgologisticsofficial",
    label: "Facebook",
    Icon: FaFacebookF,
  },
  {
    href: "https://www.instagram.com/arrowgologisticsincofficial/",
    label: "Instagram",
    Icon: FaInstagram,
  },
  {
    href: "https://www.linkedin.com/company/arrowgo-logistics-official/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function FooterSec() {
  return (
    <footer className="relative bg-[#0B1220] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm sm:text-base"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.12 }}
      >
        {/* Logo + Socials */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center md:items-start space-y-6"
        >
          <img
            src="/logo9-white.png"
            alt="ArrowGo Logistics"
            className="h-20 sm:h-24 object-contain"
          />

          <div className="flex gap-3">
            {socials.map((social) => {
              const Icon = social.Icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group p-2.5 rounded-full border border-white/15 text-white/70 hover:border-[#2563EB]/50 hover:text-white transition-colors"
                >
                  <Icon className="text-sm sm:text-base transition-colors group-hover:text-[#2563EB]" />
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* Corporate Office */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center md:text-left"
        >
          <h3
            className="text-[11px] tracking-[0.25em] text-[#94A3B8] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            CORPORATE OFFICE
          </h3>
          <p className="text-white/90 leading-relaxed">
            Arrowgo-Logistics Inc.
            <br />
            WH 8001, Mabato Rd.
            <br />
            Ibayo-Tipas, Taguig 1630
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center md:text-left"
        >
          <h3
            className="text-[11px] tracking-[0.25em] text-[#94A3B8] mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            CONTACT
          </h3>

          <div className="space-y-3 text-white/90">
            <p>
              <span className="block text-white/50 text-xs mb-0.5">
                Luzon / Visayas
              </span>
              (+63) 966 1378 180
            </p>
            <p>
              <span className="block text-white/50 text-xs mb-0.5">
                Mindanao
              </span>
              (+63) 917 115 9001
            </p>
            <a
              href="mailto:query@arrowgologistics.com"
              className="inline-block break-all sm:break-normal hover:text-[#2563EB] transition-colors"
            >
              query@arrowgologistics.com
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* Dashed divider — same language as Hero/About/Request */}
      <div
        className="relative h-px max-w-7xl mx-auto"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,255,255,0.12) 0 6px, transparent 6px 12px)",
        }}
      />

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative py-5 text-center text-xs text-[#94A3B8]"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        © {new Date().getFullYear()} ARROWGO LOGISTICS INC.
      </motion.div>
    </footer>
  );
}