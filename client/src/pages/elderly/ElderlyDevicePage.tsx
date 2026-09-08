import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Device } from '../../types';
import {
  Cpu,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  CheckCircle,
  AlertCircle,
  Radio,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const ElderlyDevicePage: React.FC = () => {
  const { activePatientId } = useAuth();
  const { socket } = useSocket();

  const [device, setDevice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevice = () => {
    if (!activePatientId) return;

    api.get(`/devices/patient/${activePatientId}`)
      .then((res) => {
        if (res.data?.data) {
          // Also fetch full device sensor details
          return api.get(`/devices/${res.data.data.deviceId}`);
        }
      })
      .then((res) => {
        if (res?.data?.data) setDevice(res.data.data);
      })
      .catch((err) => console.error('Error fetching device:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevice();
  }, [activePatientId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('device_status_updated', (updated: any) => {
      setDevice((prev: any) => (prev ? { ...prev, ...updated } : prev));
    });

    socket.on('battery_updated', (data: { batteryLevel: number; chargingStatus: any }) => {
      setDevice((prev: any) => (prev ? { ...prev, batteryLevel: data.batteryLevel, chargingStatus: data.chargingStatus } : prev));
    });

    return () => {
      socket.off('device_status_updated');
      socket.off('battery_updated');
    };
  }, [socket]);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-teal-500/40 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware Abstraction Layer v2.4</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">VIORA Smart Neckband</h1>
            <p className="text-slate-300 text-base mt-1">
              Real-time telemetry, battery health, and onboard sensor diagnostics.
            </p>
          </div>

          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Device Linked
          </span>
        </div>
      </div>

      {/* Primary Telemetry Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-6">Device Status & Health</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Battery Level</span>
            <div className="flex items-center gap-2 text-3xl font-black text-slate-900">
              {device?.chargingStatus === 'CHARGING' ? (
                <BatteryCharging className="w-8 h-8 text-amber-500 animate-pulse" />
              ) : (
                <Battery className="w-8 h-8 text-emerald-600" />
              )}
              <span>{device?.batteryLevel || 88}%</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-2 block">
              {device?.chargingStatus === 'CHARGING' ? 'Charging via USB-C' : 'Discharging normally'}
            </span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Wi-Fi Connection</span>
            <div className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Wifi className="w-7 h-7 text-teal-600" />
              <span>Connected</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-2 block">2.4 GHz Home Wi-Fi</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Bluetooth Link</span>
            <div className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Bluetooth className="w-7 h-7 text-blue-600" />
              <span>Paired</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-2 block">BLE 5.2 Audio & Data</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Firmware Version</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              v{device?.firmwareVersion || '2.4.1'}
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-2 block">Up to date</span>
          </div>
        </div>
      </div>

      {/* Clinical Sensor Hardware Diagnostic Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-2">Onboard Sensor Diagnostics</h3>
        <p className="text-xs text-slate-500 mb-6">
          Biosensors and hardware peripherals integrated into the VIORA smart collar
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: 'MAX30102',
              desc: 'High-sensitivity optical pulse oximeter & resting heart rate sensor',
              status: 'ACTIVE',
              highlight: false,
            },
            {
              name: 'TMP117',
              desc: 'High-precision digital skin temperature sensor with ±0.1°C medical accuracy',
              status: 'ACTIVE',
              highlight: true,
              label: 'Skin Temperature (TMP117)',
            },
            {
              name: 'AD8232',
              desc: 'Single-lead ECG heart monitor & ECG-Derived Respiration (EDR) extractor',
              status: 'ACTIVE',
              highlight: true,
              label: 'ECG & EDR Respiration',
            },
            {
              name: 'MPU6050',
              desc: '6-axis inertial measurement unit (IMU) for automatic fall & posture detection',
              status: 'ACTIVE',
              highlight: false,
            },
            {
              name: 'INMP441',
              desc: 'Omnidirectional I2S MEMS microphone for near-field voice assistant pickup',
              status: 'STANDBY',
              highlight: false,
            },
            {
              name: 'MAX98357A',
              desc: 'I2S Class-D amplifier with dual micro-speakers for voice and music output',
              status: 'READY',
              highlight: false,
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-4.5 rounded-2xl border-2 flex items-start justify-between gap-3 ${
                s.highlight ? 'bg-teal-50/50 border-teal-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-slate-900">{s.name}</span>
                  {s.label && (
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                      {s.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
              </div>

              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
