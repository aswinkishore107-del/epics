import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { EmergencyContact } from '../../types';
import {
  Users,
  Phone,
  Mail,
  Plus,
  Trash2,
  Shield,
  Heart,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const CaregiverPatientsPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const [patient, setPatient] = useState<any | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const fetchPatientData = () => {
    if (!activePatientId) return;

    Promise.all([
      api.get(`/patients/${activePatientId}`),
      api.get(`/patients/${activePatientId}/emergency-contacts`),
    ])
      .then(([pRes, cRes]) => {
        if (pRes.data?.data) setPatient(pRes.data.data);
        if (cRes.data?.data) setContacts(cRes.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatientData();
  }, [activePatientId]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !activePatientId) return;

    setIsSubmitting(true);
    try {
      await api.post(`/patients/${activePatientId}/emergency-contacts`, {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        priority: Number(priority),
        isPrimary: priority === 1,
      });
      setShowAddModal(false);
      setName('');
      setRelationship('');
      setPhone('');
      setEmail('');
      setSuccessToast(`Emergency contact "${name}" saved to database.`);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchPatientData();
    } catch (err: any) {
      console.error(err);
      setErrorToast(err.response?.data?.message || 'Failed to save emergency contact.');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${contactName} from emergency contacts?`)) return;

    setDeletingContactId(contactId);
    try {
      await api.delete(`/patients/${activePatientId}/emergency-contacts/${contactId}`);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setSuccessToast(`Contact "${contactName}" removed from database.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
      setErrorToast('Failed to delete emergency contact.');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setDeletingContactId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-6 right-6 z-50 bg-rose-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all">
          <AlertCircle className="w-5 h-5 text-rose-200" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Patient Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-teal-100 text-teal-800 rounded-3xl flex items-center justify-center font-black text-2xl shrink-0">
            {patient?.user?.firstName?.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900">
                {patient?.user?.firstName} {patient?.user?.lastName}
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Active Monitoring
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-3">
              <span>DOB: 15 June 1954 (Age 72)</span>
              <span>• Blood Group: B+</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{patient?.address || 'Indiranagar, Bangalore, Karnataka'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contacts & Priority Escalation */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-600" />
              <span>Emergency Contacts & Escalation Hierarchy</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              When an SOS or Fall occurs, alerts escalate in sequence: Priority 1 → Priority 2 → Priority 3
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-lg">
                  #{c.priority}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-slate-900">{c.name}</h4>
                    {c.isPrimary && (
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                        Primary Caregiver
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{c.relationship}</span>
                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      {c.phone}
                    </span>
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                        {c.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Escalation Rank {c.priority}</span>
                <button
                  onClick={() => handleDeleteContact(c.id, c.name)}
                  disabled={deletingContactId === c.id}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title={`Delete emergency contact ${c.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-black text-slate-900 mb-4">Add Emergency Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smt. Sunita Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Daughter-in-law, Sister"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value={1}>Priority 1 (First Responder)</option>
                  <option value={2}>Priority 2 (Secondary Family)</option>
                  <option value={3}>Priority 3 (Attending Doctor)</option>
                </select>
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
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
