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
        className="
          max-w-7xl mx-auto 
          px-4 sm:px-6 lg:px-8 
          py-10 sm:py-12 
          grid grid-cols-1 md:grid-cols-3 
          gap-10 
          text-gray-800 
          text-sm sm:text-base
        "
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.12 }}
      >

        {/* Logo + Socials */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center space-y-4"
        >
          <img
            src="/logo11.png"
            alt="ArrowGo Logistics"
            className="
              h-24 
              sm:h-28 
              md:h-32 
              lg:h-36 
              object-contain
              transition-all
              duration-300
            "
          />

          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/arrowgologisticsofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Facebook"
            >
              <FaFacebookF className="text-sm sm:text-base" />
            </a>

            <a
              href="https://www.instagram.com/arrowgologisticsincofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Instagram"
            >
              <FaInstagram className="text-sm sm:text-base" />
            </a>

            <a
              href="https://www.linkedin.com/company/arrowgo-logistics-official/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn className="text-sm sm:text-base" />
            </a>
          </div>
        </motion.div>

        {/* Corporate Office */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center md:text-left leading-relaxed"
        >
          <h3 className="font-semibold text-gray-900 mb-3">
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
          <h3 className="font-semibold text-gray-900 mb-3">
            Contact
          </h3>

          <p className="font-medium mb-3">
            <span className="font-semibold">Luzon / Visayas</span><br />
            (+63) 966 1378 180
          </p>

          <p className="font-medium mb-3">
            <span className="font-semibold">Mindanao</span><br />
            (+63) 917 115 9001
          </p>

          <p className="font-medium break-all sm:break-normal">
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
        className="bg-black py-3 text-center text-xs sm:text-sm font-medium text-white/80"
      >
        © {new Date().getFullYear()} ArrowGo Logistics Inc.
      </motion.div>

    </footer>
  );
}
