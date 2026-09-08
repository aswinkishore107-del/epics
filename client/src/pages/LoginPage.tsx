import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Heart,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  Stethoscope,
  Users,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('VioraDemo123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('VioraDemo123!');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);

      // Route to appropriate role dashboard
      if (user.role === 'ELDERLY') navigate('/elderly');
      else if (user.role === 'CAREGIVER') navigate('/caregiver');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/30">
            <Heart className="w-8 h-8 fill-current animate-pulse-slow" />
          </div>
          <h1 className="text-3xl font-black text-white">Sign In to VIORA</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access Elderly, Caregiver, or Doctor Health Portals
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="mb-6 bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-2 text-center">
            🚀 1-Click Quick Demo Sign In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('elderly@viora.demo')}
              className="bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Heart className="w-3.5 h-3.5 text-teal-400" />
              <span>Elderly (Rajesh)</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('caregiver@viora.demo')}
              className="bg-slate-800 hover:bg-slate-700 border border-blue-500/30 text-blue-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Caregiver (Priya)</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('doctor@viora.demo')}
              className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doctor (Dr. Arvind)</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('admin@viora.demo')}
              className="bg-slate-800 hover:bg-slate-700 border border-purple-500/30 text-purple-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>System Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elderly@viora.demo"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          VIORA Smart Health • Strictly RBAC Guarded
        </p>
      </div>
    </div>
  );
};
