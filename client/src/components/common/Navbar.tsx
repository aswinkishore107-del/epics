import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Device, Notification } from '../../types';
import {
  Heart,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Activity,
  Check,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, activePatientId, setActivePatientId } = useAuth();
  const { socket, isConnected } = useSocket();

  const [device, setDevice] = useState<Device | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [patientsList, setPatientsList] = useState<any[]>([]);

  // Fetch device and notifications
  useEffect(() => {
    if (activePatientId) {
      api.get(`/devices/patient/${activePatientId}`)
        .then((res) => {
          if (res.data?.data) setDevice(res.data.data);
        })
        .catch(() => {});
    }

    api.get('/notifications')
      .then((res) => {
        if (res.data?.data) setNotifications(res.data.data);
      })
      .catch(() => {});

    // If caregiver or doctor, fetch list of authorized patients
    if (user && (user.role === 'CAREGIVER' || user.role === 'DOCTOR')) {
      api.get('/patients')
        .then((res) => {
          if (res.data?.data) {
            setPatientsList(res.data.data);
            if (!activePatientId && res.data.data.length > 0) {
              setActivePatientId(res.data.data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [activePatientId, user]);

  // Real-time socket events for device & notifications
  useEffect(() => {
    if (!socket) return;

    socket.on('device_status_updated', (updated: Device) => {
      setDevice(updated);
    });

    socket.on('battery_updated', (data: { batteryLevel: number; chargingStatus: any }) => {
      setDevice((prev) => (prev ? { ...prev, batteryLevel: data.batteryLevel, chargingStatus: data.chargingStatus } : prev));
    });

    socket.on('new_notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off('device_status_updated');
      socket.off('battery_updated');
      socket.off('new_notification');
    };
  }, [socket]);

  const markAllNotificationsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
            <Heart className="w-6 h-6 fill-current animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">VIORA</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              AI Smart Health Platform for Elderly Well-being
            </p>
          </div>
        </div>

        {/* Center: Active Patient Selector (for Caregiver / Doctor) */}
        {(user?.role === 'CAREGIVER' || user?.role === 'DOCTOR') && patientsList.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Monitoring:</span>
            <select
              value={activePatientId || ''}
              onChange={(e) => setActivePatientId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {patientsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user?.firstName} {p.user?.lastName} (Age 72)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Controls: Device Telemetry + Notifications + User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Device Telemetry Widget */}
          {device && (
            <div
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs"
              title={`VIORA Neckband v${device.firmwareVersion} (${device.connectionStatus})`}
            >
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                {device.chargingStatus === 'CHARGING' ? (
                  <BatteryCharging className="w-4 h-4 text-amber-500 animate-pulse" />
                ) : (
                  <Battery
                    className={`w-4 h-4 ${
                      device.batteryLevel > 20 ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  />
                )}
                <span>{device.batteryLevel}%</span>
              </div>

              <div className="h-3 w-[1px] bg-slate-200 mx-0.5" />

              <div className="flex items-center gap-1.5 text-slate-400">
                <Wifi
                  className={`w-3.5 h-3.5 ${
                    device.wifiStatus === 'CONNECTED' ? 'text-teal-600' : 'text-slate-300'
                  }`}
                />
                <Bluetooth
                  className={`w-3.5 h-3.5 ${
                    device.bluetoothStatus === 'CONNECTED' ? 'text-blue-600' : 'text-slate-300'
                  }`}
                />
              </div>

              <span className="hidden lg:inline text-[10px] text-teal-700 font-mono bg-teal-50 px-1 rounded">
                TMP117 • AD8232 EDR
              </span>
            </div>
          )}

          {/* WebSocket Live Connection Pill */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-400'
            }`}
            title={isConnected ? 'Real-time WebSocket Live' : 'Reconnecting...'}
          />

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">No notifications yet</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 hover:bg-slate-50 transition-all ${
                          !notif.isRead ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-slate-400 block">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
