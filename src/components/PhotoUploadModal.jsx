import React, { useState } from 'react';
import { api } from '../services/api';
import { Camera, Upload, CheckCircle2, X, RefreshCw, Image as ImageIcon } from 'lucide-react';

export default function PhotoUploadModal({ onUploadComplete, onClose, title = "Upload Inspection Photo" }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError('File size must be under 25MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadFile(selectedFile);
      if (res.fileUrl) {
        onUploadComplete(res.fileUrl);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-300 max-h-64 bg-slate-900 flex justify-center items-center">
              <img src={previewUrl} alt="Preview" className="max-h-64 object-contain" />
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-[#0B2545] hover:bg-slate-50 transition">
              <Camera className="w-10 h-10 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">Click to capture or upload photo</span>
              <span className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, JPEG up to 25MB</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              className="px-4 py-2 bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Photo Proof
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
