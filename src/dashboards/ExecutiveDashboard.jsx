import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Building2, Receipt, CalendarCheck, ClipboardList, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ExecutiveDashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 via-[#0B2545] to-emerald-950 p-6 rounded-3xl text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/90 text-white font-bold text-[10px] uppercase tracking-wider mb-2">
              🏢 HYGIENE EXECUTIVE & COMPLIANCE PORTAL
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Sri Chaitanya Operational Compliance
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Inspect hygiene quality standards, verify bills & receipts, ask operational questions, and track resolution audit streams.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('bills')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
          >
            Review Bills & Invoices <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-emerald-900">{stats ? stats.totalBranches : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Assigned Campuses</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl font-black text-slate-900">{stats ? stats.totalWorkers : 0}</div>
          <div className="text-xs text-slate-500 font-medium">Sanitation Staff</div>
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
