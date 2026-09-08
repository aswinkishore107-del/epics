import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../api/client';
import { HealthReading, Device, Medication, Alert } from '../../types';
import {
  Users,
  Heart,
  Thermometer,
  Wind,
  Activity,
  Battery,
  BatteryCharging,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Pill,
  MessageSquare,
  Bell,
  CalendarCheck,
  PhoneCall,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const CaregiverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, activePatientId } = useAuth();
  const { socket } = useSocket();
  const { activeEmergency, acknowledgeEmergency, resolveEmergency } = useAlert();

  const [patient, setPatient] = useState<any | null>(null);
  const [vitals, setVitals] = useState<HealthReading | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<any | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    if (!activePatientId) return;

    Promise.all([
      api.get(`/patients/${activePatientId}`),
      api.get(`/vitals/current/${activePatientId}`),
      api.get(`/devices/patient/${activePatientId}`),
      api.get(`/medications/patient/${activePatientId}`),
      api.get(`/medications/adherence/${activePatientId}`),
    ])
      .then(([patRes, vitRes, devRes, medRes, adhRes]) => {
        if (patRes.data?.data) setPatient(patRes.data.data);
        if (vitRes.data?.data) setVitals(vitRes.data.data);
        if (devRes.data?.data) setDevice(devRes.data.data);
        if (medRes.data?.data) setMedications(medRes.data.data);
        if (adhRes.data?.data) setAdherence(adhRes.data.data);
      })
      .catch((err) => console.error('Error fetching caregiver data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activePatientId]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('vital_updated', (data: { reading: HealthReading }) => {
      setVitals(data.reading);
    });

    socket.on('device_status_updated', (updated: Device) => {
      setDevice(updated);
    });

    socket.on('medication_taken', () => {
      fetchDashboardData();
    });

    socket.on('new_alert', (data: { alert: Alert }) => {
      setRecentAlerts((prev) => [data.alert, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('vital_updated');
      socket.off('device_status_updated');
      socket.off('medication_taken');
      socket.off('new_alert');
    };
  }, [socket]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-teal-400 font-bold text-xs uppercase tracking-widest block">
            Caregiver Hub • Family Monitoring
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">
            Monitoring: {patient?.user?.firstName || 'Rajesh'} {patient?.user?.lastName || 'Kumar'}
          </h1>
          <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
            <span>Age: 72 • Blood Group: B+ • Condition: Controlled Hypertension</span>
          </p>
        </div>

        {/* Neckband Device Status Quick Card */}
        {device && (
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              {device.chargingStatus === 'CHARGING' ? (
                <BatteryCharging className="w-7 h-7 text-amber-400 animate-pulse" />
              ) : (
                <Battery className="w-7 h-7 text-emerald-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Neckband Battery</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">{device.batteryLevel}%</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  {device.connectionStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Active Emergency Event Notification Bar */}
      {activeEmergency && (
        <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-red-700 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="bg-white text-red-700 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                {activeEmergency.type} ALERT ACTIVE
              </span>
              <h3 className="text-2xl font-black mt-1">Emergency Event in Progress</h3>
              <p className="text-xs text-red-100">Location: {activeEmergency.location || 'Home'} • Source: {activeEmergency.source}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeEmergency.status === 'ACTIVE' && (
              <button
                onClick={() => acknowledgeEmergency(activeEmergency.id)}
                className="bg-white text-red-700 hover:bg-red-50 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer text-sm"
              >
                Acknowledge
              </button>
            )}
            <button
              onClick={() => resolveEmergency(activeEmergency.id, 'Resolved by Caregiver')}
              className="bg-red-950 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl border border-red-800 cursor-pointer text-sm"
            >
              Resolve & Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Real-Time Vitals Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>Live Health Telemetry</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">Auto-refreshed via Socket.IO</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heart Rate */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-rose-500">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Heart Rate</span>
              <Heart className="w-6 h-6 fill-current animate-pulse-slow" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {vitals?.heartRate || 78} <span className="text-base font-bold text-slate-400">BPM</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Resting baseline: 74-82 BPM</span>
          </div>

          {/* SpO2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-cyan-500">
            <div className="flex items-center justify-between text-cyan-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Blood Oxygen (SpO2)</span>
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {vitals?.spo2 || 97}<span className="text-base font-bold text-slate-400">%</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Optimal oxygenation</span>
          </div>

          {/* Skin Temperature (TMP117) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-amber-500">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Skin Temperature</span>
              <Thermometer className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {vitals?.skinTemperature || 36.5}<span className="text-base font-bold text-slate-400">°C</span>
            </div>
            <span className="text-xs text-amber-700 font-semibold mt-1 block">Measured using TMP117</span>
          </div>

          {/* Respiratory Rate (ECG-Derived Respiration) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-emerald-500">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Respiratory Rate</span>
              <Wind className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {vitals?.respiratoryRate || 16} <span className="text-base font-bold text-slate-400">/min</span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold mt-1 block">ECG-Derived Respiration (EDR)</span>
          </div>
        </div>
      </div>

      {/* 4. Medication Adherence & Prescription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adherence Gauge */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              <span>Medication Adherence</span>
            </h4>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Past 30 Days</span>
          </div>

          <div className="my-6 text-center">
            <div className="w-28 h-28 rounded-full border-8 border-indigo-600 border-t-emerald-500 flex items-center justify-center font-black text-3xl text-slate-900 mx-auto shadow-inner">
              {adherence?.adherenceRate || 96}%
            </div>
            <h5 className="font-bold text-slate-800 text-base mt-3">High Compliance</h5>
            <p className="text-xs text-slate-500">
              {adherence?.takenCount || 28} of {adherence?.totalLogged || 30} doses taken on schedule
            </p>
          </div>

          <button
            onClick={() => navigate('/caregiver/medications')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
          >
            View Full Prescription Log
          </button>
        </div>

        {/* Today's Medication Checklist */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-slate-900">Today&apos;s Medication Doses</h4>
            <span className="text-xs text-slate-400">Synchronized via Socket.IO</span>
          </div>

          <div className="space-y-3">
            {medications.map((med) => (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-base text-slate-900">{med.name} ({med.dosage})</h5>
                    <span className="text-xs text-slate-500">{med.instructions}</span>
                  </div>
                </div>

                <div className="text-right">
                  {med.todayStatus === 'TAKEN' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Taken Today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Upcoming Dose
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Quick Actions for Caregiver */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-4">Care Coordination Quick Actions</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/caregiver/messages')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 flex items-center gap-3 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">Message Patient or Doctor</span>
              <span className="text-xs text-slate-500">Three-way real-time chat</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/caregiver/patients')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 flex items-center gap-3 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">Emergency Contacts Chain</span>
              <span className="text-xs text-slate-500">Manage priority escalation</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/caregiver/health')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-500 flex items-center gap-3 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">View 30-Day Recharts</span>
              <span className="text-xs text-slate-500">Historical trend analytics</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
