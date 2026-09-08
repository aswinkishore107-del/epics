import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Reminder } from '../../types';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Bell,
  Plus,
  Moon,
  Footprints,
  Pill,
} from 'lucide-react';

export const ElderlyRemindersPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  const fetchReminders = () => {
    if (!activePatientId) return;

    api.get(`/reminders/patient/${activePatientId}`)
      .then((res) => {
        if (res.data?.data) setReminders(res.data.data);
      })
      .catch((err) => console.error('Error fetching reminders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReminders();
  }, [activePatientId]);

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/reminders/${id}`, { status: 'COMPLETED' });
      fetchReminders();
    } catch (err) {
      console.error('Error completing reminder:', err);
    }
  };

  const handleSnooze = async (id: string) => {
    try {
      const snoozedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await api.patch(`/reminders/${id}`, { status: 'SNOOZED', snoozedUntil });
      fetchReminders();
    } catch (err) {
      console.error('Error snoozing reminder:', err);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !activePatientId) return;

    try {
      await api.post('/reminders', {
        patientId: activePatientId,
        title: newTitle,
        scheduledTime: newTime ? new Date(newTime).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      setShowAddModal(false);
      setNewTitle('');
      fetchReminders();
    } catch (err) {
      console.error('Error creating reminder:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">Daily Schedule</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">My Reminders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Activities, health checks, walks, and hydration scheduled for you
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-base px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No active reminders right now.</div>
        ) : (
          reminders.map((rem) => {
            const isDone = rem.status === 'COMPLETED';

            return (
              <div
                key={rem.id}
                className={`elderly-card border-l-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone ? 'border-l-slate-300 bg-slate-50 opacity-75' : 'border-l-amber-500 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {rem.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{new Date(rem.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
                        {rem.category}
                      </span>
                    </div>
                  </div>
                </div>

                {!isDone && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleSnooze(rem.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer"
                    >
                      Snooze 15m
                    </button>
                    <button
                      onClick={() => handleComplete(rem.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-4">Create New Reminder</h3>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Afternoon Tea & Stroll"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-base text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-base text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
