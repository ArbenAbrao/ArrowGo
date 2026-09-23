import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  TruckIcon,
  ClockIcon,
  CalendarDaysIcon,
  UsersIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getMonth, getYear } from "date-fns";

// ---------------------------------------------------------------------------
// Single source of truth for the API base URL. Set REACT_APP_API_URL in your
// .env file (frontend root) so this never needs to be edited when your
// WSL2/LAN IP changes. CRA only reads REACT_APP_* vars at dev-server start,
// so restart 'npm start' after changing .env.
// ---------------------------------------------------------------------------
const API_URL = process.env.REACT_APP_API_URL;

// ---------------------------------------------------------------------------
// Mirrors isTruckCompleted() in trucks.jsx / getResponsibleBranch() logic in
// trucks.js — a truck is "still active" unless it has both timeIn and
// timeOut AND isn't sitting in one of the OUT_IN multi-leg intermediate
// stages. Kept in one place so every section below agrees on the count.
// ---------------------------------------------------------------------------
const isTruckActive = (t) =>
  !(
    !!(t.timeIn && t.timeOut) &&
    t.currentStage !== "LEG2_PENDING_IN" &&
    t.currentStage !== "LEG2_PENDING_OUT" &&
    t.currentStage !== "LEG3_PENDING_IN"
  );

/* =====================================================================
   DESIGN TOKENS
   Gate-ops palette: emerald/cyan read as "moving" (trucks + go-signal),
   amber/violet flag things waiting on a human (appointments, visitors).
   Chart colors reuse the same set so every panel speaks one language.
   ===================================================================== */

const ACCENT = {
  emerald: "#10B981",
  cyan: "#06B6D4",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  sky: "#38BDF8",
};

const CHART_PALETTE = ["#06B6D4","#10B981",  "#8B5CF6", "#F59E0B", "#38BDF8", "#F43F5E", "#A3E635", "#FB923C", "#EC4899", "#14B8A6"];

const withAlpha = (hex, alphaHex) => `${hex}${alphaHex}`;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Keyframes for the activity marquee + the featured stat card's soft glow.
// Injected once as a plain <style> tag (see <MarqueeStyles/>) since this
// project doesn't have custom keyframes wired into tailwind.config.js.
function MarqueeStyles() {
  return (
    <style>{`
      @keyframes gt-marquee-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      .gt-marquee-track {
        animation: gt-marquee-scroll 32s linear infinite;
      }
      .gt-marquee-track:hover {
        animation-play-state: paused;
      }
      @keyframes gt-glow-pulse {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
      }
      .gt-glow-pulse {
        animation: gt-glow-pulse 3.2s ease-in-out infinite;
      }
    `}</style>
  );
}

// Small hook that smoothly counts a number up/down to its new value instead
// of snapping instantly — makes the stat cards feel alive when polling
// refreshes the data every 5s.
function useCountUp(value, duration = 650) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf;
    let start;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

/* =====================================================================
   ACTIVITY MARQUEE
   A scrolling ticker of the latest gate activity (trucks + visitors),
   combined and time-sorted. Purely decorative/at-a-glance — pauses on
   hover so it can actually be read.
   ===================================================================== */

function ActivityMarquee({ trucks = [], visitors = [], darkMode }) {
  const items = useMemo(() => {
    const truckItems = trucks.map((t) => ({
      id: `truck-${t.truckKey || t.id}`,
      date: t.date,
      Icon: TruckIcon,
      color: isTruckActive(t) ? ACCENT.cyan : ACCENT.sky,
      text: `${t.clientName || "Truck"} · ${t.plateNumber || "—"} ${isTruckActive(t) ? "en route" : "completed"}`,
    }));
    const visitorItems = visitors.map((v) => ({
      id: `visitor-${v.id}`,
      date: v.date,
      Icon: UsersIcon,
      color: ACCENT.violet,
      text: `${v.visitorName || "Visitor"} · ${v.company || "—"} ${v.timeOut ? "checked out" : "on-site"}`,
    }));
    return [...truckItems, ...visitorItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 14);
  }, [trucks, visitors]);

  if (items.length === 0) return null;

  // Duplicate the list so the CSS translateX(-50%) loop is seamless.
  const loop = [...items, ...items];
  const edgeColor = darkMode ? "#0B1220" : "#F7F9FB";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border mb-6 ${
        darkMode ? "bg-white/[0.03] border-white/[0.08]" : "bg-white/80 border-black/[0.06]"
      }`}
    >
      <div className="gt-marquee-track flex items-center py-2.5" style={{ width: "max-content" }}>
        {loop.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mx-1.5 whitespace-nowrap"
            style={{ backgroundColor: withAlpha(item.color, "14"), color: item.color }}
          >
            <item.Icon className="w-3.5 h-3.5" />
            {item.text}
          </span>
        ))}
      </div>
      {/* fade the ticker into the panel edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-10"
        style={{ background: `linear-gradient(90deg, ${edgeColor}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-10"
        style={{ background: `linear-gradient(270deg, ${edgeColor}, transparent)` }}
      />
    </div>
  );
}

/* =====================================================================
   SHARED PRIMITIVES
   ===================================================================== */

function Panel({ darkMode, className = "", children }) {
  return (
    <div
      className={`min-w-0 w-full rounded-2xl border backdrop-blur-xl transition-colors ${
        darkMode
          ? "bg-white/[0.03] border-white/[0.08]"
          : "bg-white/80 border-black/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-20px_rgba(15,23,42,0.15)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, text, darkMode }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center text-center py-10">
      <Icon className={`w-8 h-8 mb-2 ${darkMode ? "text-gray-700" : "text-gray-300"}`} />
      <p className="text-sm max-w-[280px] opacity-60">{text}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, darkMode }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur-xl ${
        darkMode ? "bg-gray-900/90 border-white/10 text-gray-200" : "bg-white/95 border-black/10 text-gray-800"
      }`}
    >
      {label !== undefined && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function StatusPill({ status, darkMode }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    approved: { rgb: "16,185,129", label: "Approved" },
    completed: { rgb: "56,189,248", label: "Completed" },
    pending: { rgb: "245,158,11", label: "Pending" },
  };
  const cfg = map[s] || map.pending;
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: `rgba(${cfg.rgb},0.14)`, color: `rgb(${cfg.rgb})` }}
    >
      {cfg.label}
    </span>
  );
}

function ModalShell({ title, darkMode, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border p-6 max-h-[80vh] overflow-y-auto backdrop-blur-xl ${
          darkMode ? "bg-gray-900/95 border-white/10 text-gray-100" : "bg-white/95 border-black/10 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-4">
      <span className="opacity-60 shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/* =====================================================================
   STAT CARD + OVERVIEW (consolidated KPI hero)
   ===================================================================== */

function StatCard({ icon: Icon, label, value, accent, darkMode, description, featured, breakdown }) {
  const baseBorder = darkMode ? "border-white/[0.08]" : "border-black/[0.06]";
  const baseBg = darkMode ? "bg-white/[0.03]" : "bg-white/80";
  const displayValue = useCountUp(typeof value === "number" ? value : 0);

  return (
    <motion.div
      title={description}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${baseBorder} ${featured ? "" : baseBg} ${
        !darkMode && !featured ? "shadow-[0_1px_2px_rgba(15,23,42,0.04)]" : ""
      }`}
      style={
        featured
          ? {
              background: darkMode
                ? `linear-gradient(135deg, ${withAlpha(accent, "26")}, ${withAlpha(accent, "05")})`
                : `linear-gradient(135deg, ${withAlpha(accent, "14")}, ${withAlpha(accent, "03")})`,
            }
          : undefined
      }
    >
      {featured && (
        <span
          className="gt-glow-pulse pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl"
          style={{ backgroundColor: withAlpha(accent, "33") }}
        />
      )}
      <span
        className="relative inline-flex items-center justify-center rounded-xl p-2"
        style={{ backgroundColor: withAlpha(accent, "1F"), color: accent }}
      >
        <Icon className="w-5 h-5" />
      </span>
      <p className={`relative mt-4 font-semibold tabular-nums ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
        {displayValue}
      </p>
      <p className="relative mt-1 text-sm opacity-60">{label}</p>
      {breakdown && (
        <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70">
          {breakdown.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <b.icon className="w-3.5 h-3.5" />
              {b.text}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function OverviewSection({ analytics, totalTrucks, visitors, darkMode }) {
  const completedTrucks = totalTrucks - analytics.truckPending;
  const visitorsOnSite = visitors.filter((v) => !v.timeOut).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <div className="col-span-2">
        <StatCard
          featured
          icon={ClockIcon}
          label="Items needing attention today"
          value={analytics.totalPending}
          accent={ACCENT.emerald}
          darkMode={darkMode}
          breakdown={[
            { icon: TruckIcon, text: `${analytics.truckPending} trucks` },
            { icon: CalendarDaysIcon, text: `${analytics.appointmentPending} appointments` },
          ]}
        />
      </div>
      <StatCard
        icon={TruckIcon}
        label="Active trucks"
        value={analytics.truckPending}
        accent={ACCENT.cyan}
        darkMode={darkMode}
        description="Trucks currently on their journey"
      />
      <StatCard
        icon={CheckCircleIcon}
        label="Completed trucks"
        value={completedTrucks}
        accent={ACCENT.sky}
        darkMode={darkMode}
        description="Trucks that finished their time-in/time-out flow"
      />
      <StatCard
        icon={UsersIcon}
        label="Visitors on-site"
        value={visitorsOnSite}
        accent={ACCENT.violet}
        darkMode={darkMode}
        description="Visitors who have not timed out yet"
      />
      <StatCard
        icon={CalendarDaysIcon}
        label="Pending appointments"
        value={analytics.appointmentPending}
        accent={ACCENT.amber}
        darkMode={darkMode}
        description="Appointment requests awaiting approval"
      />
    </div>
  );
}

/* =====================================================================
   PENDING REQUESTS (table view + detail modal)
   ===================================================================== */

function RequestTable({ title, rows, columns, darkMode, emptyText, onRowClick }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium mb-2 opacity-80">{title}</p>
      <div className={`rounded-xl border max-h-[260px] overflow-y-auto overflow-x-auto ${darkMode ? "border-white/10" : "border-gray-100"}`}>
        <table className="w-full min-w-[480px] text-sm">
          <thead className={`sticky top-0 z-10 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <tr className={`text-left ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {columns.map((c) => (
                <th key={c.key} className="font-medium px-4 py-2.5">
                  {c.label}
                </th>
              ))}
              <th className="font-medium px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.tr
                  key={r.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onRowClick(r)}
                  className={`cursor-pointer border-t transition-colors ${
                    darkMode ? "border-white/5 hover:bg-white/5" : "border-gray-50 hover:bg-gray-50"
                  }`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5">
                      {r[c.key] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <StatusPill status={r.status} darkMode={darkMode} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center opacity-50">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestReportSection({ analytics, darkMode }) {
  const [modalItem, setModalItem] = useState(null);
  if (!analytics) return null;

  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold">Pending requests</h2>
      <p className="text-sm opacity-60 mt-0.5">Appointments and trucks awaiting action</p>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestTable
          title="Appointments"
          rows={analytics.recent.appointments}
          darkMode={darkMode}
          emptyText="No pending appointments."
          onRowClick={setModalItem}
          columns={[
            { key: "name", label: "Name" },
            { key: "person_to_visit", label: "Person to visit" },
            { key: "branch", label: "Branch" },
          ]}
        />
        <RequestTable
          title="Trucks in progress"
          rows={analytics.recent.trucks}
          darkMode={darkMode}
          emptyText="No trucks currently in progress."
          onRowClick={setModalItem}
          columns={[
            { key: "name", label: "Client" },
            { key: "plate_number", label: "Plate" },
            { key: "branch", label: "Branch" },
          ]}
        />
      </div>

      <AnimatePresence>
        {modalItem && (
          <ModalShell
            title={modalItem.plate_number ? "Truck details" : "Appointment details"}
            darkMode={darkMode}
            onClose={() => setModalItem(null)}
          >
            <div className="space-y-1 text-sm">
              <DetailRow label="Name" value={modalItem.name} />
              {modalItem.person_to_visit && <DetailRow label="Person to visit" value={modalItem.person_to_visit} />}
              {modalItem.plate_number && <DetailRow label="Plate number" value={modalItem.plate_number} mono />}
              {modalItem.branch && <DetailRow label="Branch" value={modalItem.branch} />}
              {modalItem.status && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="opacity-60">Status</span>
                  <StatusPill status={modalItem.status} darkMode={darkMode} />
                </div>
              )}
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </Panel>
  );
}

/* =====================================================================
   MOVEMENT (gradient area chart, trucks vs visitors over time)
   ===================================================================== */

function MovementSection({ trucks = [], visitors = [], darkMode }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const allData = useMemo(
    () => [...trucks.map((t) => ({ ...t, type: "truck" })), ...visitors.map((v) => ({ ...v, type: "visitor" }))],
    [trucks, visitors]
  );

  const movementData = useMemo(() => {
    let grouped = [];
    if (selectedMonth === "all") {
      for (let m = 0; m < 12; m++) {
        const start = startOfMonth(new Date(selectedYear, m));
        let Trucks = 0,
          Visitors = 0;
        allData.forEach((item) => {
          const d = new Date(item.date);
          if (getYear(d) !== selectedYear || getMonth(d) !== m) return;
          item.type === "truck" ? Trucks++ : Visitors++;
        });
        grouped.push({ name: format(start, "MMM"), Trucks, Visitors });
      }
    } else {
      const start = startOfMonth(new Date(selectedYear, selectedMonth));
      const days = eachDayOfInterval({ start, end: endOfMonth(start) });
      grouped = days.map((d) => ({ name: format(d, "d"), Trucks: 0, Visitors: 0 }));
      allData.forEach((item) => {
        const d = new Date(item.date);
        if (getYear(d) !== selectedYear || getMonth(d) !== selectedMonth) return;
        const targetName = format(d, "d");
        const target = grouped.find((g) => g.name === targetName);
        if (!target) return;
        item.type === "truck" ? target.Trucks++ : target.Visitors++;
      });
    }
    return grouped;
  }, [allData, selectedMonth, selectedYear]);

  const totals = useMemo(
    () => ({
      trucks: movementData.reduce((a, b) => a + b.Trucks, 0),
      visitors: movementData.reduce((a, b) => a + b.Visitors, 0),
    }),
    [movementData]
  );

  const exportCSV = () => {
    const headers = ["Period", "Trucks", "Visitors"];
    const rows = movementData.map((d) => [d.name, d.Trucks, d.Visitors]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movement-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const axisColor = "#9CA3AF";
  const gridColor = darkMode ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const selectStyle = darkMode ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200";

  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Gate movement</h2>
          <p className="text-sm opacity-60 mt-0.5">Trucks and visitors over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
            className={`text-sm rounded-lg px-3 py-2 border ${selectStyle}`}
          >
            <option value="all">All months</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {format(new Date(2024, i), "MMMM")}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`text-sm rounded-lg px-3 py-2 border ${selectStyle}`}
          >
            {Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 border transition-colors ${
              darkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5 mb-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENT.emerald }} />
          {totals.trucks} trucks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENT.sky }} />
          {totals.visitors} visitors
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={movementData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="fillTrucks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT.emerald} stopOpacity={0.35} />
              <stop offset="95%" stopColor={ACCENT.emerald} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT.sky} stopOpacity={0.35} />
              <stop offset="95%" stopColor={ACCENT.sky} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={32} />
          <RechartsTooltip content={<ChartTooltip darkMode={darkMode} />} />
          <Area type="monotone" dataKey="Trucks" stroke={ACCENT.emerald} strokeWidth={2} fill="url(#fillTrucks)" />
          <Area type="monotone" dataKey="Visitors" stroke={ACCENT.sky} strokeWidth={2} fill="url(#fillVisitors)" />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* =====================================================================
   VISITORS PER COMPANY (donut + legend)
   ===================================================================== */

function VisitorsPerCompanySection({ visitors = [], darkMode }) {
  const data = useMemo(() => {
    const counts = visitors.reduce((acc, v) => {
      const company = v.company || "Unknown";
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [visitors]);

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold">Visitors by company</h2>
      <p className="text-sm opacity-60 mt-0.5">Where today's visitors are coming from</p>

      {data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          darkMode={darkMode}
          text="No visitors logged yet. Check-ins will appear here once the front desk starts recording them."
        />
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-[220px] h-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltip darkMode={darkMode} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-xs opacity-60">Total visitors</span>
            </div>
          </div>
          <ul className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="flex items-center gap-2 opacity-70 shrink-0 tabular-nums">
                  <span>{d.value}</span>
                  <span className="opacity-50">{total ? Math.round((d.value / total) * 100) : 0}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* =====================================================================
   BRANCHES OVERVIEW (donut + drill-down modal / single-branch detail)
   ===================================================================== */

function DrilldownModal({ data, darkMode, onClose }) {
  const hasClients = data.clients && data.clients.length > 0;
  const hasTrucks = data.trucks && data.trucks.length > 0;
  return (
    <ModalShell title={data.title} darkMode={darkMode} onClose={onClose}>
      {hasClients && (
        <div className="mb-4">
          <p className="text-xs font-medium opacity-60 mb-2">Clients</p>
          <ul className="space-y-1">
            {data.clients.map((c) => (
              <li key={c.id} className={`text-sm px-3 py-2 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasTrucks && (
        <div>
          <p className="text-xs font-medium opacity-60 mb-2">Trucks</p>
          <ul className="space-y-1">
            {data.trucks.map((t) => (
              <li key={t.id} className={`text-sm font-mono px-3 py-2 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                {t.plate_number || t.id}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hasClients && !hasTrucks && <p className="text-sm opacity-60">No records found.</p>}
    </ModalShell>
  );
}

function BranchesOverviewSection({ trucks = [], darkMode }) {
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, clientsRes] = await Promise.all([
          axios.get(`${API_URL}/api/branches`),
          axios.get(`${API_URL}/api/branch-clients`),
        ]);
        setBranches(branchesRes.data);
        setClients(clientsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const data = useMemo(
    () =>
      branches.map((b, i) => ({
        id: b.id,
        name: b.name,
        value: b.clientCount,
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [branches]
  );
  const total = data.reduce((a, b) => a + b.value, 0);

  const activeBranch = selectedBranch === "all" ? null : branches.find((b) => String(b.id) === selectedBranch);
  const branchClients = activeBranch ? clients.filter((c) => c.branch_id === activeBranch.id) : [];
  const branchTrucks = activeBranch ? trucks.filter((t) => t.branch_id === activeBranch.id) : [];

  const handleBranchClick = (name) => {
    const branch = branches.find((b) => b.name === name);
    if (!branch) return;
    setModalData({
      title: branch.name,
      clients: clients.filter((c) => c.branch_id === branch.id),
      trucks: trucks.filter((t) => t.branch_id === branch.id),
    });
  };

  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Branches overview</h2>
          <p className="text-sm opacity-60 mt-0.5">Client distribution across branches</p>
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className={`text-sm rounded-lg px-3 py-2 border ${
            darkMode ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200"
          }`}
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBranch === "all" ? (
        data.length === 0 ? (
          <EmptyState icon={BuildingOffice2Icon} darkMode={darkMode} text="No branch data yet." />
        ) : (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-[220px] h-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color} onClick={() => handleBranchClick(d.name)} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip darkMode={darkMode} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold tabular-nums">{total}</span>
                <span className="text-xs opacity-60">Total clients</span>
              </div>
            </div>
            <ul className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {data.map((d) => (
                <li
                  key={d.name}
                  onClick={() => handleBranchClick(d.name)}
                  className="flex items-center justify-between text-sm cursor-pointer hover:opacity-80"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="flex items-center gap-2 opacity-70 shrink-0 tabular-nums">
                    <span>{d.value}</span>
                    <span className="opacity-50">{total ? Math.round((d.value / total) * 100) : 0}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`rounded-xl px-4 py-3 ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className="text-xl font-semibold tabular-nums">{branchClients.length}</p>
              <p className="text-xs opacity-60">Clients</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
              <p className="text-xl font-semibold tabular-nums">{branchTrucks.length}</p>
              <p className="text-xs opacity-60">Trucks logged</p>
            </div>
          </div>
          {branchClients.length === 0 ? (
            <EmptyState icon={BuildingOffice2Icon} darkMode={darkMode} text="This branch has no registered clients yet." />
          ) : (
            <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {branchClients.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-50"}`}
                >
                  <MapPinIcon className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AnimatePresence>
        {modalData && <DrilldownModal data={modalData} darkMode={darkMode} onClose={() => setModalData(null)} />}
      </AnimatePresence>
    </Panel>
  );
}

/* =====================================================================
   TRUCKS ANALYTICS (per client / per branch bar charts)
   ===================================================================== */

function TrucksAnalyticsSection({ trucks, registeredCount, darkMode }) {
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [stackedView, setStackedView] = useState(true);
  const colorMap = useRef({});

  useEffect(() => {
    let i = 0;
    [...new Set(trucks.map((t) => t.clientName))].forEach((c) => {
      if (!colorMap.current[c]) {
        colorMap.current[c] = c?.toLowerCase() === "arrowgo" ? ACCENT.emerald : CHART_PALETTE[i++ % CHART_PALETTE.length];
      }
    });
  }, [trucks]);

  const branches = useMemo(() => ["ALL", ...new Set(trucks.map((t) => t.branchRegistered))], [trucks]);
  const clients = useMemo(() => {
    const src = selectedBranch === "ALL" ? trucks : trucks.filter((t) => t.branchRegistered === selectedBranch);
    return ["ALL", ...new Set(src.map((t) => t.clientName))];
  }, [trucks, selectedBranch]);

  useEffect(() => setSelectedClient("ALL"), [selectedBranch]);

  const filtered = useMemo(() => {
    return trucks.filter((t) => {
      if (selectedBranch !== "ALL" && t.branchRegistered !== selectedBranch) return false;
      if (selectedClient !== "ALL" && t.clientName !== selectedClient) return false;
      return true;
    });
  }, [trucks, selectedBranch, selectedClient]);

  const clientData = useMemo(() => {
    const counts = filtered.reduce((a, t) => ({ ...a, [t.clientName]: (a[t.clientName] || 0) + 1 }), {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, fill: colorMap.current[name] }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const branchLabels = useMemo(
    () => (selectedBranch === "ALL" ? [...new Set(trucks.map((t) => t.branchRegistered))] : [selectedBranch]),
    [trucks, selectedBranch]
  );
  const allClients = useMemo(() => [...new Set(trucks.map((t) => t.clientName))], [trucks]);

  const branchData = useMemo(
    () =>
      branchLabels.map((b) => {
        const row = { branch: b };
        allClients.forEach((c) => {
          row[c] = trucks.filter((t) => t.branchRegistered === b && t.clientName === c).length;
        });
        return row;
      }),
    [branchLabels, allClients, trucks]
  );

  const axisColor = "#9CA3AF";
  const gridColor = darkMode ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const selectStyle = darkMode ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200";

  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Trucks by client and branch</h2>
          <p className="text-sm opacity-60 mt-0.5">{registeredCount} trucks registered to clients</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className={`text-sm rounded-lg px-3 py-2 border ${selectStyle}`}>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className={`text-sm rounded-lg px-3 py-2 border ${selectStyle}`}>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => setStackedView((v) => !v)}
            className={`text-sm rounded-lg px-3 py-2 border transition-colors ${
              darkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {stackedView ? "Grouped view" : "Stacked view"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80 mb-2">Trucks per client</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} interval={0} />
              <YAxis allowDecimals={false} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={32} />
              <RechartsTooltip content={<ChartTooltip darkMode={darkMode} />} cursor={{ fill: gridColor }} />
              <Bar dataKey="value" name="Trucks" radius={[6, 6, 0, 0]}>
                {clientData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80 mb-2">Trucks per branch ({stackedView ? "stacked" : "grouped"})</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis dataKey="branch" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={32} />
              <RechartsTooltip content={<ChartTooltip darkMode={darkMode} />} cursor={{ fill: gridColor }} />
              <Legend wrapperStyle={{ fontSize: 12, opacity: 0.8 }} />
              {allClients.map((c) => (
                <Bar
                  key={c}
                  dataKey={c}
                  stackId={stackedView ? "a" : undefined}
                  fill={colorMap.current[c]}
                  radius={stackedView ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}

/* =====================================================================
   RECENT ACTIVITY (trucks / visitors)
   ===================================================================== */

function RecentTrucksSection({ trucks, darkMode }) {
  const recent = [...trucks].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1">Recent trucks</h2>
      <p className="text-sm opacity-60 mb-1">Latest gate entries</p>
      {recent.length === 0 ? (
        <EmptyState icon={TruckIcon} darkMode={darkMode} text="No trucks yet. Entries will appear here once the gate starts logging activity." />
      ) : (
        <ul className={`divide-y ${darkMode ? "divide-white/5" : "divide-gray-100"}`}>
          {recent.map((t) => {
            const active = isTruckActive(t);
            const color = active ? ACCENT.cyan : ACCENT.sky;
            return (
              <li
                key={t.truckKey || t.id}
                className={`flex items-center justify-between gap-3 py-3 px-1 rounded-lg transition-colors ${
                  darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: withAlpha(color, "1A"), color }}
                  >
                    <TruckIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.clientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono opacity-60">{t.plateNumber || "—"}</span>
                      {t.truckType && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${darkMode ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                          {t.truckType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs opacity-70">
                    {t.timeIn}
                    {t.timeOut ? ` – ${t.timeOut}` : ""}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] mt-0.5" style={{ color: active ? color : undefined, opacity: active ? 1 : 0.5 }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? "animate-pulse" : ""}`} style={{ backgroundColor: active ? color : "#9CA3AF" }} />
                    {active ? "Active" : "Completed"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function RecentVisitorsSection({ visitors, darkMode }) {
  const recent = [...visitors].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  return (
    <Panel darkMode={darkMode} className="p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1">Recent visitors</h2>
      <p className="text-sm opacity-60 mb-1">Latest check-ins</p>
      {recent.length === 0 ? (
        <EmptyState icon={UsersIcon} darkMode={darkMode} text="No visitors yet. Check-ins will appear here once the front desk starts recording them." />
      ) : (
        <ul className={`divide-y ${darkMode ? "divide-white/5" : "divide-gray-100"}`}>
          {recent.map((v) => {
            const onSite = !v.timeOut;
            const initials = (v.visitorName || "?")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <li
                key={v.id}
                className={`flex items-center justify-between gap-3 py-3 px-1 rounded-lg transition-colors ${
                  darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold"
                    style={{ backgroundColor: withAlpha(ACCENT.violet, "1A"), color: ACCENT.violet }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.visitorName}</p>
                    <p className="text-xs opacity-60 truncate">{v.company}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs opacity-70">
                    {v.timeIn}
                    {v.timeOut ? ` – ${v.timeOut}` : ""}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] mt-0.5"
                    style={{ color: onSite ? ACCENT.violet : undefined, opacity: onSite ? 1 : 0.5 }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${onSite ? "animate-pulse" : ""}`} style={{ backgroundColor: onSite ? ACCENT.violet : "#9CA3AF" }} />
                    {onSite ? "On-site" : "Checked out"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* =====================================================================
   DASHBOARD (main export)
   ===================================================================== */

export default function Dashboard({ darkMode }) {
  const [trucks, setTrucks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [registeredTrucks, setRegisteredTrucks] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [truckRes, visitorRes, clientRes, appointmentRes] = await Promise.all([
          axios.get(`${API_URL}/api/trucks`),
          axios.get(`${API_URL}/api/visitors`),
          axios.get(`${API_URL}/api/clients`),
          // Already pending-only — see backend/routes/appointmentrequest.js GET "/"
          axios.get(`${API_URL}/api/appointment-requests`),
        ]);

        setTrucks(truckRes.data);
        setVisitors(visitorRes.data);
        setRegisteredTrucks(clientRes.data);
        setAppointmentRequests(appointmentRes.data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const requestAnalytics = useMemo(() => {
    const activeTrucks = trucks.filter(isTruckActive);

    const recentAppointments = [...appointmentRequests]
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        name: a.visitor_name,
        person_to_visit: a.person_to_visit,
        branch: a.branch,
        status: a.status || "pending",
      }));

    const recentTrucks = [...activeTrucks]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((t) => ({
        id: t.truckKey,
        name: t.clientName,
        plate_number: t.plateNumber,
        branch: t.destinationBranch || t.branchRegistered,
        status: "pending",
      }));

    return {
      totalPending: activeTrucks.length + appointmentRequests.length,
      appointmentPending: appointmentRequests.length,
      truckPending: activeTrucks.length,
      recent: { appointments: recentAppointments, trucks: recentTrucks },
    };
  }, [trucks, appointmentRequests]);

  const pageBg = darkMode ? "bg-[#0B1220] text-gray-300" : "bg-[#F7F9FB] text-gray-900";

  return (
    <div className={`w-full min-h-screen overflow-x-hidden transition-colors duration-300 ${pageBg}`}>
      <MarqueeStyles />
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.img
              src="/logo22.png"
              alt="Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <div>
              <h1 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h1>
              <p className="text-sm opacity-60">Gate activity at a glance</p>
            </div>
          </motion.div>
          <AnimatePresence>
            {lastUpdated && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ACCENT.emerald }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: ACCENT.emerald }} />
                </span>
                <span className="font-medium" style={{ color: ACCENT.emerald }}>
                  Live
                </span>
                <span className={`w-px h-3 ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
                <span className="opacity-60">
                  Updated{" "}
                  <motion.span
                    key={lastUpdated.getTime()}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="tabular-nums"
                  >
                    {format(lastUpdated, "h:mm:ss a")}
                  </motion.span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ActivityMarquee trucks={trucks} visitors={visitors} darkMode={darkMode} />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants}>
            <OverviewSection analytics={requestAnalytics} totalTrucks={trucks.length} visitors={visitors} darkMode={darkMode} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <RequestReportSection analytics={requestAnalytics} darkMode={darkMode} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MovementSection trucks={trucks} visitors={visitors} darkMode={darkMode} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <VisitorsPerCompanySection visitors={visitors} darkMode={darkMode} />
            <BranchesOverviewSection trucks={trucks} darkMode={darkMode} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <TrucksAnalyticsSection trucks={trucks} registeredCount={registeredTrucks.length} darkMode={darkMode} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RecentTrucksSection trucks={trucks} darkMode={darkMode} />
            <RecentVisitorsSection visitors={visitors} darkMode={darkMode} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}