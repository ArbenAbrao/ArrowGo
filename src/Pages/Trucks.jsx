// Trucks.jsx
import React, { useEffect, useMemo, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const STORAGE_KEYS = {
  TRUCKS: "trucks_v1",
  SEARCH_HISTORY: "truck_search_history_v1",
  TRUCK_TYPES: "truck_types_v1",
};

const headerImage = "logo4.png";

export default function Trucks() {
  const todayISO = new Date().toISOString().split("T")[0];

  // ------------------ STATES ------------------
  const [trucks, setTrucks] = useState([]);
  const [registeredTypes, setRegisteredTypes] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRegisterTypeOpen, setIsRegisterTypeOpen] = useState(false);
  const [currentTruck, setCurrentTruck] = useState(null);
  const [filterDate, setFilterDate] = useState(todayISO);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [newTruck, setNewTruck] = useState({ type: "", driver: "", plate: "", clientName: "", bay: "", date: todayISO, purpose: "", timeIn: "", timeOut: "" });
  const [searchHistory, setSearchHistory] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDefaults, setNewTypeDefaults] = useState({ plate: "", clientName: "" });

  // ------------------ LOCAL STORAGE LOAD ------------------
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEYS.TRUCKS); if (raw) setTrucks(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(STORAGE_KEYS.TRUCK_TYPES); if (raw) setRegisteredTypes(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY); if (raw) setSearchHistory(JSON.parse(raw)); } catch {}
  }, []);

  // ------------------ LOCAL STORAGE SAVE ------------------
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks)); } catch {} }, [trucks]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.TRUCK_TYPES, JSON.stringify(registeredTypes)); } catch {} }, [registeredTypes]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory)); } catch {} }, [searchHistory]);

  // ------------------ UTILS ------------------
  const fmtNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const nextId = () => (trucks.length ? Math.max(...trucks.map(t => t.id || 0)) + 1 : 1);
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), ampm = m[3]?.toUpperCase();
    if (ampm) { if (ampm === "AM" && hh === 12) hh = 0; if (ampm === "PM" && hh !== 12) hh += 12; }
    return hh * 60 + mm;
  };
  const computeDuration = (t) => { if (!t.timeIn || !t.timeOut) return null; let mins = parseTimeToMinutes(t.timeOut) - parseTimeToMinutes(t.timeIn); if (mins < 0) mins += 24*60; const h=Math.floor(mins/60), m=mins%60; return h>0?`${h}h ${m}m`:`${m}m`; };
  const statusBadge = (truck) => truck.timeOut ? <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">OUT</span> : truck.timeIn ? <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">IN</span> : <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">—</span>;
  const builtinTypes = ["EV", "6 Wheeler", "10 Wheeler", "Trailer", "Pickup"];

  const isBayOccupied = (bay, date) => trucks.some(t => t.date===date && t.bay===bay && !t.timeOut);

  // ------------------ TRUCK HANDLERS ------------------
  const handleAddTruck = e => {
    e?.preventDefault();
    const id = nextId();
    setTrucks(s => [{ id, ...newTruck }, ...s]);
    setNewTruck({ type: "", driver: "", plate: "", clientName: "", bay: "", date: todayISO, purpose: "", timeIn: "", timeOut: "" });
    setIsAddOpen(false);
  };

  const handleOpenEdit = truck => { setCurrentTruck({...truck}); setIsEditOpen(true); };
  const handleSaveEdit = e => { e?.preventDefault(); if(!currentTruck) return; setTrucks(s => s.map(t => t.id===currentTruck.id ? {...currentTruck} : t)); setIsEditOpen(false); };
  const handleDeleteTruck = id => { if(!window.confirm("Delete this truck?")) return; setTrucks(s=>s.filter(t=>t.id!==id)); setIsEditOpen(false); };
  const handleSetTimeIn = truckId => { const time=fmtNow(); setTrucks(s=>s.map(t=>t.id===truckId?{...t,timeIn:time}:t)); if(currentTruck?.id===truckId) setCurrentTruck(c=>({...c,timeIn:time})); };
  const handleSetTimeOut = truckId => { const time=fmtNow(); setTrucks(s=>s.map(t=>t.id===truckId?{...t,timeOut:time}:t)); if(currentTruck?.id===truckId) setCurrentTruck(c=>({...c,timeOut:time})); };

  // ------------------ TYPE HANDLERS ------------------
const handleAddType = (e) => {
  e.preventDefault();

  // Check if plate is already registered
  if (registeredTypes.some(rt => rt.plate === newTypeDefaults.plate && newTypeDefaults.plate.trim() !== "")) {
    return alert(`Plate ${newTypeDefaults.plate} is already registered!`);
  }

  // Add the new type
  setRegisteredTypes(prev => [
    ...prev,
    {
      name: newTypeName.trim(),
      plate: newTypeDefaults.plate.trim(),
      clientName: newTypeDefaults.clientName.trim(),
    }
  ]);

  // Reset form
  setNewTypeName("");
  setNewTypeDefaults({ plate: "", clientName: "" });
};
  const handleDeleteType = name => { if(!window.confirm(`Delete registered type "${name}"?`)) return; setRegisteredTypes(s=>s.filter(t=>t.name!==name)); };

  // ------------------ CSV EXPORT ------------------
  const exportCSV = () => {
    const headers = ["id","type","driver","plate","clientName","bay","date","timeIn","timeOut","purpose"];
    const rows = trucks.map(t=>headers.map(h=>JSON.stringify(t[h]??"")).join(","));
    const csv=[headers.join(","),...rows].join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`truck-logs-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // ------------------ FILTERED & SORTED ------------------
  const filteredAndSortedTrucks = useMemo(()=>{
    const q = searchText.trim().toLowerCase();
    let res = trucks.filter(t=>{
      if(filterDate && t.date!==filterDate) return false;
      if(filterStatus==="IN" && !t.timeIn) return false;
      if(filterStatus==="OUT" && !t.timeOut) return false;
      if(!q) return true;
      const hay=`${t.type||""} ${t.driver||""} ${t.plate||""} ${t.clientName||""}`.toLowerCase();
      return hay.includes(q);
    });
    const cmp = (a,b)=>{
      if(sortBy==="date_desc") return b.date.localeCompare(a.date);
      if(sortBy==="date_asc") return a.date.localeCompare(b.date);
      if(sortBy==="timein_desc") return (parseTimeToMinutes(b.timeIn)||-1)-(parseTimeToMinutes(a.timeIn)||-1);
      if(sortBy==="timein_asc") return (parseTimeToMinutes(a.timeIn)||99999)-(parseTimeToMinutes(b.timeIn)||99999);
      if(sortBy==="driver_asc") return (a.driver||"").localeCompare(b.driver||"");
      if(sortBy==="driver_desc") return (b.driver||"").localeCompare(a.driver||"");
      return 0;
    };
    return res.slice().sort(cmp);
  },[trucks,filterDate,filterStatus,searchText,sortBy]);

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
              <h1 className="text-3xl font-bold text-green-700">Truck List</h1>
              <p className="text-sm text-gray-500">Manage trucks — clock in/out, edit and search</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setIsAddOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ Add Truck</button>
            <button onClick={()=>setIsRegisterTypeOpen(true)} className="bg-white border px-3 py-2 rounded hover:bg-gray-50 text-gray-800" title="Register truck type">+ Register Type</button>
            <button onClick={exportCSV} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700" title="Export CSV">Export CSV</button>
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
              <label className="block text-sm text-gray-600 mb-1">Search (type / driver / plate)</label>
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
                <option value="driver_asc">Driver A→Z</option>
                <option value="driver_desc">Driver Z→A</option>
              </select>
            </div>
          </div>
        </div>

        {/* ------------------ CARD LIST ------------------ */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${filteredAndSortedTrucks.length>=10?"max-h-[520px] overflow-auto pr-2":""}`}>
          {filteredAndSortedTrucks.length===0?
            <div className="bg-white border rounded-lg p-6 text-center text-gray-500">No trucks found for the selected filters.</div>:
            filteredAndSortedTrucks.map(truck=>(
              <div key={truck.id} className="bg-white border rounded-lg shadow-sm p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{truck.type||"—"}</h3>
                      <p className="text-sm text-gray-500">Driver: <span className="text-gray-700 font-medium">{truck.driver||"—"}</span></p>
                      <p className="text-sm text-gray-500">Plate: <span className="text-gray-700 font-medium">{truck.plate||"—"}</span></p>
                      <p className="text-sm text-gray-500">Client: <span className="text-gray-700 font-medium">{truck.clientName||"—"}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="font-medium text-gray-800">{truck.date}</p>
                      <div className="mt-2">{statusBadge(truck)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
                    <div><span className="block text-xs text-gray-400">Time In</span><span className="font-medium">{truck.timeIn||"—"}</span></div>
                    <div><span className="block text-xs text-gray-400">Time Out</span><span className="font-medium">{truck.timeOut||"—"}</span></div>
                    {truck.purpose && <div><span className="block text-xs text-gray-400">Purpose</span><span className="font-medium">{truck.purpose}</span></div>}
                    {truck.bay && <div><span className="block text-xs text-gray-400">Bay</span><span className="font-medium">{truck.bay}</span></div>}
                    {computeDuration(truck) && <div><span className="block text-xs text-gray-400">Duration</span><span className="font-medium">{computeDuration(truck)}</span></div>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-col gap-2">
                    {!truck.timeIn? <button onClick={()=>handleSetTimeIn(truck.id)} className="px-3 py-1 rounded border bg-green-50 text-green-700 hover:bg-green-100">Set IN</button>:
                      <button disabled className="px-3 py-1 rounded border bg-green-100 text-green-800 cursor-default">{truck.timeIn}</button>}
                    {!truck.timeOut? <button onClick={()=>handleSetTimeOut(truck.id)} className="px-3 py-1 rounded border bg-red-50 text-red-700 hover:bg-red-100">Set OUT</button>:
                      <button disabled className="px-3 py-1 rounded border bg-red-100 text-red-800 cursor-default">{truck.timeOut}</button>}
                  </div>
                  <button onClick={()=>handleOpenEdit(truck)} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Edit</button>
                </div>
              </div>
            ))
          }
        </div>

        {/* ------------------ MODALS ------------------ */}
 {/* ADD TRUCK MODAL */}
<Transition appear show={isAddOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={()=>setIsAddOpen(false)}>
    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
      <div className="fixed inset-0 bg-black bg-opacity-25" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Add Truck</Dialog.Title>
            <form onSubmit={e=>{
              e.preventDefault();
              if(!newTruck.bay) return alert("Please select a bay");
              if(newTruck.bay === "Waitlist") {
                handleAddTruck(); // Add truck to waitlist
                return alert("Truck added to the waitlist");
              }
              if(isBayOccupied(newTruck.bay,newTruck.date)) return alert(`Bay ${newTruck.bay} is already occupied on ${newTruck.date}`);
              // Automatically set time in
              const timeNow = new Date();
              setNewTruck(t=>({ ...t, timeIn: timeNow.toLocaleTimeString() }));
              handleAddTruck();
            }} className="flex flex-col gap-3">

              {/* CLIENT DROPDOWN */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Client</label>
                <select value={newTruck.clientName} onChange={e=>{
                  const client = e.target.value;
                  setNewTruck(t=>({
                    ...t,
                    clientName: client,
                    type: "", // reset truck type when client changes
                  }));
                }} className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Client --</option>
                  {Array.from(new Set(registeredTypes.map(rt=>rt.clientName).filter(c=>c))).sort().map(c=>
                    <option key={c} value={c}>{c}</option>
                  )}
                </select>
              </div>

              {/* TRUCK TYPE DROPDOWN FILTERED BY CLIENT */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Truck Type</label>
                <select value={newTruck.type} onChange={e=>{
                  const val=e.target.value;
                  setNewTruck(t=>({
                    ...t,
                    type:val,
                    plate:registeredTypes.find(rt=>rt.name===val)?.plate || "",
                  }));
                }} className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Truck Type --</option>
                  {registeredTypes
                    .filter(rt=>rt.clientName===newTruck.clientName)
                    .map(rt=>rt.name)
                    .sort()
                    .map(name=> <option key={name} value={name}>{name}</option>)
                  }
                </select>
              </div>

              {/* DRIVER */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Driver</label>
                <input type="text" required value={newTruck.driver} onChange={e=>setNewTruck(t=>({...t,driver:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* PLATE */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plate</label>
                <input type="text" value={newTruck.plate} onChange={e=>setNewTruck(t=>({...t,plate:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* BAY */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bay</label>
                <select value={newTruck.bay} onChange={e=>setNewTruck(t=>({...t,bay:e.target.value}))} className="border rounded px-3 py-2 w-full">
                  <option value="">-- Select Bay --</option>
                  {Array.from({length:10}, (_,i)=>['A','B'].map(letter=>`${i+1}${letter}`)).flat().map(bay=>(
                    <option 
                      key={bay} 
                      value={bay} 
                      disabled={isBayOccupied(bay,newTruck.date)} // disable if bay occupied
                    >
                      {bay} {isBayOccupied(bay,newTruck.date) ? '(Occupied)' : ''}
                    </option>
                  ))}
                  {/* Waitlist option */}
                  <option value="Waitlist">Waitlist</option>
                </select>
              </div>

              {/* PURPOSE */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                <input type="text" value={newTruck.purpose} onChange={e=>setNewTruck(t=>({...t,purpose:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={()=>setIsAddOpen(false)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Add Truck</button>
              </div>

            </form>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>


{/* EDIT TRUCK MODAL */}
<Transition appear show={isEditOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={()=>setIsEditOpen(false)}>
    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
      <div className="fixed inset-0 bg-black bg-opacity-25" />
    </Transition.Child>
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Edit Truck</Dialog.Title>
            {currentTruck && <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">

              {/* Truck Type */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Truck Type</label>
                <input type="text" value={currentTruck.type} disabled className="border rounded px-3 py-2 w-full bg-gray-100"/>
              </div>

              {/* Driver */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Driver</label>
                <input type="text" value={currentTruck.driver} onChange={e=>setCurrentTruck(t=>({...t,driver:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* Plate */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plate</label>
                <input type="text" value={currentTruck.plate} onChange={e=>setCurrentTruck(t=>({...t,plate:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Client</label>
                <input type="text" value={currentTruck.clientName} disabled className="border rounded px-3 py-2 w-full bg-gray-100"/>
              </div>

              {/* Bay */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bay</label>
                <select value={currentTruck.bay} onChange={e=>setCurrentTruck(t=>({...t,bay:e.target.value}))} className="border rounded px-3 py-2 w-full">
                  {Array.from({length:10}, (_,i)=>['A','B'].map(letter=>`${i+1}${letter}`)).flat().map(bay=>(
                    <option 
                      key={bay} 
                      value={bay} 
                      disabled={isBayOccupied(bay,currentTruck.date) && bay !== currentTruck.bay} // disable if occupied and not current
                    >
                      {bay} {isBayOccupied(bay,currentTruck.date) && bay !== currentTruck.bay ? '(Occupied)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Purpose</label>
                <input type="text" value={currentTruck.purpose} onChange={e=>setCurrentTruck(t=>({...t,purpose:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={()=>handleDeleteTruck(currentTruck.id)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
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


        {/* REGISTER TYPE MODAL */}
        <Transition appear show={isRegisterTypeOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={()=>setIsRegisterTypeOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Register Truck Type</Dialog.Title>
                    <form onSubmit={handleAddType} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Type Name</label>
                        <input type="text" value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} className="border rounded px-3 py-2 w-full"/>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Default Plate</label>
                        <input type="text" value={newTypeDefaults.plate} onChange={e=>setNewTypeDefaults(d=>({...d,plate:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Default Client Name</label>
                        <input type="text" value={newTypeDefaults.clientName} onChange={e=>setNewTypeDefaults(d=>({...d,clientName:e.target.value}))} className="border rounded px-3 py-2 w-full"/>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={()=>setIsRegisterTypeOpen(false)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Add Type</button>
                      </div>
                    </form>

                    {/* Existing types list */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-2">Registered Types</h4>
                      <ul className="space-y-2 max-h-48 overflow-auto">
                        {registeredTypes.map(rt=>(
                          <li key={rt.name} className="flex justify-between items-center bg-gray-50 px-3 py-1 rounded">
                            <span>{rt.name} {rt.clientName?"("+rt.clientName+")":""}</span>
                            <button onClick={()=>handleDeleteType(rt.name)} className="px-2 py-1 text-sm text-red-600 hover:text-red-800">Delete</button>
                          </li>
                        ))}
                        {registeredTypes.length===0 && <li className="text-gray-500 text-sm">No registered types</li>}
                      </ul>
                    </div>
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
