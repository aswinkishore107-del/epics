import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Pill,
  FileText,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  RefreshCw,
  Battery,
  Wifi,
  Shield,
  User,
  Phone
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const DoctorPatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lastTelemetry } = useSocket();

  const [patient, setPatient] = useState<any>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'vitals' | 'ecg' | 'medications' | 'notes' | 'reports'>('vitals');
  const [loading, setLoading] = useState(true);

  // New Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('SOAP');
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Prescription State
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('Once daily');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);

  // Generate Report State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const patientId = id || 'default';
      const [pRes, vRes, nRes, mRes, rRes] = await Promise.all([
        api.get(`/patients/${patientId}`).catch(() => ({ data: null })),
        api.get(`/vitals/history?patientId=${patientId}&range=24h`).catch(() => ({ data: [] })),
        api.get(`/notes?patientId=${patientId}`).catch(() => ({ data: [] })),
        api.get(`/medications/patient/${patientId}`).catch(() => ({ data: [] })),
        api.get(`/reports?patientId=${patientId}`).catch(() => ({ data: [] })),
      ]);

      if (pRes.data?.data || pRes.data) setPatient(pRes.data?.data || pRes.data);
      const vList = vRes.data?.data || vRes.data;
      if (Array.isArray(vList)) setVitalsHistory(vList);
      const nList = nRes.data?.data || nRes.data;
      if (Array.isArray(nList)) setNotes(nList);
      const mList = mRes.data?.data || mRes.data;
      if (Array.isArray(mList)) setMedications(mList);
      const rList = rRes.data?.data || rRes.data;
      if (Array.isArray(rList)) setReports(rList);
    } catch (err) {
      console.error('Error fetching patient clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !patient) return;
    try {
      setSubmittingNote(true);
      const res = await api.post('/notes', {
        patientId: patient.id,
        category: noteCategory,
        content: noteContent.trim(),
      });
      const newNote = res.data?.data || res.data;
      setNotes((prev) => [newNote, ...prev]);
      setNoteContent('');
    } catch (err) {
      console.error('Error adding clinical note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !patient) return;

    let freq = 'ONCE_DAILY';
    if (newMedFreq.toLowerCase().includes('twice')) freq = 'TWICE_DAILY';
    else if (newMedFreq.toLowerCase().includes('three')) freq = 'THREE_TIMES_DAILY';
    else if (newMedFreq.toLowerCase().includes('needed') || newMedFreq.toLowerCase().includes('prn')) freq = 'AS_NEEDED';

    try {
      const res = await api.post('/medications', {
        patientId: patient.id,
        name: newMedName.trim(),
        dosage: newMedDosage.trim() || '1 dose',
        frequency: freq,
        instructions: newMedInstructions.trim(),
        scheduledTimes: ['08:00'],
      });
      const newMed = res.data?.data || res.data;
      setMedications((prev) => [newMed, ...prev]);
      setShowPrescribeModal(false);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedInstructions('');
    } catch (err) {
      console.error('Error prescribing medication:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!patient) return;
    try {
      setGeneratingReport(true);
      const res = await api.post('/reports/generate', {
        patientId: patient.id,
        range: '7d',
        title: `Comprehensive Weekly Clinical Review - ${patient.user?.firstName || patient.name || 'Rajesh'}`
      });
      const newReport = res.data?.data || res.data;
      setReports((prev) => [newReport, ...prev]);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating clinical report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const activePatient = patient || {
    id: id || 'demo-id',
    name: 'Rajesh Kumar',
    age: 72,
    gender: 'Male',
    bloodType: 'B+',
    status: 'NORMAL',
    room: 'Room 304 - North Wing',
    device: {
      serialNumber: 'VIO-NECK-2026-0042',
      firmwareVersion: 'v2.4.1-rc3',
      batteryLevel: lastTelemetry?.batteryLevel ?? 88,
      batteryState: 'GOOD',
      isCharging: false,
      wifiStatus: 'CONNECTED',
      bluetoothStatus: 'PAIRED'
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          to="/doctor"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctor Clinical Triage
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:from-teal-700 hover:to-cyan-800 transition-all disabled:opacity-50"
          >
            {generatingReport ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate AI Clinical Report
          </button>
        </div>
      </div>

      {reportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          Clinical evaluation report generated and archived to patient health records.
        </div>
      )}

      {/* Patient Clinical Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-teal-50 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-teal-500/20">
              {activePatient.name?.split(' ').map((n: string) => n[0]).join('') || 'RK'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">{activePatient.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activePatient.status || 'NORMAL'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {activePatient.id}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
                <span><strong>Age:</strong> {activePatient.age || 72} yrs</span>
                <span>•</span>
                <span><strong>Sex:</strong> {activePatient.gender || 'Male'}</span>
                <span>•</span>
                <span><strong>Blood:</strong> {activePatient.bloodType || 'B+'}</span>
                <span>•</span>
                <span><strong>Ward/Room:</strong> {activePatient.room || 'Room 304 - North Wing'}</span>
              </p>
            </div>
          </div>

          {/* Neckband Hardware Status Badge */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <div className="text-slate-400 font-medium">Neckband Battery</div>
                <div className="font-bold text-slate-800">{lastTelemetry?.batteryLevel ?? 88}%</div>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-teal-600" />
              <div className="text-xs">
                <div className="text-slate-400 font-medium">Link</div>
                <div className="font-bold text-slate-800">Wi-Fi Active</div>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-xs">
              <div className="text-slate-400 font-medium">Firmware</div>
              <div className="font-mono text-slate-700">v2.4.1</div>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>
              <strong>Clinical Guardrail:</strong> TMP117 measures <strong>Skin Temperature</strong>.
              Respiratory Rate is computed via <strong>ECG-Derived Respiration (EDR)</strong>.
              Automated triggers are demo safety thresholds — not a definitive medical diagnosis.
            </span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">VIORA Clinical Workstation</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vitals'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Vitals Trend (24h)
        </button>
        <button
          onClick={() => setActiveTab('ecg')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ecg'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          ECG / EDR Respiration
        </button>
        <button
          onClick={() => setActiveTab('medications')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'medications'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescriptions & Adherence
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Clinical Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Clinical Reports ({reports.length})
        </button>
      </div>

      {/* Tab 1: Vitals Trend Charts */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heart Rate Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">Heart Rate (BPM)</h3>
                </div>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  Target: 60-100 BPM
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory}>
                    <defs>
                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[50, 120]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SpO2 Oxygen Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-bold text-slate-800">Oxygen Saturation (SpO₂)</h3>
                </div>
                <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                  Target: ≥ 95%
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory}>
                    <defs>
                      <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[90, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="spo2" stroke="#0891b2" strokeWidth={2} fillOpacity={1} fill="url(#colorSpo2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skin Temperature (TMP117) Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-slate-800">Skin Temperature (°C)</h3>
                    <div className="text-[10px] text-slate-400 font-semibold">Measured using TMP117 Precision Sensor</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Target: 33.5 - 37.0°C
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[33, 39]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Respiratory Rate (EDR) Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-slate-800">Respiratory Rate (BrPM)</h3>
                    <div className="text-[10px] text-slate-400 font-semibold">ECG-Derived Respiration (EDR) via AD8232</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  Target: 12 - 20 BrPM
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory}>
                    <defs>
                      <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[10, 26]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="respiratoryRate" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorResp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ECG & EDR Analysis */}
      {activeTab === 'ecg' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
                  Live Lead-I ECG Strip Simulation
                </h3>
                <p className="text-xs text-slate-400">
                  AD8232 Single-Lead Front-End • 250 Hz Sampling Rate • EDR Extraction Enabled
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LEADS ATTACHED
                </span>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-mono">
                  HR: {lastTelemetry?.heartRate ?? 72} BPM
                </span>
              </div>
            </div>

            {/* Oscilloscope Grid Canvas */}
            <div className="relative h-64 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 ecg-grid">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <path
                  d="M 0 100 Q 50 95 100 100 T 200 100 L 220 90 L 230 140 L 245 20 L 260 115 L 270 100 Q 310 80 340 100 L 420 100 L 440 90 L 450 140 L 465 20 L 480 115 L 490 100 Q 530 80 560 100 L 640 100 L 660 90 L 670 140 L 685 20 L 700 115 L 710 100 Q 750 80 800 100"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ecg-line"
                />
              </svg>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800 text-center">
              <div>
                <div className="text-xs text-slate-400">PR Interval</div>
                <div className="text-base font-bold font-mono text-emerald-400">156 ms</div>
                <div className="text-[10px] text-slate-500">Normal (120-200ms)</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">QRS Duration</div>
                <div className="text-base font-bold font-mono text-emerald-400">88 ms</div>
                <div className="text-[10px] text-slate-500">Normal (&lt;120ms)</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">QTc Interval</div>
                <div className="text-base font-bold font-mono text-emerald-400">412 ms</div>
                <div className="text-[10px] text-slate-500">Bazett Formula</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">EDR Respiration</div>
                <div className="text-base font-bold font-mono text-teal-400">
                  {lastTelemetry?.respiratoryRate ?? 16} BrPM
                </div>
                <div className="text-[10px] text-slate-500">ECG-Derived</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Prescriptions & Adherence */}
      {activeTab === 'medications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Active Prescriptions & Regimen</h3>
            <button
              onClick={() => setShowPrescribeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Prescribe New Medication
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">
                No active medications recorded for this patient.
              </div>
            ) : (
              medications.map((med) => (
                <div key={med.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-base">{med.name}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {med.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      <strong>Frequency:</strong> {med.frequency}
                    </p>
                    {med.instructions && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Prescribed by: Dr. Arvind Sharma</span>
                    <span className="font-mono">{new Date(med.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Clinical Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Note Input Box */}
          <form onSubmit={handleAddNote} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Add Clinical Note (SOAP / Observations)</h3>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-slate-50"
              >
                <option value="SOAP">SOAP Note</option>
                <option value="ROUTINE">Routine Follow-up</option>
                <option value="ALERT_REVIEW">Alert Review</option>
                <option value="MEDICATION_REVIEW">Medication Review</option>
              </select>
            </div>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Record clinical assessment, medication response, subjective observations, plan..."
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Logged with Dr. Arvind Sharma's clinical digital signature
              </span>
              <button
                type="submit"
                disabled={submittingNote || !noteContent.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submittingNote ? 'Saving Note...' : 'Save Clinical Note'}
              </button>
            </div>
          </form>

          {/* Notes History */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">
                No clinical notes recorded yet.
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {note.category || 'CLINICAL NOTE'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <div className="pt-2 text-xs font-semibold text-teal-700">
                    Signed: {note.doctorName || 'Dr. Arvind Sharma, Cardiologist'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: AI & Clinical Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Clinical Evaluation & Summary Reports</h3>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generatingReport ? 'Analyzing Trends...' : 'Generate New 7-Day Assessment'}
            </button>
          </div>

          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                No health reports archived. Click "Generate New 7-Day Assessment" to create one.
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      {report.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Coverage: <strong>{report.range || '7-Day Rolling Summary'}</strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {report.summary || report.content}
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Generated by VIORA Clinical Intelligence Core</span>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Summary
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Prescribe Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Prescribe New Medication</h3>
            <form onSubmit={handlePrescribe} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Metoprolol Tartrate"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="e.g. 25 mg"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed">As needed (PRN)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  placeholder="e.g. Take with morning breakfast with water."
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
                >
                  Prescribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
