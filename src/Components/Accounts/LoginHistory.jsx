import { useMemo, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Pager, initialsOf } from "./accountsUi";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "SUCCESS", label: "Success" },
  { id: "FAILED", label: "Failed" },
  { id: "suspicious", label: "Suspicious" },
];

const formatDate = (d) =>
  new Date(d).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusLabel = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "Unknown");

function StatusBadge({ status }) {
  if (status === "SUCCESS") {
    return (
      <span className="ac-badge has-icon t-em">
        <CheckCircleIcon className="h-4 w-4" />
        {statusLabel(status)}
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="ac-badge has-icon t-rose">
        <XCircleIcon className="h-4 w-4" />
        {statusLabel(status)}
      </span>
    );
  }
  return (
    <span className="ac-badge has-icon t-slate">
      <ExclamationCircleIcon className="h-4 w-4" />
      {statusLabel(status)}
    </span>
  );
}

export default function LoginHistory({
  logs,
  darkMode, // eslint-disable-line no-unused-vars
  currentPage,
  setCurrentPage,
  ITEMS_PER_PAGE,
  loading = false,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const counts = useMemo(
    () => ({
      all: logs.length,
      SUCCESS: logs.filter((l) => l.status === "SUCCESS").length,
      FAILED: logs.filter((l) => l.status === "FAILED").length,
      suspicious: logs.filter((l) => l.is_suspicious).length,
    }),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "suspicious" ? Boolean(log.is_suspicious) : log.status === statusFilter;
      const matchesSearch = term
        ? `${log.name || ""} ${log.username_or_email || ""} ${log.location || ""} ${log.device || ""}`.toLowerCase().includes(term)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [logs, search, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const page = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasFilters = Boolean(search || statusFilter !== "all");
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <>
      {/* TOOLBAR */}
      <div className="ac-toolbar">
        <div className="ac-field grow">
          <MagnifyingGlassIcon className="ac-lead" />
          <input
            type="search"
            placeholder="Search user, location, device"
            aria-label="Search login history"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="ac-input has-lead"
          />
        </div>

        <div className="ac-chips" role="group" aria-label="Filter by result">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={statusFilter === f.id}
              className={`ac-seg-btn is-flat ${statusFilter === f.id ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter(f.id);
                setCurrentPage(1);
              }}
            >
              {f.label}
              <span className="ac-pill ac-num">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="ac-btn ac-btn-secondary">
            Clear
          </button>
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="ac-skel h-[60px]" />
          ))}
        </div>
      ) : paginatedLogs.length === 0 ? (
        <div className="ac-empty">
          <span className="ac-empty-icon">
            <ClockIcon className="h-6 w-6" />
          </span>
          <h2 className="vmvas-heading text-[17px] font-bold" style={{ color: "var(--ink)" }}>
            {logs.length === 0 ? "No login activity yet." : "No entries match these filters."}
          </h2>
          <p className="ac-muted mt-1.5 max-w-sm text-sm">
            {logs.length === 0 ? "Sign-ins will show up here as they happen." : "Try adjusting your search or filters."}
          </p>
          {hasFilters && (
            <button type="button" className="ac-btn ac-btn-secondary mt-5" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ac-head is-logs" aria-hidden="true">
            <span>User</span>
            <span>Status</span>
            <span>Location</span>
            <span>Device</span>
            <span>Flag</span>
            <span>Date</span>
          </div>

          <ul>
            {paginatedLogs.map((log) => {
              const who = log.name || log.username_or_email || "Unknown";
              return (
                <li key={log.id} className={`ac-row is-logs ${log.is_suspicious ? "is-flagged" : ""}`}>
                  <div className="l-user">
                    <span className="ac-avatar is-muted" aria-hidden="true">
                      {initialsOf(...who.split(" "))}
                    </span>
                    <span className="ac-name" title={who}>
                      {who}
                    </span>
                  </div>

                  <div className="l-status">
                    <StatusBadge status={log.status} />
                  </div>

                  <div className="l-line l-loc">
                    <MapPinIcon />
                    <span title={log.location || ""}>{log.location || "-"}</span>
                  </div>

                  <div className="l-line l-dev">
                    <DevicePhoneMobileIcon />
                    <span title={log.device || ""}>{log.device || "-"}</span>
                  </div>

                  <div className="l-flag">
                    {log.is_suspicious ? (
                      <span className="ac-badge t-amber">Suspicious</span>
                    ) : (
                      <span className="ac-badge t-slate">Normal</span>
                    )}
                  </div>

                  <div className="l-line l-date ac-num">
                    <ClockIcon />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        total={filteredLogs.length}
        pageSize={ITEMS_PER_PAGE}
        label={filteredLogs.length === 1 ? "entry" : "entries"}
        onPage={setCurrentPage}
      />
    </>
  );
}