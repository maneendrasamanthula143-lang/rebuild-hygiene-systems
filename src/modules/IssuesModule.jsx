import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhotoUploadModal from '../components/PhotoUploadModal';
import QuestionsModal from '../components/QuestionsModal';
import { AlertTriangle, Plus, Camera, CheckCircle2, Clock, MapPin, ShieldAlert, MessageSquare, RefreshCw, Filter } from 'lucide-react';

export default function IssuesModule() {
  const { user, role } = useAuth();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [activeQuestionIssue, setActiveQuestionIssue] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    category_id: '',
    priority: 'HIGH',
    description: '',
    photo_url: '',
    branch_id: role === 'SUPERVISOR' ? user.branch_id : ''
  });

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : selectedBranch;

      const issueRes = await api.getIssues({
        branch_id: activeBranch,
        priority: priorityFilter,
        status: statusFilter
      });
      const configRes = await api.getMasterConfig();
      const hierarchyRes = await api.getHierarchy();

      setIssues(issueRes.issues || []);
      setCategories(configRes.issueCategories || []);
      setBranches(hierarchyRes.branches || []);

      if (configRes.issueCategories.length > 0 && !form.category_id) {
        setForm(f => ({ ...f, category_id: configRes.issueCategories[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch, priorityFilter, statusFilter]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : (selectedBranch || branches[0]?.id);

      await api.createIssue({
        ...form,
        branch_id: activeBranch
      });

      setShowAddModal(false);
      setForm({
        category_id: categories[0]?.id || '',
        priority: 'HIGH',
        description: '',
        photo_url: '',
        branch_id: activeBranch
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await api.updateIssueStatus(issueId, newStatus);
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
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-600" /> Operational Issue & Complaint Ticketing
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Sanitation & Maintenance Incident Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Real-time reporting and follow-up on plumbing, hygiene, waste, and facility failures.
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

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-300" /> Report New Issue
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Report Issue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-auto">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Report Operational Incident
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Urgency / Priority Level</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL (Immediate Action Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location & Issue Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Specify location and describe the incident in detail..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg h-24"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Attach Incident Photo</span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-2.5 py-1 bg-slate-800 text-amber-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                </div>
                {form.photo_url && (
                  <img src={form.photo_url} alt="Issue" className="w-16 h-16 rounded-lg object-cover border mt-2" />
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
                  Submit Incident Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          title="Upload Operational Incident Photo"
          onUploadComplete={(url) => setForm(f => ({ ...f, photo_url: url }))}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {activeQuestionIssue && (
        <QuestionsModal
          recordType="ISSUE"
          recordId={activeQuestionIssue.id}
          title={`Ticket ${activeQuestionIssue.ticket_no}: ${activeQuestionIssue.category_name}`}
          onClose={() => setActiveQuestionIssue(null)}
        />
      )}

      {/* Issues Tickets Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading tickets database...
        </div>
      ) : issues.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No operational issues reported matching the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map(iss => (
            <div key={iss.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-800">{iss.ticket_no}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      iss.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                      iss.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {iss.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Status:</span>
                    <select
                      value={iss.status}
                      onChange={e => handleStatusChange(iss.id, e.target.value)}
                      className="text-xs font-bold border border-slate-300 rounded px-2 py-0.5 bg-slate-50 text-slate-800"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-bold text-slate-900">{iss.category_name}</div>
                  <div className="text-xs text-slate-600 mt-1">{iss.description}</div>
                </div>

                {iss.photo_url && (
                  <div className="mt-3">
                    <a href={iss.photo_url} target="_blank" rel="noreferrer">
                      <img src={iss.photo_url} alt="Incident" className="w-24 h-24 rounded-xl object-cover border" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[10px] text-slate-400">
                  Branch: <span className="font-semibold text-slate-700">{iss.branch_name}</span>
                </div>
                <button
                  onClick={() => setActiveQuestionIssue(iss)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Inquiry Thread
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
