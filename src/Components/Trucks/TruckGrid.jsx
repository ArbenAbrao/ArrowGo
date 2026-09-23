import {
  ClockIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  TagIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

/* ================= STATUS STYLES ================= */

const STATUS_STYLES = {
  Waiting: {
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  Active: {
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
  },
  Completed: {
    dot: "bg-gray-400",
    bar: "bg-gray-400/60",
  },
};

/* ================= BRANCH OWNERSHIP / STAGE RULE =================
   Mirrors trucks.jsx's copy of the same function — keep both in sync.

   IN_OUT (default): destination branch owns the entry end-to-end,
   SINGLE_LEG the whole time.

   OUT_IN: ownership moves across three legs as the truck travels:
     LEG1_PENDING_OUT -> home branch      (Time Out — truck leaves)
     LEG2_PENDING_IN  -> destination      (Time In — truck arrives)
     LEG2_PENDING_OUT -> destination      (Time Out — truck leaves them)
     LEG3_PENDING_IN  -> home branch      (Time In — truck returns)
==================================================================== */
function getResponsibleBranch(truck) {
  if (truck.flowType !== "OUT_IN") {
    return truck.destinationBranch;
  }

  switch (truck.currentStage) {
    case "LEG1_PENDING_OUT":
      return truck.branchRegistered;
    case "LEG2_PENDING_IN":
    case "LEG2_PENDING_OUT":
      return truck.destinationBranch;
    case "LEG3_PENDING_IN":
      return truck.branchRegistered;
    default:
      return truck.branchRegistered;
  }
}

// Human-readable label for where a truck is in its multi-leg journey —
// used in the flow badge for OUT_IN entries so both branches can tell
// at a glance which leg is currently active, not just the flow type.
function getStageLabel(truck) {
  if (truck.flowType !== "OUT_IN") return null;

  switch (truck.currentStage) {
    case "LEG1_PENDING_OUT":
      return "Leg 1 · awaiting Time Out (home)";
    case "LEG2_PENDING_IN":
      return "Leg 2 · awaiting Time In (destination)";
    case "LEG2_PENDING_OUT":
      return "Leg 2 · awaiting Time Out (destination)";
    case "LEG3_PENDING_IN":
      return "Leg 3 · awaiting Time In (home)";
    case "COMPLETED":
      return "Completed";
    default:
      return null;
  }
}

/* ================= SMALL HELPERS ================= */

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

/* ================= ICON BUTTON ================= */

function IconButton({
  icon: Icon,
  onClick,
  tone = "neutral",
  darkMode,
  title,
  iconClassName = "",
}) {
  const tones = {
    neutral: darkMode
      ? "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700",

    danger: darkMode
      ? "bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
      : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500",

    success:
      "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",

    warning:
      "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${tones[tone]}`}
    >
      <Icon className={`w-3.5 h-3.5 ${iconClassName}`} />
    </button>
  );
}

/* ================= TRUCK GRID ================= */

export default function TruckGrid({
  paginatedTrucks,
  clients,
  darkMode,
  handleTimeIn,
  handleTimeOut,
  handleEditOpen,
  handleDeleteOpen,
  userRole,
  userBranch, // ✅ used for the per-card branch ownership guard below
}) {
  const canModify = ["Admin", "IT", "User"].includes(userRole);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {paginatedTrucks.map((truck) => {
        /* ================= FLOW ================= */

        const flow =
          truck.flowType === "OUT_IN"
            ? "out-in"
            : "in-out";

        const isMultiLeg = flow === "out-in";
        const stageLabel = getStageLabel(truck);

        /* ================= STATUS ================= */

        let status = "Completed";

        if (!isMultiLeg) {
          const isTimeInPending = !truck.timeIn;
          const isTimeOutPending = truck.timeIn && !truck.timeOut;

          status = isTimeInPending
            ? "Waiting"
            : isTimeOutPending
            ? "Active"
            : "Completed";
        } else {
          // Multi-leg: any stage before COMPLETED counts as in-progress.
          // "Waiting" only for Leg 1 (nothing has happened yet); every
          // other pending stage is "Active" since the truck is already
          // moving through its journey.
          status =
            truck.currentStage === "COMPLETED"
              ? "Completed"
              : truck.currentStage === "LEG1_PENDING_OUT"
              ? "Waiting"
              : "Active";
        }

        const statusStyle = STATUS_STYLES[status];

        /* ================= CLIENT ================= */
        // Matched several ways since different creation paths populate
        // different identifying fields on the trucks-table row: some carry
        // an explicit clientId, but add-truck's own "id" column is actually
        // the originally-selected vehicle's client id, and vehicleId (e.g.
        // "VI-0002") is derived from that same client id too. Trying all
        // three means the lookup — and therefore the Control ID below —
        // still resolves regardless of which one a given entry has.
        //
        // ✅ FIX: compared with String(...) on both sides. truck.id /
        // truck.clientId can come back from the API as a number while
        // clients[].id is sometimes a string (or vice versa depending on
        // the MySQL driver's type casting for that column) — a strict
        // === was failing on rows where the types didn't match, which is
        // why some cards showed "--" for Control ID even though a
        // matching client existed.

        const client = clients?.find(
          (c) =>
            String(c.id) === String(truck.clientId) ||
            String(c.id) === String(truck.id) ||
            (truck.vehicleId && String(c.vehicleId) === String(truck.vehicleId))
        );

        /* ================= IDENTIFIER ================= */
        // Control ID is the only vehicle identifier shown to users — the
        // human-assigned one from registration (lives on the client
        // record, not the trucks row). No fallback to the raw database id
        // or the derived vehicleId ("VI-0002"); entries without a Control
        // ID on file just show as missing rather than surfacing an id.
        //
        // truck.controlId is now populated directly at creation time
        // (see backend/routes/trucks.js /add-truck), so this only needs
        // the client?.controlId fallback for older rows saved before
        // that fix, or any entry the client lookup above can resolve.

        const controlId = truck.controlId || client?.controlId || null;

        /* ================= ROUTE ================= */

        const isInternalTransfer =
          truck.branchRegistered &&
          truck.destinationBranch &&
          truck.branchRegistered === truck.destinationBranch;

        /* ================= BRANCH OWNERSHIP (button lock) =================
           Only IT bypasses this. Admin, Client, and User can only click
           Time In / Time Out on entries their own branch currently owns
           — which, for OUT_IN entries, changes as the truck moves
           through its legs. The backend enforces this too; this is the
           UX-level guard so the button doesn't even show as clickable
           for the branch that doesn't currently own the turn. */

        const isOwningBranch =
          userRole === "IT" ||
          !userBranch ||
          getResponsibleBranch(truck) === userBranch;

        /* ================= NEXT ACTION (multi-leg aware) ================= */
        // Which of Time In / Time Out (if either) is next for this entry,
        // regardless of flow type — replaces the old flow==="in-out" vs
        // "out-in" branching with a single stage-driven lookup so Leg 2
        // and Leg 3 render the correct button automatically.

        let nextAction = null; // "TIME_IN" | "TIME_OUT" | null (done)

        if (!isMultiLeg) {
          if (!truck.timeIn) nextAction = "TIME_IN";
          else if (!truck.timeOut) nextAction = "TIME_OUT";
        } else {
          switch (truck.currentStage) {
            case "LEG1_PENDING_OUT":
              nextAction = "TIME_OUT";
              break;
            case "LEG2_PENDING_IN":
              nextAction = "TIME_IN";
              break;
            case "LEG2_PENDING_OUT":
              nextAction = "TIME_OUT";
              break;
            case "LEG3_PENDING_IN":
              nextAction = "TIME_IN";
              break;
            default:
              nextAction = null;
          }
        }

        /* ================= HELPERS ================= */

        const helpersList = (() => {
          try {
            if (Array.isArray(truck.helpers)) {
              return truck.helpers.filter(Boolean);
            }

            if (
              truck.helper &&
              typeof truck.helper === "string"
            ) {
              const parsed = JSON.parse(truck.helper);

              if (Array.isArray(parsed)) {
                return parsed.filter(Boolean);
              }

              return [];
            }

            return [];
          } catch {
            return [];
          }
        })();

        /* ================= DATE ================= */

        const formattedDate = truck.date
          ? new Date(truck.date).toLocaleDateString("en-PH", {
              timeZone: "Asia/Manila",
              year: "numeric",
              month: "short",
              day: "numeric",
              weekday: "short",
            })
          : "--";

        return (
          <div
            key={truck.truckKey ?? truck.id}
            className={`flex w-full overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
              darkMode
                ? "bg-gray-900/70 border-white/10 hover:border-white/20 shadow-black/20"
                : "bg-white border-gray-200 hover:border-gray-300 shadow-gray-200/50"
            }`}
          >
            {/* ================= STATUS ACCENT BAR ================= */}

            <div
              className={`w-1 shrink-0 ${statusStyle.bar}`}
            />

            <div className="flex-1 min-w-0">
              {/* ================= HEADER ================= */}

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  {/* ================= CONTROL ID / STATUS / FLOW / ROUTE / BAY ================= */}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                    {/* Control ID — leads the card so it's the first thing
                        anyone scanning the grid sees, instead of being
                        buried a few rows down in the info grid. */}

                    {controlId && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                          darkMode
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                        title="Control ID"
                      >
                        <IdentificationIcon className="w-3.5 h-3.5" />
                        {controlId}
                      </span>
                    )}

                    {/* Status */}

                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                      />

                      <span
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-gray-200"
                            : "text-gray-700"
                        }`}
                      >
                        {status}
                      </span>
                    </span>

                    {/* Flow (+ current leg, for multi-leg entries) */}

                    <span
                      className={`inline-flex items-center gap-1 text-xs shrink-0 ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                      title={stageLabel || undefined}
                    >
                      <ArrowsRightLeftIcon className="w-3.5 h-3.5" />

                      {flow === "out-in"
                        ? "Out → In"
                        : "In → Out"}

                      {stageLabel && (
                        <span
                          className={`ml-1 font-mono text-[10px] px-1 py-0.5 rounded ${
                            darkMode
                              ? "bg-white/5 text-gray-400"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {stageLabel}
                        </span>
                      )}
                    </span>

                    {/* Route */}

                    {truck.branchRegistered &&
                      truck.destinationBranch && (
                        <>
                          {isInternalTransfer ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <BuildingOfficeIcon className="w-3.5 h-3.5" />

                              {truck.branchRegistered}

                              <span
                                className={
                                  darkMode
                                    ? "text-emerald-400/70"
                                    : "text-emerald-600"
                                }
                              >
                                · Internal
                              </span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-xs ${
                                darkMode
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              <BuildingOfficeIcon className="w-3.5 h-3.5" />

                              {truck.branchRegistered}

                              <ArrowRightIcon className="w-3 h-3 opacity-50" />

                              <span
                                className={`font-medium ${
                                  darkMode
                                    ? "text-gray-200"
                                    : "text-gray-800"
                                }`}
                              >
                                {truck.destinationBranch}
                              </span>
                            </span>
                          )}
                        </>
                      )}

                    {/* Bay */}

                    {truck.bay && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-md border shrink-0 ${
                          darkMode
                            ? "bg-white/5 border-white/10 text-gray-300"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <TagIcon className="w-3 h-3" />

                        {truck.bay}
                      </span>
                    )}
                  </div>

                  {/* ================= ACTION BUTTONS ================= */}

                  {canModify && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* ================= TIME BUTTONS ================= */}
                      {/* Only render for the branch that currently owns
                          this entry (isOwningBranch). IT always sees
                          them; Admin/Client/User only see them when the
                          entry's current leg belongs to their own
                          branch. Edit and Delete stay available to
                          everyone in canModify, same as before. */}

                      {isOwningBranch && nextAction === "TIME_IN" && (
                        <IconButton
                          icon={ClockIcon}
                          tone="success"
                          darkMode={darkMode}
                          title="Time In"
                          onClick={() => handleTimeIn(truck)}
                        />
                      )}

                      {isOwningBranch && nextAction === "TIME_OUT" && (
                        <IconButton
                          icon={ClockIcon}
                          tone="warning"
                          darkMode={darkMode}
                          title="Time Out"
                          onClick={() => handleTimeOut(truck)}
                        />
                      )}

                      {/* EDIT */}

                      <IconButton
                        icon={PencilIcon}
                        tone="neutral"
                        darkMode={darkMode}
                        title="Edit"
                        onClick={() =>
                          handleEditOpen(truck)
                        }
                      />

                      {/* DELETE */}
                      {/* ✅ FIX: pass truck.truckKey (the backend's
                          /trucks/:truckKey route key) instead of
                          truck.id, which is NULL for visitor/3PL
                          entries and would otherwise 404 on delete. */}

                      <IconButton
                        icon={TrashIcon}
                        tone="danger"
                        darkMode={darkMode}
                        title="Delete"
                        onClick={() =>
                          handleDeleteOpen(truck.truckKey)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* ================= ALL TRUCK INFORMATION ================= */}

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {/* CLIENT */}

                  <Field
                    label="Client"
                    darkMode={darkMode}
                  >
                    {truck.clientName || "--"}

                    {truck.clientId && (
                      <span
                        className={`ml-1 font-normal ${
                          darkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        ({truck.clientId})
                      </span>
                    )}
                  </Field>

                  {/* CONTROL ID */}

                  <Field
                    label="Control ID"
                    darkMode={darkMode}
                  >
                    {controlId ? (
                      <span
                        className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          darkMode
                            ? "bg-white/5 text-emerald-300"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {controlId}
                      </span>
                    ) : (
                      "--"
                    )}
                  </Field>

                  {/* PLATE */}

                  <Field
                    label="Plate"
                    darkMode={darkMode}
                  >
                    {truck.plateNumber || "--"}
                  </Field>

                  {/* TYPE */}

                  <Field
                    label="Type"
                    darkMode={darkMode}
                  >
                    {truck.truckType || "--"}
                  </Field>

                  {/* DRIVER */}

                  <Field
                    label="Driver"
                    darkMode={darkMode}
                  >
                    {truck.driver || "--"}
                  </Field>

                  {/* HELPERS */}

                  <Field
                    label="Helpers"
                    darkMode={darkMode}
                  >
                    {helpersList.length > 0
                      ? helpersList.join(", ")
                      : "--"}
                  </Field>

                  {/* PURPOSE */}

                  <Field
                    label="Purpose"
                    darkMode={darkMode}
                  >
                    {truck.purpose || "--"}
                  </Field>

                  {/* DATE */}

                  <Field
                    label="Date"
                    darkMode={darkMode}
                  >
                    {formattedDate}
                  </Field>

                  {!isMultiLeg && (
                    <>
                      {/* TIME IN */}

                      <Field
                        label="Time In"
                        darkMode={darkMode}
                      >
                        <span
                          className={
                            truck.timeIn
                              ? "text-emerald-400"
                              : darkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }
                        >
                          {truck.timeIn || "--"}
                        </span>
                      </Field>

                      {/* TIME OUT */}

                      <Field
                        label="Time Out"
                        darkMode={darkMode}
                      >
                        <span
                          className={
                            truck.timeOut
                              ? "text-amber-400"
                              : darkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }
                        >
                          {truck.timeOut || "--"}
                        </span>
                      </Field>
                    </>
                  )}
                </div>

                {/* ================= MULTI-LEG HISTORY ================= */}
                {/* Full timeline of an OUT_IN entry, so either branch can
                    see the whole trip — not just their own leg — while
                    it's still in progress or after it's done. */}

                {isMultiLeg && (
                  <div
                    className={`mt-3 pt-3 border-t ${
                      darkMode ? "border-white/10" : "border-gray-100"
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Trip Timeline
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                      <Field label={`Time Out · ${truck.branchRegistered || "Home"}`} darkMode={darkMode}>
                        <span className={truck.leg1TimeOut ? "text-amber-400" : darkMode ? "text-gray-500" : "text-gray-400"}>
                          {truck.leg1TimeOut || "--"}
                        </span>
                      </Field>

                      <Field label={`Time In · ${truck.destinationBranch || "Destination"}`} darkMode={darkMode}>
                        <span className={truck.leg2TimeIn ? "text-emerald-400" : darkMode ? "text-gray-500" : "text-gray-400"}>
                          {truck.leg2TimeIn || "--"}
                        </span>
                      </Field>

                      <Field label={`Time Out · ${truck.destinationBranch || "Destination"}`} darkMode={darkMode}>
                        <span className={truck.leg2TimeOut ? "text-amber-400" : darkMode ? "text-gray-500" : "text-gray-400"}>
                          {truck.leg2TimeOut || "--"}
                        </span>
                      </Field>

                      <Field label={`Time In · ${truck.branchRegistered || "Home"}`} darkMode={darkMode}>
                        <span className={truck.leg3TimeIn ? "text-emerald-400" : darkMode ? "text-gray-500" : "text-gray-400"}>
                          {truck.leg3TimeIn || "--"}
                        </span>
                      </Field>
                    </div>
                  </div>
                )}

                {/* ================= ADDITIONAL INFO ================= */}

                {(truck.branchRegistered ||
                  truck.destinationBranch ||
                  truck.bay) && (
                  <div
                    className={`mt-3 pt-3 border-t ${
                      darkMode
                        ? "border-white/10"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                      {/* REGISTERED BRANCH */}

                      {truck.branchRegistered && (
                        <Field
                          label="Registered Branch"
                          darkMode={darkMode}
                        >
                          {truck.branchRegistered}
                        </Field>
                      )}

                      {/* DESTINATION */}

                      {truck.destinationBranch && (
                        <Field
                          label="Destination Branch"
                          darkMode={darkMode}
                        >
                          {truck.destinationBranch}
                        </Field>
                      )}

                      {/* BAY */}

                      {truck.bay && (
                        <Field
                          label="Bay"
                          darkMode={darkMode}
                        >
                          <span className="font-mono">
                            {truck.bay}
                          </span>
                        </Field>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}