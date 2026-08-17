"use client";

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Calendar, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface ReportRiskActionBannerProps {
  riskLevel: 'CRITICAL' | 'HIGH' | 'RISKY' | 'MEDIUM' | 'MODERATE' | 'LOW' | string;
  specialty?: string;
  reportType?: string;
}

export default function ReportRiskActionBanner({ riskLevel, specialty = "Specialist", reportType = "Report" }: ReportRiskActionBannerProps) {
  const risk = riskLevel.toUpperCase();
  const isUrgentRisky = ['CRITICAL', 'HIGH', 'RISKY', 'EMERGENCY'].includes(risk);
  const isMedium = ['MEDIUM', 'MODERATE'].includes(risk);

  if (!isUrgentRisky && !isMedium) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold text-sm">Low Risk - Routine Findings: </span>
          <span className="text-xs text-emerald-800">No immediate clinical appointment required. Routine annual checkup is advised.</span>
        </div>
      </div>
    );
  }

  if (isUrgentRisky) {
    return (
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-6 rounded-3xl shadow-lg border border-red-500 space-y-3 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>AI Urgent Auto-Booking Triggered</span>
          </div>
          <span className="bg-red-950/80 text-red-200 text-xs px-2.5 py-0.5 rounded-full font-extrabold border border-red-500/40">
            EMERGENCY PRIORITY
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            🚨 Urgent Appointment Automatically Booked!
          </h3>
          <p className="text-xs text-red-100 leading-relaxed">
            Due to <strong>{risk} RISK</strong> findings in your {reportType}, an urgent consultation slot has been automatically booked with a <strong>{specialty}</strong> to ensure rapid medical intervention.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/20 text-xs gap-3 sm:gap-0">
          <div className="flex items-center gap-2 text-amber-100 font-semibold">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
            <span>Priority Queue Position #1 • Slot Reserved</span>
          </div>
          <Link
            href="/dashboard/appointments"
            className="w-full sm:w-auto px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1 shrink-0"
          >
            View Appointment <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-amber-400 space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-200" />
          <span>AI Clinical Suggestion</span>
        </div>
        <span className="bg-amber-900/60 text-amber-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
          MODERATE RISK
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
          💡 Appointment Booking Suggestion
        </h3>
        <p className="text-xs text-amber-100 leading-relaxed">
          Moderate risk findings were identified in your report. Booking a follow-up consultation with a <strong>{specialty}</strong> is strongly recommended for early evaluation.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/20 text-xs gap-3 sm:gap-0">
        <span className="text-amber-100 font-medium">Recommended Specialty: {specialty}</span>
        <Link
          href={`/dashboard/appointments`}
          className="w-full sm:w-auto px-4 py-2 bg-white text-amber-800 hover:bg-amber-50 font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1 shrink-0"
        >
          <Calendar className="w-3.5 h-3.5" /> Book Appointment Now <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
