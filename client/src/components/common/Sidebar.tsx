import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Pill,
  CalendarCheck,
  Smile,
  AlertOctagon,
  Music,
  Mic,
  MessageSquare,
  Users,
  Cpu,
  ShieldCheck,
  FileText,
  ClipboardList,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 z-20">
      <div className="space-y-1">
        {/* ELDERLY NAVIGATION */}
        {role === 'ELDERLY' && (
          <>
            <SidebarItem to="/elderly" icon={<LayoutDashboard className="w-5 h-5 text-teal-600" />} label="Dashboard" end />
            <SidebarItem to="/elderly/health" icon={<HeartPulse className="w-5 h-5 text-rose-500" />} label="My Health" />
            <SidebarItem to="/elderly/ecg" icon={<Activity className="w-5 h-5 text-emerald-500" />} label="ECG & Respiration" />
            <SidebarItem to="/elderly/medications" icon={<Pill className="w-5 h-5 text-indigo-500" />} label="My Medicines" />
            <SidebarItem to="/elderly/reminders" icon={<CalendarCheck className="w-5 h-5 text-amber-500" />} label="My Reminders" />
            <SidebarItem to="/elderly/wellness" icon={<Smile className="w-5 h-5 text-purple-500" />} label="Wellness Check" />
            <SidebarItem to="/elderly/emergency" icon={<AlertOctagon className="w-5 h-5 text-red-600" />} label="Emergency SOS" badge="Priority" />
            <SidebarItem to="/elderly/entertainment" icon={<Music className="w-5 h-5 text-pink-500" />} label="Music & Calls" />
            <SidebarItem to="/elderly/voice" icon={<Mic className="w-5 h-5 text-teal-500" />} label="Talk to VIORA" />
            <SidebarItem to="/elderly/messages" icon={<MessageSquare className="w-5 h-5 text-blue-500" />} label="Messages" />
            <SidebarItem to="/elderly/community" icon={<Users className="w-5 h-5 text-emerald-600" />} label="Community" />
            <SidebarItem to="/elderly/device" icon={<Cpu className="w-5 h-5 text-slate-600" />} label="Neckband Device" />
          </>
        )}

        {/* CAREGIVER NAVIGATION */}
        {role === 'CAREGIVER' && (
          <>
            <SidebarItem to="/caregiver" icon={<LayoutDashboard className="w-5 h-5 text-teal-600" />} label="Caregiver Overview" end />
            <SidebarItem to="/caregiver/patients" icon={<Users className="w-5 h-5 text-blue-500" />} label="Patients Directory" />
            <SidebarItem to="/caregiver/health" icon={<HeartPulse className="w-5 h-5 text-rose-500" />} label="Vitals & Trends" />
            <SidebarItem to="/caregiver/alerts" icon={<AlertOctagon className="w-5 h-5 text-red-500" />} label="Alerts & SOS" />
            <SidebarItem to="/caregiver/medications" icon={<Pill className="w-5 h-5 text-indigo-500" />} label="Medication Adherence" />
            <SidebarItem to="/caregiver/messages" icon={<MessageSquare className="w-5 h-5 text-emerald-500" />} label="Team Messages" />
            <SidebarItem to="/caregiver/community" icon={<Users className="w-5 h-5 text-purple-500" />} label="Community Circle" />
            <SidebarItem to="/caregiver/settings" icon={<ShieldCheck className="w-5 h-5 text-slate-500" />} label="Safety Rules" />
          </>
        )}

        {/* DOCTOR NAVIGATION */}
        {role === 'DOCTOR' && (
          <>
            <SidebarItem to="/doctor" icon={<LayoutDashboard className="w-5 h-5 text-teal-600" />} label="Clinical Triage" end />
            <SidebarItem to="/doctor/ecg" icon={<Activity className="w-5 h-5 text-rose-500" />} label="ECG & EDR Waves" />
            <SidebarItem to="/doctor/notes" icon={<ClipboardList className="w-5 h-5 text-indigo-500" />} label="Clinical Notes" />
            <SidebarItem to="/doctor/reports" icon={<FileText className="w-5 h-5 text-amber-500" />} label="Health Reports" />
            <SidebarItem to="/doctor/messages" icon={<MessageSquare className="w-5 h-5 text-blue-500" />} label="Consultation Chat" />
            <SidebarItem to="/doctor/rules" icon={<ShieldCheck className="w-5 h-5 text-slate-500" />} label="Safety Thresholds" />
          </>
        )}

        {/* ADMIN NAVIGATION */}
        {role === 'ADMIN' && (
          <>
            <SidebarItem to="/admin" icon={<LayoutDashboard className="w-5 h-5 text-teal-600" />} label="Admin Dashboard" end />
            <SidebarItem to="/admin/rules" icon={<ShieldCheck className="w-5 h-5 text-indigo-500" />} label="Configurable Rules" />
          </>
        )}
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  end?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, badge, end }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
          isActive
            ? 'bg-teal-50 text-teal-800 font-bold shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
        }`
      }
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
          {badge}
        </span>
      )}
    </NavLink>
  );
};
