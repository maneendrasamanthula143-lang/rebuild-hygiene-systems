import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Smartphone, Lock, ArrowRight, RefreshCw, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginModal() {
  const { loginWithPassword, requestSuperAdminOtp, verifySuperAdminOtp, error, setError } = useAuth();

  const [activeTab, setActiveTab] = useState('SUPER_ADMIN'); // 'SUPER_ADMIN' or 'ROLES'

  // Super Admin OTP states
  const [mobile, setMobile] = useState('6304261686');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Role Password login states
  const [identifier, setIdentifier] = useState('supervisor1@srichaitanya.net');
  const [password, setPassword] = useState('SriChaitanya2026!');

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setOtpNotice('');
    try {
      const res = await requestSuperAdminOtp(mobile);
      setOtpSent(true);
      setCooldown(60);
      if (res.devOtpNotice) {
        setOtpNotice(res.devOtpNotice);
      }
    } catch (err) {
      // Handled by context error
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifySuperAdminOtp(mobile, otpCode);
    } catch (err) {
      // Handled by context error
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in both identifier and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(identifier, password);
    } catch (err) {
      // Handled by context error
    } finally {
      setLoading(false);
    }
  };

  const fillQuickPreset = (roleEmail) => {
    setError(null);
    setIdentifier(roleEmail);
    setPassword('SriChaitanya2026!');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-auto">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#0B2545] p-6 text-center text-white relative">
          <div className="mx-auto w-24 h-24 mb-3 bg-white p-2 rounded-2xl shadow-lg border-2 border-amber-400/50 flex items-center justify-center">
            <img
              src="/sri-chaitanya-logo.jpg"
              alt="Sri Chaitanya Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">
            Sri Chaitanya Educational Institutions
          </h2>
          <div className="mt-1 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            REBUILD HYGIENE SYSTEMS
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('SUPER_ADMIN');
              setError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'SUPER_ADMIN'
                ? 'bg-white text-[#0B2545] shadow-sm font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-red-600" /> Super Admin OTP
          </button>
          <button
            onClick={() => {
              setActiveTab('ROLES');
              setError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ROLES'
                ? 'bg-white text-[#0B2545] shadow-sm font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" /> Operational Login
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* TAB 1: SUPER ADMIN OTP LOGIN */}
          {activeTab === 'SUPER_ADMIN' && (
            <div>
              <div className="mb-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  SUPER ADMIN SECURE OTP PROTOCOL
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enter registered Super Admin mobile number to receive secure OTP code.
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Super Admin Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                        +91
                      </span>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="6304261686"
                        maxLength={10}
                        className="w-full pl-12 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Request Real OTP <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {otpNotice && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-mono font-semibold">
                      {otpNotice}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Enter 6-Digit OTP Code
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Sent to +91 {mobile}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full tracking-widest text-center text-lg font-mono font-bold border border-slate-300 rounded-lg py-2.5 focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545]"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verify OTP & Login
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Change Mobile
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      onClick={handleSendOtp}
                      className="text-[#C8102E] font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: OPERATIONAL ROLE LOGIN */}
          {activeTab === 'ROLES' && (
            <div>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email address or Mobile
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="supervisor1@srichaitanya.net"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Log In to Operations Portal <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Preset Selector for Testing */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Demo Accounts Quick-Switch
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('md@srichaitanya.net')}
                    className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-left font-medium border border-slate-200 truncate"
                  >
                    👔 MD Account
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('gm@srichaitanya.net')}
                    className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-left font-medium border border-slate-200 truncate"
                  >
                    💼 GM Account
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('executive@srichaitanya.net')}
                    className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-left font-medium border border-slate-200 truncate"
                  >
                    🏢 Executive Account
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('supervisor1@srichaitanya.net')}
                    className="px-2 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-left border border-amber-200 truncate"
                  >
                    📱 Supervisor (Vizag)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
