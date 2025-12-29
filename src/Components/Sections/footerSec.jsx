import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { motion } from "framer-motion";

export default function FooterSec() {
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-white border-t border-gray-200">

      <motion.div
        className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-800 text-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.12 }}
      >

        {/* Logo + Socials */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center space-y-3"
        >
          <img
            src="/logo5.png"
            alt="ArrowGo Logistics"
            className="h-20 object-contain"
          />

          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/arrowgologisticsofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Facebook"
            >
              <FaFacebookF className="text-sm" />
            </a>
            <a
              href="https://www.instagram.com/arrowgologisticsincofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Instagram"
            >
              <FaInstagram className="text-sm" />
            </a>
            <a
              href="https://www.linkedin.com/company/arrowgo-logistics-official/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn className="text-sm" />
            </a>
          </div>
        </motion.div>

        {/* Corporate Office */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center md:text-left leading-relaxed"
        >
          <h3 className="font-semibold text-gray-900 mb-2">
            Corporate Office
          </h3>
          <p className="font-medium">
            Arrowgo-Logistics Inc.<br />
            12th floor, Avecshare Center<br />
            Bonifacio Triangle, BGC 1634
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center md:text-left leading-relaxed"
        >
          <h3 className="font-semibold text-gray-900 mb-2">
            Contact
          </h3>

          <p className="font-medium mb-2">
            <span className="font-semibold">Luzon / Visayas</span><br />
            (+63) 966 1378 180
          </p>

          <p className="font-medium mb-2">
            <span className="font-semibold">Mindanao</span><br />
            (+63) 917 115 9001
          </p>

          <p className="font-medium">
            query@arrowgologistics.com
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-black py-3 text-center text-xs font-medium text-white/80"
      >
        © {new Date().getFullYear()} ArrowGo Logistics Inc.
      </motion.div>

    </footer>
  );
}
