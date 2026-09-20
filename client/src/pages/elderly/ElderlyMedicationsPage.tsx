import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Medication } from '../../types';
import confetti from 'canvas-confetti';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const ElderlyMedicationsPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const { socket } = useSocket();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<{ adherenceRate: number; takenCount: number; totalLogged: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<string | null>(null);

  const fetchMeds = () => {
    if (!activePatientId) return;

    Promise.all([
      api.get(`/medications/patient/${activePatientId}`),
      api.get(`/medications/adherence/${activePatientId}`),
    ])
      .then(([medsRes, adhRes]) => {
        if (medsRes.data?.data) setMedications(medsRes.data.data);
        if (adhRes.data?.data) setAdherence(adhRes.data.data);
      })
      .catch((err) => console.error('Error fetching medications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeds();
  }, [activePatientId]);

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

  const handleMarkTaken = async (med: Medication) => {
    if (!activePatientId || med.todayStatus === 'TAKEN') return;
    setTakingId(med.id);

    try {
      await api.post('/medications/log', {
        medicationId: med.id,
        patientId: activePatientId,
        status: 'TAKEN',
      });

      // Fire celebratory confetti for taking medicine on time!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });

      // Refresh list
      fetchMeds();
    } catch (err) {
      console.error('Error marking medication taken:', err);
    } finally {
      setTakingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with 30-Day Adherence Gauge */}
      <div className="bg-gradient-to-r from-teal-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-teal-200 font-bold text-xs uppercase tracking-widest block">Daily Prescription Care</span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">My Medicines Today</h1>
          <p className="text-teal-100/90 text-base mt-1">
            Tap the button when you take your medicine to automatically update Priya & Dr. Sharma.
          </p>
        </div>

        {/* Adherence Rate Pill */}
        {adherence && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 shrink-0">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-400 flex items-center justify-center font-black text-xl text-white">
              {adherence.adherenceRate}%
            </div>
            <div>
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">30-Day Adherence</span>
              <span className="text-sm font-semibold text-white">Excellent compliance</span>
            </div>
          </div>
        )}
      </div>

      {/* Medications List */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Today&apos;s Prescription Schedule</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-semibold">Loading prescriptions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => {
              const isTaken = med.todayStatus === 'TAKEN';
              const isMissed = med.todayStatus === 'MISSED';

              return (
                <div
                  key={med.id}
                  className={`elderly-card border-l-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
                    isTaken
                      ? 'border-l-emerald-500 bg-emerald-50/30'
                      : isMissed
                      ? 'border-l-rose-500 bg-rose-50/30'
                      : 'border-l-indigo-500 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        isTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <Pill className="w-8 h-8" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-slate-900">{med.name}</h3>
                        <span className="bg-slate-100 text-slate-800 text-sm font-bold px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {med.dosage}
                        </span>
                      </div>

                      <p className="text-base text-slate-600 mt-1 font-medium">{med.instructions}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mt-2">
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {med.schedules.map((s) => s.scheduledTime).join(', ') || 'Morning'}
                          </span>
                        </span>

                        <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg">
                          {med.frequency.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mark Taken Button */}
                  <div className="self-end sm:self-center shrink-0 w-full sm:w-auto">
                    {isTaken ? (
                      <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-800 font-bold text-lg px-6 py-4 rounded-2xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span>Taken Today</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkTaken(med)}
                        disabled={takingId === med.id}
                        className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                      >
                        <Check className="w-6 h-6 stroke-[3]" />
                        <span>Mark as Taken</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
