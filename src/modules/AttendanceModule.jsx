import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhotoUploadModal from '../components/PhotoUploadModal';
import { CalendarCheck, Save, Camera, CheckCircle2, Clock, Filter, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function AttendanceModule() {
  const { user, role } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [shift, setShift] = useState('MORNING');
  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Attendance state map per workerId: { status, check_in, check_out, remarks }
  const [attendanceState, setAttendanceState] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const hierarchyRes = await api.getHierarchy();
      setBranches(hierarchyRes.branches || []);

      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : (selectedBranch || hierarchyRes.branches[0]?.id);

      if (activeBranch) {
        // Fetch workers for branch
        const workerRes = await api.getWorkers({ branch_id: activeBranch });
        const workerList = workerRes.workers || [];
        setWorkers(workerList);

        // Fetch existing attendance for this date & branch
        const attRes = await api.getAttendance({ date, branch_id: activeBranch });
        const existingAtt = attRes.attendance || [];
        setAttendanceRecords(existingAtt);

        // Populate form state map
        const stateMap = {};
        workerList.forEach(w => {
          const matched = existingAtt.find(a => a.worker_id === w.id);
          stateMap[w.id] = {
            status: matched ? matched.status : 'PRESENT',
            check_in: matched ? (matched.check_in || '06:30 AM') : '06:30 AM',
            check_out: matched ? (matched.check_out || '02:30 PM') : '02:30 PM',
            remarks: matched ? (matched.remarks || '') : ''
          };
        });
        setAttendanceState(stateMap);
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

  const handleStatusChange = (workerId, newStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], status: newStatus }
    }));
  };

  const handleRemarksChange = (workerId, text) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], remarks: text }
    }));
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const recordsToSubmit = Object.keys(attendanceState).map(workerId => ({
        worker_id: parseInt(workerId, 10),
        status: attendanceState[workerId].status,
        check_in: attendanceState[workerId].check_in,
        check_out: attendanceState[workerId].check_out,
        remarks: attendanceState[workerId].remarks
      }));

      const activeBranch = role === 'SUPERVISOR' ? user.branch_id : selectedBranch;

      await api.recordBulkAttendance({
        date,
        shift,
        branch_id: activeBranch,
        records: recordsToSubmit,
        photo_url: photoUrl
      });

      setSuccessMsg('Attendance saved to persistent database successfully.');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            <CalendarCheck className="w-4 h-4 text-emerald-600" /> Ground Housekeeping Attendance
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Worker Shift Attendance Entry
          </h2>
          <p className="text-xs text-slate-500">
            Record, verify, and store housekeeping staff shift attendance with proof photo.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {role !== 'SUPERVISOR' && (
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
            >
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

          <select
            value={shift}
            onChange={e => setShift(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
          >
            <option value="MORNING">MORNING SHIFT</option>
            <option value="EVENING">EVENING SHIFT</option>
            <option value="NIGHT">NIGHT SHIFT</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Proof Photo Bar */}
      <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] p-4 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Camera className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Attendance Verification Proof Photo</div>
            <div className="text-[11px] text-slate-300">
              {photoUrl ? 'Verification image attached' : 'Optional group attendance inspection photo upload'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {photoUrl && (
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-300 underline font-semibold flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" /> View Uploaded Photo
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow transition"
          >
            {photoUrl ? 'Change Photo' : 'Upload Proof Photo'}
          </button>
        </div>
      </div>

      {showPhotoModal && (
        <PhotoUploadModal
          title="Upload Shift Attendance Group Photo"
          onUploadComplete={(url) => setPhotoUrl(url)}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {/* Attendance Form Sheet */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading shift roster...
        </div>
      ) : workers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No workers registered for this branch. Please add workers in the Worker Roster section.
        </div>
      ) : (
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Worker Info</th>
                    <th className="p-3.5 text-center">Attendance Status</th>
                    <th className="p-3.5">Timings</th>
                    <th className="p-3.5">Shift Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {workers.map(w => {
                    const current = attendanceState[w.id] || { status: 'PRESENT', remarks: '' };
                    return (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{w.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.employee_code} • {w.designation_name || 'Cleaner'}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                            {['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(w.id, st)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                                  current.status === st
                                    ? st === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm' :
                                      st === 'ABSENT' ? 'bg-red-600 text-white shadow-sm' :
                                      st === 'HALF_DAY' ? 'bg-amber-500 text-white shadow-sm' :
                                      'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600">
                          06:30 AM - 02:30 PM
                        </td>
                        <td className="p-3.5">
                          <input
                            type="text"
                            placeholder="Optional shift notes..."
                            value={current.remarks}
                            onChange={e => handleRemarksChange(w.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0B2545]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#C8102E] hover:bg-[#9A0B22] text-white text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-300" />}
              Save Attendance Sheet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
