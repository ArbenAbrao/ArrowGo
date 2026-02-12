export default function RecentTruckRequests({ requests, darkMode }) {
  const chartContainerBg = darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-black";

  const recentTruckRequests = requests
    .filter(r => r.type === "truck")
    .slice(0, 5);

  return (
    <div className={`rounded-lg p-4 ${chartContainerBg} w-full`}>
      <h2 className="text-lg font-bold mb-2">Recent Truck Requests</h2>

      {/* Scrollable on small screens */}
      <div className="overflow-x-auto sm:overflow-x-hidden">
        <ul className="divide-y divide-gray-300 dark:divide-gray-700">
          {recentTruckRequests.map(req => (
            <li
              key={req.id}
              className="py-2 px-2 sm:px-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"
            >
              <span className="font-medium">{req.client_name}</span>
              <span className="text-sm opacity-80">{req.truck_type}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
