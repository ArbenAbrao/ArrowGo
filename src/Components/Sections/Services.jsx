import { motion } from "framer-motion";
import { FaWarehouse, FaShippingFast, FaTruck, FaCalendarAlt, FaBoxOpen, FaPeopleCarry } from "react-icons/fa";

// Import Google Fonts
import "@fontsource/pacifico"; // npm install @fontsource/pacifico

export default function Services() {
  const services = [
    {
      title: "Warehousing/Storage",
      icon: <FaWarehouse className="text-5xl" />,
      frontDesc:
        "Our Warehousing and Storage Facilities combined with warehousing management are top of the line that will help you grow your business.",
      backDesc:
        "With reliable utilities and equipment, massive warehouse support structures, people and expertise. These resources are readily available when you need it and how you need it.",
      frontGradient: "linear-gradient(135deg, #34d399, #10b981, #059669)",
      backGradient: "linear-gradient(135deg, #059669, #047857, #065f46)",
    },
    {
      title: "Sea and Air Forwarding",
      icon: <FaShippingFast className="text-5xl" />,
      frontDesc:
        "Our Sea and Air Freight Services is able to provide unique, reliable, and cost effective shipping solutions for any of your transportation requirements.",
      backDesc:
        "We treat our clients uniquely. Thus, we provide tailor made solutions for each of our client needs.",
      frontGradient: "linear-gradient(135deg, #60a5fa, #3b82f6, #2563eb)",
      backGradient: "linear-gradient(135deg, #2563eb, #1d4ed8, #1e40af)",
    },
    {
      title: "Supply Chain Management",
      icon: <FaPeopleCarry className="text-5xl" />,
      frontDesc:
        "With our fast-paced environment, planning and execution on the transport of goods should be on your advantage.",
      backDesc:
        "Our experience is your advantage. With 10 years of experience in the market, our expertise will be a great asset for your business.",
      frontGradient: "linear-gradient(135deg, #a78bfa, #8b5cf6, #7c3aed)",
      backGradient: "linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)",
    },
    {
      title: "Customs Brokerage",
      icon: <FaCalendarAlt className="text-5xl" />,
      frontDesc:
        "Our licensed brokers are highly skilled and as well highly experienced. It is for us to provide our clients high quality services.",
      backDesc: "Let us move you with honesty and greatness.",
      frontGradient: "linear-gradient(135deg, #facc15, #eab308, #ca8a04)",
      backGradient: "linear-gradient(135deg, #ca8a04, #b45309, #78350f)",
    },
    {
      title: "Packing and Crating",
      icon: <FaBoxOpen className="text-5xl" />,
      frontDesc:
        "ArrowGo wants our clients to save time in packing and building crate. This will let them focus on their core competencies.",
      backDesc: "Witness and experience the difference.",
      frontGradient: "linear-gradient(135deg, #f87171, #ef4444, #dc2626)",
      backGradient: "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)",
    },
    {
      title: "Trucking and Distribution",
      icon: <FaTruck className="text-5xl" />,
      frontDesc:
        "To keep your business running, we provide trucking and distribution services. We are here to help you grow your business.",
      backDesc: "Logistic beyond expectation.",
      frontGradient: "linear-gradient(135deg, #2dd4bf, #14b8a6, #0d9488)",
      backGradient: "linear-gradient(135deg, #0d9488, #0f766e, #115e59)",
    },
  ];

  const gradientAnimation = {
    backgroundSize: "300% 300%",
    animation: "gradientShift 10s ease infinite",
  };

  return (
    <section id="services" className="bg-gray-50 py-20">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Header */}
        <h2 className="text-4xl font-bold mb-2 text-black">
          Our Services
        </h2>
        <div className="w-24 h-1 bg-green-500 mx-auto mb-4 rounded"></div>
        <p className="text-gray-600 mb-12">
          ArrowGo Logistics provides{" "}
          <span style={{ fontFamily: "Pacifico, cursive" }} className="text-green-500 font-bold">
            One-Stop-Shop
          </span>{" "}
          logistics solutions and services.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              className="w-full h-72 cursor-pointer"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="relative w-full h-full rounded-xl transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="relative w-full h-full rounded-xl"
                  style={{ transformStyle: "preserve-3d" }}
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
                >
                  {/* Front */}
                  <motion.div
                    className="absolute inset-0 rounded-xl p-6 flex flex-col justify-center items-center shadow-lg text-white"
                    style={{ ...gradientAnimation, background: service.frontGradient, backfaceVisibility: "hidden" }}
                  >
                    <motion.div
                      whileHover={{ y: -5, scale: 1.1 }}
                      className="mb-4 inline-block transition-shadow duration-300 hover:shadow-[0_0_20px_3px_rgba(255,255,255,0.3)] rounded-full"
                    >
                      {service.icon}
                    </motion.div>
                    <h4 className="text-xl font-bold mt-4 mb-2">{service.title}</h4>
                    <p className="text-white text-center">{service.frontDesc}</p>
                  </motion.div>

                  {/* Back */}
                  <motion.div
                    className="absolute inset-0 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-lg text-white"
                    style={{ ...gradientAnimation, background: service.backGradient, backfaceVisibility: "hidden", rotateY: "180deg" }}
                  >
                    <h4 className="text-xl font-bold mb-2">{service.title} Info</h4>
                    <p className="text-white">{service.backDesc}</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
