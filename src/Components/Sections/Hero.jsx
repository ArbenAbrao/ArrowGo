import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "/Truck1.jpg",
  "/Truck2.jpg",
  "/Truck3.jpg",
  "/Truck4.jpg",
  "/Truck5.jpg",
  "/Truck6.jpg",
  "/Truck7.jpg",
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Carousel Images */}
      <AnimatePresence>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt="ArrowGo Logistics"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 1 }}
        />
      </AnimatePresence>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 px-6 max-w-4xl text-center text-white"
      >
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-4 px-4 py-1 text-sm tracking-widest bg-white/10 backdrop-blur rounded-full"
        >
          HELLO, WE PROVIDE
        </motion.span>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          WORLD CLASS <span className="block text-green-400">LOGISTICS SYSTEM</span>
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-8">
          Smart truck tracking, visitor monitoring, and operational analytics —
          all in one powerful logistics platform.
        </p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            const section = document.getElementById("about");
            if (!section) return;
            const yOffset = -80;
            const y =
              section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }}
          className="bg-blue-600 px-8 py-4 rounded-md font-semibold tracking-wide hover:bg-blue-500 transition"
        >
          GET STARTED →
        </motion.button>
      </motion.div>
    </section>
  );
}
