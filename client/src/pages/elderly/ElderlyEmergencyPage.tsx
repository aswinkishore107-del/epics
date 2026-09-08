import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../api/client';
import { EmergencyContact } from '../../types';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';

export const ElderlyEmergencyPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const { activeEmergency, acknowledgeEmergency, resolveEmergency } = useAlert();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    if (!activePatientId) return;

    api.get(`/patients/${activePatientId}/emergency-contacts`)
      .then((res) => {
        if (res.data?.data) setContacts(res.data.data);
      })
      .catch((err) => console.error('Error fetching emergency contacts:', err));
  }, [activePatientId]);

  const handleManualSOS = async () => {
    if (!activePatientId || triggering) return;
    setTriggering(true);

    try {
      await api.post('/emergency/sos', {
        patientId: activePatientId,
        location: 'Living Room, Home',
      });
    } catch (err) {
      console.error('Error triggering SOS:', err);
    } finally {
      setTriggering(false);
    }
  };

  const handleTriggerFallDemo = async () => {
    if (!activePatientId) return;
    try {
      await api.post('/devices/simulator/trigger', {
        patientId: activePatientId,
        action: 'FALL',
      });
    } catch (err) {
      console.error('Error triggering simulated fall:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertOctagon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Emergency Assistance</h1>
        <p className="text-red-100 text-base sm:text-lg mt-2 max-w-xl mx-auto">
          Press the button below if you need urgent medical help or have experienced a fall.
        </p>
      </div>

      {/* Giant SOS Trigger Button */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-4 border-red-200 shadow-xl text-center">
        <div className="relative inline-block">
          <button
            onClick={handleManualSOS}
            disabled={triggering || activeEmergency?.status === 'ACTIVE'}
            className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full font-black text-3xl sm:text-4xl shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 mx-auto cursor-pointer border-8 border-red-200 ${
              activeEmergency?.status === 'ACTIVE'
                ? 'bg-red-800 text-white animate-pulse'
                : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/50'
            }`}
          >
            <AlertOctagon className="w-16 h-16 sm:w-20 sm:h-20 fill-current" />
            <span>SOS</span>
            <span className="text-xs font-bold tracking-widest uppercase opacity-90">Press to Send</span>
          </button>
        </div>

        <p className="text-sm font-bold text-slate-500 mt-6 max-w-md mx-auto">
          Sending SOS immediately alerts your priority emergency contacts and transmits your current GPS location and vitals.
        </p>

        {/* Fall Detection Simulation Trigger */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleTriggerFallDemo}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm px-6 py-3 rounded-2xl transition-all active:scale-95 cursor-pointer border border-amber-300"
          >
            ⚠️ Test Simulated Fall Detection (15-Second Verification)
          </button>
        </div>
      </div>

      {/* Priority Emergency Contacts Escalation Chain */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Emergency Contacts & Escalation Order</h3>
            <p className="text-xs text-slate-500">Alerts notify contacts in sequence based on priority</p>
          </div>
        </div>

        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                  #{c.priority}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-bold text-slate-900">{c.name}</h4>
                    {c.isPrimary && (
                      <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 block mt-0.5">{c.relationship}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${c.phone}`}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{c.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
