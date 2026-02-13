import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../Components/Modals/LoginModal";
import { useToast } from "../Context/ToastContext";

/* Sections */
import HeaderSec from "../Components/Sections/headerSec";
import FooterSec from "../Components/Sections/footerSec";
import Hero from "../Components/Sections/Hero";
import Services from "../Components/Sections/Services";
import ArrowGoInfo from "../Components/Sections/ArrowGoInfo";
import Divider from "../Components/Sections/Divider";
import Request from "../Components/Sections/Request";
import About from "../Components/Sections/about";

/* Icons */
import { FaWarehouse, FaTruck, FaBoxOpen } from "react-icons/fa";
import { AiOutlineGlobal } from "react-icons/ai";
import { MdOutlineInventory, MdOutlineLocalShipping } from "react-icons/md";

export default function Welcome() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const rotatingWords = ["Create", "Build", "Develop"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () =>
      setIsScrolled(window.scrollY > window.innerHeight * 0.5);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://192.168.254.126:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast("Incorrect username/email or password.", "error");
        } else if (response.status === 403) {
          showToast("Your account is disabled. Contact admin.", "error");
        } else {
          showToast(data.message || "Login failed. Try again.", "error");
        }
        setLoading(false);
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsModalOpen(false);
      showToast("Login successful!", "success");

      redirectAfterLogin
        ? window.open(redirectAfterLogin, "_blank")
        : navigate("/dashboard", { replace: true });

      setRedirectAfterLogin(null);
    } catch {
      showToast("Server error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      title: "Warehousing / Storage",
      frontDesc: "Top-notch...",
      backDesc: "Reliable...",
      icon: <FaWarehouse className="text-5xl text-green-500 mb-4" />,
      btnText: "Learn More",
    },
    {
      title: "Sea and Air Forwarding",
      frontDesc: "Reliable...",
      backDesc: "Tailor-made...",
      icon: <AiOutlineGlobal className="text-5xl text-blue-500 mb-4" />,
      btnText: "Contact Us Now",
    },
    {
      title: "Supply Chain Management",
      frontDesc: "Planning...",
      backDesc: "10 years...",
      icon: <MdOutlineInventory className="text-5xl text-purple-500 mb-4" />,
      btnText: "Hear More from Us",
    },
    {
      title: "Customs Brokerage",
      frontDesc: "Licensed...",
      backDesc: "Honest...",
      icon: <MdOutlineLocalShipping className="text-5xl text-orange-500 mb-4" />,
      btnText: "Hear More from Us",
    },
    {
      title: "Packing and Crating",
      frontDesc: "Efficient...",
      backDesc: "Save time...",
      icon: <FaBoxOpen className="text-5xl text-red-500 mb-4" />,
      btnText: "Contact Us",
    },
    {
      title: "Trucking and Distribution",
      frontDesc: "Keep your business...",
      backDesc: "Reliable logistics...",
      icon: <FaTruck className="text-5xl text-yellow-500 mb-4" />,
      btnText: "Hear More from Us",
    },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      <HeaderSec
        isScrolled={isScrolled}
        onLoginClick={() => setIsModalOpen(true)}
      />

      <Hero />
      <Divider gradient="bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
      <About />
      <Request
        onLoginClick={(path) => {
          setRedirectAfterLogin(path);
          setIsModalOpen(true);
        }}
      />
      <Services services={services} />

      <ArrowGoInfo
        rotatingWords={rotatingWords}
        currentWordIndex={currentWordIndex}
      />
      <FooterSec />

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLogin={handleLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
      />
    </div>
  );
}
