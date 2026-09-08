import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const DoctorNotesPage: React.FC = () => {
  const { user, activePatientId } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // New Note
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('SOAP');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching clinical notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post('/notes', {
        patientId: activePatientId || 'demo-id',
        category,
        content,
      });
      setNotes([res.data, ...notes]);
      setContent('');
      setShowModal(false);
    } catch (err) {
      console.error('Error creating note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clinical SOAP & Consultation Notes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized SOAP notes, treatment plans, follow-up logs, and clinical observations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-teal-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Write Clinical Note
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes by keyword or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SOAP', 'ROUTINE', 'ALERT_REVIEW', 'MEDICATION_REVIEW'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No clinical notes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Record a new SOAP note or clinical observation using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {note.category || 'SOAP'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Patient: <strong>{note.patient?.name || 'Rajesh Kumar'}</strong>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {note.content}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-teal-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Clinician Signature: {note.doctorName || 'Dr. Arvind Sharma, Cardiologist'}
                </span>
                <span className="font-mono text-[11px]">VIORA EMR Record ID: {note.id.substring(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Note Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Record Clinical SOAP Note</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-slate-50"
              >
                <option value="SOAP">SOAP Note</option>
                <option value="ROUTINE">Routine Follow-up</option>
                <option value="ALERT_REVIEW">Alert Review</option>
                <option value="MEDICATION_REVIEW">Medication Review</option>
              </select>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Observations & Plan
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="S: Patient reports feeling well; no nocturnal dyspnea.&#10;O: HR stable 72 bpm, SpO2 98%, Skin Temp 34.2C (TMP117), EDR 16 BrPM.&#10;A: Stable post-discharge management.&#10;P: Continue current beta-blocker regimen, follow up in 2 weeks."
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Sign Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
