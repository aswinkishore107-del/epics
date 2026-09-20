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
  Sparkles,
  Trash2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const DoctorNotesPage: React.FC = () => {
  const { user, activePatientId } = useAuth();
  const { socket } = useSocket();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // New Note Modal
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('SOAP');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast / Feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      const list = res.data?.data || res.data;
      setNotes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching clinical notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activePatientId]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleNoteCreated = (data: { note: any }) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === data.note.id)) return prev;
        return [data.note, ...prev];
      });
    };

    const handleNoteDeleted = (data: { noteId: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== data.noteId));
    };

    socket.on('note_created', handleNoteCreated);
    socket.on('note_deleted', handleNoteDeleted);

    return () => {
      socket.off('note_created', handleNoteCreated);
      socket.off('note_deleted', handleNoteDeleted);
    };
  }, [socket]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setErrorToast(null);

      const res = await api.post('/notes', {
        patientId: activePatientId || undefined,
        category,
        content: content.trim(),
      });

      const newNote = res.data?.data || res.data;
      setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
      setContent('');
      setShowModal(false);
      setSuccessToast('Clinical note signed and saved to database successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Error creating note:', err);
      setErrorToast(err.response?.data?.message || 'Failed to save note. Please check inputs.');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clinical note from the database?')) return;

    try {
      setDeletingId(id);
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setSuccessToast('Clinical note removed from database.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      (n.content || n.clinicalNotes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-black text-slate-900">Clinical SOAP & Consultation Notes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized SOAP notes, treatment plans, follow-up logs, and clinical observations.
          </p>
        </div>
        <button
          onClick={() => {
            setContent('');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
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
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No clinical notes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Record a new SOAP note or clinical observation using the &quot;Write Clinical Note&quot; button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {note.category || 'SOAP'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Patient: <strong className="text-slate-900">{note.patient?.name || 'Rajesh Kumar'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingId === note.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete clinical note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {note.content || note.clinicalNotes}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
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
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-slate-50 cursor-pointer"
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
                  Clinical Observations & Plan *
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

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving & Signing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Sign Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
