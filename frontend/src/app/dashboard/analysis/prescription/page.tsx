"use client";

import { Activity, Download, Pill, CheckCircle2, FileText, ArrowLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PrescriptionAnalysis() {
  const [loading, setLoading] = useState(true);

  // Simulate loading state for AI processing
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-slate-800">OCR is Processing Prescription...</h2>
        <p className="text-slate-500 mt-2">Extracting medicines, dosages, and schedules.</p>
      </div>
    );
  }

  // Mocked response matching backend
  const extractedMedicines = [
    {"name": "Amoxicillin 500mg", "dosage": "1 tablet", "schedule": "1-0-1 (Morning & Night)", "duration": "5 Days"},
    {"name": "Paracetamol 650mg", "dosage": "1 tablet", "schedule": "1-1-1 (After meals)", "duration": "3 Days"},
    {"name": "Cetirizine 10mg", "dosage": "1 tablet", "schedule": "0-0-1 (Night)", "duration": "5 Days"}
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/patient" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-200 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Prescription OCR</h1>
          <p className="text-slate-500 font-medium">Extracted on August 10, 2026</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">OCR Status</h3>
          <h2 className="text-3xl font-bold text-blue-600">Successful</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Extraction Summary
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            The AI has successfully scanned and digitized your handwritten prescription. We identified {extractedMedicines.length} prescribed medications. Please review the dosages and schedule below to ensure accuracy before setting up reminders.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="bg-green-50 border border-green-100 px-4 py-3 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">High confidence extraction for Amoxicillin and Paracetamol.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">Digitized Medicines</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="px-6 py-4 font-semibold">Medicine Name</th>
                <th className="px-6 py-4 font-semibold">Dosage</th>
                <th className="px-6 py-4 font-semibold">Schedule</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {extractedMedicines.map((med, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{med.name}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{med.dosage}</td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" /> {med.schedule}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
