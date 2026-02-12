export default function PaginationControls({
  darkMode,
  currentPage,
  totalPages,
  setCurrentPage,
}) {
  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
<button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    className={`
      px-4 py-2 border rounded transition
      ${darkMode 
        ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]" 
        : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    Prev
  </button>

  {Array.from({ length: totalPages }).map((_, index) => {
    const pageNum = index + 1;
    const isActive = currentPage === pageNum;
    return (
      <button
        key={index}
        onClick={() => setCurrentPage(pageNum)}
        className={`
          px-4 py-2 border rounded transition
          ${darkMode 
            ? isActive
              ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
              : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]"
            : isActive
              ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
              : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"
          }
        `}
      >
        {pageNum}
      </button>
    );
  })}

  <button
    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
    disabled={currentPage === totalPages}
    className={`
      px-4 py-2 border rounded transition
      ${darkMode 
        ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.6)]" 
        : "bg-white text-green-900 border-green-300 hover:bg-green-100 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    Next
  </button>    </div>
  );
}
