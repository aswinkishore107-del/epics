import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import {
  Stethoscope,
  Users,
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setActivePatientId } = useAuth();
  const { socket } = useSocket();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'STABLE' | 'WARNING' | 'CRITICAL'>('ALL');

  const fetchPatients = () => {
    api.get('/patients')
      .then((res) => {
        if (res.data?.data) {
          setPatients(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Real-time vital updates update triage table
  useEffect(() => {
    if (!socket) return;

    socket.on('vital_updated', () => {
      fetchPatients();
    });

    socket.on('emergency_created', () => {
      fetchPatients();
    });

    return () => {
      socket.off('vital_updated');
      socket.off('emergency_created');
    };
  }, [socket]);

  const totalPatients = patients.length;
  const stableCount = patients.filter((p) => p.healthReadings?.[0]?.status === 'STABLE' || !p.healthReadings?.[0]).length;
  const warningCount = patients.filter((p) => p.healthReadings?.[0]?.status === 'WARNING').length;
  const criticalCount = patients.filter((p) => p.healthReadings?.[0]?.status === 'CRITICAL' || p.emergencyEvents?.length > 0).length;

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.user?.firstName} ${p.user?.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const currentStatus = p.healthReadings?.[0]?.status || 'STABLE';
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectPatient = (patientId: string) => {
    setActivePatientId(patientId);
    navigate(`/doctor/patient/${patientId}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-teal-500/40 font-mono">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Geriatric Cardiology Clinical Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">Dr. Arvind Sharma, MD</h1>
            <p className="text-slate-300 text-sm mt-1">
              Fortis Healthcare & Geriatric Institute • Attending Cardiologist
            </p>
          </div>

          <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-3.5 py-1.5 rounded-full border border-emerald-500/40 flex items-center gap-2 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Continuous Telemetry Stream Live</span>
          </span>
        </div>
      </div>

      {/* Clinical Triage Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assigned Patients</span>
          <div className="text-4xl font-black text-slate-900 mt-2">{totalPatients}</div>
          <span className="text-xs text-teal-600 font-semibold mt-1 block">Under continuous monitoring</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-emerald-500">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Stable Patients</span>
          <div className="text-4xl font-black text-emerald-600 mt-2">{stableCount}</div>
          <span className="text-xs text-slate-500 mt-1 block">Vitals in target resting range</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-amber-500">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Warning Thresholds</span>
          <div className="text-4xl font-black text-amber-600 mt-2">{warningCount}</div>
          <span className="text-xs text-slate-500 mt-1 block">Requires observation</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-rose-500">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Critical Emergencies</span>
          <div className="text-4xl font-black text-rose-600 mt-2">{criticalCount}</div>
          <span className="text-xs text-rose-700 font-semibold mt-1 block">Immediate clinical action</span>
        </div>
      </div>

      {/* Patient Triage Table */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient name..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'STABLE', 'WARNING', 'CRITICAL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6">Patient Name</th>
                <th className="py-4 px-6">Triage Status</th>
                <th className="py-4 px-6">Heart Rate</th>
                <th className="py-4 px-6">SpO2</th>
                <th className="py-4 px-6">Skin Temp (TMP117)</th>
                <th className="py-4 px-6">Respiration (EDR)</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No patients matched this filter.</td>
                </tr>
              ) : (
                filteredPatients.map((pat) => {
                  const reading = pat.healthReadings?.[0];
                  const status = reading?.status || 'STABLE';

                  return (
                    <tr key={pat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center">
                            {pat.user?.firstName?.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-base">
                              {pat.user?.firstName} {pat.user?.lastName}
                            </span>
                            <span className="text-xs text-slate-400">Age: 72 • Male • ID: {pat.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                            status === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {reading?.heartRate || 78} BPM
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {reading?.spo2 || 97}%
                      </td>

                      <td className="py-4 px-6 font-bold text-amber-800">
                        {reading?.skinTemperature || 36.5}°C
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-800">
                        {reading?.respiratoryRate || 16} /min (EDR)
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleSelectPatient(pat.id)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>Clinical Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
