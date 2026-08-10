"use client";

import { Calendar, Clock, Video, User, CheckCircle2, Activity, ShieldAlert, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Appointments() {
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [specialty, setSpecialty] = useState("Cardiologist");
  const [urgency, setUrgency] = useState("normal");
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [aiRec, setAiRec] = useState<any>(null);

  useEffect(() => {
    fetchRecommendations();
    fetchMyAppointments();
  }, [specialty, urgency]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getAppointmentRecommendations(specialty, urgency);
      setSlots(res.slots || []);
      if (res.ai_recommendation) {
        setAiRec(res.ai_recommendation);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await api.getMyAppointments();
      setMyAppointments(res.appointments || []);
    } catch (error) {
      console.error("Failed to fetch my appointments", error);
    }
  };

  const handleBook = async (slotId: string) => {
    try {
      await api.bookAppointment(slotId, urgency);
      setBooked(true);
      fetchRecommendations();
      fetchMyAppointments();
    } catch (error: any) {
      alert(error.message || "Failed to book appointment");
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.cancelAppointment(appointmentId, "Cancelled by patient");
      alert("Appointment cancelled successfully.");
      fetchRecommendations();
      fetchMyAppointments();
    } catch (error: any) {
      alert(error.message || "Failed to cancel appointment");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Smart Appointment Booking</h1>
          <p className="text-slate-500 font-medium mt-1">SIH1383: AI-optimized doctor schedule matching & queue management.</p>
        </div>

        {/* Priority / Urgency Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase px-2">Urgency:</span>
          {(['normal', 'urgent', 'emergency', 'follow_up'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setUrgency(level)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                urgency === level
                  ? level === 'emergency' ? 'bg-red-600 text-white' :
                    level === 'urgent' ? 'bg-amber-500 text-white' :
                    level === 'follow_up' ? 'bg-purple-600 text-white' :
                    'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {level.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {aiRec && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-indigo-600 shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-indigo-900">AI Clinical Recommendation: </span>
            <span className="text-indigo-800">{aiRec.reason} (Confidence: {Math.round(aiRec.confidence * 100)}%)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Available Doctors & Ranked Slots */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Ranked Specialist Slots</h2>
            <select 
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2 font-medium"
            >
              <option value="Cardiologist">Cardiologist</option>
              <option value="Pulmonologist">Pulmonologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="General Physician">General Physician</option>
              <option value="Oncologist">Oncologist</option>
            </select>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 bg-slate-100 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No available slots found for {specialty} matching current priority.</p>
            </div>
          ) : (
            slots.map((slot, idx) => {
              const startDate = new Date(slot.start_time);
              const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateString = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
              
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{slot.doctor_name}</h3>
                        {slot.rating && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                            ★ {slot.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{slot.doctor_specialty} • {slot.hospital_name || 'Central Hospital'}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" /> AI Score: {slot.score}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Wait: ~{slot.estimated_wait_minutes} mins (Pos: #{slot.queue_position})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
                        <Calendar className="w-4 h-4 text-blue-600"/> {dateString}, {timeString}
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">Available</p>
                    </div>
                    <button 
                      onClick={() => handleBook(slot.slot_id)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition shrink-0"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Sidebar: Status & My Appointments */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
            {booked ? (
              <div className="animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Appointment Confirmed!</h3>
                <p className="text-xs text-slate-500">SIH1383 allocation complete. Check in-app notifications for details.</p>
                <button 
                  onClick={() => setBooked(false)}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full"
                >
                  Book Another Slot
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Video className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Teleconsultations</h3>
                <p className="text-xs text-slate-500">Secure end-to-end encrypted consultations with ranked specialists.</p>
              </div>
            )}
          </div>

          {/* My Booked Appointments Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> My Appointments
            </h3>
            
            {myAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No active appointments scheduled.</p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((appt, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{appt.doctor_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        appt.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' :
                        appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(appt.scheduled_time).toLocaleString()}</p>
                    
                    {appt.status === 'scheduled' && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
