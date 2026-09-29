import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhotoUploadModal from '../components/PhotoUploadModal';
import QuestionsModal from '../components/QuestionsModal';
import { ClipboardList, Plus, Camera, CheckCircle2, Clock, MapPin, Sparkles, MessageSquare, RefreshCw, Image as ImageIcon } from 'lucide-react';

export default function DailyWorkLogModule() {
  const { user, role } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [workLogs, setWorkLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [date, setDate] = useState(todayStr);
  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [activeQuestionLog, setActiveQuestionLog] = useState(null);
  const [error, setError] = useState(null);

  // New Work Log Form State
  const [form, setForm] = useState({
    category_id: '',
    area: '',
    description: '',
    start_time: '07:00 AM',
    completion_time: '09:00 AM',
    status: 'COMPLETED',
    worker_ids: [],
    photos: [],
    remarks: ''
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : selectedBranch;

      const logRes = await api.getWorkLogs({ date, branch_id: activeBranch });
      const configRes = await api.getMasterConfig();
      const hierarchyRes = await api.getHierarchy();

      setWorkLogs(logRes.workLogs || []);
      setCategories(configRes.workCategories || []);
      setBranches(hierarchyRes.branches || []);

      if (activeBranch) {
        const workerRes = await api.getWorkers({ branch_id: activeBranch });
        setWorkers(workerRes.workers || []);
      }

      if (configRes.workCategories.length > 0 && !form.category_id) {
        setForm(f => ({ ...f, category_id: configRes.workCategories[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date, selectedBranch]);

  const handleWorkerToggle = (workerId) => {
    setForm(prev => {
      const exists = prev.worker_ids.includes(workerId);
      return {
        ...prev,
        worker_ids: exists ? prev.worker_ids.filter(id => id !== workerId) : [...prev.worker_ids, workerId]
      };
    });
  };

  const handleCreateWorkLog = async (e) => {
    e.preventDefault();
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : (selectedBranch || branches[0]?.id);

      await api.createWorkLog({
        ...form,
        date,
        branch_id: activeBranch
      });

      setShowAddModal(false);
      setForm({
        category_id: categories[0]?.id || '',
        area: '',
        description: '',
        start_time: '07:00 AM',
        completion_time: '09:00 AM',
        status: 'COMPLETED',
        worker_ids: [],
        photos: [],
        remarks: ''
      });
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
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8102E] uppercase tracking-wider">
            <ClipboardList className="w-4 h-4 text-amber-500" /> Digital Cleaning & Sanitation Logbook
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Daily Operational Work Log
          </h2>
          <p className="text-xs text-slate-500">
            Replaces manual physical housekeeping logbooks with real-time digital logs and photo evidence.
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

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Log Cleaning Task
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Add Work Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Record Housekeeping Task Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateWorkLog} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Category</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Area / Location</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  placeholder="e.g. Block A 1st Floor Classrooms & Restrooms"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description of Work</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe cleaning methods, chemicals used, sanitization completed..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    placeholder="07:00 AM"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Completion Time</label>
                  <input
                    type="text"
                    value={form.completion_time}
                    onChange={e => setForm({ ...form, completion_time: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Workers Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Housekeeping Team/Workers</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {workers.map(w => (
                    <label key={w.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.worker_ids.includes(w.id)}
                        onChange={() => handleWorkerToggle(w.id)}
                        className="rounded text-[#0B2545]"
                      />
                      <span className="font-semibold">{w.name}</span> ({w.employee_code})
                    </label>
                  ))}
                </div>
              </div>

              {/* Photo Proof */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Attach Work Inspection Photos</span>
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
                    {form.photos.map((url, idx) => (
                      <img key={idx} src={url} alt="Proof" className="w-12 h-12 rounded-lg object-cover border" />
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
                  className="px-4 py-2 bg-[#C8102E] text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Work Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          title="Upload Task Completion Inspection Photo"
          onUploadComplete={(url) => setForm(f => ({ ...f, photos: [...f.photos, url] }))}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {activeQuestionLog && (
        <QuestionsModal
          recordType="WORK_LOG"
          recordId={activeQuestionLog.id}
          title={`Work Log: ${activeQuestionLog.category_name} - ${activeQuestionLog.area}`}
          onClose={() => setActiveQuestionLog(null)}
        />
      )}

      {/* Work Logs Stream */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading work log entries...
        </div>
      ) : workLogs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No work logs recorded for the selected date and branch.
        </div>
      ) : (
        <div className="space-y-4">
          {workLogs.map(log => {
            const photos = JSON.parse(log.photos || '[]');
            return (
              <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                        {log.category_name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        log.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#0B2545] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> {log.area}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.start_time} - {log.completion_time}
                    </div>
                    <div className="text-[10px] text-slate-400">Branch: {log.branch_name}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {log.description || 'Routine housekeeping & sanitation completed.'}
                </p>

                {/* Inspection Photos */}
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative">
                        <img src={url} alt="Work Proof" className="w-20 h-20 rounded-xl object-cover border border-slate-300 group-hover:opacity-90 shadow-sm" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Logged by: <span className="font-semibold text-slate-800">{log.recorder_name || 'Supervisor'}</span>
                  </div>

                  <button
                    onClick={() => setActiveQuestionLog(log)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Q&A / Remarks
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
