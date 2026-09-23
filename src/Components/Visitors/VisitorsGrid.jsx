import VisitorCard from "./VisitorCard";

export default function VisitorsGrid({
  currentVisitors,
  darkMode,
  handleEditOpen,
  handleDeleteOpen,
  handleTimeOut,
}) {
  /**
   * ✅ STRICT FILTER
   * - must be timed in
   * - must NOT be timed out
   * - must NOT be a raw appointment request
   * - must belong to the logged-in user's branch (unless IT) — safety
   *   net on top of the branch scoping already done in visitors.jsx
   */
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.role || "";
  const userBranch = storedUser?.branch || ""; // ✅ NEW

  const timedInVisitors = currentVisitors.filter(
    (v) =>
      v.timeIn &&                   // must be timed in
      !v.timeOut &&                  // still active
      v.appointmentRequest === 1 &&  // ONLY accepted appointments
      (userRole === "IT" || !userBranch || v.branch === userBranch) // ✅ NEW — own branch only
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {timedInVisitors.length === 0 && (
        <p className="col-span-full text-center text-gray-400">
          No active timed-in visitors
        </p>
      )}

      {timedInVisitors.map((visitor) => (
        <VisitorCard
          key={visitor.id}
          visitor={visitor}
          darkMode={darkMode}
          handleEditOpen={handleEditOpen}
          handleDeleteOpen={handleDeleteOpen}
          handleTimeOut={handleTimeOut}
          userRole={userRole}
        />
      ))}
    </div>
  );
}