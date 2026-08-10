"use client";

import { useState } from 'react';
import { Activity, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    // Mocking an AI symptom analysis response
    setTimeout(() => {
      setResult({
        possibleConditions: [
          { name: "Viral Pharyngitis", probability: "High", urgency: "Routine" },
          { name: "Seasonal Allergies", probability: "Medium", urgency: "Routine" },
          { name: "Strep Throat", probability: "Low", urgency: "Consult Doctor" }
        ],
        recommendation: "Based on your symptoms (sore throat, mild fever), this appears to be a routine viral infection. Rest and hydrate. If symptoms persist for more than 3 days, consult a physician."
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">AI Symptom Checker</h1>
        <p className="text-slate-500 font-medium mt-2">Describe how you're feeling and our AI will suggest possible causes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col h-full">
          <label className="block text-sm font-bold text-slate-700 mb-2">Describe your symptoms in detail</label>
          <textarea 
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="E.g., I've had a sore throat and a mild fever of 99.5F for the last two days..."
            className="w-full flex-1 min-h-[200px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 font-medium text-slate-800 resize-none mb-4"
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            className="w-full flex items-center justify-center py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20 mt-auto"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Activity className="w-5 h-5 mr-2" />}
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </div>

        {/* Results Section */}
        <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-8 ${!result ? 'opacity-50 pointer-events-none flex flex-col justify-center items-center text-center' : ''}`}>
          {!result ? (
            <>
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Enter your symptoms to see AI analysis.</p>
            </>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Analysis Results</h3>
              
              <div className="space-y-3">
                {result.possibleConditions.map((cond: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">{cond.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      cond.probability === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {cond.probability} Probability
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm text-blue-900 font-medium leading-relaxed">
                  {result.recommendation}
                </p>
              </div>

              <Link href="/dashboard/appointments" className="w-full flex items-center justify-center py-3 bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 rounded-xl font-bold text-sm transition-colors mt-4 gap-2">
                Book a Consultation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
