import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Database,
  Radio,
  Cpu,
  RefreshCw,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Battery,
  Wifi,
  Users,
  Terminal,
  Activity,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAlert } from '../../context/AlertContext';

export const AdminDashboard: React.FC = () => {
  const { isConnected, lastTelemetry } = useSocket();
  const { triggerEmergencyAlert, triggerFallCountdown } = useAlert();

  const [systemHealth, setSystemHealth] = useState<any>({
    database: 'CONNECTED (Neon Serverless PostgreSQL)',
    nodeServer: 'ONLINE (Port 5000)',
    socketServer: 'ACTIVE (Port 5000)',
    aiEngine: 'ONLINE (OpenAI gpt-4o-mini)',
    simulator: 'RUNNING',
    activeConnections: 3,
  });

  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulatingEvent, setSimulatingEvent] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [devRes, logRes] = await Promise.all([
        api.get('/devices').catch(() => ({ data: [] })),
        api.get('/emergency/history').catch(() => ({ data: [] })),
      ]);
      if (Array.isArray(devRes.data)) setDevices(devRes.data);
      if (Array.isArray(logRes.data)) setLogs(logRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const triggerAnomaly = async (type: string, data: any) => {
    try {
      setSimulatingEvent(type);
      await api.post('/devices/simulate-anomaly', { type, data });
      if (type === 'FALL') {
        triggerFallCountdown(15);
      } else if (type === 'SOS') {
        triggerEmergencyAlert({
          id: `sos-${Date.now()}`,
          patientId: 'demo-id',
          patientName: 'Rajesh Kumar',
          type: 'SOS_TRIGGERED',
          severity: 'CRITICAL',
          message: 'Elderly initiated immediate neckband SOS button alert.',
          timestamp: new Date().toISOString()
        });
      }
      setTimeout(() => setSimulatingEvent(null), 1000);
      fetchAdminData();
    } catch (err) {
      console.error('Error triggering anomaly:', err);
      setSimulatingEvent(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">VIORA System Administration & Telemetry</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
              SUPERADMIN CONSOLE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Fleet operations, sensor simulation engine, safety rule triggers, and platform audit trail.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Fleet
        </button>
      </div>

      {/* System Infrastructure Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">PostgreSQL (Neon)</div>
            <div className="text-sm font-bold text-slate-900">Live Pooler</div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected & Synchronized
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Socket.IO Server</div>
            <div className="text-sm font-bold text-slate-900">
              {isConnected ? 'ONLINE (Port 5000)' : 'CONNECTING...'}
            </div>
            <div className="text-[10px] text-teal-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Real-Time Bi-Directional
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">AI Clinical Agent</div>
            <div className="text-sm font-bold text-slate-900">gpt-4o-mini</div>
            <div className="text-[10px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Grounded DB Tools
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Hardware Neckband</div>
            <div className="text-sm font-bold text-slate-900">ESP32-S3 Simulator</div>
            <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Telemetry 2s Heartbeat
            </div>
          </div>
        </div>
      </div>

      {/* Safety Rule Engine & Anomaly Injector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hardware & Vitals Simulation Injector</h2>
              <p className="text-xs text-slate-500">
                Trigger synthetic sensor states to validate real-time safety thresholds and alerts.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            Demo Safety Threshold — Not a Medical Diagnosis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Normal Reset */}
          <button
            onClick={() => triggerAnomaly('NORMAL', { heartRate: 72, spo2: 98, temperature: 34.2, respiratoryRate: 16 })}
            disabled={simulatingEvent !== null}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-all"
          >
            <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
              <span>Normal Resting Vitals</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-emerald-700 mt-2 font-mono">
              HR 72 • SpO₂ 98% • Temp 34.2°C • EDR 16
            </div>
          </button>

          {/* High HR */}
          <button
            onClick={() => triggerAnomaly('HIGH_HR', { heartRate: 128, spo2: 96, temperature: 34.8, respiratoryRate: 22 })}
            disabled={simulatingEvent !== null}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-left transition-all"
          >
            <div className="text-xs font-bold text-rose-800 flex items-center justify-between">
              <span>Tachycardia Anomaly</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xs text-rose-700 mt-2 font-mono">
              HR 128 BPM (Threshold &gt;110)
            </div>
          </button>

          {/* Low SpO2 */}
          <button
            onClick={() => triggerAnomaly('LOW_SPO2', { heartRate: 85, spo2: 89, temperature: 34.0, respiratoryRate: 24 })}
            disabled={simulatingEvent !== null}
            className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 text-left transition-all"
          >
            <div className="text-xs font-bold text-cyan-800 flex items-center justify-between">
              <span>Hypoxia Anomaly</span>
              <AlertTriangle className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xs text-cyan-700 mt-2 font-mono">
              SpO₂ 89% (Threshold &lt;92%)
            </div>
          </button>

          {/* Fall Detection */}
          <button
            onClick={() => triggerAnomaly('FALL', { accelX: 2.8, accelY: 0.1, accelZ: 3.4 })}
            disabled={simulatingEvent !== null}
            className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-left transition-all"
          >
            <div className="text-xs font-bold text-purple-800 flex items-center justify-between">
              <span>Fall Impact Simulation</span>
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs text-purple-700 mt-2 font-mono">
              15s Countdown + Siren Trigger
            </div>
          </button>
        </div>
      </div>

      {/* Hardware Telemetry & Device Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Fleet Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              Connected Smart Neckband Fleet
            </h3>
            <span className="text-xs font-mono text-slate-400">1 Online Device</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">VIORA Neckband Alpha-01</div>
                <div className="text-xs font-mono text-slate-500">ID: VIO-NECK-2026-0042</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ACTIVE STREAMING
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <div className="text-slate-400">Battery</div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  {lastTelemetry?.batteryLevel ?? 88}%
                </div>
              </div>
              <div>
                <div className="text-slate-400">Firmware</div>
                <div className="font-bold text-slate-800 font-mono">v2.4.1-rc3</div>
              </div>
              <div>
                <div className="text-slate-400">Network</div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-teal-600" />
                  Wi-Fi + BLE
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Assigned Patient: <strong>Rajesh Kumar (Age 72)</strong> • Sensor cluster: MAX30102, AD8232, TMP117, MPU6050
            </div>
          </div>
        </div>

        {/* Audit Log / Safety Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-700" />
              Safety Rule Engine Incident Log
            </h3>
            <span className="text-xs font-mono text-slate-400">{logs.length} Total</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No critical safety violations recorded.
              </div>
            ) : (
              logs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      {log.type.replace('_', ' ')}
                    </div>
                    <div className="text-slate-600">{log.message}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
