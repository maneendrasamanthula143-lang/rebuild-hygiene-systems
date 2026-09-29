import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building2, CalendarCheck, ClipboardList, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

export default function GMDashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-[#0B2545] to-blue-950 p-6 rounded-3xl text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/90 text-white font-bold text-[10px] uppercase tracking-wider mb-2">
              💼 GENERAL MANAGER OPERATIONS CONSOLE
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Sri Chaitanya Operational Command
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Regional oversight of daily housekeeping tasks, incident tickets, worker attendance, and supervisor daily reports.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('issues')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
          >
            Review Issues <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-blue-900">{stats ? stats.totalBranches : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Facilities Monitored</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-slate-900">{stats ? stats.totalWorkers : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Total Staff</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-emerald-700">{stats ? stats.todayWorkCount : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Work Entries Today</div>
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
