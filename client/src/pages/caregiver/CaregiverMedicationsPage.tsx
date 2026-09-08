import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Medication } from '../../types';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const CaregiverMedicationsPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('ONCE_DAILY');
  const [instructions, setInstructions] = useState('');
  const [time, setTime] = useState('08:00');

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
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedData();
  }, [activePatientId]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !activePatientId) return;

    try {
      await api.post('/medications', {
        patientId: activePatientId,
        name,
        dosage,
        frequency,
        instructions,
        scheduledTimes: [time],
      });
      setShowAddModal(false);
      setName('');
      setDosage('');
      setInstructions('');
      fetchMedData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Pharmacotherapy Management</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Prescription & Adherence Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily doses, missed pills, and update regimens
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
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
        {medications.map((m) => (
          <div key={m.id} className="elderly-card border-l-8 border-l-indigo-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-slate-900">{m.name}</h4>
                  <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">
                    {m.dosage}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{m.instructions}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1.5">
                  <span>Frequency: {m.frequency.replace('_', ' ')}</span>
                  <span>• Times: {m.schedules.map((s) => s.scheduledTime).join(', ') || '08:00'}</span>
                </div>
              </div>
            </div>

            <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1.5 rounded-xl self-end sm:self-center">
              Active Regimen
            </span>
          </div>
        ))}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-4">Add Medication Regimen</h3>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Dosage</label>
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
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
