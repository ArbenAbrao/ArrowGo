import { motion } from "framer-motion";
import { FaTruck, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Request() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Register Truck",
      desc: "Register your truck easily to start scheduling pickups and deliveries.",
      icon: FaTruck,
      btnText: "Register Truck",
      link: "/register-truck",
      bgGradient: "bg-gradient-to-br from-green-200 to-green-400",
      textColor: "text-green-900",
      btnColor: "bg-green-600 hover:bg-green-500",
      iconColor: "text-green-900",
      iconGlow: "shadow-green-400",
    },
    {
      title: "Set Appointment",
      desc: "Visit our office to inquire or schedule an appointment conveniently.",
      icon: FaCalendarAlt,
      btnText: "Set Appointment",
      link: "/appointment",
      bgGradient: "bg-gradient-to-br from-blue-200 to-blue-400",
      textColor: "text-blue-900",
      btnColor: "bg-blue-600 hover:bg-blue-500",
      iconColor: "text-blue-900",
      iconGlow: "shadow-blue-400",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Gradient heading */}
        <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">
          Register Truck & Set Appointment
        </h2>
        <div className="w-24 h-1 bg-green-500 mx-auto mb-8 rounded"></div>

        <div className="grid md:grid-cols-2 gap-8">
          {cards.map((card, i) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={i}
                className={`${card.bgGradient} shadow-inner shadow-lg rounded-2xl p-8 transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-105`}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
              >
                {/* Icon with glow and pop */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.1 }}
                  className={`mb-4 inline-block transition-shadow duration-300 hover:shadow-[0_0_20px_3px_${card.iconGlow}] rounded-full`}
                >
                  <IconComponent className={`text-5xl ${card.iconColor}`} />
                </motion.div>

                <h3 className={`text-2xl font-bold mb-4 ${card.textColor}`}>
                  {card.title}
                </h3>
                <p className={`mb-6 ${card.textColor}`}>{card.desc}</p>

                {/* Button with subtle hover animation */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`${card.btnColor} text-white px-6 py-3 rounded-lg font-medium transition`}
                  onClick={() => {
                    if (card.link === "/appointment") {
                      window.open(card.link, "_blank"); // open in new tab
                    } else {
                      navigate(card.link);
                    }
                  }}
                >
                  {card.btnText}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
