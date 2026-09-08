import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Heart,
  Thermometer,
  Wind,
  Activity,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const ElderlyHealthPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePatientId) return;
    setLoading(true);

    api.get(`/vitals/history/${activePatientId}?timeRange=${timeRange}`)
      .then((res) => {
        if (res.data?.data) {
          setHistoryData(res.data.data);
        }
      })
      .catch((err) => console.error('Error fetching vitals history:', err))
      .finally(() => setLoading(false));
  }, [activePatientId, timeRange]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Time Filters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block">Continuous Telemetry</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Health Trends & Vitals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical trends recorded by VIORA Smart Neckband sensors
          </p>
        </div>

        {/* Time Range Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Loading health trends from database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* 1. Heart Rate Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Heart Rate (BPM)</h3>
                  <span className="text-xs text-slate-400">Normal resting target: 60 - 100 BPM</span>
                </div>
              </div>
              <span className="text-2xl font-black text-rose-600">
                {historyData[historyData.length - 1]?.heartRate || 78} BPM
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[50, 130]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                  />
                  <ReferenceLine y={100} stroke="#f87171" strokeDasharray="3 3" label={{ value: 'Elevated (100)', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="heartRate" stroke="#e11d48" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. SpO2 Blood Oxygen Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">SpO2 Blood Oxygen (%)</h3>
                  <span className="text-xs text-slate-400">Normal range: 95% - 100%</span>
                </div>
              </div>
              <span className="text-2xl font-black text-cyan-600">
                {historyData[historyData.length - 1]?.spo2 || 97}%
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[85, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                  />
                  <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning (<95%)', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Skin Temperature (TMP117) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Skin Temperature (°C)</h3>
                  <span className="text-xs text-amber-700 font-bold">Measured using TMP117 sensor</span>
                </div>
              </div>
              <span className="text-2xl font-black text-amber-600">
                {historyData[historyData.length - 1]?.skinTemperature || 36.5}°C
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[34.0, 39.5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                  />
                  <ReferenceLine y={37.8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Fever Line (37.8°C)', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="skinTemperature" stroke="#f59e0b" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Respiratory Rate (ECG-Derived Respiration - EDR) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Respiratory Rate (/min)</h3>
                  <span className="text-xs text-emerald-700 font-bold">ECG-Derived Respiration (EDR) via AD8232</span>
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-600">
                {historyData[historyData.length - 1]?.respiratoryRate || 16} /min
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[8, 30]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                  />
                  <ReferenceLine y={22} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Tachypnea (>22)', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Bradypnea (<10)', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="respiratoryRate" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
