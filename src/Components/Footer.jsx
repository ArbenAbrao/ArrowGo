function Footer() {
  return (
    <footer className="bg-green-600 text-white py-2 border-t border-green-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 text-center text-xs sm:text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="text-green-900 font-semibold">ArrowGo Logisctics Inc.</span>. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
