"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, AlertCircle, Clock, CalendarDays, Activity, BriefcaseMedical, Plus, UserPlus, Power, CheckCircle, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDoctorModal, setAddDoctorModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: '',
    email: '',
    specialty: 'Cardiologist',
    experience_years: 5,
    consultation_duration_minutes: 30,
    is_emergency_available: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      const docsRes = await api.getDoctors();
      setDoctors(docsRes.data || []);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
    setLoading(false);
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDoctor(newDoc);
      alert("Doctor profile created successfully!");
      setAddDoctorModal(false);
      setNewDoc({ name: '', email: '', specialty: 'Cardiologist', experience_years: 5, consultation_duration_minutes: 30, is_emergency_available: false });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to create doctor");
    }
  };

  const handleToggleDeactivate = async (docId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this doctor?`)) return;
    try {
      if (currentStatus) {
        await api.deactivateDoctor(docId);
      } else {
        await api.updateDoctor(docId, { is_active: true });
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4">
        <div className="h-10 bg-slate-100 rounded-xl w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl"></div>
      </div>
    );
  }

  const metrics = stats?.metrics || { total_today: 12, urgent_cases: 3, avg_wait_time: "18 mins", predicted_no_show: "8.5%" };
  const workload = stats?.workload || [];
  const availability = stats?.availability || [];
  const recentAllocations = stats?.recent_allocations || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hospital Administration & Queue Control</h1>
          <p className="text-slate-500 font-medium mt-1">SIH1383: Doctor Workload Rebalancing & Real-Time Availability Overview</p>
        </div>
        
        <button
          onClick={() => setAddDoctorModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-600/20 flex items-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add New Doctor
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Bookings</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.total_today}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-red-200 transition">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent & Emergency</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.urgent_cases}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-amber-200 transition">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Wait Time</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.avg_wait_time}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Predicted No-Show Rate</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.predicted_no_show}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Doctor Roster & Workload Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BriefcaseMedical className="w-5 h-5 text-blue-600" /> Active Doctor Roster & Workload
              </span>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {doctors.length} Doctors Registered
              </span>
            </h2>

            <div className="space-y-4">
              {doctors.map((doc: any, i: number) => {
                const docWorkload = workload.find((w: any) => w.id === doc.id || w.name === doc.name);
                const count = docWorkload ? docWorkload.appointments : 0;
                const status = docWorkload ? docWorkload.status : (doc.is_active ? 'Available' : 'Deactivated');

                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{doc.name}</h3>
                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          ★ {doc.rating || 5.0}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.specialty} • {doc.experience_years} yrs exp • {doc.consultation_duration_minutes}m slot</p>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{count} slots booked</p>
                        <p className={`text-xs font-bold ${
                          status === 'Overloaded' ? 'text-red-500' :
                          status === 'Busy' ? 'text-amber-500' :
                          !doc.is_active ? 'text-slate-400' : 'text-emerald-600'
                        }`}>
                          {status}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleDeactivate(doc.id, doc.is_active)}
                        title={doc.is_active ? "Deactivate Doctor" : "Activate Doctor"}
                        className={`p-2 rounded-xl transition ${
                          doc.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Specialty Availability & Live Allocations */}
        <div className="space-y-6">
          
          {/* Specialty Slots Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Specialty Capacity
            </h2>
            <div className="space-y-3">
              {availability.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{item.specialty}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {item.slots} Available Slots
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent AI Allocations */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" /> Recent SIH1383 Allocations
            </h2>
            {recentAllocations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent allocations.</p>
            ) : (
              <div className="space-y-3">
                {recentAllocations.map((appt: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Assigned to {appt.doctor}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        appt.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                        appt.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {appt.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{appt.specialty} • {new Date(appt.time).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Add Doctor Modal */}
      {addDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Register New Doctor</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Gregory House"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="gregory.house@medivision.com"
                  value={newDoc.email}
                  onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Primary Specialty</label>
                  <select
                    value={newDoc.specialty}
                    onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Pulmonologist">Pulmonologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Oncologist">Oncologist</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newDoc.experience_years}
                    onChange={(e) => setNewDoc({ ...newDoc, experience_years: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Slot Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={newDoc.consultation_duration_minutes}
                    onChange={(e) => setNewDoc({ ...newDoc, consultation_duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="emergency_avail"
                    checked={newDoc.is_emergency_available}
                    onChange={(e) => setNewDoc({ ...newDoc, is_emergency_available: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="emergency_avail" className="text-xs font-bold text-slate-700">Emergency On-Call</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddDoctorModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl"
                >
                  Register Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
