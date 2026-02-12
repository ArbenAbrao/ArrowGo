export default function RecentAppointmentRequests({ requests, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";

  const recentAppointmentRequests = requests
    .filter(r => r.type === "appointment")
    .slice(0, 5);

  return (
    <div className={`rounded-lg p-4 ${chartContainerBg} w-full`}>
      <h2 className="text-lg font-bold mb-2">Recent Appointment Requests</h2>

      {/* Make list scrollable on small screens */}
      <div className="overflow-x-auto sm:overflow-x-hidden">
        <ul className="divide-y divide-gray-300 dark:divide-gray-700">
          {recentAppointmentRequests.map(req => (
            <li
              key={req.id}
              className="py-2 px-2 sm:px-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"
            >
              <span className="font-medium">{req.visitor_name}</span>
              <span className="text-sm opacity-80">
                Visiting ({req.person_to_visit})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
