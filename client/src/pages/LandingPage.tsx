import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Shield,
  Activity,
  Users,
  Stethoscope,
  Radio,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Pill,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePortalClick = (role: string) => {
    if (user) {
      if (user.role === 'ELDERLY') navigate('/elderly');
      else if (user.role === 'CAREGIVER') navigate('/caregiver');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else navigate('/admin');
    } else {
      navigate(`/login?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-teal-500 selection:text-white">
      {/* Top Hero Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <Heart className="w-6 h-6 fill-current animate-pulse-slow" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight font-sans">VIORA</span>
              <span className="text-[10px] ml-2 text-teal-400 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                v2.4 Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-md transition-all active:scale-95"
            >
              Sign In / Demo Access
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-950/80 border border-teal-800/80 text-teal-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-inner">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>AI-Powered Connected Healthcare for Senior Well-being</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Empowering Seniors. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
              Reassuring Families.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A unified smart health ecosystem powered by the VIORA Smart Neckband, Neon PostgreSQL, Socket.IO, and Grounded AI health intelligence.
          </p>

          {/* Quick Role Selection Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {/* Elderly Card */}
            <div
              onClick={() => handlePortalClick('ELDERLY')}
              className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-teal-500/80 rounded-3xl p-6 transition-all duration-300 cursor-pointer group shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Dashboard 1</span>
              <h3 className="text-2xl font-black text-white mt-1">Elderly Patient</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Large high-contrast text, voice assistant, one-tap Emergency SOS, medicines checklist, music, and simple vitals.
              </p>
              <div className="mt-6 flex items-center gap-2 text-teal-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter Elderly Experience</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Caregiver Card */}
            <div
              onClick={() => handlePortalClick('CAREGIVER')}
              className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-blue-500/80 rounded-3xl p-6 transition-all duration-300 cursor-pointer group shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Dashboard 2</span>
              <h3 className="text-2xl font-black text-white mt-1">Caregiver Family</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Instant emergency alerts, neckband battery status, medication adherence tracking, reminders, and direct messaging.
              </p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter Caregiver Experience</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Doctor Card */}
            <div
              onClick={() => handlePortalClick('DOCTOR')}
              className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500/80 rounded-3xl p-6 transition-all duration-300 cursor-pointer group shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Dashboard 3</span>
              <h3 className="text-2xl font-black text-white mt-1">Doctor Clinical</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Clinical triage, high-resolution ECG waveforms, ECG-Derived Respiration (EDR), notes editor, and summary reports.
              </p>
              <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter Doctor Experience</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware & Sensor Abstraction Banner */}
      <section className="border-t border-slate-800 bg-slate-950/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
              <Cpu className="w-4 h-4" />
              <span>VIORA Smart Neckband Integration</span>
            </div>
            <h2 className="text-3xl font-black">Clinical Biosensor Hardware Architecture</h2>
            <p className="text-sm text-slate-400 mt-2">
              Engineered with lightweight ergonomic neckband telemetry, hardware emergency interrupt, and local real-time audio.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <SensorBadge title="MAX30102" desc="Pulse Oximeter & HR" />
            <SensorBadge title="TMP117" desc="Skin Temperature" highlight />
            <SensorBadge title="AD8232" desc="ECG & EDR Respiration" highlight />
            <SensorBadge title="MPU6050" desc="Fall & Posture IMU" />
            <SensorBadge title="INMP441" desc="I2S Voice Mic" />
            <SensorBadge title="ESP32" desc="Wi-Fi / MQTT Controller" />
          </div>
        </div>
      </section>
    </div>
  );
};

const SensorBadge: React.FC<{ title: string; desc: string; highlight?: boolean }> = ({ title, desc, highlight }) => {
  return (
    <div className={`p-4 rounded-2xl border text-center transition-all ${
      highlight ? 'bg-teal-950/40 border-teal-500/50' : 'bg-slate-900 border-slate-800'
    }`}>
      <span className="text-sm font-black text-white block">{title}</span>
      <span className="text-xs text-slate-400 mt-1 block">{desc}</span>
    </div>
  );
};
