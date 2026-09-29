import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SystemConfigModule() {
  const [config, setConfig] = useState({ workCategories: [], issueCategories: [], departments: [], designations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('work-categories');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getMasterConfig();
      setConfig(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddConfig = async (e) => {
    e.preventDefault();
    try {
      await api.createMasterConfig(activeTab, { name, description });
      setName('');
      setDescription('');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            <Settings className="w-4 h-4 text-amber-500" /> Operational Master Configuration
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545] mt-1">
            Work Categories, Issue Types & Designations
          </h2>
          <p className="text-xs text-slate-500">
            Configure system categories dynamically without rebuilding code.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl p-2 gap-2 text-xs font-bold">
        {[
          { id: 'work-categories', label: 'Work Categories' },
          { id: 'issue-categories', label: 'Issue Categories' },
          { id: 'departments', label: 'Departments' },
          { id: 'designations', label: 'Designations' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === t.id ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Add */}
      <form onSubmit={handleAddConfig} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">New Item Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Solar Panel Wash"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional details..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>
        <button type="submit" className="py-2 px-4 bg-[#C8102E] text-white text-xs font-bold rounded-lg shadow">
          Add to Master Config
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B2545]" /> Loading master configuration...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 font-bold text-xs text-[#0B2545] uppercase border-b border-slate-200">
            Active Configured {activeTab.replace('-', ' ')}
          </div>
          <ul className="divide-y divide-slate-100 text-xs p-4">
            {(activeTab === 'work-categories' ? config.workCategories :
              activeTab === 'issue-categories' ? config.issueCategories :
              activeTab === 'departments' ? config.departments :
              config.designations).map((item, idx) => (
              <li key={item.id || idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{item.name}</span>
                  {item.description && <p className="text-[11px] text-slate-400">{item.description}</p>}
                </div>
                <span className="text-[10px] font-mono text-slate-400">ID: #{item.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
