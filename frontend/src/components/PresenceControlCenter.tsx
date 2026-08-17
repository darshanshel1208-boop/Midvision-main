"use client";

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Camera, 
  Smartphone, 
  UserCheck, 
  AlertCircle, 
  Zap, 
  Clock, 
  Activity, 
  RefreshCw, 
  ShieldCheck,
  Building2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';

export default function PresenceControlCenter() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simulator State
  const [simTech, setSimTech] = useState<'rfid' | 'face' | 'mobile'>('rfid');
  const [simRoom, setSimRoom] = useState<string>('OPD Cabin 101');
  const [faceConfidence, setFaceConfidence] = useState<number>(0.95);
  const [mobileDistance, setMobileDistance] = useState<number>(1.5);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000); // Auto refresh every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const docsRes = await api.getDoctorPresences();
      setDoctors(docsRes.doctors || []);
      if (!selectedDoctor && docsRes.doctors && docsRes.doctors.length > 0) {
        setSelectedDoctor(docsRes.doctors[0].doctor_id);
      }

      const logsRes = await api.getPresenceSensorLogs(20);
      setLogs(logsRes.logs || []);

      const waitRes = await api.getWaitlistQueue();
      setWaitlist(waitRes.waitlist || []);
    } catch (err) {
      console.error("Error fetching presence data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRFID = async (action: string = "ENTER") => {
    if (!selectedDoctor) return;
    const doc = doctors.find(d => d.doctor_id === selectedDoctor);
    const rfidTag = doc?.rfid_tag_id || selectedDoctor;
    try {
      const res = await api.sendRFIDEvent(rfidTag, simRoom, action, "RFID-READER-OPD-01");
      setActionMessage(`RFID Event Transmitted: ${res.status} via RFID badge`);
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleSimulateFace = async () => {
    if (!selectedDoctor) return;
    const doc = doctors.find(d => d.doctor_id === selectedDoctor);
    const faceId = doc?.face_id || selectedDoctor;
    try {
      const res = await api.sendFaceDetectionEvent(faceId, faceConfidence, simRoom, "CAM-CABIN-INLET");
      setActionMessage(`Face Recognition Event Transmitted: Doctor ${res.status} (Conf: ${Math.round(faceConfidence * 100)}%)`);
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleSimulateMobile = async () => {
    if (!selectedDoctor) return;
    const doc = doctors.find(d => d.doctor_id === selectedDoctor);
    const mobId = doc?.mobile_device_id || selectedDoctor;
    try {
      const res = await api.sendMobileProximityEvent(mobId, mobileDistance, "BLE-CABIN-BEACON");
      setActionMessage(`Mobile Proximity Ping: Distance ${mobileDistance}m -> Status ${res.status}`);
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleManualOverride = async (status: string) => {
    if (!selectedDoctor) return;
    try {
      const res = await api.overrideDoctorStatus(selectedDoctor, status, simRoom);
      setActionMessage(`Manual Override: Status set to ${status}`);
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleTriggerAI = async (doctorId: string) => {
    try {
      const res = await api.triggerAIAllocation(doctorId);
      if (res.allocated) {
        setActionMessage(`AI Slot Allocator: ${res.allocated_count} waitlisted patients auto-assigned slots!`);
      } else {
        setActionMessage(`AI Slot Allocator: ${res.reason || "No allocation made."}`);
      }
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const activeDocObj = doctors.find(d => d.doctor_id === selectedDoctor);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> AI & Digital Sensor Integration
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Optimizing Doctor Availability & Dynamic Slot Allocation
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-2 max-w-2xl">
              Automated doctor presence tracking using multi-sensor technology (RFID, Face Detection, Mobile Proximity) & real-time AI dynamic slot allocation for waitlisted patients.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Feeds
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-3 rounded-2xl flex items-center justify-between text-sm font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Grid: Doctor Presence Live Monitor & Hardware Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Doctor Presences (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" /> Live Doctor Availability Matrix
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
              {doctors.length} Doctors Tracked
            </span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const isSelected = doc.doctor_id === selectedDoctor;
                const isPresent = doc.status === "PRESENT";
                const isBreak = doc.status === "ON_BREAK";
                
                return (
                  <div 
                    key={doc.doctor_id} 
                    onClick={() => setSelectedDoctor(doc.doctor_id)}
                    className={`p-5 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected ? 'border-blue-500 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.doctor_name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{doc.specialty} • {doc.room_number}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                        isPresent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        isBreak ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Detection Sensor</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                          {doc.last_detection_method === 'RFID' && <Radio className="w-3 h-3 text-purple-600" />}
                          {doc.last_detection_method === 'FACE_DETECTION' && <Camera className="w-3 h-3 text-blue-600" />}
                          {doc.last_detection_method === 'MOBILE_PROXIMITY' && <Smartphone className="w-3 h-3 text-emerald-600" />}
                          {doc.last_detection_method}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Signal Score</span>
                        <span className="font-bold text-blue-600">
                          {Math.round((doc.confidence || 0) * 100)}% ({doc.distance_meters?.toFixed(1) || 0}m)
                        </span>
                      </div>
                    </div>

                    {isPresent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerAI(doc.doctor_id);
                        }}
                        className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> Allocate Waitlisted Slots
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Real-time Sensor Log Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" /> Multi-Sensor Detection Log Feed
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No sensor events recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        log.sensor_type === 'RFID' ? 'bg-purple-100 text-purple-700' :
                        log.sensor_type === 'FACE_DETECTION' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {log.sensor_type === 'RFID' && <Radio className="w-4 h-4" />}
                        {log.sensor_type === 'FACE_DETECTION' && <Camera className="w-4 h-4" />}
                        {log.sensor_type === 'MOBILE_PROXIMITY' && <Smartphone className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800">{log.doctor_name}</span>
                        <p className="text-[11px] text-slate-500">
                          {log.sensor_type} • Action: {log.event_action} • Room: {log.detected_room || 'OPD'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Sensor Simulator & AI Slot Control */}
        <div className="space-y-6">
          


          {/* AI Waitlist & Queue Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> AI Waitlist Queue
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {waitlist.length} Queued
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {waitlist.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No waitlisted patients queued.</p>
              ) : (
                waitlist.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.patient_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          item.urgency_level === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                          item.urgency_level === 'URGENT' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.urgency_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.specialty_required} • {item.symptoms}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 block">Score: {item.priority_score}</span>
                      <span className={`text-[10px] font-semibold ${item.status === 'ALLOCATED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
