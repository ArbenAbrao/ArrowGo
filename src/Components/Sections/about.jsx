import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="w-full bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-14 text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            <span className="text-green-600">ARROWGO-LOGISTICS INC.</span>{" "}
            IS COMMITTED TO PROVIDING COMPREHENSIVE THIRD-PARTY LOGISTICS SOLUTION
          </h2>
        </motion.div>

        {/* CONTENT GRID */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 leading-relaxed mb-6">
              From seamless transportation and warehousing to inventory management
              and distribution, our services are designed to streamline your supply
              chain and eliminate operational bottlenecks. By entrusting your
              logistics needs to us, your business can concentrate on its core
              operations, driving growth, innovation, and customer satisfaction
              without the complexities of managing logistics internally.
            </p>

            <p className="text-gray-600 leading-relaxed">
              With over a decade of industry expertise, we specialize in delivering
              comprehensive end-to-end logistics solutions that combine efficiency,
              reliability, and cost-effectiveness.
            </p>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 leading-relaxed">
              With secure, scalable, and strategically located storage solutions
              designed to drive client growth, Arrowgo-Logistics Inc. empowers
              businesses to expand effortlessly. Our warehousing facilities adapt
              to the dynamic demands of your operations, ensuring inventory is
              protected and readily available for distribution exactly when you
              need it.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
