import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../api/client';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  Bell,
  Sparkles,
  Cpu,
  Radio,
  Clock,
  User,
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

const PLAYLIST: Track[] = [
  { id: '1', title: 'Gentle Morning Flute & Raga', artist: 'VIORA Calming Collection', duration: '4:20' },
  { id: '2', title: 'Courtyard Birdsong & Wind Chimes', artist: 'Nature Relaxation', duration: '5:15' },
  { id: '3', title: 'Evening Sitara Ambient Serenity', artist: 'Peaceful Mind Series', duration: '6:30' },
  { id: '4', title: 'Guided Breathing & Mindfulness Soundscape', artist: 'Geriatric Wellness Lab', duration: '3:45' },
];

export const ElderlyEntertainmentPage: React.FC = () => {
  const { activePatientId } = useAuth();
  const { socket } = useSocket();
  const { phoneNotifications, dismissPhoneNotification } = useAlert();

  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  // Phone Call State
  const [activeCallContact, setActiveCallContact] = useState<{ name: string; phone: string } | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);

  // Socket command listener
  useEffect(() => {
    if (!socket) return;

    socket.on('music_command', (data: { command: string; volume?: number }) => {
      if (data.command === 'PLAY' || data.command === 'RESUME') setIsPlaying(true);
      else if (data.command === 'PAUSE') setIsPlaying(false);
      else if (data.command === 'NEXT') handleNextTrack();
      else if (data.command === 'PREVIOUS') handlePrevTrack();
      else if (data.command === 'SET_VOLUME' && data.volume !== undefined) setVolume(data.volume);
    });

    return () => {
      socket.off('music_command');
    };
  }, [socket, currentTrackIndex]);

  // Active call duration timer
  useEffect(() => {
    let timer: any;
    if (activeCallContact) {
      timer = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeCallContact]);

  const sendMediaCommand = async (command: 'PLAY' | 'PAUSE' | 'RESUME' | 'NEXT' | 'PREVIOUS' | 'SET_VOLUME', newVol?: number) => {
    if (!activePatientId) return;
    try {
      await api.post('/devices/VIORA-NECK-7291/media', {
        patientId: activePatientId,
        command,
        volume: newVol ?? volume,
        track: PLAYLIST[currentTrackIndex].title,
      });
    } catch (err) {
      console.error('Media command error:', err);
    }
  };

  const handlePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    sendMediaCommand(nextState ? 'PLAY' : 'PAUSE');
  };

  const handleNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
    sendMediaCommand('NEXT');
  };

  const handlePrevTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIndex);
    sendMediaCommand('PREVIOUS');
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sendMediaCommand('SET_VOLUME', newVol);
  };

  const handleStartCall = async (contact: { name: string; phone: string }) => {
    setActiveCallContact(contact);
    if (!activePatientId) return;
    try {
      await api.post('/devices/VIORA-NECK-7291/call', {
        patientId: activePatientId,
        action: 'INITIATE',
        contact,
      });
    } catch (err) {
      console.error('Call initiation error:', err);
    }
  };

  const handleEndCall = async () => {
    if (!activePatientId || !activeCallContact) return;
    try {
      await api.post('/devices/VIORA-NECK-7291/call', {
        patientId: activePatientId,
        action: 'END',
        contact: activeCallContact,
      });
      setActiveCallContact(null);
    } catch (err) {
      console.error('End call error:', err);
      setActiveCallContact(null);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Distinction Banner: Simulated vs Real ESP32 */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">VIORA Device Abstraction Layer</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono uppercase">
                Demo Simulator Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrates simulated neckband audio playback (MAX98357A amplifier) & smartphone phone call bridging.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            api.post('/devices/simulator/trigger', {
              patientId: activePatientId,
              action: 'INCOMING_CALL',
            });
          }}
          className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold px-4 py-2 rounded-xl border border-teal-500/30 shrink-0 cursor-pointer"
        >
          Test Incoming Call Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. MUSIC & RELAXATION PLAYER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center">
                  <Music className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Music & Relaxation</h3>
                  <p className="text-xs text-slate-500">Audio plays through VIORA Neckband Speaker</p>
                </div>
              </div>

              {/* Animated Equalizer Waveform */}
              {isPlaying && (
                <div className="flex items-end gap-1 h-8 px-3 py-1 bg-pink-50 rounded-xl">
                  <span className="w-1.5 bg-pink-500 rounded-full animate-pulse h-4" />
                  <span className="w-1.5 bg-pink-600 rounded-full animate-pulse h-7" />
                  <span className="w-1.5 bg-pink-400 rounded-full animate-pulse h-3" />
                  <span className="w-1.5 bg-pink-500 rounded-full animate-pulse h-6" />
                </div>
              )}
            </div>

            {/* Current Track Card */}
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 my-4">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-widest block mb-1">
                Now Playing ({currentTrackIndex + 1} of {PLAYLIST.length})
              </span>
              <h4 className="text-2xl font-black text-slate-900">{PLAYLIST[currentTrackIndex].title}</h4>
              <p className="text-sm font-semibold text-slate-500 mt-1">{PLAYLIST[currentTrackIndex].artist}</p>
              <span className="text-xs text-slate-400 mt-2 block font-mono">{PLAYLIST[currentTrackIndex].duration}</span>
            </div>

            {/* Playback Controls (Large, Easy to Press) */}
            <div className="flex items-center justify-center gap-6 my-6">
              <button
                onClick={handlePrevTrack}
                className="w-14 h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-20 h-20 bg-pink-600 hover:bg-pink-700 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-pink-600/30 transition-all active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
              </button>

              <button
                onClick={handleNextTrack}
                className="w-14 h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Next Track"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <Volume2 className="w-6 h-6 text-slate-600 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-pink-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700 w-12 text-right">{volume}%</span>
            </div>
          </div>

          {/* Tracklist selection */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Playlist</span>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {PLAYLIST.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                    sendMediaCommand('PLAY');
                  }}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer text-sm font-semibold transition-all ${
                    idx === currentTrackIndex ? 'bg-pink-50 text-pink-700 font-bold border border-pink-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}</span>
                    <span>{track.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. PHONE CALLS & SMARTPHONE NOTIFICATIONS */}
        <div className="space-y-6">
          {/* Quick Family Call Controls */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Phone Calls</h3>
                <p className="text-xs text-slate-500">Call family members via VIORA Neckband Audio</p>
              </div>
            </div>

            {/* If Call is Active */}
            {activeCallContact ? (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 text-center animate-pulse-slow">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-1">
                  Active Call in Progress
                </span>
                <h4 className="text-2xl font-black text-slate-900">{activeCallContact.name}</h4>
                <p className="text-sm text-slate-600">{activeCallContact.phone}</p>
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-mono text-xl font-bold my-3">
                  <Clock className="w-5 h-5" />
                  <span>{formatSeconds(callSeconds)}</span>
                </div>

                <button
                  onClick={handleEndCall}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-3 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto cursor-pointer"
                >
                  <PhoneOff className="w-6 h-6" />
                  <span>End Call</span>
                </button>
              </div>
            ) : (
              /* Quick Call Contact Buttons */
              <div className="space-y-3">
                <button
                  onClick={() => handleStartCall({ name: 'Priya Kumar (Daughter)', phone: '+91 98765 43210' })}
                  className="w-full bg-slate-50 hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      P
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block">Priya Kumar</span>
                      <span className="text-xs font-semibold text-slate-500">Daughter • Primary Caregiver</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => handleStartCall({ name: 'Amit Kumar (Son)', phone: '+91 98765 43211' })}
                  className="w-full bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      A
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block">Amit Kumar</span>
                      <span className="text-xs font-semibold text-slate-500">Son • Family Contact</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => handleStartCall({ name: 'Dr. Arvind Sharma (Cardiologist)', phone: '+91 98112 34567' })}
                  className="w-full bg-slate-50 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                      Dr
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block">Dr. Arvind Sharma</span>
                      <span className="text-xs font-semibold text-slate-500">Attending Cardiologist</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Smartphone Notifications Display */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">Phone Notifications</h4>
                  <p className="text-xs text-slate-500">Mirrored from paired smartphone</p>
                </div>
              </div>

              <button
                onClick={() => {
                  api.post('/devices/simulator/trigger', {
                    patientId: activePatientId,
                    action: 'PHONE_NOTIFICATION',
                  });
                }}
                className="text-xs text-teal-600 hover:text-teal-700 font-bold"
              >
                + Push Demo
              </button>
            </div>

            <div className="space-y-2">
              {phoneNotifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No incoming phone notifications. Click &quot;+ Push Demo&quot; to test.
                </div>
              ) : (
                phoneNotifications.map((n, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-teal-700 uppercase">{n.appName || 'Phone'}</span>
                      <h5 className="text-sm font-bold text-slate-800">{n.sender || 'Update'}</h5>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                    <button
                      onClick={() => dismissPhoneNotification(i)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
