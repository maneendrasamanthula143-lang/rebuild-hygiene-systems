import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserPlus, Building2, Search, Filter, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function WorkerManagement() {
  const { user, role } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    employee_code: '',
    branch_id: role === 'SUPERVISOR' ? user.branch_id : '',
    designation_id: '',
    department_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBranch) params.branch_id = selectedBranch;

      const workerRes = await api.getWorkers(params);
      const hierarchyRes = await api.getHierarchy();
      const configRes = await api.getMasterConfig();

      setWorkers(workerRes.workers || []);
      setBranches(hierarchyRes.branches || []);
      setDepartments(configRes.departments || []);
      setDesignations(configRes.designations || []);

      if (configRes.departments.length > 0 && !form.department_id) {
        setForm(f => ({ ...f, department_id: configRes.departments[0].id }));
      }
      if (configRes.designations.length > 0 && !form.designation_id) {
        setForm(f => ({ ...f, designation_id: configRes.designations[0].id }));
      }
      if (hierarchyRes.branches.length > 0 && !form.branch_id && role !== 'SUPERVISOR') {
        setForm(f => ({ ...f, branch_id: hierarchyRes.branches[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await api.createWorker({
        ...form,
        branch_id: role === 'SUPERVISOR' ? user.branch_id : form.branch_id
      });
      setShowAddModal(false);
      setForm({
        name: '',
        employee_code: '',
        branch_id: role === 'SUPERVISOR' ? user.branch_id : (branches[0]?.id || ''),
        designation_id: designations[0]?.id || '',
        department_id: departments[0]?.id || ''
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateWorkerStatus(id, nextStatus);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8102E] uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-amber-500" /> Housekeeping & Sanitation Staff
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Worker Roster & Designation Directory
          </h2>
          <p className="text-xs text-slate-500">
            Registered ground housekeeping personnel per campus/branch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {role !== 'SUPERVISOR' && (
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
            >
              <option value="">All Institutional Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-amber-400" /> Add New Worker
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Modal Add Worker */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" /> Add Housekeeping Worker
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Worker Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. K. Lakshmi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID Code</label>
                <input
                  type="text"
                  value={form.employee_code}
                  onChange={e => setForm({ ...form, employee_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. EMP-VZG-004"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              {role !== 'SUPERVISOR' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Branch / Camp</label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={form.department_id}
                    onChange={e => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <select
                    value={form.designation_id}
                    onChange={e => setForm({ ...form, designation_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C8102E] text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workers Roster Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading worker roster...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5">Employee Code</th>
                  <th className="p-3.5">Worker Name</th>
                  <th className="p-3.5">Branch / Location</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {w.employee_code}
                    </td>
                    <td className="p-3.5 font-bold text-[#0B2545]">
                      {w.name}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {w.branch_name}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {w.department_name || 'Housekeeping'}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {w.designation_name || 'Cleaner'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        w.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(w.id, w.status)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                          w.status === 'ACTIVE'
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {w.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
