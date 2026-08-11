"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, AlertCircle, FileText, CheckCircle2, ChevronRight, Activity, Calendar, Clock, Ban, Play, Check, X } from 'lucide-react';

export default function DoctorDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveDates, setLeaveDates] = useState({ start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const docRes = await api.getDoctors();
      if (docRes.data && docRes.data.length > 0) {
        setDoctors(docRes.data);
        const firstDoc = docRes.data[0];
        setSelectedDoctorId(firstDoc.id);
        fetchSchedule(firstDoc.id);
      }
      const apptRes = await api.getMyAppointments();
      setMyAppointments(apptRes.appointments || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchSchedule = async (docId: string) => {
    try {
      const res = await api.getDoctorSchedule(docId);
      setSchedule(res.slots || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockSlot = async (slotId: string) => {
    try {
      await api.blockSlot(slotId, "Blocked by Doctor");
      alert("Slot blocked successfully.");
      if (selectedDoctorId) fetchSchedule(selectedDoctorId);
    } catch (e: any) {
      alert(e.message || "Failed to block slot");
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !leaveDates.start_date || !leaveDates.end_date) return;
    try {
      await api.requestDoctorLeave({
        doctor_id: selectedDoctorId,
        start_date: leaveDates.start_date,
        end_date: leaveDates.end_date,
        reason: leaveDates.reason
      });
      alert("Leave recorded and conflicting slots blocked.");
      setLeaveModal(false);
      fetchSchedule(selectedDoctorId);
    } catch (err: any) {
      alert(err.message || "Failed to process leave request");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Doctor Portal & Schedule Controls</h1>
          <p className="text-slate-500 mt-1">Working hours, live patient queue, and leave management.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {doctors.length > 0 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                fetchSchedule(e.target.value);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl p-2.5 font-bold shadow-sm"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          )}

          <button 
            onClick={() => setLeaveModal(true)}
            className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-xl text-sm hover:bg-amber-100 transition shadow-sm flex items-center gap-2"
          >
            <Ban className="w-4 h-4 text-amber-600" /> Set Leave / Unavailability
          </button>
        </div>
      </div>

      {/* Multi-Sensor Presence & RFID Quick Access Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-purple-100">Multi-Sensor Doctor Presence Integration Active</h3>
            <p className="text-xs text-purple-200/80">RFID tag badges, Face Recognition cameras, and Mobile BLE proximity pings automatically update your availability status and auto-allocate waitlisted patient slots.</p>
          </div>
        </div>
        <a 
          href="/dashboard/presence"
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
        >
          Open Presence Simulator & Control Center &rarr;
        </a>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Doctor</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">
            {doctors.find(d => d.id === selectedDoctorId)?.name || 'Dr. Jenkins'}
          </h2>
          <p className="text-xs text-blue-600 font-bold mt-1">
            {doctors.find(d => d.id === selectedDoctorId)?.specialty || 'Specialist'}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Size</p>
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mt-2">{myAppointments.length}</h2>
          <p className="text-xs text-emerald-600 font-bold mt-1">Scheduled Patients</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Slots</p>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mt-2">{schedule.length}</h2>
          <p className="text-xs text-purple-600 font-bold mt-1">Open 30-min Slots</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duty Status</p>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-emerald-600 mt-2">Active & On Duty</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Smart Allocation Sync</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Schedule & Slot Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Dynamic 30-Min Timeslot Engine
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>)}
              </div>
            ) : schedule.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No active slots generated or all blocked/booked.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {schedule.map((slot, i) => {
                  const startTime = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(slot.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{dateStr}, {startTime}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">{slot.status}</p>
                      </div>
                      <button
                        onClick={() => handleBlockSlot(slot.slot_id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition"
                      >
                        Block
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Patient Queue & Appointments */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Live Patient Queue
            </h3>
            {myAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No scheduled consultations right now.</p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((appt, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Patient: {appt.patient_name || appt.patient_id?.slice(0, 8)}</p>
                        <p className="text-[11px] text-slate-500">{new Date(appt.scheduled_time).toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        appt.urgency_level === 'emergency' ? 'bg-red-100 text-red-700' :
                        appt.urgency_level === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appt.urgency_level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-indigo-600 font-bold pt-1">
                      <span>Est Wait: ~{appt.estimated_wait_minutes}m</span>
                      <span className="text-slate-500 font-medium">Pos: #{appt.queue_position}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Leave Request Modal */}
      {leaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Request Leave / Mark Unavailable</h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveDates.start_date}
                  onChange={(e) => setLeaveDates({ ...leaveDates, start_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveDates.end_date}
                  onChange={(e) => setLeaveDates({ ...leaveDates, end_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="Personal / Medical Conference"
                  value={leaveDates.reason}
                  onChange={(e) => setLeaveDates({ ...leaveDates, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl"
                >
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
