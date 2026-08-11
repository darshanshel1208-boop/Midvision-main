"use client";

import { UploadCloud, File, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function UploadReport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!reportType) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_type', reportType);
      formData.append('description', description);

      if (reportType === 'prescription') {
        const response = await api.extractPrescription(formData);
        router.push(`/dashboard/analysis/prescription`);
      } else {
        const response = await api.uploadReport(formData);
        router.push(`/dashboard/analysis/${reportType}`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Upload Medical Report</h1>
        <p className="text-slate-500 font-medium mt-2">Upload any medical report/images for AI analysis</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Upload Area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-12 flex flex-col items-center justify-center transition hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer group shadow-sm"
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.dcm"
        />
        
        {file ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <File className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{file.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
            >
              Change File
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Click to upload <span className="font-medium text-slate-500">or drag and drop</span></h3>
            <p className="text-xs text-slate-400">Supports: JPG, PNG, PDF, DICOM</p>
            <p className="text-xs text-slate-400 mt-1">Max file size: 20MB</p>
          </>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Report Type</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-800"
          >
            <option value="">Select Report Type</option>
            <option value="blood">Blood Test Report</option>
            <option value="xray">Chest X-Ray</option>
            <option value="mri">MRI Scan</option>
            <option value="ct">CT Scan</option>
            <option value="ecg">ECG</option>
            <option value="prescription">Prescription (OCR)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Report Description (Optional)</label>
          <textarea 
            rows={3} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Eg: Fever, cough, chest pain..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 font-medium text-slate-800 resize-none"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading}
          className="w-full flex items-center justify-center py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
          {loading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
        </button>
      </div>

    </div>
  );
}
