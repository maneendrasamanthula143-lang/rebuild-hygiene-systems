import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Shield, MapPin, CheckCircle2, XCircle, RefreshCw, KeyRound, Building2 } from 'lucide-react';

export default function UserManagement() {
  const { role: currentUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    role: 'SUPERVISOR',
    branch_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const userRes = await api.getUsers();
      const hierarchyRes = await api.getHierarchy();
      setUsers(userRes.users || []);
      setBranches(hierarchyRes.branches || []);
      if (hierarchyRes.branches.length > 0 && !form.branch_id) {
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
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(form);
      setShowAddModal(false);
      setForm({ name: '', mobile: '', email: '', password: '', role: 'SUPERVISOR', branch_id: branches[0]?.id || '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.toggleUserStatus(id, !currentStatus);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            <Users className="w-4 h-4 text-amber-500" /> Operational User & Staff Authorization
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            System User Accounts & Role Assignment
          </h2>
          <p className="text-xs text-slate-500">
            Manage Super Admin, MD, GM, Executive, and Supervisor accounts.
          </p>
        </div>

        {currentUserRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-amber-300" /> Create System User
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* User Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" /> Create Authorized System User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="user@srichaitanya.net"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (OTP Login)</option>
                    <option value="MD">MD (Managing Director)</option>
                    <option value="GM">GM (General Manager)</option>
                    <option value="EXECUTIVE">EXECUTIVE</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                  </select>
                </div>

                {form.role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Set password"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                )}
              </div>

              {form.role === 'SUPERVISOR' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Branch / Camp</label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}

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
                  className="px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg shadow"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading users database...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Assigned Branch</th>
                  <th className="p-3.5 text-center">Status</th>
                  {currentUserRole === 'SUPER_ADMIN' && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      <div>{u.email || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{u.mobile ? `+91 ${u.mobile}` : ''}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                        u.role === 'MD' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'GM' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'EXECUTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {u.branch_name || 'All Branches Scope'}
                    </td>
                    <td className="p-3.5 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                            u.is_active
                              ? 'border-red-300 text-red-600 hover:bg-red-50'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
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
