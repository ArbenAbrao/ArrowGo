import { useState, useEffect } from "react";
import axios from "axios";
import { HiPencil, HiTrash } from "react-icons/hi";

const API = "/api";

export default function Branches({ darkMode }) {
  const containerBg = darkMode
    ? "bg-gray-800 text-gray-300"
    : "bg-gray-50 text-gray-900";

  const cardBg = darkMode ? "bg-gray-900" : "bg-white";
  const inputBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-gray-50 border-gray-300";

  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);

  const [branchForm, setBranchForm] = useState({ name: "" });
  const [clientForm, setClientForm] = useState({ branchId: "", name: "" });
  const [editingBranchId, setEditingBranchId] = useState(null);

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const [b, c] = await Promise.all([
        axios.get(`${API}/branches`),
        axios.get(`${API}/branch-clients`)
      ]);

      setBranches(b.data);
      setClients(c.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= BRANCH =================
  const addOrUpdateBranch = async e => {
    e.preventDefault();
    if (!branchForm.name) return;

    try {
      if (editingBranchId) {
        await axios.put(`${API}/branches/${editingBranchId}`, branchForm);
      } else {
        await axios.post(`${API}/branches`, branchForm);
      }

      setBranchForm({ name: "" });
      setEditingBranchId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBranch = async id => {
    if (!window.confirm("Delete branch?")) return;
    await axios.delete(`${API}/branches/${id}`);
    fetchData();
  };

  // ================= CLIENT =================
  const addClient = async e => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.branchId) return;

    await axios.post(`${API}/branch-clients`, {
      name: clientForm.name,
      branch_id: clientForm.branchId
    });

    setClientForm({ branchId: "", name: "" });
    fetchData();
  };

  const deleteClient = async id => {
    if (!window.confirm("Delete client?")) return;
    await axios.delete(`${API}/branch-clients/${id}`);
    fetchData();
  };

  return (
    <div className={`p-4 sm:p-6 min-h-screen ${containerBg}`}>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo4.png" alt="Logo" className="h-10 w-10" />
        <h1 className={`text-2xl font-bold ${darkMode ? "text-cyan-400" : "text-green-600"}`}>
          Branches / Clients
        </h1>
      </div>

      {/* FORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* BRANCH FORM */}
        <form onSubmit={addOrUpdateBranch} className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h2 className="font-semibold mb-4">
            {editingBranchId ? "Edit Branch" : "Add Branch"}
          </h2>

          <input
            className={`w-full mb-4 p-2 rounded border ${inputBg}`}
            placeholder="Branch Name"
            value={branchForm.name}
            onChange={e => setBranchForm({ name: e.target.value })}
            required
          />

          <button className="px-4 py-2 rounded bg-green-600 text-white">
            {editingBranchId ? "Update" : "Save"}
          </button>
        </form>

        {/* CLIENT FORM */}
        <form onSubmit={addClient} className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h2 className="font-semibold mb-4">Register Client</h2>

          <select
            className={`w-full mb-3 p-2 rounded border ${inputBg}`}
            value={clientForm.branchId}
            onChange={e => setClientForm({ ...clientForm, branchId: e.target.value })}
            required
          >
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <input
            className={`w-full mb-4 p-2 rounded border ${inputBg}`}
            placeholder="Client Name"
            value={clientForm.name}
            onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
            required
          />

          <button className="px-4 py-2 rounded bg-blue-600 text-white">
            Register Client
          </button>
        </form>
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BRANCH TABLE */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h2 className="font-semibold mb-3">Branches</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Branch</th>
                <th className="text-center">Clients</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td className="text-center">{b.clientCount}</td>
                  <td className="text-right flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditingBranchId(b.id);
                        setBranchForm({ name: b.name });
                      }}
                      className="text-blue-500"
                    >
                      <HiPencil />
                    </button>
                    <button
                      onClick={() => deleteBranch(b.id)}
                      className="text-red-500"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {!branches.length && (
                <tr><td colSpan="3" className="text-center py-4">No branches</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CLIENT TABLE */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h2 className="font-semibold mb-3">Clients</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Client</th>
                <th>Branch</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.branch}</td>
                  <td className="text-right">
                    <button onClick={() => deleteClient(c.id)} className="text-red-500">
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {!clients.length && (
                <tr><td colSpan="3" className="text-center py-4">No clients</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
