import React from 'react';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  PhoneCall,
  PhoneOff,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  ShieldAlert,
  Bell,
  X,
} from 'lucide-react';

export const GlobalEmergencyModal: React.FC = () => {
  const {
    activeEmergency,
    fallCountdown,
    cancelFallAlert,
    acknowledgeEmergency,
    resolveEmergency,
    incomingCall,
    answerCall,
    declineCall,
    phoneNotifications,
    dismissPhoneNotification,
    latestAlert,
    dismissLatestAlert,
  } = useAlert();

  const { user } = useAuth();

  return (
    <>
      {/* 1. Fall Countdown Modal (15-second Verification Window) */}
      {fallCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border-4 border-amber-500 text-center animate-bounce-slight">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-12 h-12" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2">Possible Fall Detected!</h2>
            <p className="text-lg text-slate-600 mb-6">
              The VIORA neckband motion sensor detected a sudden impact. Are you okay?
            </p>

            <div className="my-6">
              <div className="w-24 h-24 rounded-full border-8 border-amber-500 border-t-transparent animate-spin mx-auto flex items-center justify-center text-4xl font-black text-amber-600">
                <span className="animate-none">{fallCountdown}s</span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-3">
                Emergency contacts will be notified automatically if uncancelled.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={cancelFallAlert}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xl py-5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-8 h-8" />
                I Am Okay (Cancel Alert)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Emergency Event Banner / Full-screen Overlay */}
      {activeEmergency && (
        <div className="fixed inset-x-0 top-0 z-50 bg-red-600 text-white shadow-2xl p-4 sm:p-6 border-b-4 border-red-800 animate-pulse">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white text-red-700 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeEmergency.type} EMERGENCY
                  </span>
                  <span className="text-xs bg-red-900/60 px-2 py-0.5 rounded text-red-200">
                    STATUS: {activeEmergency.status}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                  Active Emergency Alert for Rajesh Kumar
                </h3>
                <div className="flex items-center gap-4 text-xs sm:text-sm text-red-100 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeEmergency.location || 'Home'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(activeEmergency.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {activeEmergency.status === 'ACTIVE' && (
                <button
                  onClick={() => acknowledgeEmergency(activeEmergency.id)}
                  className="bg-white text-red-700 hover:bg-red-50 font-bold px-6 py-3 rounded-xl shadow transition-all active:scale-95 text-sm sm:text-base flex-1 md:flex-initial"
                >
                  Acknowledge
                </button>
              )}

              <button
                onClick={() => resolveEmergency(activeEmergency.id, 'Resolved from dashboard')}
                className="bg-red-900 hover:bg-red-950 text-white font-bold px-6 py-3 rounded-xl shadow transition-all active:scale-95 text-sm sm:text-base flex-1 md:flex-initial border border-red-700"
              >
                Resolve & Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Incoming Simulated Phone Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-700 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <PhoneCall className="w-10 h-10" />
            </div>

            <span className="text-xs uppercase tracking-widest text-teal-400 font-mono">
              VIORA Neckband Audio Call
            </span>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{incomingCall.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{incomingCall.phone}</p>

            <p className="text-xs text-slate-400 my-4 bg-slate-800 p-2.5 rounded-xl border border-slate-700">
              Audio will route through VIORA Neckband Speaker & I2S Microphone
            </p>

            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 animate-bounce"
                title="Answer on Neckband"
              >
                <PhoneCall className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Simulated Phone Notification Popups */}
      {phoneNotifications.length > 0 && (
        <div className="fixed top-20 right-6 z-40 flex flex-col gap-2 max-w-sm w-full">
          {phoneNotifications.map((notif, idx) => (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-teal-200 text-slate-900 flex items-start gap-3 animate-in slide-in-from-right"
            >
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    {notif.appName || 'Phone Notification'}
                  </span>
                  <button
                    onClick={() => dismissPhoneNotification(idx)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h5 className="font-semibold text-sm text-slate-900 truncate">{notif.sender || 'Message'}</h5>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Real-time Safety Rule Alert Toast */}
      {latestAlert && (
        <div className="fixed bottom-20 left-6 z-40 max-w-md w-full bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl shadow-xl text-amber-950 flex items-start gap-3 animate-in slide-in-from-left">
          <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {latestAlert.severity} Alert
              </span>
              <button onClick={dismissLatestAlert} className="text-amber-700 hover:text-amber-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h5 className="font-bold text-sm mt-0.5">{latestAlert.title}</h5>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">{latestAlert.message}</p>
          </div>
        </div>
      )}
    </>
  );
};
