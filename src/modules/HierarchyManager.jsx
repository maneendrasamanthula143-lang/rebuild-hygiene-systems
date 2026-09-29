import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitFork, Building2, MapPin, Plus, CheckCircle2, ChevronRight, Layers, ShieldCheck, RefreshCw } from 'lucide-react';

export default function HierarchyManager() {
  const { role } = useAuth();
  const [hierarchy, setHierarchy] = useState({ states: [], districts: [], branches: [], tree: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showAddState, setShowAddState] = useState(false);
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);

  const [stateForm, setStateForm] = useState({ name: '', code: '' });
  const [districtForm, setDistrictForm] = useState({ state_id: '', name: '' });
  const [branchForm, setBranchForm] = useState({ district_id: '', name: '', type: 'CAMP', code: '', address: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getHierarchy();
      setHierarchy(res);
      if (res.states.length > 0 && !districtForm.state_id) {
        setDistrictForm(f => ({ ...f, state_id: res.states[0].id }));
      }
      if (res.districts.length > 0 && !branchForm.district_id) {
        setBranchForm(f => ({ ...f, district_id: res.districts[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddState = async (e) => {
    e.preventDefault();
    try {
      await api.createState(stateForm);
      setStateForm({ name: '', code: '' });
      setShowAddState(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDistrict = async (e) => {
    e.preventDefault();
    try {
      await api.createDistrict(districtForm);
      setDistrictForm({ state_id: hierarchy.states[0]?.id || '', name: '' });
      setShowAddDistrict(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      await api.createBranch(branchForm);
      setBranchForm({ district_id: hierarchy.districts[0]?.id || '', name: '', type: 'CAMP', code: '', address: '' });
      setShowAddBranch(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8102E] uppercase tracking-wider">
            <GitFork className="w-4 h-4" /> Organizational Hierarchy Infrastructure
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            States, Districts, Branches & Camps
          </h2>
          <p className="text-xs text-slate-500">
            Real-time relational organizational tree for Sri Chaitanya Educational Institutions.
          </p>
        </div>

        {role === 'SUPER_ADMIN' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddState(!showAddState)}
              className="px-3 py-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Add State
            </button>
            <button
              onClick={() => setShowAddDistrict(!showAddDistrict)}
              className="px-3 py-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Add District
            </button>
            <button
              onClick={() => setShowAddBranch(!showAddBranch)}
              className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-amber-300" /> Add Branch / Camp
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Add Forms */}
      {showAddState && (
        <form onSubmit={handleAddState} className="bg-amber-50 p-4 rounded-xl border border-amber-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1">State Name</label>
            <input
              type="text"
              value={stateForm.name}
              onChange={e => setStateForm({ ...stateForm, name: e.target.value })}
              placeholder="e.g. Telangana"
              className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1">State Code</label>
            <input
              type="text"
              value={stateForm.code}
              onChange={e => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. TS"
              className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white"
              required
            />
          </div>
          <button type="submit" className="py-2 px-4 bg-[#0B2545] text-white text-xs font-bold rounded-lg">
            Save State
          </button>
        </form>
      )}

      {showAddDistrict && (
        <form onSubmit={handleAddDistrict} className="bg-blue-50 p-4 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">Select Parent State</label>
            <select
              value={districtForm.state_id}
              onChange={e => setDistrictForm({ ...districtForm, state_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg bg-white"
              required
            >
              {hierarchy.states.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">District Name</label>
            <input
              type="text"
              value={districtForm.name}
              onChange={e => setDistrictForm({ ...districtForm, name: e.target.value })}
              placeholder="e.g. Warangal"
              className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg bg-white"
              required
            />
          </div>
          <button type="submit" className="py-2 px-4 bg-[#0B2545] text-white text-xs font-bold rounded-lg">
            Save District
          </button>
        </form>
      )}

      {showAddBranch && (
        <form onSubmit={handleAddBranch} className="bg-red-50 p-4 rounded-xl border border-red-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-red-900 mb-1">Select District</label>
            <select
              value={branchForm.district_id}
              onChange={e => setBranchForm({ ...branchForm, district_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white"
              required
            >
              {hierarchy.districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-red-900 mb-1">Facility Type</label>
            <select
              value={branchForm.type}
              onChange={e => setBranchForm({ ...branchForm, type: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white"
            >
              <option value="CAMP">CAMP</option>
              <option value="SCHOOL">SCHOOL</option>
              <option value="COLLEGE">COLLEGE</option>
              <option value="HOSTEL">HOSTEL</option>
              <option value="BRANCH">BRANCH</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-red-900 mb-1">Branch/Camp Name</label>
            <input
              type="text"
              value={branchForm.name}
              onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
              placeholder="e.g. Sri Chaitanya Techno Campus"
              className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-900 mb-1">Branch Code</label>
            <input
              type="text"
              value={branchForm.code}
              onChange={e => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SC-WGL-005"
              className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white"
              required
            />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="w-full py-2 px-4 bg-[#C8102E] text-white text-xs font-bold rounded-lg">
              Create New Branch / Camp
            </button>
          </div>
        </form>
      )}

      {/* Tree Visualization */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading database hierarchy...
        </div>
      ) : (
        <div className="space-y-4">
          {hierarchy.tree.map(state => (
            <div key={state.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    {state.code}
                  </span>
                  STATE: {state.name}
                </div>
                <span className="text-xs text-amber-300 font-semibold">
                  {state.districts.length} Districts
                </span>
              </div>

              <div className="p-4 space-y-4">
                {state.districts.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No districts added to this state yet.</div>
                ) : (
                  state.districts.map(dist => (
                    <div key={dist.id} className="pl-4 border-l-2 border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        DISTRICT: {dist.name}
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {dist.branches.length} Facilities
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {dist.branches.map(branch => (
                          <div
                            key={branch.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-[#0B2545] transition"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-[#0B2545] truncate">
                                {branch.name}
                              </span>
                              <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                {branch.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              CODE: {branch.code}
                            </div>
                            {branch.address && (
                              <div className="text-[10px] text-slate-500 truncate mt-1">
                                {branch.address}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
