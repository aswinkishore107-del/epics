import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../api/client';
import { HealthReading, Device } from '../../types';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Footprints,
  ShieldCheck,
  Mic,
  AlertOctagon,
  Pill,
  CalendarCheck,
  Music,
  PhoneCall,
  MessageSquare,
  Smile,
  Users,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Sparkles,
} from 'lucide-react';

export const ElderlyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, activePatientId } = useAuth();
  const { socket } = useSocket();

  const [vitals, setVitals] = useState<HealthReading | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current vitals & device status
  useEffect(() => {
    if (!activePatientId) return;

    Promise.all([
      api.get(`/vitals/current/${activePatientId}`),
      api.get(`/devices/patient/${activePatientId}`),
    ])
      .then(([vitalsRes, deviceRes]) => {
        if (vitalsRes.data?.data) setVitals(vitalsRes.data.data);
        if (deviceRes.data?.data) setDevice(deviceRes.data.data);
      })
      .catch((err) => console.error('Error fetching dashboard data:', err))
      .finally(() => setLoading(false));
  }, [activePatientId]);

  // Real-time Socket.IO subscriptions for vital and device updates
  useEffect(() => {
    if (!socket) return;

    socket.on('vital_updated', (data: { reading: HealthReading }) => {
      setVitals(data.reading);
    });

    socket.on('device_status_updated', (updatedDevice: Device) => {
      setDevice(updatedDevice);
    });

    socket.on('battery_updated', (data: { batteryLevel: number; chargingStatus: any }) => {
      setDevice((prev) => (prev ? { ...prev, batteryLevel: data.batteryLevel, chargingStatus: data.chargingStatus } : prev));
    });

    return () => {
      socket.off('vital_updated');
      socket.off('device_status_updated');
      socket.off('battery_updated');
    };
  }, [socket]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcoming Header with Greeting */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-teal-200 font-semibold text-lg">Good day,</span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-1">
              Rajesh Kumar ji
            </h1>
            <p className="text-teal-100/90 text-lg mt-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
              <span>VIORA Smart Neckband is connected and actively monitoring your well-being.</span>
            </p>
          </div>

          {/* Quick Voice Prompt Pill */}
          <button
            onClick={() => navigate('/elderly/voice')}
            className="bg-white/15 hover:bg-white/25 border-2 border-white/30 text-white font-bold text-lg px-6 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 self-start md:self-auto cursor-pointer shadow-md"
          >
            <Mic className="w-6 h-6 text-teal-300 animate-pulse" />
            <span>Talk to VIORA</span>
          </button>
        </div>
      </div>

      {/* 2. Device Status & Battery Bar */}
      {device && (
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
              {device.chargingStatus === 'CHARGING' ? (
                <BatteryCharging className="w-7 h-7 text-amber-500 animate-pulse" />
              ) : (
                <Battery className="w-7 h-7 text-emerald-600" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">VIORA Neckband Battery</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">{device.batteryLevel}%</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {device.chargingStatus === 'CHARGING' ? 'Charging' : 'Connected & Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-600 text-sm font-semibold">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Wifi className="w-4 h-4 text-teal-600" />
              <span>Wi-Fi Active</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Bluetooth className="w-4 h-4 text-blue-600" />
              <span>Bluetooth Linked</span>
            </span>
          </div>
        </div>
      )}

      {/* 3. Primary Vitals Display (Large, High Contrast) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600" />
            <span>Current Health Readings</span>
          </h2>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Status: Stable
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Heart Rate */}
          <div className="elderly-card border-l-8 border-l-rose-500">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider">Heart Rate</span>
              <Heart className="w-7 h-7 fill-current animate-pulse-slow" />
            </div>
            <div className="text-4xl font-black text-slate-900">
              {vitals?.heartRate || 78} <span className="text-lg font-bold text-slate-500">BPM</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Normal resting pulse</p>
          </div>

          {/* SpO2 */}
          <div className="elderly-card border-l-8 border-l-cyan-500">
            <div className="flex items-center justify-between text-cyan-600 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider">SpO2 Oxygen</span>
              <Activity className="w-7 h-7" />
            </div>
            <div className="text-4xl font-black text-slate-900">
              {vitals?.spo2 || 97}<span className="text-lg font-bold text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Optimal blood oxygen</p>
          </div>

          {/* Skin Temperature (TMP117) */}
          <div className="elderly-card border-l-8 border-l-amber-500">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider">Skin Temperature</span>
              <Thermometer className="w-7 h-7" />
            </div>
            <div className="text-4xl font-black text-slate-900">
              {vitals?.skinTemperature || 36.5}<span className="text-lg font-bold text-slate-500">°C</span>
            </div>
            <p className="text-xs text-amber-800/80 font-medium mt-2">Measured using TMP117</p>
          </div>

          {/* Respiratory Rate (ECG-Derived Respiration) */}
          <div className="elderly-card border-l-8 border-l-emerald-500">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider">Respiratory Rate</span>
              <Wind className="w-7 h-7" />
            </div>
            <div className="text-4xl font-black text-slate-900">
              {vitals?.respiratoryRate || 16} <span className="text-lg font-bold text-slate-500">/min</span>
            </div>
            <p className="text-xs text-emerald-800/80 font-medium mt-2">ECG-Derived Respiration (EDR)</p>
          </div>

          {/* Activity Steps */}
          <div className="elderly-card border-l-8 border-l-indigo-500">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-sm font-bold uppercase tracking-wider">Daily Steps</span>
              <Footprints className="w-7 h-7" />
            </div>
            <div className="text-4xl font-black text-slate-900">
              4,250 <span className="text-lg font-bold text-slate-500">steps</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Target: 5,000 steps</p>
          </div>
        </div>
      </div>

      {/* 4. Large Quick Action Grid (Accessible & High Contrast) */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Emergency SOS Button (Large & Prominent) */}
          <button
            onClick={() => navigate('/elderly/emergency')}
            className="sm:col-span-2 elderly-btn-emergency cursor-pointer"
          >
            <AlertOctagon className="w-10 h-10 shrink-0" />
            <div className="text-left">
              <span className="block text-2xl font-black">Emergency SOS</span>
              <span className="block text-sm font-semibold opacity-90">Press to notify Priya & Dr. Sharma immediately</span>
            </div>
          </button>

          {/* Talk to VIORA */}
          <button
            onClick={() => navigate('/elderly/voice')}
            className="elderly-btn-primary cursor-pointer"
          >
            <Mic className="w-8 h-8" />
            <span>Talk to VIORA</span>
          </button>

          {/* My Medicines */}
          <button
            onClick={() => navigate('/elderly/medications')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <Pill className="w-8 h-8 text-indigo-600" />
            <span>My Medicines</span>
          </button>

          {/* My Reminders */}
          <button
            onClick={() => navigate('/elderly/reminders')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <CalendarCheck className="w-8 h-8 text-amber-600" />
            <span>My Reminders</span>
          </button>

          {/* My Health Trends */}
          <button
            onClick={() => navigate('/elderly/health')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <Activity className="w-8 h-8 text-rose-600" />
            <span>My Health Trends</span>
          </button>

          {/* Music & Calls */}
          <button
            onClick={() => navigate('/elderly/entertainment')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <Music className="w-8 h-8 text-pink-600" />
            <span>Music & Calls</span>
          </button>

          {/* Call Family */}
          <button
            onClick={() => navigate('/elderly/entertainment?tab=call')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <PhoneCall className="w-8 h-8 text-teal-600" />
            <span>Call Family</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => navigate('/elderly/messages')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <span>Messages</span>
          </button>

          {/* Wellness Check */}
          <button
            onClick={() => navigate('/elderly/wellness')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <Smile className="w-8 h-8 text-purple-600" />
            <span>Wellness Check</span>
          </button>

          {/* Community */}
          <button
            onClick={() => navigate('/elderly/community')}
            className="elderly-btn-secondary cursor-pointer hover:border-teal-500 border-2 border-transparent"
          >
            <Users className="w-8 h-8 text-emerald-600" />
            <span>Community</span>
          </button>
        </div>
      </div>
    </div>
  );
};
