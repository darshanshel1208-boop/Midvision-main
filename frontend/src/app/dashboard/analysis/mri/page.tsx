"use client";

import { Activity, Download, Image as ImageIcon, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MRIAnalysis() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-slate-800">AI is Analyzing MRI Brain Scan...</h2>
        <p className="text-slate-500 mt-2">Processing slices and detecting neurological patterns.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/patient" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-200 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">MRI Brain Analysis</h1>
          <p className="text-slate-500 font-medium">Analysis completed on August 9, 2026</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Level</h3>
          <h2 className="text-3xl font-bold text-green-600">Normal</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> AI Findings
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Analysis of the multi-planar MRI reveals no acute intracranial hemorrhage, mass effect, or midline shift. Ventricular size and sulcal prominence are within normal limits for age. No restricted diffusion to suggest acute ischemia.
          </p>
          <div className="flex flex-col gap-3 mt-4">
            <div className="bg-green-50 border border-green-100 px-4 py-3 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800">Clear Scan (No Anomalies Detected)</p>
                <p className="text-xs text-green-700 mt-1">Confidence: 96%. All major neurological structures appear perfectly healthy.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
