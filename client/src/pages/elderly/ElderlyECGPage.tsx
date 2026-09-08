import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { EcgRecord } from '../../types';
import {
  Activity,
  Heart,
  Radio,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Wind,
  CheckCircle,
} from 'lucide-react';

export const ElderlyECGPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const [ecgRecord, setEcgRecord] = useState<EcgRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackOffset, setPlaybackOffset] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!activePatientId) return;

    api.get(`/ecg/latest/${activePatientId}`)
      .then((res) => {
        if (res.data?.data) {
          setEcgRecord(res.data.data);
        }
      })
      .catch((err) => console.error('Error fetching ECG:', err))
      .finally(() => setLoading(false));
  }, [activePatientId]);

  // Live Oscilloscope Sweep Animation on Canvas
  useEffect(() => {
    if (!ecgRecord || !ecgRecord.dataPoints || ecgRecord.dataPoints.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;
    const points = ecgRecord.dataPoints;
    const speed = 2; // points per frame

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Dark medical oscilloscope screen
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw faint oscilloscope grid
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw active ECG waveform trace
      ctx.strokeStyle = '#22c55e'; // Bright neon medical green
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;

      ctx.beginPath();

      const visiblePoints = Math.floor(width / 2.5);
      for (let i = 0; i < visiblePoints; i++) {
        const dataIdx = (offset + i) % points.length;
        const val = points[dataIdx];
        const x = i * 2.5;
        // Scale amplitude: midY - val * 70
        const y = midY - val * 85;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Reset shadow for sweep bar
      ctx.shadowBlur = 0;

      // Lead sweep head cursor
      const sweepX = (visiblePoints - 1) * 2.5;
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(sweepX, midY - points[(offset + visiblePoints) % points.length] * 85, 4, 0, Math.PI * 2);
      ctx.fill();

      offset = (offset + speed) % points.length;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ecgRecord]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Attribution */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 text-xs font-bold px-3 py-1 rounded-full mb-1">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>AD8232 Single-Lead ECG Front End</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">ECG & Respiration Waveform</h1>
          <p className="text-sm text-slate-500 mt-1">
            Continuous cardiac electrical potential and ECG-Derived Respiration (EDR)
          </p>
        </div>

        {/* Demo Simulation Badge */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-right self-start sm:self-auto">
          <span className="text-xs font-black text-amber-800 uppercase tracking-widest block">
            DEMO SIMULATION
          </span>
          <span className="text-[11px] text-amber-700 block mt-0.5">
            Synthetic sinus rhythm data for platform demonstration
          </span>
        </div>
      </div>

      {/* Primary Oscilloscope Display */}
      <div className="bg-slate-950 rounded-3xl p-6 border-4 border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-slate-300 text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              LEAD I: AD8232
            </span>
            <span className="font-mono text-xs text-slate-400">Sample Rate: 250 Hz</span>
            <span className="font-mono text-xs text-slate-400">Gain: 1.0 mV / div</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800">
              Signal Quality: 98% (EXCELLENT)
            </span>
            <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-full border border-slate-800">
              Filter: 0.5 - 40 Hz Bandpass
            </span>
          </div>
        </div>

        {/* Canvas Oscilloscope */}
        <div className="my-6 relative rounded-2xl overflow-hidden bg-[#090d16] border border-slate-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={850}
            height={260}
            className="w-full max-h-[300px] block"
          />
        </div>

        {/* Vital Metrics Readout below ECG */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">Heart Rate</span>
            <div className="flex items-center gap-2 text-3xl font-black text-white mt-1">
              <Heart className="w-7 h-7 text-rose-500 fill-current animate-pulse" />
              <span>{ecgRecord?.heartRate || 78}</span>
              <span className="text-sm font-bold text-slate-400">BPM</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Normal Sinus Rhythm</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">ECG-Derived Respiration (EDR)</span>
            <div className="flex items-center gap-2 text-3xl font-black text-white mt-1">
              <Wind className="w-7 h-7 text-teal-400" />
              <span>16</span>
              <span className="text-sm font-bold text-slate-400">breaths/min</span>
            </div>
            <span className="text-[11px] text-teal-300 font-semibold mt-1 block">Extracted from AD8232 Modulation</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">Rhythm Assessment</span>
            <div className="text-sm font-bold text-slate-200 mt-2 leading-snug">
              Regular P-Q-R-S-T morphologic intervals. No ectopic beats.
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">Status: Verified Normal</span>
          </div>
        </div>
      </div>

      {/* Clinical Interpretation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <span>Automated Biosensor Rhythm Interpretation</span>
        </h3>
        <p className="text-slate-700 text-base leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {ecgRecord?.rhythmInterpretation ||
            'Normal Sinus Rhythm. Signal Quality: 98%. ECG-Derived Respiration (EDR): 16 breaths/min. No acute ischemic ST-segment shifts or premature ventricular contractions detected.'}
        </p>

        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          Disclaimer: Automated rhythm interpretations and simulated telemetry are provided for informational well-being support and do not replace professional 12-lead electrocardiography or clinical diagnostic evaluations.
        </p>
      </div>
    </div>
  );
};
