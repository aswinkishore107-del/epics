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
  Shield
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const DoctorReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching clinical reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/reports/generate', {
        range: '7d',
        title: 'Weekly Multi-Parameter Triage Summary'
      });
      setReports([res.data, ...reports]);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const filteredReports = reports.filter(r =>
    (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:from-teal-700 hover:to-cyan-800 transition-all disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Clinical Synthesis
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
            placeholder="Search reports by title, patient, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredReports.length}</strong> archived reports
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No clinical reports found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Generate your first patient weekly clinical synthesis using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-teal-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{report.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Patient: <strong>{report.patient?.name || 'Rajesh Kumar'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{report.range || '7-Day Summary'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print PDF
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {report.summary || report.content}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Evaluated parameters: HR, Skin Temp (TMP117), SpO₂, Respiration (EDR), Fall events</span>
                <span className="font-mono text-[11px]">VIORA Clinical Intelligence Engine</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
