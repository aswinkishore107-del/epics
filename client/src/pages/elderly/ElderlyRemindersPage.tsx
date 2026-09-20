import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Reminder } from '../../types';
import confetti from 'canvas-confetti';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Bell,
  Plus,
  Moon,
  Footprints,
  Pill,
  Droplets,
  Utensils,
  Stethoscope,
  Volume2,
  Trash2,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  RotateCw,
} from 'lucide-react';

type FilterType = 'ALL' | 'PENDING' | 'COMPLETED';

export const ElderlyRemindersPage: React.FC = () => {
  const { user, activePatientId } = useAuth();
  const { socket } = useSocket();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'GENERAL' | 'MEDICATION' | 'ACTIVITY' | 'HYDRATION' | 'APPOINTMENT'>('GENERAL');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(() => {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [newDescription, setNewDescription] = useState('');
  const [newRecurring, setNewRecurring] = useState(false);

  // UX Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Resolved patientId
  const patientId = activePatientId || (user as any)?.profile?.id;

  const fetchReminders = () => {
    if (!patientId) return;

    api.get(`/reminders/patient/${patientId}`)
      .then((res) => {
        if (res.data?.data) setReminders(res.data.data);
      })
      .catch((err) => console.error('Error fetching reminders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReminders();
  }, [patientId]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (data: { reminder: Reminder }) => {
      setReminders((prev) => {
        if (prev.some((r) => r.id === data.reminder.id)) return prev;
        return [...prev, data.reminder].sort(
          (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        );
      });
    };

    const handleUpdated = (data: { reminder: Reminder }) => {
      setReminders((prev) =>
        prev.map((r) => (r.id === data.reminder.id ? data.reminder : r))
      );
    };

    const handleDeleted = (data: { reminderId: string }) => {
      setReminders((prev) => prev.filter((r) => r.id !== data.reminderId));
    };

    socket.on('reminder_created', handleCreated);
    socket.on('reminder_updated', handleUpdated);
    socket.on('reminder_deleted', handleDeleted);

    return () => {
      socket.off('reminder_created', handleCreated);
      socket.off('reminder_updated', handleUpdated);
      socket.off('reminder_deleted', handleDeleted);
    };
  }, [socket]);

  // Reset modal fields
  const handleOpenModal = () => {
    setNewTitle('');
    setNewCategory('GENERAL');
    setNewDate(new Date().toISOString().split('T')[0]);
    const d = new Date(Date.now() + 15 * 60 * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setNewTime(`${hh}:${mm}`);
    setNewDescription('');
    setNewRecurring(false);
    setFormError(null);
    setShowAddModal(true);
  };

  // Quick preset helper
  const applyPreset = (preset: { title: string; category: typeof newCategory; description?: string }) => {
    setNewTitle(preset.title);
    setNewCategory(preset.category);
    if (preset.description) setNewDescription(preset.description);
    setFormError(null);
  };

  // Quick time preset helper
  const setTimeOffset = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    setNewDate(target.toISOString().split('T')[0]);
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(target.getMinutes()).padStart(2, '0');
    setNewTime(`${hh}:${mm}`);
  };

  // Form submission: Robust date and time assembly
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a reminder title (e.g. Food, Medicine).');
      return;
    }

    if (!patientId) {
      setFormError('Patient account not detected. Please reload the page.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Assemble valid Date object regardless of input format
      let scheduledDate: Date;
      if (newDate && newTime) {
        const [y, m, d] = newDate.split('-').map(Number);
        const [h, min] = newTime.split(':').map(Number);
        scheduledDate = new Date(y, m - 1, d, h, min, 0, 0);
      } else if (newTime) {
        const [h, min] = newTime.split(':').map(Number);
        scheduledDate = new Date();
        scheduledDate.setHours(h, min, 0, 0);
      } else {
        scheduledDate = new Date(Date.now() + 60 * 60 * 1000);
      }

      if (isNaN(scheduledDate.getTime())) {
        setFormError('Please choose a valid date and time.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        patientId,
        title: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim() || undefined,
        scheduledTime: scheduledDate.toISOString(),
        isRecurring: newRecurring,
        recurrencePattern: newRecurring ? 'DAILY' : undefined,
      };

      const res = await api.post('/reminders', payload);

      setShowAddModal(false);
      setSuccessToast(`Reminder "${res.data?.data?.title || newTitle}" saved successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
      fetchReminders();
    } catch (err: any) {
      console.error('Error creating reminder:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to save reminder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete reminder action with confetti celebration
  const handleComplete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/reminders/${id}`, { status: 'COMPLETED' });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
      });
      fetchReminders();
      setSuccessToast('Great job! Reminder completed.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error completing reminder:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Snooze reminder for 15 minutes
  const handleSnooze = async (id: string) => {
    setActionLoadingId(id);
    try {
      const snoozedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await api.patch(`/reminders/${id}`, { status: 'SNOOZED', snoozedUntil });
      fetchReminders();
      setSuccessToast('Snoozed for 15 minutes.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error snoozing reminder:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete reminder action
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove reminder "${title}"?`)) return;

    setActionLoadingId(id);
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setSuccessToast(`Deleted "${title}".`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Error deleting reminder:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Text-to-speech voice narration for elderly accessibility
  const handleSpeak = (rem: Reminder) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const timeStr = new Date(rem.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const text = `Reminder: ${rem.title}. Scheduled for ${timeStr}. ${rem.description ? rem.description : ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // gentle cadence for seniors
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Category Icon & Color Mapping
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'MEDICATION':
        return {
          icon: <Pill className="w-6 h-6 text-indigo-600" />,
          bg: 'bg-indigo-100',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          label: 'Medication',
        };
      case 'HYDRATION':
        return {
          icon: <Droplets className="w-6 h-6 text-sky-600" />,
          bg: 'bg-sky-100',
          badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
          label: 'Hydration',
        };
      case 'ACTIVITY':
        return {
          icon: <Footprints className="w-6 h-6 text-emerald-600" />,
          bg: 'bg-emerald-100',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Activity / Walk',
        };
      case 'APPOINTMENT':
        return {
          icon: <Stethoscope className="w-6 h-6 text-purple-600" />,
          bg: 'bg-purple-100',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Doctor / Visit',
        };
      case 'GENERAL':
      default:
        return {
          icon: <Utensils className="w-6 h-6 text-amber-600" />,
          bg: 'bg-amber-100',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Food / General',
        };
    }
  };

  // Identify any reminder that is currently due or past-due and pending
  const dueReminders = useMemo(() => {
    const now = new Date().getTime();
    return reminders.filter((r) => {
      if (r.status === 'COMPLETED') return false;
      const t = new Date(r.snoozedUntil || r.scheduledTime).getTime();
      return t <= now;
    });
  }, [reminders]);

  // Filtered list
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      if (filter === 'PENDING') return rem.status !== 'COMPLETED';
      if (filter === 'COMPLETED') return rem.status === 'COMPLETED';
      return true;
    });
  }, [reminders, filter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast feedback */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-bounce">
          <Check className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block">Daily Schedule & Care</span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 flex items-center gap-3">
            <span>My Reminders</span>
            <span className="text-sm font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
              {reminders.filter((r) => r.status !== 'COMPLETED').length} Active
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Meals, medication times, walks, and hydration scheduled for your health
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Active Due Reminders Alert Banner */}
      {dueReminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg border-2 border-amber-300 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-100 block">
                  Due Right Now!
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{dueReminders[0].title}</h3>
                <p className="text-xs sm:text-sm text-amber-100">
                  Scheduled for {new Date(dueReminders[0].scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {dueReminders[0].description && ` • ${dueReminders[0].description}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => handleSpeak(dueReminders[0])}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Hear reminder spoken aloud"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear</span>
              </button>
              <button
                onClick={() => handleSnooze(dueReminders[0].id)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Snooze 15m
              </button>
              <button
                onClick={() => handleComplete(dueReminders[0].id)}
                className="bg-white text-orange-700 hover:bg-orange-50 font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Complete Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({reminders.length})
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            filter === 'PENDING'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending / Upcoming ({reminders.filter((r) => r.status !== 'COMPLETED').length})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            filter === 'COMPLETED'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({reminders.filter((r) => r.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            Loading your schedule...
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200 shadow-sm">
            <CalendarCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-xl font-bold text-slate-700">No reminders found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === 'COMPLETED'
                ? 'No reminders have been completed yet today.'
                : 'You are all caught up! Click "Add Reminder" above to set a new task or meal reminder.'}
            </p>
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const isDone = rem.status === 'COMPLETED';
            const isSnoozed = rem.status === 'SNOOZED';
            const categoryMeta = getCategoryMeta(rem.category);
            const scheduledDate = new Date(rem.scheduledTime);
            const isDue = !isDone && scheduledDate.getTime() <= Date.now();

            return (
              <div
                key={rem.id}
                className={`elderly-card border-l-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isDone
                    ? 'border-l-slate-300 bg-slate-50/80 opacity-70'
                    : isDue
                    ? 'border-l-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-400/30'
                    : 'border-l-teal-500 bg-white'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-14 h-14 ${categoryMeta.bg} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    {categoryMeta.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-xl sm:text-2xl font-black ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {rem.title}
                      </h3>
                      {isDue && (
                        <span className="text-[10px] font-extrabold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          Due Now
                        </span>
                      )}
                      {isSnoozed && (
                        <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Snoozed 15m
                        </span>
                      )}
                      {rem.isRecurring && (
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          Daily
                        </span>
                      )}
                    </div>

                    {rem.description && (
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{rem.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-2 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </span>
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-lg border text-[10px] uppercase font-black ${categoryMeta.badgeBg}`}
                      >
                        {categoryMeta.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Speak button */}
                  <button
                    onClick={() => handleSpeak(rem)}
                    className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all cursor-pointer"
                    title="Read reminder aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {!isDone && (
                    <>
                      <button
                        onClick={() => handleSnooze(rem.id)}
                        disabled={actionLoadingId === rem.id}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Snooze 15m
                      </button>

                      <button
                        onClick={() => handleComplete(rem.id)}
                        disabled={actionLoadingId === rem.id}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                    </>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(rem.id, rem.title)}
                    disabled={actionLoadingId === rem.id}
                    className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Create New Reminder</h3>
                  <p className="text-xs text-slate-500">Scheduled notification for your care routine</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Preset Chips for Easy Entry */}
            <div className="mb-5">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      title: 'Food / Meal',
                      category: 'GENERAL',
                      description: 'Healthy breakfast/lunch/dinner routine',
                    })
                  }
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Food / Meal</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      title: 'Prescribed Medicine',
                      category: 'MEDICATION',
                      description: 'Take with warm glass of water',
                    })
                  }
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pill className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Medicine</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      title: 'Hydration: Glass of Water',
                      category: 'HYDRATION',
                      description: 'Keep kidneys healthy with 250ml water',
                    })
                  }
                  className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Drink Water</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      title: 'Evening Garden Walk',
                      category: 'ACTIVITY',
                      description: 'Gentle 15-minute walking routine',
                    })
                  }
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Walk</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      title: 'Doctor Appointment Check',
                      category: 'APPOINTMENT',
                      description: 'Follow-up consultation with physician',
                    })
                  }
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                  <span>Doctor Visit</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4">
              {/* Reminder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reminder Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Food, Afternoon Walk, Blood Pressure Check"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-base text-slate-900 font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('GENERAL')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'GENERAL'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Food / Meal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory('MEDICATION')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'MEDICATION'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Medication</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory('HYDRATION')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'HYDRATION'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Hydration</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory('ACTIVITY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'ACTIVITY'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span>Activity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory('APPOINTMENT')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'APPOINTMENT'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Doctor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategory('GENERAL')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === 'GENERAL'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>General</span>
                  </button>
                </div>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Quick Time Helpers */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTimeOffset(15)}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  +15 mins
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOffset(60)}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  +1 hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(new Date().toISOString().split('T')[0]);
                    setNewTime('08:00');
                  }}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Morning (8:00 AM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(new Date().toISOString().split('T')[0]);
                    setNewTime('13:00');
                  }}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Noon (1:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(new Date().toISOString().split('T')[0]);
                    setNewTime('19:30');
                  }}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Dinner (7:30 PM)
                </button>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Notes / Details
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Warm water, take before eating, 10 min walk"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Daily recurrence toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newRecurring}
                  onChange={(e) => setNewRecurring(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="recurring" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Repeat this reminder daily at this time
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-sm px-7 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving Reminder...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Reminder</span>
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
