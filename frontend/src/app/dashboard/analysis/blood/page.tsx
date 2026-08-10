"use client";

import { Activity, Download, HeartPulse, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
      <div className="flex items-center gap-4 mb-8">
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
          <div className="flex gap-4 mt-4">
            <div className="bg-green-50 border border-green-100 px-4 py-3 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Lipid profile (Cholesterol, Triglycerides) is excellent.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">Vitamin D levels are slightly below optimal. Consider supplementation.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Biomarker Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="px-6 py-4 font-semibold">Test Name</th>
                <th className="px-6 py-4 font-semibold">Result</th>
                <th className="px-6 py-4 font-semibold">Reference Range</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">Hemoglobin (Hb)</td>
                <td className="px-6 py-4 font-bold text-slate-700">14.2 g/dL</td>
                <td className="px-6 py-4 text-slate-500">13.8 - 17.2 g/dL</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-bold text-xs">Normal</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">White Blood Cells (WBC)</td>
                <td className="px-6 py-4 font-bold text-slate-700">6.8 x10^9/L</td>
                <td className="px-6 py-4 text-slate-500">4.5 - 11.0 x10^9/L</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-bold text-xs">Normal</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">Platelets</td>
                <td className="px-6 py-4 font-bold text-slate-700">245 x10^9/L</td>
                <td className="px-6 py-4 text-slate-500">150 - 450 x10^9/L</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-bold text-xs">Normal</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">Vitamin D (25-OH)</td>
                <td className="px-6 py-4 font-bold text-amber-600">22 ng/mL</td>
                <td className="px-6 py-4 text-slate-500">30 - 100 ng/mL</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-bold text-xs">Low</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
