import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { WellnessResponse } from '../../types';
import confetti from 'canvas-confetti';
import {
  Smile,
  Moon,
  Utensils,
  Zap,
  Scale,
  CheckCircle,
  History,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const ElderlyWellnessPage: React.FC = () => {
  const { user, activePatientId } = useAuth();
  const targetPatientId = activePatientId || (user as any)?.profile?.id;

  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState('RESTFUL');
  const [dietRating, setDietRating] = useState('BALANCED');
  const [stressLevel, setStressLevel] = useState('LOW');
  const [weightKg, setWeightKg] = useState(68);
  const [heightCm, setHeightCm] = useState(172);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<WellnessResponse[]>([]);

  const fetchHistory = () => {
    if (!targetPatientId) return;
    api.get(`/wellness/history/${targetPatientId}`)
      .then((res) => {
        if (res.data?.data) setHistory(res.data.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchHistory();
  }, [targetPatientId]);

  const bmi = parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientId) {
      setErrorMessage('Patient profile not loaded yet. Please reload.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await api.post('/wellness/submit', {
        patientId: targetPatientId,
        sleepHours: Number(sleepHours),
        sleepQuality,
        dietRating,
        stressLevel,
        alcoholIntake: 'NONE',
        tobaccoUse: 'NONE',
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        notes: notes.trim() || 'Daily self-check submitted',
      });

      setSubmitted(true);
      confetti({ particleCount: 70, spread: 60 });
      fetchHistory();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Error submitting wellness questionnaire:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save wellness questionnaire.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 bg-white/20 text-purple-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Smile className="w-4 h-4" />
          <span>Daily Self-Check</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black">Wellness Questionnaire</h1>
        <p className="text-purple-100/90 text-base mt-1">
          A quick 1-minute check to keep Priya and Dr. Sharma informed of how you feel.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{errorMessage}</span>
        </div>
      )}

      {submitted && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 p-5 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
          <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-black text-lg">Thank you, Rajesh ji!</h4>
            <p className="text-sm">Your wellness response and BMI ({bmi}) have been saved and shared with your care team.</p>
          </div>
        </div>
      )}

      {/* Visual Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-8">
        {/* 1. Sleep Duration */}
        <div>
          <label className="block text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Moon className="w-6 h-6 text-indigo-600" />
            <span>How many hours did you sleep last night?</span>
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {[5, 6, 7, 7.5, 8].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setSleepHours(hours)}
                className={`py-4 px-2 rounded-2xl font-black text-lg sm:text-xl border-2 transition-all cursor-pointer ${
                  sleepHours === hours
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        {/* 2. Sleep Quality */}
        <div>
          <label className="block text-lg font-black text-slate-900 mb-3">How was the quality of your sleep?</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'RESTFUL', label: 'Restful 😊', desc: 'Slept soundly' },
              { id: 'NORMAL', label: 'Average 😐', desc: 'Woke up once' },
              { id: 'RESTLESS', label: 'Restless 🥱', desc: 'Trouble sleeping' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSleepQuality(item.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  sleepQuality === item.id
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-lg font-bold">{item.label}</span>
                <span className="block text-xs text-slate-500 mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Diet & Appetite */}
        <div>
          <label className="block text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-600" />
            <span>How was your diet & appetite today?</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'BALANCED', label: 'Good 🥗', desc: 'Ate full meals' },
              { id: 'MODERATE', label: 'Moderate 🍲', desc: 'Normal appetite' },
              { id: 'LIGHT', label: 'Light 🥣', desc: 'Ate very little' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDietRating(item.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  dietRating === item.id
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-lg font-bold">{item.label}</span>
                <span className="block text-xs text-slate-500 mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Stress / Mood Level */}
        <div>
          <label className="block text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-500" />
            <span>How is your stress level or mood?</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'LOW', label: 'Calm 🟢', desc: 'Feeling relaxed' },
              { id: 'MODERATE', label: 'Moderate 🟡', desc: 'Mild tension' },
              { id: 'HIGH', label: 'Elevated 🔴', desc: 'Feeling stressed' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStressLevel(item.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  stressLevel === item.id
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-lg font-bold">{item.label}</span>
                <span className="block text-xs text-slate-500 mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Weight, Height & BMI Calculator */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <label className="block text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <Scale className="w-6 h-6 text-teal-600" />
            <span>Weight & Calculated BMI</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Weight (kg)</span>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Height (cm)</span>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-lg font-bold text-slate-900"
              />
            </div>

            <div className="bg-teal-100/70 p-3.5 rounded-xl border border-teal-200 text-center">
              <span className="text-xs font-bold text-teal-800 uppercase block">Calculated BMI</span>
              <span className="text-3xl font-black text-teal-900">{bmi}</span>
              <span className="text-[11px] font-bold text-teal-700 block">Normal Weight</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-2xl py-5 rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-3"
        >
          <CheckCircle className="w-8 h-8" />
          <span>Save Wellness Check</span>
        </button>
      </form>
    </div>
  );
};
