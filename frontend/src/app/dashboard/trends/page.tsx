"use client";

import { useState } from 'react';
import { TrendingUp, Activity, Heart, ShieldCheck, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface MetricTrend {
  parameter: string;
  category: string;
  current: string;
  unit: string;
  status: 'normal' | 'warning' | 'borderline';
  change: string;
  direction: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
  reference: string;
  recommendation: string;
}

const SAMPLE_TRENDS: MetricTrend[] = [
  {
    parameter: 'Hemoglobin',
    category: 'Complete Blood Count',
    current: '14.2',
    unit: 'g/dL',
    status: 'normal',
    change: '+0.5',
    direction: 'up',
    history: [
      { date: 'Jan 2026', value: 13.5 },
      { date: 'Apr 2026', value: 13.8 },
      { date: 'Jul 2026', value: 14.0 },
      { date: 'Aug 2026', value: 14.2 }
    ],
    reference: '13.5 - 17.5 g/dL',
    recommendation: 'Oxygen-carrying capacity is optimal. Continue balanced nutrition.'
  },
  {
    parameter: 'Fasting Blood Sugar (HbA1c)',
    category: 'Metabolic & Diabetes',
    current: '5.8',
    unit: '%',
    status: 'borderline',
    change: '+0.2',
    direction: 'up',
    history: [
      { date: 'Jan 2026', value: 5.4 },
      { date: 'Apr 2026', value: 5.5 },
      { date: 'Jul 2026', value: 5.7 },
      { date: 'Aug 2026', value: 5.8 }
    ],
    reference: '< 5.7% (Normal), 5.7 - 6.4% (Prediabetes)',
    recommendation: 'Slight upward trend into prediabetes threshold. Dietary evaluation recommended with General Physician.'
  },
  {
    parameter: 'Total Cholesterol',
    category: 'Lipid Profile',
    current: '185',
    unit: 'mg/dL',
    status: 'normal',
    change: '-12',
    direction: 'down',
    history: [
      { date: 'Jan 2026', value: 205 },
      { date: 'Apr 2026', value: 198 },
      { date: 'Jul 2026', value: 190 },
      { date: 'Aug 2026', value: 185 }
    ],
    reference: '< 200 mg/dL',
    recommendation: 'Lipid control improved significantly following lifestyle adjustments.'
  },
  {
    parameter: 'Resting Heart Rate',
    category: 'Cardiovascular Vitals',
    current: '72',
    unit: 'bpm',
    status: 'normal',
    change: '-3',
    direction: 'down',
    history: [
      { date: 'Jan 2026', value: 78 },
      { date: 'Apr 2026', value: 76 },
      { date: 'Jul 2026', value: 74 },
      { date: 'Aug 2026', value: 72 }
    ],
    reference: '60 - 100 bpm',
    recommendation: 'Cardiovascular endurance is improving. Regular aerobic activity is recommended.'
  }
];

export default function Trends() {
  const [selectedMetric, setSelectedMetric] = useState<MetricTrend>(SAMPLE_TRENDS[0]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Longitudinal Health Trends</h1>
          <p className="text-slate-500 font-medium mt-1">SIH1383: AI-driven parameter tracking across blood tests, vitals, and reports.</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Longitudinal Model Active
        </div>
      </div>

      {/* Parameter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SAMPLE_TRENDS.map((metric, i) => {
          const isSelected = selectedMetric.parameter === metric.parameter;
          return (
            <div
              key={i}
              onClick={() => setSelectedMetric(metric)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.category}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  metric.status === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                  metric.status === 'borderline' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {metric.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 text-sm">{metric.parameter}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-800">{metric.current}</span>
                <span className="text-xs text-slate-500">{metric.unit}</span>
                <span className={`text-xs font-bold flex items-center ml-auto ${
                  metric.direction === 'down' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {metric.direction === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  {metric.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Metric Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Visualization & History */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedMetric.parameter} Trajectory</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Reference Range: {selectedMetric.reference}</p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl">
              4 Historical Points
            </span>
          </div>

          {/* Simple Visual Bar Trend */}
          <div className="space-y-4 pt-2">
            {selectedMetric.history.map((item, idx) => {
              const maxVal = Math.max(...selectedMetric.history.map(h => h.value)) * 1.15;
              const widthPct = Math.min(100, Math.round((item.value / maxVal) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.date}
                    </span>
                    <span>{item.value} {selectedMetric.unit}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedMetric.status === 'normal' ? 'bg-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight & Action Recommendation */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> AI Clinical Assessment
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {selectedMetric.recommendation}
            </p>

            {selectedMetric.status === 'borderline' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Doctor Review Suggested
                </div>
                <p className="text-[11px] leading-relaxed">
                  Based on SIH1383 protocol, longitudinal drifts above baseline threshold benefit from preventive specialist consultation.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
