import { useState } from "react";

export default function HeaderSec({ isScrolled, onLoginClick }) {
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-500 ${
        isScrolled ? "bg-white shadow" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-10 py-4">
        <img
          src={isScrolled ? "/logo5.png" : "/logo5-white.png"}
          alt="Logo"
          className="h-10 transition-all duration-500"
        />
        <button
          onClick={onLoginClick}
          className={`px-6 py-2 rounded-md font-semibold transition ${
            isScrolled
              ? "bg-green-500 text-black hover:bg-green-400"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          LOGIN
        </button>
      </div>
    </header>
  );
}
