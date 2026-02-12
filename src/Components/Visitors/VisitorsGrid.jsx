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
   * 
   * 
   */

  
  const timedInVisitors = currentVisitors.filter(
  (v) =>
    v.timeIn &&              // must be timed in
    !v.timeOut &&            // still active
    v.appointmentRequest === 1 // ONLY accepted appointments
);

  return (
    <div className="flex flex-col gap-4">
      {timedInVisitors.length === 0 && (
        <p className="text-center text-gray-400">
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
        />
      ))}
    </div>
  );
}
