import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onComplete, 600);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0B2545] via-[#134074] to-[#0B2545] text-white p-6 transition-opacity duration-700 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md pt-8 flex justify-between items-center text-xs tracking-widest text-slate-300 uppercase">
        <span className="flex items-center gap-1 text-[#F4A261]">
          <ShieldCheck className="w-4 h-4" /> OFFICIAL OPERATIONAL ENTERPRISE PORTAL
        </span>
        <span className="border border-white/20 px-2 py-0.5 rounded text-[10px] text-amber-300 font-semibold">
          v1.0 PRODUCTION
        </span>
      </div>

      <div className="flex flex-col items-center text-center my-auto">
        {/* EXACT ORIGINAL UPLOADED LOGO CONTAINER */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 opacity-30 blur-lg animate-pulse"></div>
          <div className="relative p-2 bg-white rounded-2xl shadow-2xl border-2 border-amber-400/40">
            <img
              src="/sri-chaitanya-logo.jpg"
              alt="Sri Chaitanya Educational Institutions Logo"
              className="h-32 sm:h-40 w-auto object-contain rounded-xl"
            />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
          Sri Chaitanya Educational Institutions
        </h1>

        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/90 border border-red-400/50 shadow-lg text-amber-200 font-bold tracking-wider text-sm sm:text-base uppercase">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          REBUILD HYGIENE SYSTEMS
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-sm font-light">
          Real-Time Institutional Sanitation, Housekeeping & Operational Excellence Platform
        </p>
      </div>

      {/* Loading Bar & Footer */}
      <div className="w-full max-w-md pb-8 text-center space-y-3">
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 via-red-500 to-amber-300 h-full rounded-full animate-pulse w-3/4"></div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Securing enterprise database connections...
        </div>
      </div>
    </div>
  );
}
