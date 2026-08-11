import Link from 'next/link';
import Helix3D from '@/components/Helix3D';
import './landing.css';
import { User, Activity, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="page">
        
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3 group text-decoration-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                MediVision <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">AI</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100/80 ml-1">
                  v2.5
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">Clinical Decision Support</span>
            </div>
          </Link>

          <div className="flex items-center">
            <Link href="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-md shadow-blue-600/20 hover:scale-105">
              <User className="w-4 h-4" />
              Login
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="eyebrow">AI-POWERED CLINICAL DECISION SUPPORT</div>
              <h1>Intelligent pathways to Clinical Insights</h1>
              <Link href="/login" className="btn-outline">
                GET STARTED
              </Link>
            </div>

            <Helix3D />

            <div className="hero-copy-right">
              <p>Instantly analyze X-Rays, MRIs, ECGs, and Prescriptions with Google Gemini Vision. Dynamically optimize doctor availability, estimate wait times, and match patients to top specialists.</p>
              <Link href="/login" className="btn-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                Dive in deeper
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <div className="space-y-6 mb-24">
          
          {/* Card 01 */}
          <section className="info-card">
            <div className="info-num text-slate-800">01</div>
            <div className="info-mid">
              <span className="date">MULTIMODAL DIAGNOSTICS</span>
              <h3 className="text-slate-800">Medical Imaging & Prescription OCR Analysis</h3>
            </div>
            <div className="info-text">
              <p>MediVision AI ingests Chest X-Rays, MRI scans, CT images, ECG signals, and handwritten prescriptions. Powered by Google Gemini 2.5 Vision, it extracts critical diagnostic findings, flags abnormalities, and generates patient-friendly summaries.</p>
            </div>
          </section>

          {/* Card 02 */}
          <section className="info-card">
            <div className="info-num text-slate-800">02</div>
            <div className="info-mid">
              <span className="date">SMART ALLOCATION ENGINE</span>
              <h3 className="text-slate-800">Doctor Availability & Appointment Optimization</h3>
            </div>
            <div className="info-text">
              <p>Our dynamic scheduling engine balances doctor schedules, workload capacity, urgency levels, patient preferences, and estimated queue wait times to eliminate double-booking and optimize hospital patient flow.</p>
            </div>
          </section>

          {/* Card 03 */}
          <section className="info-card">
            <div className="info-num text-slate-800">03</div>
            <div className="info-mid">
              <span className="date">HEALTH INTELLIGENCE</span>
              <h3 className="text-slate-800">Longitudinal Trends & 24/7 AI Health Chatbot</h3>
            </div>
            <div className="info-text">
              <p>Track lab vitals across historical medical reports with AI trend analysis. Consult our 24/7 AI Health Assistant for instant medical guidance, symptom screening, and automated doctor recommendations.</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
