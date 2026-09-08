import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Play,
  Square,
  AlertTriangle,
  Activity,
  Heart,
  Pill,
  PhoneCall,
  Bell,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';

export const SimulatorDrawer: React.FC = () => {
  const { activePatientId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!activePatientId) return null;

  const showFeedback = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleSimulation = async () => {
    try {
      setLoadingAction('toggle');
      const nextState = !isSimulating;
      await api.post('/devices/simulator/toggle', {
        patientId: activePatientId,
        enable: nextState,
      });
      setIsSimulating(nextState);
      showFeedback(nextState ? '▶ Continuous sensor telemetry active' : '⏹ Sensor simulator paused');
    } catch {
      showFeedback('Error toggling simulator');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTrigger = async (action: string, condition?: string) => {
    try {
      setLoadingAction(action);
      await api.post('/devices/simulator/trigger', {
        patientId: activePatientId,
        action,
        condition,
      });
      showFeedback(`Triggered simulated event: ${action} ${condition ? `(${condition})` : ''}`);
    } catch {
      showFeedback('Error triggering event');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-teal-400 hover:text-white px-4 py-3 rounded-full shadow-2xl border-2 border-teal-500/40 hover:border-teal-400 transition-all font-semibold text-sm backdrop-blur-md"
      >
        <Sliders className="w-5 h-5 text-teal-400 animate-spin-slow" />
        <span>VIORA Simulator</span>
        <span className="bg-teal-500/20 text-teal-300 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
          Demo
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Expanded Control Box */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-84 sm:w-96 bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                Hardware & Telemetry Simulator
              </h4>
              <p className="text-xs text-slate-400">ESP32 + MAX30102 + TMP117 + MPU6050</p>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">
              Demo Mode
            </span>
          </div>

          {message && (
            <div className="my-3 text-xs bg-teal-950/80 text-teal-200 p-2.5 rounded-xl border border-teal-800">
              {message}
            </div>
          )}

          {/* Continuous Loop Control */}
          <div className="mt-4 flex items-center justify-between bg-slate-800/80 p-3 rounded-2xl">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Continuous Sensor Stream</span>
              <span className="text-[11px] text-slate-400">Generates vitals every 8-12 seconds</span>
            </div>
            <button
              onClick={handleToggleSimulation}
              disabled={loadingAction === 'toggle'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isSimulating
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isSimulating ? 'Active' : 'Paused'}
            </button>
          </div>

          {/* Simulation Event Triggers */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Emergency & Vitals Triggers
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTrigger('SOS')}
                disabled={loadingAction === 'SOS'}
                className="bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <AlertTriangle className="w-4 h-4 text-white" />
                Trigger SOS
              </button>

              <button
                onClick={() => handleTrigger('FALL')}
                disabled={loadingAction === 'FALL'}
                className="bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Activity className="w-4 h-4 text-white" />
                Trigger Fall (15s)
              </button>

              <button
                onClick={() => handleTrigger('ABNORMAL_VITALS', 'TACHYCARDIA')}
                disabled={loadingAction === 'ABNORMAL_VITALS'}
                className="bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Heart className="w-4 h-4 text-white" />
                Tachycardia (HR 135)
              </button>

              <button
                onClick={() => handleTrigger('ABNORMAL_VITALS', 'HYPOXIA')}
                disabled={loadingAction === 'ABNORMAL_VITALS'}
                className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Activity className="w-4 h-4 text-white" />
                Hypoxia (SpO2 88%)
              </button>

              <button
                onClick={() => handleTrigger('ABNORMAL_VITALS', 'FEVER')}
                disabled={loadingAction === 'ABNORMAL_VITALS'}
                className="bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Activity className="w-4 h-4 text-white" />
                Elevated Skin Temp
              </button>

              <button
                onClick={() => handleTrigger('MISSED_MEDICATION')}
                disabled={loadingAction === 'MISSED_MEDICATION'}
                className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Pill className="w-4 h-4 text-white" />
                Missed Med Dose
              </button>
            </div>
          </div>

          {/* Connected Device & Entertainment Triggers */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Connected Phone & Audio Triggers
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTrigger('INCOMING_CALL')}
                className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 border border-slate-700"
              >
                <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                Simulate Call
              </button>

              <button
                onClick={() => handleTrigger('PHONE_NOTIFICATION')}
                className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 border border-slate-700"
              >
                <Bell className="w-3.5 h-3.5 text-teal-400" />
                Simulate Notification
              </button>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
            SafetyRuleEngine evaluates triggers deterministically. Thresholds are labeled as demo non-diagnostic standards.
          </p>
        </div>
      )}
    </div>
  );
};
