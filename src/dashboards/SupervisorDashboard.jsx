import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  FileText,
  Receipt,
  UserCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function SupervisorDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.branch_id) {
      api.getDashboardStats({ branch_id: user.branch_id })
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mobile-first Field Header Banner */}
      <div className="bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#0B2545] p-5 sm:p-6 rounded-3xl text-white shadow-lg border border-amber-400/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider mb-2">
              📱 SUPERVISOR FIELD COMMAND
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {user?.branch_name || 'My Assigned Branch'}
            </h1>
            <div className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Authorized Branch Restricted Portal
            </div>
          </div>

          <div className="bg-white/10 px-3 py-2 rounded-2xl border border-white/20 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-300">Ground Roster</div>
            <div className="text-lg font-black text-amber-300">{stats ? stats.totalWorkers : 0} Workers</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS GRID (MOBILE FIRST) */}
      <div>
        <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
          Quick Field Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('attendance')}
            className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl shadow-md flex flex-col items-center text-center transition group"
          >
            <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase">Take Attendance</span>
            <span className="text-[10px] opacity-80 mt-0.5">Today's Shift Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('work_logs')}
            className="p-4 bg-gradient-to-br from-[#0B2545] to-[#134074] hover:from-[#134074] hover:to-[#0B2545] text-white rounded-2xl shadow-md flex flex-col items-center text-center transition group"
          >
            <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition">
              <ClipboardList className="w-6 h-6 text-amber-300" />
            </div>
            <span className="text-xs font-black uppercase">Log Daily Work</span>
            <span className="text-[10px] opacity-80 mt-0.5">Cleaning Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className="p-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl shadow-md flex flex-col items-center text-center transition group"
          >
            <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase">Report Incident</span>
            <span className="text-[10px] opacity-80 mt-0.5">Plumbing / Hygiene</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_reports')}
            className="p-4 bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-2xl shadow-md flex flex-col items-center text-center transition group"
          >
            <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <span className="text-xs font-black uppercase">Daily Summary</span>
            <span className="text-[10px] opacity-80 mt-0.5">Compile EOD Report</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white rounded-2xl shadow-md flex flex-col items-center text-center transition group col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition">
              <Receipt className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-black uppercase">Branch Bills</span>
            <span className="text-[10px] opacity-80 mt-0.5">View & Download</span>
          </button>
        </div>
      </div>

      {/* Operational Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Today's Tasks</div>
            <div className="text-xl font-extrabold text-[#0B2545] mt-0.5">
              {stats ? stats.todayWorkCount : 0} Completed
            </div>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Active Incidents</div>
            <div className="text-xl font-extrabold text-red-600 mt-0.5">
              {stats && stats.issueStats ? (stats.issueStats.find(i => i.status === 'OPEN')?.count || 0) : 0} Open
            </div>
          </div>
          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
