import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Medication } from '../../types';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Trash2,
  RotateCw,
  Check,
  X,
} from 'lucide-react';

export const CaregiverMedicationsPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const { socket } = useSocket();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('ONCE_DAILY');
  const [instructions, setInstructions] = useState('');
  const [time, setTime] = useState('08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete & Confirmation State
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchMedData = () => {
    if (!activePatientId) return;

    Promise.all([
      api.get(`/medications/patient/${activePatientId}`),
      api.get(`/medications/adherence/${activePatientId}`),
    ])
      .then(([mRes, aRes]) => {
        if (mRes.data?.data) setMedications(mRes.data.data);
        if (aRes.data?.data) setAdherence(aRes.data.data);
      })
      .catch((err) => console.error('Error fetching medications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedData();
  }, [activePatientId]);

  // Real-time socket sync for added or deleted medications
  useEffect(() => {
    if (!socket) return;

    const handleDeleted = (data: { medicationId: string }) => {
      setMedications((prev) => prev.filter((m) => m.id !== data.medicationId));
    };

    socket.on('medication_deleted', handleDeleted);

    return () => {
      socket.off('medication_deleted', handleDeleted);
    };
  }, [socket]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !activePatientId) return;

    setIsSubmitting(true);
    try {
      await api.post('/medications', {
        patientId: activePatientId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        instructions: instructions.trim() || undefined,
        scheduledTimes: [time],
      });
      setShowAddModal(false);
      setName('');
      setDosage('');
      setInstructions('');
      setSuccessToast(`Prescription "${name}" added successfully.`);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchMedData();
    } catch (err: any) {
      console.error(err);
      setErrorToast(err.response?.data?.message || 'Failed to add medication.');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedication = async () => {
    if (!medToDelete) return;
    setDeletingId(medToDelete.id);

    try {
      await api.delete(`/medications/${medToDelete.id}`);
      setMedications((prev) => prev.filter((m) => m.id !== medToDelete.id));
      setSuccessToast(`Prescription "${medToDelete.name}" deleted from database.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setMedToDelete(null);
      fetchMedData();
    } catch (err: any) {
      console.error('Error deleting medication:', err);
      setErrorToast(err.response?.data?.message || 'Failed to delete medication from database.');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Pharmacotherapy Management</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Prescription & Adherence Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily doses, update regimens, and manage active prescriptions
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescription</span>
        </button>
      </div>

      {/* Adherence Overview */}
      {adherence && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 uppercase">30-Day Adherence</span>
            <div className="text-4xl font-black text-indigo-600 mt-2">{adherence.adherenceRate}%</div>
            <span className="text-xs text-slate-500 mt-1 block">Optimal therapeutic coverage</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Doses Taken</span>
            <div className="text-4xl font-black text-emerald-600 mt-2">{adherence.takenCount}</div>
            <span className="text-xs text-slate-500 mt-1 block">Logged on schedule</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Missed Doses</span>
            <div className="text-4xl font-black text-rose-600 mt-2">{adherence.missedCount}</div>
            <span className="text-xs text-slate-500 mt-1 block">Missed / unlogged</span>
          </div>
        </div>
      )}

      {/* Prescription List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading prescriptions...
          </div>
        ) : medications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200 shadow-sm">
            <Pill className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-xl font-bold text-slate-700">No active prescriptions</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no medications in the database for this patient. Click &quot;Add Prescription&quot; to prescribe a medicine.
            </p>
          </div>
        ) : (
          medications.map((m) => (
            <div
              key={m.id}
              className="elderly-card border-l-8 border-l-indigo-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-black text-slate-900">{m.name}</h4>
                    <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">
                      {m.dosage}
                    </span>
                  </div>
                  {m.instructions && (
                    <p className="text-sm text-slate-600 mt-0.5">{m.instructions}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1.5 flex-wrap">
                    <span>Frequency: {m.frequency.replace(/_/g, ' ')}</span>
                    <span>• Times: {m.schedules?.map((s) => s.scheduledTime).join(', ') || '08:00'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons on card */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1.5 rounded-xl">
                  Active Regimen
                </span>

                <button
                  onClick={() => setMedToDelete(m)}
                  className="px-3.5 py-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
                  title={`Delete prescription ${m.name} from database`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Delete Prescription */}
      {medToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Delete Prescription?</h3>
                  <p className="text-xs text-slate-500">Database deletion confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setMedToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80">
              <p className="text-sm text-slate-700">
                Are you sure you want to permanently delete:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Pill className="w-4 h-4 text-indigo-600" />
                <span className="text-base font-black text-slate-900">
                  {medToDelete.name}
                </span>
                <span className="text-xs bg-white text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                  {medToDelete.dosage}
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-2 font-medium">
                ⚠️ This will permanently remove this medicine and all its scheduled logs from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingId === medToDelete.id}
                onClick={() => setMedToDelete(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === medToDelete.id}
                onClick={handleDeleteMedication}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingId === medToDelete.id ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Deleting from Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Prescription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-slate-900">Add Medication Regimen</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amlodipine"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dosage *</label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 5mg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="ONCE_DAILY">Once Daily</option>
                  <option value="TWICE_DAILY">Twice Daily</option>
                  <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                  <option value="AS_NEEDED">As Needed (PRN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with warm water after lunch"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Medication</span>
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
