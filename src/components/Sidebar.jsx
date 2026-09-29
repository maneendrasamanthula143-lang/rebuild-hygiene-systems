import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GitFork,
  Users,
  UserCheck,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  FileText,
  Receipt,
  Settings,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const { role, user } = useAuth();

  const getMenuItems = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Admin Dashboard', icon: LayoutDashboard },
          { id: 'hierarchy', label: 'Org Hierarchy', icon: GitFork },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'workers', label: 'Housekeeping Workers', icon: UserCheck },
          { id: 'attendance', label: 'Worker Attendance', icon: CalendarCheck },
          { id: 'work_logs', label: 'Daily Work Logs', icon: ClipboardList },
          { id: 'issues', label: 'Operational Issues', icon: AlertTriangle },
          { id: 'daily_reports', label: 'Daily Reports', icon: FileText },
          { id: 'bills', label: 'Bills & Invoices', icon: Receipt },
          { id: 'config', label: 'Master Configuration', icon: Settings },
          { id: 'audit_logs', label: 'System Audit Logs', icon: ShieldCheck }
        ];

      case 'MD':
        return [
          { id: 'overview', label: 'MD Dashboard', icon: LayoutDashboard },
          { id: 'hierarchy', label: 'Hierarchy Drill-Down', icon: GitFork },
          { id: 'attendance', label: 'Regional Attendance', icon: CalendarCheck },
          { id: 'work_logs', label: 'Work Logs', icon: ClipboardList },
          { id: 'issues', label: 'Issue Tracker', icon: AlertTriangle },
          { id: 'daily_reports', label: 'Daily Reports', icon: FileText },
          { id: 'bills', label: 'Financial Bills', icon: Receipt },
          { id: 'audit_logs', label: 'Audit Trail', icon: ShieldCheck }
        ];

      case 'GM':
        return [
          { id: 'overview', label: 'GM Dashboard', icon: LayoutDashboard },
          { id: 'hierarchy', label: 'Org Locations', icon: Building2 },
          { id: 'attendance', label: 'Attendance Review', icon: CalendarCheck },
          { id: 'work_logs', label: 'Daily Work Logs', icon: ClipboardList },
          { id: 'issues', label: 'Issues & Tickets', icon: AlertTriangle },
          { id: 'daily_reports', label: 'Daily Reports', icon: FileText },
          { id: 'bills', label: 'Bills & Receipts', icon: Receipt }
        ];

      case 'EXECUTIVE':
        return [
          { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance Records', icon: CalendarCheck },
          { id: 'work_logs', label: 'Cleaning Logs', icon: ClipboardList },
          { id: 'issues', label: 'Operational Issues', icon: AlertTriangle },
          { id: 'daily_reports', label: 'Daily Reports', icon: FileText },
          { id: 'bills', label: 'Bills & Invoices', icon: Receipt }
        ];

      case 'SUPERVISOR':
        return [
          { id: 'overview', label: 'Field Dashboard', icon: LayoutDashboard },
          { id: 'attendance', label: "Today's Attendance", icon: CalendarCheck },
          { id: 'work_logs', label: 'Log Daily Work', icon: ClipboardList },
          { id: 'issues', label: 'Report Issue', icon: AlertTriangle },
          { id: 'daily_reports', label: 'Submit Daily Report', icon: FileText },
          { id: 'bills', label: 'Branch Bills & Docs', icon: Receipt }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleSelect = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#0B2545] border-r border-slate-700 text-slate-200 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Assigned Location Header */}
          {user && (
            <div className="p-4 border-b border-slate-700/80 bg-slate-900/50">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Active Operational Scope
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                {user.branch_name || 'All Institutional Branches'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Role: <span className="text-slate-200 font-semibold">{role}</span>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-md font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer branding notice */}
          <div className="p-4 border-t border-slate-700/80 bg-slate-900/40 text-[10px] text-slate-400 text-center">
            SRI CHAITANYA EDUCATIONAL INSTITUTIONS
            <div className="text-amber-400/80 font-mono mt-0.5">Production Enterprise v1.0</div>
          </div>
        </div>
      </aside>
    </>
  );
}
