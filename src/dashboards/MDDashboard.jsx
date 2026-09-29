import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building2, GitFork, UserCheck, CalendarCheck, AlertTriangle, Receipt, FileText, ArrowRight } from 'lucide-react';

export default function MDDashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900 via-[#0B2545] to-purple-950 p-6 rounded-3xl text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600/90 text-white font-bold text-[10px] uppercase tracking-wider mb-2">
              👔 MANAGING DIRECTOR EXECUTIVE CONSOLE
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Sri Chaitanya Operational Governance
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Organization-wide visibility into hygiene compliance, worker attendance rates, critical issues, and financial bills.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('hierarchy')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
          >
            Explore Org Hierarchy <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-purple-900">{stats ? stats.totalBranches : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Active Campuses</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-slate-900">{stats ? stats.totalWorkers : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Housekeeping Staff</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-emerald-700">{stats ? stats.todayWorkCount : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Tasks Completed Today</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-red-600">
            {stats && stats.issueStats ? (stats.issueStats.find(i => i.status === 'OPEN')?.count || 0) : 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Open Incident Tickets</div>
        </div>
      </div>
    </div>
  );
}
