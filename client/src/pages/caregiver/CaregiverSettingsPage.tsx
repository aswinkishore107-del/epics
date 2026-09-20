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
  RotateCw,
  AlertCircle
} from 'lucide-react';

export const CaregiverSettingsPage: React.FC = () => {
  const [rules, setRules] = useState<SafetyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [thresholdValues, setThresholdValues] = useState<{ [id: string]: number }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchRules = () => {
    api.get('/safety-rules')
      .then((res) => {
        if (res.data?.data) {
          setRules(res.data.data);
          const initialMap: { [id: string]: number } = {};
          res.data.data.forEach((r: SafetyRule) => {
            initialMap[r.id] = r.threshold;
          });
          setThresholdValues(initialMap);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdateRule = async (id: string) => {
    const val = thresholdValues[id];
    if (val === undefined || isNaN(val)) return;

    setSavingId(id);
    try {
      await api.patch(`/safety-rules/${id}`, { threshold: Number(val) });
      setSavedId(id);
      setSuccessToast('Safety threshold saved to database successfully!');
      setTimeout(() => {
        setSavedId(null);
        setSuccessToast(null);
      }, 3000);
      fetchRules();
    } catch (err) {
      console.error('Error saving rule:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleEnabled = async (rule: SafetyRule) => {
    setSavingId(rule.id);
    try {
      await api.patch(`/safety-rules/${rule.id}`, { enabled: !rule.enabled });
      setSuccessToast(`Rule ${!rule.enabled ? 'activated' : 'deactivated'} in database.`);
      setTimeout(() => setSuccessToast(null), 3000);
      fetchRules();
    } catch (err) {
      console.error('Error toggling rule:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-bounce">
          <Check className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Demo Safety Threshold — Not a Medical Diagnosis</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Safety Rule Engine Configuration</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The SafetyRuleEngine evaluates biosensor telemetry deterministically (completely independent of AI).
          All thresholds below are stored in the PostgreSQL database and trigger alerts in real time.
        </p>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            Loading safety rules...
          </div>
        ) : (
          rules.map((rule) => {
            const currentVal = thresholdValues[rule.id] ?? rule.threshold;
            const isModified = currentVal !== rule.threshold;
            const isSaving = savingId === rule.id;
            const isSaved = savedId === rule.id;

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-3xl p-6 border-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
                  rule.enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-inner">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-black text-slate-900">{rule.metric.replace(/_/g, ' ')}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          rule.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {rule.severity}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-600">
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
                    <span className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg font-mono inline-block mt-2 border border-amber-200">
                      Rule: {rule.operator} {rule.threshold}
                    </span>
                  </div>
                </div>

                {/* Threshold Input & Dedicated Save Button */}
                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={currentVal}
                      onChange={(e) =>
                        setThresholdValues((prev) => ({
                          ...prev,
                          [rule.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-center font-black text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={() => handleUpdateRule(rule.id)}
                    disabled={isSaving}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : isModified
                        ? 'bg-teal-600 hover:bg-teal-700 text-white ring-2 ring-teal-400'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleEnabled(rule)}
                    disabled={isSaving}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
