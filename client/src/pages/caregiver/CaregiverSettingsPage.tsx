import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { SafetyRule } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  Heart,
  Thermometer,
  Wind,
  Activity,
  Sliders,
  Check,
} from 'lucide-react';

export const CaregiverSettingsPage: React.FC = () => {
  const [rules, setRules] = useState<SafetyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRules = () => {
    api.get('/safety-rules')
      .then((res) => {
        if (res.data?.data) setRules(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdateRule = async (id: string, newThreshold: number) => {
    setSavingId(id);
    try {
      await api.patch(`/safety-rules/${id}`, { threshold: newThreshold });
      fetchRules();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Demo Safety Threshold — Not a Medical Diagnosis</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Safety Rule Engine Configuration</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The SafetyRuleEngine evaluates biosensor telemetry deterministically (completely independent of AI).
          All thresholds below are configurable demo benchmarks designed for testing alerts and early warning notifications.
        </p>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading safety rules...</div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900">{rule.metric.replace(/_/g, ' ')}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{rule.description}</p>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono inline-block mt-1.5 border border-amber-200">
                    Condition: {rule.operator} {rule.threshold}
                  </span>
                </div>
              </div>

              {/* Threshold Adjuster */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <input
                  type="number"
                  defaultValue={rule.threshold}
                  onBlur={(e) => handleUpdateRule(rule.id, Number(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-teal-500"
                />
                <span className="text-xs font-bold text-slate-400">
                  {savingId === rule.id ? 'Saving...' : 'Blur to update'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
