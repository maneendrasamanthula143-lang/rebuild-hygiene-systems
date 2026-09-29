import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Building2, Users, UserCheck, CalendarCheck, AlertTriangle, Receipt, ArrowUpRight, Clock, RefreshCw } from 'lucide-react';

export default function SuperAdminDashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#0B2545] p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase mb-2 shadow">
              <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN CONTROL CENTER
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Sri Chaitanya Operational Oversight
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Complete administrative authority over institutional hierarchy, user credentials, worker rosters, attendance, and audit logs.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              Manage System Users
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition"
            >
              Org Hierarchy
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-[#0B2545]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0B2545]">{stats ? stats.totalBranches : 0}</div>
            <div className="text-xs text-slate-500 font-medium">Branches / Camps</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats ? stats.totalWorkers : 0}</div>
            <div className="text-xs text-slate-500 font-medium">Housekeeping Staff</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{stats ? stats.todayWorkCount : 0}</div>
            <div className="text-xs text-slate-500 font-medium">Today's Work Logs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">
              {stats && stats.issueStats ? (stats.issueStats.find(i => i.status === 'OPEN')?.count || 0) : 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Open Incident Tickets</div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('users')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#0B2545] cursor-pointer transition group"
        >
          <div className="flex justify-between items-center mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2545]" />
          </div>
          <h3 className="font-bold text-sm text-[#0B2545]">User Access Control</h3>
          <p className="text-xs text-slate-500 mt-1">Configure role permissions, assign branches, create MD, GM, Executive, Supervisor accounts.</p>
        </div>

        <div
          onClick={() => setActiveTab('hierarchy')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#0B2545] cursor-pointer transition group"
        >
          <div className="flex justify-between items-center mb-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2545]" />
          </div>
          <h3 className="font-bold text-sm text-[#0B2545]">Hierarchy Structure</h3>
          <p className="text-xs text-slate-500 mt-1">Add future States, Districts, Schools, Colleges, Hostels and Camps dynamically.</p>
        </div>

        <div
          onClick={() => setActiveTab('audit_logs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#0B2545] cursor-pointer transition group"
        >
          <div className="flex justify-between items-center mb-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2545]" />
          </div>
          <h3 className="font-bold text-sm text-[#0B2545]">System Audit Logs</h3>
          <p className="text-xs text-slate-500 mt-1">Review unalterable activity logs, login security events, and data changes.</p>
        </div>
      </div>
    </div>
  );
}
