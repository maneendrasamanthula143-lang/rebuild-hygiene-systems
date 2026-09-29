import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QuestionsModal from '../components/QuestionsModal';
import { Receipt, Plus, Upload, Download, Trash2, Search, Filter, Lock, MessageSquare, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export default function BillsInvoicesModule() {
  const { user, role } = useAuth();
  const [bills, setBills] = useState([]);
  const [branches, setBranches] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Search & Filter
  const [selectedBranch, setSelectedBranch] = useState(role === 'SUPERVISOR' ? user.branch_id : '');
  const [searchBillNo, setSearchBillNo] = useState('');
  const [searchVendor, setSearchVendor] = useState('');

  const [activeQuestionBill, setActiveQuestionBill] = useState(null);
  const [error, setError] = useState(null);

  // Upload Form State (Authorized higher users)
  const [form, setForm] = useState({
    bill_no: '',
    invoice_no: '',
    date: new Date().toISOString().split('T')[0],
    branch_id: '',
    bill_type: 'Sanitation & Cleaning Supplies',
    vendor_name: '',
    amount: '',
    description: '',
    remarks: '',
    file_url: ''
  });

  const [uploadingFile, setUploadingFile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'SUPERVISOR') {
        params.branch_id = user.branch_id;
      } else if (selectedBranch) {
        params.branch_id = selectedBranch;
      }
      if (searchBillNo) params.bill_no = searchBillNo;
      if (searchVendor) params.vendor_name = searchVendor;

      const billsRes = await api.getBills(params);
      const hierarchyRes = await api.getHierarchy();

      setBills(billsRes.bills || []);
      setBranches(hierarchyRes.branches || []);
      setStates(hierarchyRes.states || []);
      setDistricts(hierarchyRes.districts || []);

      if (hierarchyRes.branches.length > 0 && !form.branch_id) {
        setForm(f => ({ ...f, branch_id: hierarchyRes.branches[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch, searchBillNo, searchVendor]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit.');
      return;
    }

    setUploadingFile(true);
    try {
      const res = await api.uploadFile(file);
      setForm(f => ({ ...f, file_url: res.fileUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.uploadBill(form);
      setShowUploadModal(false);
      setForm({
        bill_no: '',
        invoice_no: '',
        date: new Date().toISOString().split('T')[0],
        branch_id: branches[0]?.id || '',
        bill_type: 'Sanitation & Cleaning Supplies',
        vendor_name: '',
        amount: '',
        description: '',
        remarks: '',
        file_url: ''
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill record?')) return;
    try {
      await api.deleteBill(id);
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
            <Receipt className="w-4 h-4 text-emerald-600" /> Operational Expenditure & Invoices
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Bills, Invoices & Purchase Receipts
          </h2>
          <p className="text-xs text-slate-500">
            {role === 'SUPERVISOR'
              ? 'Read-only authorized bill repository for your assigned branch.'
              : 'Institutional bill repository linked across States, Districts, and Camps.'}
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bill / Invoice #"
              value={searchBillNo}
              onChange={e => setSearchBillNo(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Supervisor CANNOT upload bills requirement */}
          {role !== 'SUPERVISOR' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Upload Official Bill
            </button>
          )}
        </div>
      </div>

      {role === 'SUPERVISOR' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          Supervisor Security Restrict Notice: Supervisors have read-only access to view and download bills for their assigned branch only.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Modal Upload Bill (Higher Roles Only) */}
      {showUploadModal && role !== 'SUPERVISOR' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto">
            <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" /> Upload Institutional Bill / Invoice
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Number</label>
                  <input
                    type="text"
                    value={form.bill_no}
                    onChange={e => setForm({ ...form, bill_no: e.target.value })}
                    placeholder="e.g. BILL-2026-881"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={form.invoice_no}
                    onChange={e => setForm({ ...form, invoice_no: e.target.value })}
                    placeholder="e.g. INV-99042"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Branch / Camp</label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    value={form.vendor_name}
                    onChange={e => setForm({ ...form, vendor_name: e.target.value })}
                    placeholder="e.g. CleanCare Chemicals Ltd"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 14500.00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Bill Document File (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0B2545] file:text-white hover:file:bg-[#134074]"
                  required
                />
                {uploadingFile && <div className="text-[11px] text-amber-600 mt-1 font-semibold">Uploading document...</div>}
                {form.file_url && <div className="text-[11px] text-emerald-600 mt-1 font-bold">Document attached successfully!</div>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.file_url}
                  className="px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                >
                  Upload & Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeQuestionBill && (
        <QuestionsModal
          recordType="BILL"
          recordId={activeQuestionBill.id}
          title={`Bill #${activeQuestionBill.bill_no} - ${activeQuestionBill.vendor_name}`}
          onClose={() => setActiveQuestionBill(null)}
        />
      )}

      {/* Bills Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading financial bills database...
        </div>
      ) : bills.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No bills found for your authorized location scope.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5">Bill & Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Location Scope</th>
                  <th className="p-3.5">Vendor / Supplier</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5 text-center">Document</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-[#0B2545]">
                      <div>{b.bill_no}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Invoice: {b.invoice_no}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{b.date}</td>
                    <td className="p-3.5 text-slate-700">
                      <div>{b.branch_name}</div>
                      <div className="text-[10px] text-slate-400">{b.district_name}, {b.state_name}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{b.vendor_name}</td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-700 font-mono">
                      ₹{parseFloat(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      <a
                        href={b.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> View/Download
                      </a>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setActiveQuestionBill(b)}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Inquiry / Q&A"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </button>

                      {['SUPER_ADMIN', 'EXECUTIVE'].includes(role) && (
                        <button
                          onClick={() => handleDeleteBill(b.id)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
