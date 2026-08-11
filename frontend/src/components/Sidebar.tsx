import Link from 'next/link';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Activity, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle,
  User,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-slate-100 min-h-screen flex flex-col shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-4">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">MediVision AI</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-2">Patient Views</div>
        <Link href="/dashboard/patient" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
        </Link>
        <Link href="/dashboard/appointments" className="flex items-center px-4 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30 border border-blue-500 my-3">
          <Calendar className="w-5 h-5 mr-3" /> 
          <span>Smart Appointments</span>
        </Link>
        <Link href="/dashboard/upload" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <Upload className="w-4 h-4 mr-3" /> Upload Report
        </Link>
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-2">Health Tools</div>
        <Link href="/dashboard/symptoms" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <Activity className="w-4 h-4 mr-3" /> Symptom Checker
        </Link>
        <Link href="/dashboard/chatbot" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <MessageCircle className="w-4 h-4 mr-3" /> AI Chatbot
        </Link>
        <Link href="/dashboard/trends" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <TrendingUp className="w-4 h-4 mr-3" /> Health Trends
        </Link>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-2">Provider Views</div>
        <Link href="/dashboard/presence" className="flex items-center px-4 py-2.5 text-sm font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-500/30 border border-purple-500 my-2">
          <Activity className="w-4 h-4 mr-3" /> Doctor Presence & RFID/AI
        </Link>
        <Link href="/dashboard/doctor" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <User className="w-4 h-4 mr-3" /> Doctor Portal
        </Link>
        <Link href="/dashboard/admin" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
          <ShieldAlert className="w-4 h-4 mr-3" /> Admin Portal
        </Link>
      </nav>
      
      <div className="p-4 mt-auto">
        <button className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors border border-red-100">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency SOS
        </button>
      </div>
    </div>
  );
}
