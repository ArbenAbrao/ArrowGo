import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ============================================================
   Shared UI for the Accounts page, table, login history and
   the three account modals. Render <AccountsStyles /> once on
   the page (Accounts.jsx does this) — everything else relies
   on the classes it defines.
   ============================================================ */

export const ROLES = ["Admin", "User", "IT", "Client"];

// Same role → tone mapping as before: Admin sky, IT amber, Client slate, User emerald.
export const ROLE_TONE = {
  Admin: "t-sky",
  IT: "t-amber",
  Client: "t-slate",
  User: "t-em",
};

export const initialsOf = (first = "", last = "") =>
  `${(first || "").trim()[0] || ""}${(last || "").trim()[0] || ""}`.toUpperCase() || "?";

// Builds a compact page list with "..." gaps, e.g. [1, "...", 4, 5, 6, "...", 12]
export function getPageNumbers(current, total) {
  const delta = 1;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) pages.push(i);
  }
  const withGaps = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) withGaps.push("...");
    withGaps.push(page);
    previous = page;
  }
  return withGaps;
}

/* ================= STYLES =================
   Same emerald + slate system as the rest of the app. Every color is a
   Tailwind slate / emerald / sky / amber / rose value. */
export const accountsCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');
.vmvas-heading { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em; }

.ac {
  --panel:#FFFFFF; --panel-solid:#FFFFFF; --side:#F8FAFC; --sunken:#F1F5F9; --hover:#F8FAFC; --thumb:#FFFFFF;
  --border:#E2E8F0; --border-soft:#F1F5F9;
  --ink:#0F172A; --text:#334155; --muted:#64748B; --faint:#94A3B8;
  --input-bg:#FFFFFF; --input-border:#CBD5E1;
  --em:#10B981; --em-tint:#ECFDF5; --em-line:#A7F3D0; --em-ink:#047857; --em-soft:rgba(16,185,129,.07);
  --focus-line:#34D399; --focus-ring:rgba(52,211,153,.35); --focus-outline:#059669;
  --rose:#E11D48; --rose-tint:#FFF1F2; --rose-line:#FECDD3; --rose-soft:rgba(244,63,94,.05);
  --amber-soft:rgba(245,158,11,.07);
  --t-em-bg:#ECFDF5; --t-em-ink:#047857;
  --t-sky-bg:#F0F9FF; --t-sky-ink:#0369A1;
  --t-amber-bg:#FFFBEB; --t-amber-ink:#B45309;
  --t-rose-bg:#FFF1F2; --t-rose-ink:#BE123C;
  --t-slate-bg:#F1F5F9; --t-slate-ink:#475569;
  --dialog:#FFFFFF;
  --shadow-sm:0 1px 2px rgba(15,23,42,.06);
  --shadow:0 1px 2px rgba(15,23,42,.04), 0 16px 40px -16px rgba(15,23,42,.14);
  --shadow-lg:0 24px 60px -18px rgba(15,23,42,.35);
}
.ac-dark {
  --panel:rgba(15,23,42,.7); --panel-solid:#0B1224; --side:rgba(2,6,23,.45); --sunken:rgba(30,41,59,.6); --hover:rgba(30,41,59,.45); --thumb:#334155;
  --border:#1E293B; --border-soft:rgba(30,41,59,.7);
  --ink:#F1F5F9; --text:#CBD5E1; --muted:#94A3B8; --faint:#64748B;
  --input-bg:rgba(30,41,59,.7); --input-border:#334155;
  --em-tint:rgba(16,185,129,.1); --em-line:rgba(16,185,129,.25); --em-ink:#34D399; --em-soft:rgba(16,185,129,.08);
  --focus-line:rgba(16,185,129,.6); --focus-ring:rgba(16,185,129,.3); --focus-outline:#34D399;
  --rose:#FB7185; --rose-tint:rgba(244,63,94,.1); --rose-line:rgba(244,63,94,.28); --rose-soft:rgba(244,63,94,.06);
  --amber-soft:rgba(245,158,11,.07);
  --t-em-bg:rgba(16,185,129,.15); --t-em-ink:#34D399;
  --t-sky-bg:rgba(14,165,233,.15); --t-sky-ink:#38BDF8;
  --t-amber-bg:rgba(245,158,11,.15); --t-amber-ink:#FBBF24;
  --t-rose-bg:rgba(244,63,94,.15); --t-rose-ink:#FB7185;
  --t-slate-bg:#1E293B; --t-slate-ink:#94A3B8;
  --dialog:#0F172A;
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 50px -20px rgba(0,0,0,.65);
  --shadow-lg:0 30px 70px -20px rgba(0,0,0,.8);
}
.ac *, .ac *::before, .ac *::after { box-sizing:border-box; }
.ac button { font-family:inherit; cursor:pointer; }
.ac :focus-visible { outline:2px solid var(--focus-outline); outline-offset:2px; }
.ac-num { font-variant-numeric:tabular-nums; }
.ac-muted { color:var(--muted); }
.ac-scroll { scrollbar-width:thin; scrollbar-color:var(--border) transparent; }

/* tones */
.t-em { background:var(--t-em-bg); color:var(--t-em-ink); }
.t-sky { background:var(--t-sky-bg); color:var(--t-sky-ink); }
.t-amber { background:var(--t-amber-bg); color:var(--t-amber-ink); }
.t-rose { background:var(--t-rose-bg); color:var(--t-rose-ink); }
.t-slate { background:var(--t-slate-bg); color:var(--t-slate-ink); }
.ac-badge { display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 10px; border-radius:999px; font-size:12px; font-weight:600; white-space:nowrap; }
.ac-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.ac-badge.has-icon { padding:0 10px 0 8px; }
.ac-badge.has-icon::before { display:none; }
.ac-badge.is-live::before { animation:ac-pulse 1.8s ease-in-out infinite; }
@keyframes ac-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(.8); } }

/* buttons */
.ac-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:12px;
  border:1px solid transparent; font-size:14px; font-weight:600; white-space:nowrap;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease, filter .15s ease; }
.ac-btn:disabled { opacity:.6; cursor:not-allowed; }
.ac-btn-sm { height:36px; padding:0 14px; font-size:13px; }
.ac-btn-primary { color:#fff; background:linear-gradient(180deg,#10B981 0%,#059669 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 18px -8px rgba(5,150,105,.6); }
.ac-dark .ac-btn-primary { color:#020617; background:linear-gradient(180deg,#34D399 0%,#059669 100%); }
.ac-btn-warn { color:#fff; background:linear-gradient(180deg,#FBBF24 0%,#D97706 100%); box-shadow:0 8px 18px -8px rgba(217,119,6,.55); }
.ac-dark .ac-btn-warn { color:#020617; }
.ac-btn-danger { color:#fff; background:linear-gradient(180deg,#F43F5E 0%,#E11D48 100%); box-shadow:0 8px 18px -8px rgba(225,29,72,.55); }
.ac-dark .ac-btn-danger { color:#020617; background:linear-gradient(180deg,#FB7185 0%,#E11D48 100%); }
.ac-btn-primary:hover:not(:disabled), .ac-btn-warn:hover:not(:disabled), .ac-btn-danger:hover:not(:disabled) { filter:brightness(1.07); }
.ac-btn-secondary { color:var(--text); background:transparent; border-color:var(--input-border); }
.ac-btn-secondary:hover:not(:disabled) { background:var(--hover); border-color:var(--faint); }
.ac-chip-btn { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:999px; border:1px solid var(--em-line);
  background:var(--em-tint); color:var(--em-ink); font-size:12.5px; font-weight:600; transition:filter .15s ease; }
.ac-chip-btn:hover { filter:brightness(.97); }

.ac-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; border:0;
  background:transparent; color:var(--faint); transition:background-color .15s ease, color .15s ease; }
.ac-icon-btn:hover { color:var(--ink); background:var(--sunken); }
.ac-icon-btn.is-pw:hover { color:var(--t-sky-ink); background:var(--t-sky-bg); }
.ac-icon-btn.is-warn:hover { color:var(--t-amber-ink); background:var(--t-amber-bg); }
.ac-icon-btn.is-ok:hover { color:var(--t-em-ink); background:var(--t-em-bg); }
.ac-icon-btn.is-danger:hover { color:var(--rose); background:var(--rose-tint); }

/* inputs */
.ac-field { position:relative; }
.ac-field .ac-lead { position:absolute; left:13px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--faint); pointer-events:none; }
.ac-field .ac-chev { position:absolute; right:13px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--faint); pointer-events:none; }
.ac-field .ac-trail { position:absolute; right:5px; top:50%; transform:translateY(-50%); }
.ac-input { width:100%; height:42px; padding:0 14px; border-radius:12px; border:1px solid var(--input-border); background:var(--input-bg);
  color:var(--ink); font:inherit; font-size:14px; outline:none; transition:border-color .15s ease, box-shadow .15s ease; }
.ac-input::placeholder { color:var(--faint); }
.ac-input:focus { border-color:var(--focus-line); box-shadow:0 0 0 3px var(--focus-ring); }
.ac-input.has-lead { padding-left:38px; }
.ac-input.has-trail { padding-right:44px; }
.ac-input.is-invalid { border-color:var(--rose); }
.ac-input.is-invalid:focus { box-shadow:0 0 0 3px var(--rose-line); }
select.ac-input { appearance:none; padding-right:36px; cursor:pointer; }
select.ac-input option, .ac-role select option { color:var(--ink); background:var(--dialog); }
.ac-label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:var(--ink); }
.ac-msg { display:flex; align-items:center; gap:6px; margin-top:6px; font-size:12.5px; }
.ac-msg.is-error { color:var(--rose); }
.ac-msg.is-ok { color:var(--em-ink); }

/* shell + tabs */
.ac-shell { position:relative; background:var(--panel); border:1px solid var(--border); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
.ac-shell.has-line::before { content:""; position:absolute; left:0; right:0; top:0; height:2px; z-index:2;
  background:linear-gradient(90deg,#10B981 0%,#14B8A6 55%,#06B6D4 100%); }
.ac-tabbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px 16px; border-bottom:1px solid var(--border); }
.ac-seg { display:inline-flex; padding:4px; border-radius:14px; background:var(--sunken); border:1px solid var(--border-soft); }
.ac-seg-btn { position:relative; z-index:0; display:inline-flex; align-items:center; gap:8px; height:34px; padding:0 14px; border:0; border-radius:10px;
  background:transparent; font-size:13.5px; font-weight:600; color:var(--muted); transition:color .15s ease; }
.ac-seg-btn:hover, .ac-seg-btn.is-active { color:var(--ink); }
.ac-seg-thumb { position:absolute; inset:0; z-index:-1; border-radius:10px; background:var(--thumb); box-shadow:var(--shadow-sm); border:1px solid var(--border-soft); }
.ac-seg-btn.is-flat.is-active { background:var(--thumb); box-shadow:var(--shadow-sm); border:1px solid var(--border-soft); }
.ac-pill { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:20px; padding:0 7px; border-radius:999px;
  background:var(--sunken); color:var(--muted); font-size:11.5px; font-weight:600; }
.ac-seg-btn.is-active .ac-pill { background:var(--em-tint); color:var(--em-ink); }

/* toolbar */
.ac-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:16px 20px; background:var(--side); border-bottom:1px solid var(--border); }
.ac-toolbar .grow { flex:1 1 240px; }
.ac-toolbar .sel { flex:0 1 180px; min-width:150px; }
@media (max-width:639px) { .ac-toolbar .sel { flex:1 1 100%; } }

/* list rows (accounts + login history) */
.ac-head { display:none; }
.ac-row { display:grid; gap:12px; padding:16px 20px; border-bottom:1px solid var(--border-soft); transition:background-color .15s ease; }
.ac-row:last-child { border-bottom:0; }
.ac-row:hover { background:var(--hover); }
.ac-row.is-disabled { background:var(--rose-soft); }
.ac-row.is-flagged { background:var(--amber-soft); }

.ac-row.is-accounts { grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"acct actions" "tags tags" "meta meta"; }
.ac-id { grid-area:acct; display:flex; align-items:center; gap:14px; min-width:0; }
.ac-actions { grid-area:actions; display:flex; align-items:center; justify-content:flex-end; gap:2px; }
.ac-tags { grid-area:tags; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.ac-meta { grid-area:meta; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.ac-cell { display:flex; flex-direction:column; min-width:0; }
.ac-lab { font-size:11.5px; color:var(--faint); margin-bottom:2px; }
.ac-strong { font-size:13.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ac-sub { font-size:13px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.ac-row.is-logs { grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"user status" "loc loc" "dev dev" "flag date"; align-items:center; }
.l-user { grid-area:user; display:flex; align-items:center; gap:12px; min-width:0; }
.l-status { grid-area:status; justify-self:end; }
.l-loc { grid-area:loc; }
.l-dev { grid-area:dev; }
.l-flag { grid-area:flag; }
.l-date { grid-area:date; justify-self:end; }
.l-line { display:flex; align-items:center; gap:8px; min-width:0; font-size:13px; color:var(--muted); }
.l-line svg { width:15px; height:15px; flex:none; color:var(--faint); }
.l-line span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

@media (min-width:1280px) {
  .ac-head, .ac-row { column-gap:16px; align-items:center; }
  .ac-head { display:grid; padding:11px 20px; border-bottom:1px solid var(--border); background:var(--side); font-size:12.5px; font-weight:600; color:var(--muted); }
  .ac-head.is-accounts, .ac-row.is-accounts { grid-template-columns:minmax(220px,2fr) 132px minmax(90px,1fr) 108px minmax(110px,1fr) 116px; }
  .ac-row.is-accounts { grid-template-areas:"acct role branch status device actions"; padding:14px 20px; }
  .ac-tags, .ac-meta { display:contents; }
  .ac-cell-role { grid-area:role; }
  .ac-cell-status { grid-area:status; }
  .ac-c-branch { grid-area:branch; }
  .ac-c-device { grid-area:device; }
  .ac-lab { display:none; }
  .ac-actions { opacity:.85; }
  .ac-head.is-logs, .ac-row.is-logs { grid-template-columns:minmax(170px,1.6fr) 112px minmax(120px,1.2fr) minmax(120px,1.2fr) 112px 168px; }
  .ac-row.is-logs { grid-template-areas:"user status loc dev flag date"; padding:14px 20px; }
  .l-status, .l-date { justify-self:start; }
}
.ac-row:hover .ac-actions, .ac-row:focus-within .ac-actions { opacity:1; }

.ac-avatar { position:relative; display:flex; flex:none; align-items:center; justify-content:center; width:42px; height:42px; border-radius:13px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); font-size:13px; font-weight:600; }
.ac-avatar.is-muted { width:36px; height:36px; border-radius:11px; background:var(--sunken); border-color:var(--border); color:var(--muted); font-size:12px; }
.ac-dot { position:absolute; right:-4px; bottom:-4px; width:13px; height:13px; border-radius:50%; background:#10B981; border:2.5px solid var(--panel-solid); }
.ac-name { font-size:14.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ac-row.is-disabled .ac-name { text-decoration:line-through; opacity:.55; }
.ac-idsub { margin-top:1px; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* role select styled as a badge */
.ac-role { position:relative; display:inline-flex; align-items:center; height:30px; border-radius:999px; }
.ac-role select { appearance:none; height:30px; padding:0 28px 0 12px; border:0; border-radius:999px; background:transparent; color:inherit;
  font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; outline:none; }
.ac-role select:disabled { opacity:.5; cursor:wait; }
.ac-role svg { position:absolute; right:9px; width:14px; height:14px; pointer-events:none; }
.ac-role:focus-within { outline:2px solid var(--focus-outline); outline-offset:2px; }

/* chips filter */
.ac-chips { display:inline-flex; flex-wrap:wrap; gap:4px; padding:4px; border-radius:14px; background:var(--sunken); border:1px solid var(--border-soft); }

/* footer / pager */
.ac-foot { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:14px 20px; border-top:1px solid var(--border); background:var(--side); }
.ac-page { display:inline-flex; align-items:center; justify-content:center; min-width:36px; height:36px; padding:0 10px; border-radius:10px; border:1px solid var(--input-border);
  background:transparent; color:var(--text); font-size:13.5px; font-weight:600; transition:background-color .15s ease, border-color .15s ease; }
.ac-page:hover:not(:disabled):not(.is-current) { background:var(--hover); border-color:var(--faint); }
.ac-page:disabled { opacity:.4; cursor:not-allowed; }
.ac-page.is-current { border-color:transparent; color:#fff; background:linear-gradient(180deg,#10B981,#059669); }
.ac-dark .ac-page.is-current { color:#020617; background:linear-gradient(180deg,#34D399,#059669); }

/* empty + skeleton */
.ac-empty { display:flex; flex-direction:column; align-items:center; text-align:center; margin:24px; padding:56px 24px; border:1px dashed var(--input-border); border-radius:16px; background:var(--side); }
.ac-empty-icon { display:flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; margin-bottom:14px;
  background:var(--em-tint); border:1px solid var(--em-line); color:var(--em-ink); }
.ac-skel { background:var(--sunken); border-radius:10px; animation:ac-skel 1.4s ease-in-out infinite; }
@keyframes ac-skel { 0%,100% { opacity:1; } 50% { opacity:.55; } }
@media (prefers-reduced-motion: reduce) { .ac-skel, .ac-badge.is-live::before { animation:none; } .ac *, .ac *::before { transition-duration:0s !important; } }

/* dialogs */
.ac-dialog { display:flex; flex-direction:column; width:100%; max-width:448px; max-height:calc(100vh - 24px); border-radius:20px; border:1px solid var(--border);
  background:var(--dialog); color:var(--ink); box-shadow:var(--shadow-lg); overflow:hidden; }
.ac-dialog.is-sm { max-width:416px; }
.ac-dialog.is-lg { max-width:576px; }
.ac-dialog-head { display:flex; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid var(--border); background:var(--side); }
.ac-dialog-icon { display:flex; flex:none; align-items:center; justify-content:center; width:44px; height:44px; border-radius:14px; }
.ac-dialog-body { flex:1; overflow-y:auto; padding:22px 24px; }
.ac-dialog-foot { display:flex; justify-content:flex-end; gap:12px; padding:16px 24px; border-top:1px solid var(--border); background:var(--side); }

.ac-section { margin-top:22px; padding-top:22px; border-top:1px solid var(--border); }
.ac-section-title { margin-bottom:12px; font-size:13px; font-weight:600; color:var(--muted); }
.ac-cred { border:1px solid var(--border); background:var(--side); border-radius:16px; padding:18px; }
.ac-summary { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:16px; background:var(--sunken); border:1px solid var(--border); }

/* password meter + requirements */
.ac-meter { display:flex; gap:4px; }
.ac-meter i { flex:1; height:5px; border-radius:999px; background:var(--sunken); border:1px solid var(--border-soft); transition:background-color .2s ease; }
.ac-meter i.on-rose { background:#F43F5E; border-color:transparent; }
.ac-meter i.on-amber { background:#F59E0B; border-color:transparent; }
.ac-meter i.on-em { background:#10B981; border-color:transparent; }
.ac-reqs { display:grid; gap:7px; font-size:12.5px; }
.ac-reqs li { display:flex; align-items:center; gap:8px; color:var(--muted); transition:color .15s ease; }
.ac-reqs li.is-met { color:var(--em-ink); }
.ac-reqs li svg { width:15px; height:15px; flex:none; }
`;

export function AccountsStyles() {
  return <style>{accountsCss}</style>;
}

/* ================= PAGER ================= */
export function Pager({ page, totalPages, total, pageSize, label, onPage }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="ac-foot">
      <p className="ac-muted ac-num text-xs">
        Showing {from}–{to} of {total} {label}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            className="ac-page"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {getPageNumbers(page, totalPages).map((p, idx) =>
            p === "..." ? (
              <span key={`gap-${idx}`} className="ac-muted w-8 text-center text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`ac-page ac-num ${p === page ? "is-current" : ""}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className="ac-page"
            onClick={() => onPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

/* ================= MODAL FRAME (Headless UI) =================
   Dialogs render in a portal outside the page wrapper, so the color tokens
   are re-applied on the Dialog root via the "ac" / "ac-dark" classes. */
export function ModalFrame({
  open,
  onClose,
  darkMode = true,
  size = "md",
  icon: Icon,
  tone = "t-em",
  title,
  subtitle,
  footer,
  children,
}) {
  return (
    <Transition appear show={!!open} as={Fragment}>
      <Dialog as="div" className={`ac ${darkMode ? "ac-dark" : ""} relative z-50`} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className={`ac-dialog ${size === "sm" ? "is-sm" : size === "lg" ? "is-lg" : ""}`}>
              <div className="ac-dialog-head">
                {Icon && (
                  <span className={`ac-dialog-icon ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="vmvas-heading truncate text-[17px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
                    {title}
                  </Dialog.Title>
                  {subtitle && <p className="ac-muted mt-0.5 truncate text-xs">{subtitle}</p>}
                </div>
                <button type="button" className="ac-icon-btn" onClick={onClose} aria-label="Close">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="ac-dialog-body ac-scroll">{children}</div>

              {footer && <div className="ac-dialog-foot">{footer}</div>}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ================= PASSWORD FIELD ================= */
export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  show,
  onToggle,
  invalid,
  required,
  autoComplete = "new-password",
}) {
  return (
    <div>
      <label className="ac-label" htmlFor={id}>
        {label}
      </label>
      <div className="ac-field">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          className={`ac-input has-trail ${invalid ? "is-invalid" : ""}`}
        />
        <button
          type="button"
          className="ac-icon-btn ac-trail"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}