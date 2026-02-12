export default function HeaderSec({ isScrolled, onLoginClick }) {
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-500 ${
        isScrolled ? "bg-white shadow" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4">
        
        {/* Logo */}
        <img
          src={isScrolled ? "/logo9.png" : "/logo9-white.png"}
          alt="Logo"
          className="
            h-16
            sm:h-20 
            md:h-24 
            lg:h-28 
            xl:h-28 
            object-contain 
            transition-all 
            duration-500
          "
        />

        {/* LOGIN button */}
        <button
          onClick={onLoginClick}
          className={`
            px-4 sm:px-6 
            py-1.5 sm:py-2 
            rounded-md 
            font-semibold 
            text-sm sm:text-base
            transition
            ${
              isScrolled
                ? "bg-green-500 text-black hover:bg-green-400"
                : "bg-white text-black hover:bg-gray-100"
            }
          `}
        >
          LOGIN
        </button>

      </div>
    </header>
  );
}
