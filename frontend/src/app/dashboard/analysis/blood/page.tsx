"use client";

import { Activity, Download, HeartPulse, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReportRiskActionBanner from '@/components/ReportRiskActionBanner';

export default function BloodAnalysis() {
  const [loading, setLoading] = useState(true);

  // Simulate loading state for AI processing
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-slate-800">AI is Analyzing your Blood Report...</h2>
        <p className="text-slate-500 mt-2">Extracting biomarkers and comparing with health baselines.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/patient" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-200 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Comprehensive Blood Panel</h1>
          <p className="text-slate-500 font-medium">Analysis completed on August 9, 2026</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Feature: Risk Action Banner */}
      <ReportRiskActionBanner 
        riskLevel="LOW" 
        specialty="General Physician" 
        reportType="Blood Test Panel" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <HeartPulse className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Level</h3>
          <h2 className="text-3xl font-bold text-green-600">Low Risk</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> AI Summary & Findings
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            The AI has successfully processed your blood panel. Overall, your biomarkers are within normal healthy ranges. Hemoglobin and Red Blood Cell (RBC) counts are optimal, indicating good oxygen transport. White Blood Cell (WBC) count is normal, suggesting no acute infections.
          </p>
        </div>

      </div>
    </div>
  );
}
