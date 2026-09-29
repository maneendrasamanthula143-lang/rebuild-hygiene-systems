import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhotoUploadModal from '../components/PhotoUploadModal';
import QuestionsModal from '../components/QuestionsModal';
import { FileText, Plus, Camera, CheckCircle2, Clock, MapPin, MessageSquare, RefreshCw, Send, ShieldCheck } from 'lucide-react';

export default function DailyReportsModule() {
  const { user, role } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [date, setDate] = useState(todayStr);
  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [activeQuestionReport, setActiveQuestionReport] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    pending_tasks: '',
    issues_summary: '',
    remarks: '',
    photos: []
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : selectedBranch;

      const reportRes = await api.getDailyReports({ date, branch_id: activeBranch });
      const hierarchyRes = await api.getHierarchy();

      setReports(reportRes.reports || []);
      setBranches(hierarchyRes.branches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date, selectedBranch]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : (selectedBranch || branches[0]?.id);

      await api.createDailyReport({
        ...form,
        date,
        branch_id: activeBranch,
        attendance_summary: { status: 'COMPLETE' },
        work_summary: { status: 'VERIFIED' }
      });

      setShowAddModal(false);
      setForm({ pending_tasks: '', issues_summary: '', remarks: '', photos: [] });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            <FileText className="w-4 h-4 text-amber-500" /> Daily Campus Hygiene Digest
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Supervisor Consolidated Daily Reports
          </h2>
          <p className="text-xs text-slate-500">
            End-of-day summary reports for management review, inspection, and Q&A interaction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {role !== 'SUPERVISOR' && (
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
            >
              <option value="">All Institutional Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
          />

          {role === 'SUPERVISOR' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-300" /> Submit Today's Report
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Add Daily Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Compile End-of-Day Report
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pending / Unfinished Tasks</label>
                <textarea
                  value={form.pending_tasks}
                  onChange={e => setForm({ ...form, pending_tasks: e.target.value })}
                  placeholder="Note any tasks carried forward to tomorrow..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issues & Obstacles Summary</label>
                <textarea
                  value={form.issues_summary}
                  onChange={e => setForm({ ...form, issues_summary: e.target.value })}
                  placeholder="Summary of operational challenges encountered..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor General Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Overall cleanliness assessment, student feedback, chemical supplies status..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg h-20"
                  required
                />
              </div>

              {/* Photos */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Attach End-of-Day Inspection Photos</span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-2.5 py-1 bg-slate-800 text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                </div>
                {form.photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {form.photos.map((url, i) => (
                      <img key={i} src={url} alt="Proof" className="w-12 h-12 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C8102E] text-white text-xs font-bold rounded-lg shadow flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Official Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          title="Upload Daily Report Photo"
          onUploadComplete={(url) => setForm(f => ({ ...f, photos: [...f.photos, url] }))}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {activeQuestionReport && (
        <QuestionsModal
          recordType="REPORT"
          recordId={activeQuestionReport.id}
          title={`Daily Report (${activeQuestionReport.date}): ${activeQuestionReport.branch_name}`}
          onClose={() => setActiveQuestionReport(null)}
        />
      )}

      {/* Daily Reports Stream */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading daily reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No daily reports submitted for the selected date and branch.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(rep => {
            const photos = JSON.parse(rep.photos || '[]');
            return (
              <div key={rep.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                        SUBMITTED REPORT
                      </span>
                      <span className="text-xs font-bold text-slate-900">{rep.branch_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Submitted by Supervisor: <span className="font-semibold text-slate-800">{rep.supervisor_name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#0B2545]">{rep.date}</div>
                    <div className="text-[10px] text-slate-400">ID: #{rep.id}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-[#0B2545] mb-1">Supervisor Remarks & Overview:</div>
                    <p className="text-slate-700 font-medium">{rep.remarks || 'No remarks added.'}</p>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <div className="font-bold text-amber-900 mb-1">Pending Tasks & Obstacles:</div>
                    <p className="text-amber-950 font-medium">{rep.pending_tasks || 'All scheduled tasks completed cleanly.'}</p>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-1.5">Attached Inspection Images:</div>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Report Attachment" className="w-20 h-20 rounded-xl object-cover border shadow-sm" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Stored in persistent database
                  </div>

                  <button
                    onClick={() => setActiveQuestionReport(rep)}
                    className="px-3.5 py-1.5 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-300" /> Management Inquiry / Q&A
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
