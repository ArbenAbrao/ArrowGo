import { motion, AnimatePresence } from "framer-motion";

export default function ArrowGoInfo({ rotatingWords, currentWordIndex }) {
  return (
    <section id="arrowgo" className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-black">
            We are ArrowGo, We{" "}
            <span className="text-green-500 inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[currentWordIndex]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {rotatingWords[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            Solutions
          </h1>
          <motion.p
            className="text-gray-900 text-lg md:text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            ArrowGo Logistics combines years of experience and excellent customer service to provide you with
            tailor-made logistics and warehouse solutions.
          </motion.p>
        </div>

        {/* Text Sections */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Mission */}
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-4 text-black">Our Mission and Thrust</h3>
            <p className="text-gray-900">
              In order to achieve our Vision, our mission is to provide innovative and superior logistics solutions
              to our valuable clients, focusing on efficiency, safety, and customer satisfaction.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-4 text-black">Our Vision</h3>
            <p className="text-gray-900">
              We aim to be a leading logistics provider nationwide, known for reliability, innovation, and excellence
              in customer service.
            </p>
          </motion.div>

          {/* Quality Policy */}
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-4 text-black">Quality Policy</h3>
            <p className="text-gray-900">
              ArrowGo believes in continuous improvement—both in its resources and services—to consistently provide
              high-quality logistics solutions.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
