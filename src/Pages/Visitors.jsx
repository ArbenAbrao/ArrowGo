// Pages/Visitors.jsx
import React, { useEffect, useMemo, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const STORAGE_KEYS = {
  VISITORS: "visitors_v1",
  SEARCH_HISTORY: "visitor_search_history_v1",
  REGISTERED_TYPES: "truck_types_v1", // reuse truck types if available
  APPOINTMENTS: "appointments_v1", // appointments created from Appointment.jsx
};

const headerImage = "logo4.png";

export default function Visitors() {
  const todayISO = new Date().toISOString().split("T")[0];

  // ------------------ STATES ------------------
  const [visitors, setVisitors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [registeredTypes, setRegisteredTypes] = useState([]); // optional reuse
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentVisitor, setCurrentVisitor] = useState(null);
  const [filterDate, setFilterDate] = useState(todayISO);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    company: "",
    personToVisit: "",
    purpose: "",
    idType: "",
    idNumber: "",
    badgeNumber: "",
    vehicleMode: "On Foot", // Truck / Company Vehicle / Private Car / Motorcycle / On Foot
    vehicleDetails: "", // plate or vehicle description
    truckType: "", // only used when vehicleMode === "Truck"
    date: todayISO,
    timeIn: "",
    timeOut: ""
  });
  const [searchHistory, setSearchHistory] = useState([]);

  // ------------------ LOCAL STORAGE LOAD ------------------
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEYS.VISITORS); if (raw) setVisitors(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_TYPES); if (raw) setRegisteredTypes(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY); if (raw) setSearchHistory(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS); if (raw) setAppointments(JSON.parse(raw)); } catch {}
  }, []);

  // ------------------ LOCAL STORAGE SAVE ------------------
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors)); } catch {} }, [visitors]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory)); } catch {} }, [searchHistory]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments)); } catch {} }, [appointments]);

  // ------------------ storage event (cross-tab) ------------------
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.VISITORS) {
        try { setVisitors(JSON.parse(e.newValue || "[]")); } catch {}
      } else if (e.key === STORAGE_KEYS.APPOINTMENTS) {
        try { setAppointments(JSON.parse(e.newValue || "[]")); } catch {}
      } else if (e.key === STORAGE_KEYS.REGISTERED_TYPES) {
        try { setRegisteredTypes(JSON.parse(e.newValue || "[]")); } catch {}
      } else if (e.key === STORAGE_KEYS.SEARCH_HISTORY) {
        try { setSearchHistory(JSON.parse(e.newValue || "[]")); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ------------------ UTILS ------------------
  const fmtNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const nextId = () => (visitors.length ? Math.max(...visitors.map(v => v.id || 0)) + 1 : 1);
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), ampm = m[3]?.toUpperCase();
    if (ampm) { if (ampm === "AM" && hh === 12) hh = 0; if (ampm === "PM" && hh !== 12) hh += 12; }
    return hh * 60 + mm;
  };
  const computeDuration = (v) => { if (!v.timeIn || !v.timeOut) return null; let mins = parseTimeToMinutes(v.timeOut) - parseTimeToMinutes(v.timeIn); if (mins < 0) mins += 24*60; const h=Math.floor(mins/60), m=mins%60; return h>0?`${h}h ${m}m`:`${m}m`; };
  const statusBadge = (v) => v.timeOut ? <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">OUT</span> : v.timeIn ? <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">IN</span> : <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">—</span>;

  // ------------------ VISITOR HANDLERS ------------------
  const handleAddVisitor = (e) => {
    e?.preventDefault();
    const id = nextId();
    setVisitors(s => [{ id, ...newVisitor }, ...s]);
    setNewVisitor({
      name: "",
      company: "",
      personToVisit: "",
      purpose: "",
      idType: "",
      idNumber: "",
      badgeNumber: "",
      vehicleMode: "On Foot",
      vehicleDetails: "",
      truckType: "",
      date: todayISO,
      timeIn: "",
      timeOut: ""
    });
    setIsAddOpen(false);
  };

  const handleOpenEdit = (v) => { setCurrentVisitor({...v}); setIsEditOpen(true); };
  const handleSaveEdit = e => { e?.preventDefault(); if(!currentVisitor) return; setVisitors(s => s.map(x => x.id===currentVisitor.id ? {...currentVisitor} : x)); setIsEditOpen(false); };
  const handleDeleteVisitor = id => { if(!window.confirm("Delete this visitor?")) return; setVisitors(s=>s.filter(t=>t.id!==id)); setIsEditOpen(false); };

  const handleSetTimeIn = visitorId => { const time=fmtNow(); setVisitors(s=>s.map(v=>v.id===visitorId?{...v,timeIn:time}:v)); if(currentVisitor?.id===visitorId) setCurrentVisitor(c=>({...c,timeIn:time})); };
  const handleSetTimeOut = visitorId => { const time=fmtNow(); setVisitors(s=>s.map(v=>v.id===visitorId?{...v,timeOut:time}:v)); if(currentVisitor?.id===visitorId) setCurrentVisitor(c=>({...c,timeOut:time})); };

  // ------------------ APPOINTMENT HANDLERS ------------------
  // Convert appointment into visitor (prefill add modal)
  const handleCreateVisitorFromAppointment = (appt) => {
    // prefill newVisitor with appointment data
    setNewVisitor({
      name: appt.name || "",
      company: appt.company || "",
      personToVisit: appt.personToVisit || "",
      purpose: appt.purpose || "Appointment",
      idType: appt.idType || "",
      idNumber: appt.idNumber || "",
      badgeNumber: appt.badgeNumber || "",
      vehicleMode: appt.vehicleMode || "On Foot",
      vehicleDetails: appt.vehicleDetails || "",
      truckType: appt.truckType || "",
      date: appt.date || todayISO,
      timeIn: appt.time || "" // time from appointment form (preferred time)
    });
    // Optionally remove appointment (consider it processed)
    const remain = appointments.filter(a => a.id !== appt.id);
    setAppointments(remain);
    // open add modal so user can review and "Add Visitor" (this will add with nextId)
    setIsAddOpen(true);
  };

  const handleDismissAppointment = (id) => {
    if(!window.confirm("Dismiss this appointment?")) return;
    setAppointments(s => s.filter(a => a.id !== id));
  };

  // ------------------ CSV EXPORT ------------------
  const exportCSV = () => {
    const headers = ["id","name","company","personToVisit","purpose","idType","idNumber","badgeNumber","vehicleMode","vehicleDetails","truckType","date","timeIn","timeOut"];
    const rows = visitors.map(t=>headers.map(h=>JSON.stringify(t[h]??"")).join(","));
    const csv=[headers.join(","),...rows].join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`visitor-logs-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // ------------------ FILTERED & SORTED ------------------
  const filteredAndSortedVisitors = useMemo(()=>{
    const q = searchText.trim().toLowerCase();
    let res = visitors.filter(t=>{
      if(filterDate && t.date!==filterDate) return false;
      if(filterStatus==="IN" && !t.timeIn) return false;
      if(filterStatus==="OUT" && !t.timeOut) return false;
      if(!q) return true;
      const hay=`${t.name||""} ${t.company||""} ${t.personToVisit||""} ${t.purpose||""}`.toLowerCase();
      return hay.includes(q);
    });
    const cmp = (a,b)=>{
      if(sortBy==="date_desc") return b.date.localeCompare(a.date);
      if(sortBy==="date_asc") return a.date.localeCompare(b.date);
      if(sortBy==="timein_desc") return (parseTimeToMinutes(b.timeIn)||-1)-(parseTimeToMinutes(a.timeIn)||-1);
      if(sortBy==="timein_asc") return (parseTimeToMinutes(a.timeIn)||99999)-(parseTimeToMinutes(b.timeIn)||99999);
      if(sortBy==="name_asc") return (a.name||"").localeCompare(b.name||"");
      if(sortBy==="name_desc") return (b.name||"").localeCompare(a.name||"");
      return 0;
    };
    return res.slice().sort(cmp);
  },[visitors,filterDate,filterStatus,searchText,sortBy]);

  // ------------------ SEARCH HISTORY ------------------
  const saveCurrentSearch = ()=>{
    const entry = { id:Date.now(), name:`${filterDate} • ${filterStatus} • ${searchText||"-"}`, filters:{filterDate,filterStatus,searchText}, createdAt:new Date().toISOString() };
    setSearchHistory(s=>[entry,...s].slice(0,12));
  };
  const applyHistoryEntry = entry=>{ if(!entry?.filters) return; setFilterDate(entry.filters.filterDate||todayISO); setFilterStatus(entry.filters.filterStatus||"ALL"); setSearchText(entry.filters.searchText||""); };
  const clearSearchHistory = ()=>{ if(!window.confirm("Clear search history?")) return; setSearchHistory([]); };
  const removeHistoryItem = id => setSearchHistory(s=>s.filter(h=>h.id!==id));

  // ------------------ JSX ------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img src={headerImage} alt="logo" className="w-14 h-14 rounded-md object-cover shadow-sm" />
            <div>
              <h1 className="text-3xl font-bold text-green-700">Visitor List</h1>
              <p className="text-sm text-gray-500">Manage visitors — clock in/out, process appointments and track</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={()=>setIsAddOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Add Visitor</button>
            <button onClick={exportCSV} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700" title="Export CSV">Export CSV</button>
          </div>
        </div>

        {/* Appointment Notifications */}
        <div className="mb-6">
          <div className="bg-white shadow rounded-lg p-4 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Appointments / Notifications</h3>
                <p className="text-sm text-gray-600">Recent appointment requests. Convert to visitor or dismiss.</p>
              </div>
              <div className="text-sm text-gray-500">{appointments.length} pending</div>
            </div>

            {appointments.length===0 ? (
              <div className="text-sm text-gray-500 p-3">No appointments. Visitors added manually will appear below.</div>
            ) : (
              <ul className="space-y-2">
                {appointments.slice(0,12).map(appt=>(
                  <li key={appt.id} className="bg-yellow-50 border rounded p-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-yellow-800">{appt.name || "—"}</div>
                          <div className="text-xs text-gray-600">{appt.company ? `${appt.company} • ${appt.personToVisit||"—"}` : (appt.personToVisit||"")}</div>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <div>{appt.date || "—"}</div>
                          <div>{appt.time || "—"}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">{appt.purpose || "Appointment"}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button onClick={()=>handleCreateVisitorFromAppointment(appt)} className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700">Create Visitor</button>
                      <button onClick={()=>handleDismissAppointment(appt.id)} className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200">Dismiss</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 border-t-4 border-green-600">
          <div className="grid md:grid-cols-4 gap-4 items-end">
            {/* Date */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <div className="flex gap-2">
                {["ALL","IN","OUT"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} className={`px-3 py-2 rounded ${filterStatus===s?"bg-green-600 text-white":"bg-white border text-gray-700"}`}>{s}</button>)}
              </div>
            </div>
            {/* Search */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Search (name / company / purpose / person)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Search..." value={searchText} onChange={e=>setSearchText(e.target.value)} className="flex-1 border rounded px-3 py-2" />
                <button onClick={saveCurrentSearch} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
                <HistoryDropdown history={searchHistory} onApply={applyHistoryEntry} onClear={clearSearchHistory} onRemove={removeHistoryItem} />
              </div>
            </div>
            {/* Sort */}
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Sort</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="border rounded px-3 py-2">
                <option value="date_desc">Date ↓</option>
                <option value="date_asc">Date ↑</option>
                <option value="timein_desc">Time In ↓</option>
                <option value="timein_asc">Time In ↑</option>
                <option value="name_asc">Name A→Z</option>
                <option value="name_desc">Name Z→A</option>
              </select>
            </div>
          </div>
        </div>

        {/* ------------------ CARD LIST ------------------ */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${filteredAndSortedVisitors.length>=10?"max-h-[520px] overflow-auto pr-2":""}`}>
          {filteredAndSortedVisitors.length===0?
            <div className="bg-white border rounded-lg p-6 text-center text-gray-500">No visitors found for the selected filters.</div>:
            filteredAndSortedVisitors.map(v=>(
              <div key={v.id} className="bg-white border rounded-lg shadow-sm p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{v.name||"—"}</h3>
                      <p className="text-sm text-gray-500">Company / From: <span className="text-gray-700 font-medium">{v.company||"—"}</span></p>
                      <p className="text-sm text-gray-500">Person to Visit: <span className="text-gray-700 font-medium">{v.personToVisit||"—"}</span></p>
                      <p className="text-sm text-gray-500">Purpose: <span className="text-gray-700 font-medium">{v.purpose||"—"}</span></p>
                      {v.idType && <p className="text-sm text-gray-500">ID: <span className="text-gray-700 font-medium">{v.idType} {v.idNumber?`• ${v.idNumber}`:""}</span></p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="font-medium text-gray-800">{v.date}</p>
                      <div className="mt-2">{statusBadge(v)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
                    <div><span className="block text-xs text-gray-400">Time In</span><span className="font-medium">{v.timeIn||"—"}</span></div>
                    <div><span className="block text-xs text-gray-400">Time Out</span><span className="font-medium">{v.timeOut||"—"}</span></div>
                    {v.vehicleMode && <div><span className="block text-xs text-gray-400">Vehicle</span><span className="font-medium">{v.vehicleMode}{v.vehicleDetails?` • ${v.vehicleDetails}`:""}</span></div>}
                    {v.truckType && <div><span className="block text-xs text-gray-400">Truck Type</span><span className="font-medium">{v.truckType}</span></div>}
                    {computeDuration(v) && <div><span className="block text-xs text-gray-400">Duration</span><span className="font-medium">{computeDuration(v)}</span></div>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-col gap-2">
                    {!v.timeIn? <button onClick={()=>handleSetTimeIn(v.id)} className="px-3 py-1 rounded border bg-green-50 text-green-700 hover:bg-green-100">Set IN</button>:
                      <button disabled className="px-3 py-1 rounded border bg-green-100 text-green-800 cursor-default">{v.timeIn}</button>}
                    {!v.timeOut? <button onClick={()=>handleSetTimeOut(v.id)} className="px-3 py-1 rounded border bg-red-50 text-red-700 hover:bg-red-100">Set OUT</button>:
                      <button disabled className="px-3 py-1 rounded border bg-red-100 text-red-800 cursor-default">{v.timeOut}</button>}
                  </div>
                  <button onClick={()=>handleOpenEdit(v)} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Edit</button>
                </div>
              </div>
            ))
          }
        </div>

        {/* ------------------ MODALS ------------------ */}
        {/* ADD VISITOR MODAL */}
        <Transition appear show={isAddOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={()=>setIsAddOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Add Visitor</Dialog.Title>

                    <form onSubmit={handleAddVisitor} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                        <input type="text" required value={newVisitor.name} onChange={e=>setNewVisitor(t=>({...t,name:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Company / From</label>
                        <input type="text" value={newVisitor.company} onChange={e=>setNewVisitor(t=>({...t,company:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Person to Visit</label>
                        <input type="text" value={newVisitor.personToVisit} onChange={e=>setNewVisitor(t=>({...t,personToVisit:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                        <input type="text" value={newVisitor.purpose} onChange={e=>setNewVisitor(t=>({...t,purpose:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ID Type</label>
                          <input type="text" value={newVisitor.idType} onChange={e=>setNewVisitor(t=>({...t,idType:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ID Number</label>
                          <input type="text" value={newVisitor.idNumber} onChange={e=>setNewVisitor(t=>({...t,idNumber:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Badge Number</label>
                        <input type="text" value={newVisitor.badgeNumber} onChange={e=>setNewVisitor(t=>({...t,badgeNumber:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      {/* Vehicle Mode */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Vehicle Mode</label>
                        <select value={newVisitor.vehicleMode} onChange={e=>setNewVisitor(t=>({...t,vehicleMode:e.target.value, truckType: ""}))} className="border rounded px-3 py-2 w-full">
                          <option>On Foot</option>
                          <option>Truck</option>
                          <option>Company Vehicle</option>
                          <option>Private Car</option>
                          <option>Motorcycle</option>
                        </select>
                      </div>

                      {/* Truck type is only visible when vehicleMode === 'Truck' */}
                      {newVisitor.vehicleMode === "Truck" && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Truck Type</label>
                          <select value={newVisitor.truckType} onChange={e=>setNewVisitor(t=>({...t,truckType:e.target.value}))} className="border rounded px-3 py-2 w-full">
                            <option value="">-- Select Truck Type (optional) --</option>
                            {registeredTypes.map(rt=> <option key={rt.name} value={rt.name}>{rt.name}{rt.clientName?` (${rt.clientName})`:''}</option>)}
                            <option value="EV">EV</option>
                            <option value="6 Wheeler">6 Wheeler</option>
                            <option value="10 Wheeler">10 Wheeler</option>
                            <option value="Trailer">Trailer</option>
                            <option value="Pickup">Pickup</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Vehicle Details (plate / note)</label>
                        <input type="text" value={newVisitor.vehicleDetails} onChange={e=>setNewVisitor(t=>({...t,vehicleDetails:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Date</label>
                          <input type="date" value={newVisitor.date} onChange={e=>setNewVisitor(t=>({...t,date:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Time (optional)</label>
                          <input type="time" value={newVisitor.timeIn} onChange={e=>setNewVisitor(t=>({...t,timeIn:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={()=>setIsAddOpen(false)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Add Visitor</button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* EDIT VISITOR MODAL */}
        <Transition appear show={isEditOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={()=>setIsEditOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Edit Visitor</Dialog.Title>
                    {currentVisitor && <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                        <input type="text" value={currentVisitor.name} onChange={e=>setCurrentVisitor(t=>({...t,name:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Company / From</label>
                        <input type="text" value={currentVisitor.company} onChange={e=>setCurrentVisitor(t=>({...t,company:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Person to Visit</label>
                        <input type="text" value={currentVisitor.personToVisit} onChange={e=>setCurrentVisitor(t=>({...t,personToVisit:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                        <input type="text" value={currentVisitor.purpose} onChange={e=>setCurrentVisitor(t=>({...t,purpose:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ID Type</label>
                          <input type="text" value={currentVisitor.idType} onChange={e=>setCurrentVisitor(t=>({...t,idType:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">ID Number</label>
                          <input type="text" value={currentVisitor.idNumber} onChange={e=>setCurrentVisitor(t=>({...t,idNumber:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Badge Number</label>
                        <input type="text" value={currentVisitor.badgeNumber} onChange={e=>setCurrentVisitor(t=>({...t,badgeNumber:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Vehicle Mode</label>
                        <select value={currentVisitor.vehicleMode} onChange={e=>setCurrentVisitor(t=>({...t,vehicleMode:e.target.value}))} className="border rounded px-3 py-2 w-full">
                          <option>On Foot</option>
                          <option>Truck</option>
                          <option>Company Vehicle</option>
                          <option>Private Car</option>
                          <option>Motorcycle</option>
                        </select>
                      </div>

                      {currentVisitor.vehicleMode === "Truck" && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Truck Type</label>
                          <select value={currentVisitor.truckType} onChange={e=>setCurrentVisitor(t=>({...t,truckType:e.target.value}))} className="border rounded px-3 py-2 w-full">
                            <option value="">-- Select Truck Type (optional) --</option>
                            {registeredTypes.map(rt=> <option key={rt.name} value={rt.name}>{rt.name}{rt.clientName?` (${rt.clientName})`:''}</option>)}
                            <option value="EV">EV</option>
                            <option value="6 Wheeler">6 Wheeler</option>
                            <option value="10 Wheeler">10 Wheeler</option>
                            <option value="Trailer">Trailer</option>
                            <option value="Pickup">Pickup</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Vehicle Details (plate / note)</label>
                        <input type="text" value={currentVisitor.vehicleDetails} onChange={e=>setCurrentVisitor(t=>({...t,vehicleDetails:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Date</label>
                          <input type="date" value={currentVisitor.date} onChange={e=>setCurrentVisitor(t=>({...t,date:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Time In</label>
                          <input type="time" value={currentVisitor.timeIn} onChange={e=>setCurrentVisitor(t=>({...t,timeIn:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={()=>handleDeleteVisitor(currentVisitor.id)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                        <button type="button" onClick={()=>setIsEditOpen(false)} className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Save</button>
                      </div>
                    </form>}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

      </div>
    </div>
  );
}

// ------------------ HISTORY DROPDOWN ------------------
function HistoryDropdown({ history=[], onApply, onClear, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={()=>setOpen(o=>!o)} className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-100">History</button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border rounded shadow-lg z-50">
          <div className="flex justify-between items-center p-2 border-b">
            <span className="text-sm font-semibold">Search History</span>
            <button onClick={()=>{onClear(); setOpen(false)}} className="text-xs text-red-600 hover:underline">Clear All</button>
          </div>
          <ul className="max-h-64 overflow-auto">
            {history.map(h=>(
              <li key={h.id} className="flex justify-between items-center px-2 py-1 hover:bg-gray-50">
                <button onClick={()=>{onApply(h); setOpen(false)}} className="text-sm text-gray-800 text-left flex-1">{h.name}</button>
                <button onClick={()=>onRemove(h.id)} className="text-xs text-red-600 ml-1">x</button>
              </li>
            ))}
            {history.length===0 && <li className="px-2 py-1 text-sm text-gray-500">No history</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
