import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Clock, User, FileText, RefreshCw, Lock } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.auditLogs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-red-600" /> Immutable Security & Action Audit Trail
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            System Operations Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Records all critical administrative, attendance, bill, issue, and authorization modifications.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading audit trail...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User & Role</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5">Record Type</th>
                  <th className="p-3.5">Payload / Data Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{log.user_name || 'System Guest'}</div>
                      <div className="text-[10px] text-[#C8102E] font-mono uppercase">{log.role}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {log.record_type} {log.record_id ? `#${log.record_id}` : ''}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-600 max-w-xs truncate">
                      {log.details || '{}'}
                    </td>
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
