import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, ShieldCheck, MapPin, User, Menu, X, Sparkles } from 'lucide-react';

export default function Header({ toggleMobileSidebar }) {
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return <span className="bg-red-600 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow-sm">SUPER ADMIN</span>;
      case 'MD':
        return <span className="bg-purple-700 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">MD</span>;
      case 'GM':
        return <span className="bg-blue-700 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">GM</span>;
      case 'EXECUTIVE':
        return <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">EXECUTIVE</span>;
      case 'SUPERVISOR':
        return <span className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">SUPERVISOR</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B2545] border-b border-slate-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left branding & mobile menu button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-amber-400/50 shadow-sm shrink-0">
              <img
                src="/sri-chaitanya-logo.jpg"
                alt="Sri Chaitanya Logo"
                className="h-9 w-auto object-contain rounded"
              />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wider text-white uppercase hidden sm:block">
                Sri Chaitanya Educational Institutions
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-tight flex items-center gap-1">
                REBUILD HYGIENE SYSTEMS
              </div>
            </div>
          </div>
        </div>

        {/* Right user controls */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User assigned location info */}
            {user.branch_name && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium truncate max-w-[180px]">{user.branch_name}</span>
              </div>
            )}

            {/* User Profile & Role */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-100">{user.name}</div>
                <div className="mt-0.5">{getRoleBadge(role)}</div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-400/60 flex items-center justify-center font-bold text-amber-300 text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Log Out"
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
