'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, 
  Upload, 
  Activity, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle,
  User,
  ShieldAlert,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shadow-lg lg:shadow-sm transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>MediVision AI</span>
          </Link>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-2">Patient Views</div>
          <Link 
            href="/dashboard/patient" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 mr-3 shrink-0" /> Dashboard
          </Link>
          <Link 
            href="/dashboard/appointments" 
            onClick={onClose}
            className="flex items-center px-4 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30 border border-blue-500 my-2"
          >
            <Calendar className="w-5 h-5 mr-3 shrink-0" /> 
            <span>Smart Appointments</span>
          </Link>
          <Link 
            href="/dashboard/upload" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4 mr-3 shrink-0" /> Upload Report
          </Link>
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-5 px-2">Health Tools</div>
          <Link 
            href="/dashboard/symptoms" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Activity className="w-4 h-4 mr-3 shrink-0" /> Symptom Checker
          </Link>
          <Link 
            href="/dashboard/chatbot" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-3 shrink-0" /> AI Chatbot
          </Link>
          <Link 
            href="/dashboard/trends" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-3 shrink-0" /> Health Trends
          </Link>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-5 px-2">Provider Views</div>
          <Link 
            href="/dashboard/presence" 
            onClick={onClose}
            className="flex items-center px-4 py-2.5 text-sm font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-500/30 border border-purple-500 my-2"
          >
            <Activity className="w-4 h-4 mr-3 shrink-0" /> Doctor Presence & RFID/AI
          </Link>
          <Link 
            href="/dashboard/doctor" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <User className="w-4 h-4 mr-3 shrink-0" /> Doctor Portal
          </Link>
          <Link 
            href="/dashboard/admin" 
            onClick={onClose}
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 mr-3 shrink-0" /> Admin Portal
          </Link>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-100 shrink-0">
          <button className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors border border-red-100">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            Emergency SOS
          </button>
        </div>
      </aside>
    </>
  );
}
