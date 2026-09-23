import {
  ClockIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  BuildingOfficeIcon,
  
} from "@heroicons/react/24/outline";

/* ================= STATUS STYLES =================
   Same naming/convention as TruckGrid's STATUS_STYLES so the two grids
   read as one system — visitors only ever have Active or Completed
   (no "Waiting" pre-check-in state), so that key is simply unused here. */
const STATUS_STYLES = {
  Active: {
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
  },
  Completed: {
    dot: "bg-gray-400",
    bar: "bg-gray-400/60",
  },
};

/* ================= SMALL HELPERS =================
   Copied verbatim from TruckGrid.jsx rather than abstracted into a shared
   module the two files didn't already share — keeps this a drop-in file
   with no new import paths to wire up. */

function Field({ label, darkMode, children }) {
  return (
    <div className="min-w-0">
      <div
        className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${
          darkMode ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {label}
      </div>

      <div
        className={`text-sm font-medium break-words ${
          darkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, onClick, tone = "neutral", darkMode, title, iconClassName = "" }) {
  const tones = {
    neutral: darkMode
      ? "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",

    danger: darkMode
      ? "bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
      : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500",

    success: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",

    warning: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={!onClick}
      className={`p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50
        ${!onClick ? "opacity-40 cursor-not-allowed" : tones[tone]}`}
    >
      <Icon className={`w-3.5 h-3.5 ${iconClassName}`} />
    </button>
  );
}

/* ================= VISITOR CARD ================= */

export default function VisitorCard({ visitor, darkMode, handleEditOpen, handleDeleteOpen, handleTimeOut, userRole }) {
  const canModify = ["Admin", "IT", "User"].includes(userRole);

  const isActive = !visitor.timeOut;
  const status = isActive ? "Active" : "Completed";
  const statusStyle = STATUS_STYLES[status];

  const formattedDate = visitor.date
    ? new Date(visitor.date).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "short",
      })
    : "--";

  return (
    <div
      className={`flex w-full overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
        darkMode
          ? "bg-gray-900/70 border-white/10 hover:border-white/20 shadow-black/20"
          : "bg-white border-gray-200 hover:border-gray-300 shadow-gray-200/50"
      }`}
    >
      {/* ================= STATUS ACCENT BAR ================= */}
      <div className={`w-1 shrink-0 ${statusStyle.bar}`} />

      <div className="flex-1 min-w-0">
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            {/* ================= STATUS / BRANCH / BADGE ================= */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              {/* Status */}
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                <span className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  {status}
                </span>
              </span>

              {/* Branch */}
              {visitor.branch && (
                <span
                  className={`inline-flex items-center gap-1 text-xs shrink-0 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <BuildingOfficeIcon className="w-3.5 h-3.5" />
                  {visitor.branch}
                </span>
              )}

              {/* Badge number */}
              {visitor.badgeNumber && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-md border shrink-0 ${
                    darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <TagIcon className="w-3 h-3" />
                  {visitor.badgeNumber}
                </span>
              )}
            </div>

            {/* ================= ACTION BUTTONS ================= */}
            {canModify && (
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  icon={ClockIcon}
                  tone="warning"
                  darkMode={darkMode}
                  title="Time Out"
                  onClick={isActive ? () => handleTimeOut(visitor) : null}
                />
                <IconButton
                  icon={PencilIcon}
                  tone="neutral"
                  darkMode={darkMode}
                  title="Edit"
                  onClick={() => handleEditOpen(visitor)}
                />
                <IconButton
                  icon={TrashIcon}
                  tone="danger"
                  darkMode={darkMode}
                  title="Delete"
                  onClick={() => handleDeleteOpen(visitor.id)}
                />
              </div>
            )}
          </div>

          {/* ================= PRIMARY INFORMATION ================= */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            <Field label="Visitor" darkMode={darkMode}>
              {visitor.visitorName || "--"}
            </Field>

            <Field label="Person to Visit" darkMode={darkMode}>
              {visitor.personToVisit || "--"}
            </Field>

            <Field label="Purpose" darkMode={darkMode}>
              {visitor.purpose || "--"}
            </Field>

            <Field label="Date" darkMode={darkMode}>
              {formattedDate}
            </Field>

            <Field label="Time In" darkMode={darkMode}>
              <span className={visitor.timeIn ? "text-emerald-400" : darkMode ? "text-gray-400" : "text-gray-500"}>
                {visitor.timeIn || "--"}
              </span>
            </Field>

            <Field label="Time Out" darkMode={darkMode}>
              <span className={visitor.timeOut ? "text-amber-400" : darkMode ? "text-gray-400" : "text-gray-500"}>
                {visitor.timeOut || "--"}
              </span>
            </Field>
          </div>

          {/* ================= ADDITIONAL INFO ================= */}
          {(visitor.company || visitor.idType || visitor.idNumber || visitor.vehicleMode) && (
            <div className={`mt-3 pt-3 border-t ${darkMode ? "border-white/10" : "border-gray-100"}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {visitor.company && (
                  <Field label="Company" darkMode={darkMode}>
                    {visitor.company}
                  </Field>
                )}

                {(visitor.idType || visitor.idNumber) && (
                  <Field label="ID" darkMode={darkMode}>
                    {visitor.idType || "--"}
                    {visitor.idNumber ? ` — ${visitor.idNumber}` : ""}
                  </Field>
                )}

                {visitor.vehicleMode && (
                  <Field label="Vehicle" darkMode={darkMode}>
                    {visitor.vehicleMode}
                    {visitor.vehicleDetails ? ` · ${visitor.vehicleDetails}` : ""}
                  </Field>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}