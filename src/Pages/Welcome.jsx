// src/Pages/Welcome.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../Components/Modals/LoginModal";

// Sections
import HeaderSec from "../Components/Sections/headerSec";
import FooterSec from "../Components/Sections/footerSec";
import Hero from "../Components/Sections/Hero";
import Services from "../Components/Sections/Services";
import ArrowGoInfo from "../Components/Sections/ArrowGoInfo";
import Divider from "../Components/Sections/Divider";
import Request from "../Components/Sections/Request"; // import it
import About from "../Components/Sections/about";

// React Icons
import { FaWarehouse, FaTruck, FaBoxOpen } from "react-icons/fa";
import { AiOutlineGlobal } from "react-icons/ai";
import { MdOutlineInventory, MdOutlineLocalShipping } from "react-icons/md";

export default function Welcome() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null); // <-- Added
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const rotatingWords = ["Create", "Build", "Develop"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > window.innerHeight * 0.5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

const handleLogin = (e) => {
  e.preventDefault();
  if (email === "Admin" && password === "Admin123") {
    localStorage.setItem("isLoggedIn", "true");
    setIsModalOpen(false);

    if (redirectAfterLogin) {
      // Open redirect path in new tab
      window.open(redirectAfterLogin, "_blank");
      setRedirectAfterLogin(null);
    } else {
      navigate("/dashboard", { replace: true });
    }
  } else setError("Invalid email or password");
};


  const services = [
    { title: "Warehousing / Storage", frontDesc: "Top-notch...", backDesc: "Reliable...", icon: <FaWarehouse className="text-5xl text-green-500 mb-4" />, btnText: "Learn More" },
    { title: "Sea and Air Forwarding", frontDesc: "Reliable...", backDesc: "Tailor-made...", icon: <AiOutlineGlobal className="text-5xl text-blue-500 mb-4" />, btnText: "Contact Us Now" },
    { title: "Supply Chain Management", frontDesc: "Planning...", backDesc: "10 years...", icon: <MdOutlineInventory className="text-5xl text-purple-500 mb-4" />, btnText: "Hear More from Us" },
    { title: "Customs Brokerage", frontDesc: "Licensed...", backDesc: "Honest...", icon: <MdOutlineLocalShipping className="text-5xl text-orange-500 mb-4" />, btnText: "Hear More from Us" },
    { title: "Packing and Crating", frontDesc: "Efficient...", backDesc: "Save time...", icon: <FaBoxOpen className="text-5xl text-red-500 mb-4" />, btnText: "Contact Us" },
    { title: "Trucking and Distribution", frontDesc: "Keep your business...", backDesc: "Reliable logistics...", icon: <FaTruck className="text-5xl text-yellow-500 mb-4" />, btnText: "Hear More from Us" },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      <HeaderSec isScrolled={isScrolled} onLoginClick={() => setIsModalOpen(true)} />
      <Hero />
      <Divider gradient="bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
      <Divider gradient="bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
      <About />
<Request
  onLoginClick={(path) => {
    setRedirectAfterLogin(path); // store path
    setIsModalOpen(true); // open login modal
  }}
/>
      <Divider gradient="bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
      <Divider gradient="bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
      <Services services={services} />
      <Divider gradient="bg-gradient-to-r from-purple-500 via-pink-400 to-red-400" />
      <Divider gradient="bg-gradient-to-r from-purple-500 via-pink-400 to-red-400" />
      <ArrowGoInfo rotatingWords={rotatingWords} currentWordIndex={currentWordIndex} />
      <Divider gradient="bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400" />
      <Divider gradient="bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400" />
      <FooterSec />
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLogin={handleLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        message="Please log in to continue"
      />
    </div>
  );
}
