import Link from 'next/link';
import { FileText, ArrowRight, Activity, TrendingUp, AlertCircle, HeartPulse, Upload } from 'lucide-react';

export default function PatientDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Your Health Overview</h1>
        <p className="text-slate-500 mt-1">Track your recent reports, health trends, and AI-driven insights.</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Overall Health Score</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-1">92/100</h2>
            <p className="text-sm text-green-600 font-medium mt-1">↑ 4% from last month</p>
          </div>
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <HeartPulse className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Analyzed Reports</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-1">14</h2>
            <p className="text-sm text-blue-600 font-medium mt-1">2 new this week</p>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Alerts</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-1">1</h2>
            <p className="text-sm text-amber-600 font-medium mt-1">Requires attention</p>
          </div>
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Recent AI Analyses</h3>
              <Link href="/dashboard/upload" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              
              <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Comprehensive Blood Panel</h4>
                    <p className="text-sm text-slate-500">Analyzed 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Normal</span>
                  <Link href="/dashboard/analysis/blood" className="p-2 text-slate-400 hover:text-blue-600 bg-white shadow-sm border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Chest X-Ray (PA View)</h4>
                    <p className="text-sm text-slate-500">Analyzed 1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Observation</span>
                  <Link href="/dashboard/analysis/xray" className="p-2 text-slate-400 hover:text-blue-600 bg-white shadow-sm border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-md text-white">
            <h3 className="text-lg font-bold mb-2">Need a new analysis?</h3>
            <p className="text-blue-100 text-sm mb-6">Upload your latest medical reports or scans for instant AI-powered insights.</p>
            <Link href="/dashboard/upload" className="w-full flex items-center justify-center bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              <Upload className="w-4 h-4 mr-2" /> Upload Report
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Appointments</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-red-500 uppercase">Oct</span>
                <span className="text-lg font-bold text-slate-800">24</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Dr. Sarah Jenkins</h4>
                <p className="text-sm text-slate-500">Cardiologist • 10:30 AM</p>
              </div>
            </div>
            <Link href="/dashboard/appointments" className="block text-center text-sm font-semibold text-blue-600 mt-4 hover:text-blue-700">
              Manage Appointments
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
