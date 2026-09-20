import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Calendar,
  User,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  Shield,
  Trash2,
  Check
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const DoctorReportsPage: React.FC = () => {
  const { user, activePatientId } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      const list = res.data?.data || res.data;
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching clinical reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activePatientId]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setErrorToast(null);

      const res = await api.post('/reports/generate', {
        patientId: activePatientId || undefined,
        range: '7d',
        title: 'Weekly Multi-Parameter Triage Summary'
      });

      const newReport = res.data?.data || res.data;
      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
      setSuccessToast('Clinical evaluation report synthesized and saved to database!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setErrorToast(err.response?.data?.message || 'Failed to generate report.');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clinical report from the database?')) return;

    try {
      setDeletingId(id);
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setSuccessToast('Report removed from database.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error deleting report:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = reports.filter(r =>
    (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-bounce">
          <Check className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-6 right-6 z-50 bg-rose-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all">
          <AlertCircle className="w-5 h-5 text-rose-200" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clinical Evaluation & Health Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated multi-parameter triage syntheses, trend evaluations, and clinical summaries.
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-xl text-sm font-bold shadow-md hover:from-teal-700 hover:to-cyan-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{generating ? 'Synthesizing...' : 'Generate Clinical Synthesis'}</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between text-xs text-teal-800">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>
            <strong>Clinical Guardrail:</strong> Reports synthesize Skin Temperature (TMP117), ECG-Derived Respiration (EDR), SpO₂, and heart rate variability.
            AI summaries assist clinician review and do not substitute independent diagnostic evaluation.
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by keyword, findings, or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <strong>{filteredReports.length}</strong> reports in database
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No clinical reports available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;Generate Clinical Synthesis&quot; above to synthesize vital trends into an official EMR report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      EMR Synthesis
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {report.title || 'Weekly Multi-Parameter Triage Summary'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Patient: <strong className="text-slate-900">{report.patient?.name || 'Rajesh Kumar'}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(report.generatedAt || report.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    disabled={deletingId === report.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete report from database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed font-sans">
                {report.summary}
              </div>

              {/* Metrics Summary Strip */}
              {report.metricsJson && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Skin Temp (TMP117)</span>
                    <strong className="text-slate-900 text-sm">
                      {report.metricsJson.vitals?.skinTemperature || '36.4'}°C
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Respiration (EDR)</span>
                    <strong className="text-slate-900 text-sm">
                      {report.metricsJson.vitals?.respiratoryRate || '16'} BrPM
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resting Heart Rate</span>
                    <strong className="text-slate-900 text-sm">
                      {report.metricsJson.vitals?.heartRate || '74'} BPM
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">ECG Rhythm</span>
                    <strong className="text-emerald-700 text-sm">
                      {report.metricsJson.ecg?.rhythmInterpretation || 'Normal Sinus'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
