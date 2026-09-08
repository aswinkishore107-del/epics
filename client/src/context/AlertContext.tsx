import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../api/client';
import { EmergencyEvent, Alert } from '../types';

interface AlertContextType {
  activeEmergency: EmergencyEvent | null;
  fallCountdown: number | null; // null or remaining seconds (15..0)
  currentFallId: string | null;
  cancelFallAlert: () => Promise<void>;
  acknowledgeEmergency: (id: string) => Promise<void>;
  resolveEmergency: (id: string, notes?: string) => Promise<void>;
  incomingCall: any | null;
  answerCall: () => void;
  declineCall: () => void;
  phoneNotifications: any[];
  dismissPhoneNotification: (index: number) => void;
  latestAlert: Alert | null;
  dismissLatestAlert: () => void;
  triggerEmergencyAlert: (alert: any) => void;
  triggerFallCountdown: (seconds?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Web Audio API sound generator
class SoundEffects {
  private ctx: AudioContext | null = null;
  private alarmOscillator: OscillatorNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  startAlarm() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      if (this.alarmOscillator) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);

      // Pulse frequency
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(3, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
      lfo.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.alarmOscillator = osc;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  stopAlarm() {
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch {}
      this.alarmOscillator = null;
    }
  }
}

const sounds = new SoundEffects();

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const { user, activePatientId } = useAuth();

  const [activeEmergency, setActiveEmergency] = useState<EmergencyEvent | null>(null);
  const [fallCountdown, setFallCountdown] = useState<number | null>(null);
  const [currentFallId, setCurrentFallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [phoneNotifications, setPhoneNotifications] = useState<any[]>([]);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);

  const countdownTimerRef = useRef<any>(null);

  // Poll for existing active emergency when activePatientId changes
  useEffect(() => {
    if (!activePatientId) return;

    api.get(`/emergency/active/${activePatientId}`)
      .then((res) => {
        if (res.data?.data) {
          setActiveEmergency(res.data.data);
          if (res.data.data.status === 'ACTIVE') {
            sounds.startAlarm();
          }
        }
      })
      .catch(() => {});
  }, [activePatientId]);

  // Socket event listeners for real-time safety and alerts
  useEffect(() => {
    if (!socket) return;

    // 1. Emergency created (Manual SOS or confirmed Fall)
    socket.on('emergency_created', (data: { emergency: EmergencyEvent; patientId: string }) => {
      setActiveEmergency(data.emergency);
      sounds.startAlarm();
    });

    // 2. Emergency acknowledged
    socket.on('emergency_acknowledged', (data: { emergency: EmergencyEvent }) => {
      setActiveEmergency(data.emergency);
    });

    // 3. Emergency resolved
    socket.on('emergency_resolved', () => {
      setActiveEmergency(null);
      sounds.stopAlarm();
    });

    // 4. Fall detected (Start 15s Countdown)
    socket.on('fall_detected', (data: { fall: any; countdownSeconds: number; patientId: string }) => {
      setCurrentFallId(data.fall.id);
      setFallCountdown(data.countdownSeconds || 15);
      sounds.playChime();

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setFallCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 5. Fall cancelled
    socket.on('fall_cancelled', () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setFallCountdown(null);
      setCurrentFallId(null);
    });

    // 6. New Alert from SafetyRuleEngine
    socket.on('new_alert', (data: { alert: Alert }) => {
      setLatestAlert(data.alert);
      sounds.playChime();
    });

    // 7. Simulated Phone Notification
    socket.on('phone_notification', (data: any) => {
      setPhoneNotifications((prev) => [data, ...prev].slice(0, 5));
      sounds.playChime();
    });

    // 8. Simulated Phone Call Command
    socket.on('call_command', (data: any) => {
      if (data.action === 'INCOMING') {
        setIncomingCall(data.contact);
        sounds.playChime();
      } else if (data.action === 'END' || data.action === 'DECLINE') {
        setIncomingCall(null);
      }
    });

    return () => {
      socket.off('emergency_created');
      socket.off('emergency_acknowledged');
      socket.off('emergency_resolved');
      socket.off('fall_detected');
      socket.off('fall_cancelled');
      socket.off('new_alert');
      socket.off('phone_notification');
      socket.off('call_command');
    };
  }, [socket]);

  const cancelFallAlert = async () => {
    if (!currentFallId || !activePatientId) return;
    try {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      await api.post('/emergency/fall/cancel', {
        fallId: currentFallId,
        patientId: activePatientId,
      });
      setFallCountdown(null);
      setCurrentFallId(null);
    } catch (err) {
      console.error('Failed to cancel fall alert', err);
    }
  };

  const acknowledgeEmergency = async (id: string) => {
    try {
      const res = await api.post(`/emergency/acknowledge/${id}`);
      setActiveEmergency(res.data.data);
    } catch (err) {
      console.error('Failed to acknowledge emergency', err);
    }
  };

  const resolveEmergency = async (id: string, notes?: string) => {
    try {
      await api.post(`/emergency/resolve/${id}`, { notes });
      setActiveEmergency(null);
      sounds.stopAlarm();
    } catch (err) {
      console.error('Failed to resolve emergency', err);
    }
  };

  const answerCall = () => {
    setIncomingCall(null);
    alert('Simulated Phone Call: Connected via VIORA Neckband Speaker & Mic.');
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  const dismissPhoneNotification = (index: number) => {
    setPhoneNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  const dismissLatestAlert = () => {
    setLatestAlert(null);
  };

  const triggerEmergencyAlert = (emergency: any) => {
    setActiveEmergency(emergency);
    sounds.startAlarm();
  };

  const triggerFallCountdown = (seconds: number = 15) => {
    setFallCountdown(seconds);
    sounds.startAlarm();
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setFallCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <AlertContext.Provider
      value={{
        activeEmergency,
        fallCountdown,
        currentFallId,
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
        triggerEmergencyAlert,
        triggerFallCountdown,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
