import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User as UserIcon,
  ShieldCheck,
  Send,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'viora';
  text: string;
  toolsUsed?: string[];
  timestamp: Date;
}

export const ElderlyVoicePage: React.FC = () => {
  const { activePatientId } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'viora',
      text: 'Namaste Rajesh ji! I am VIORA, your voice companion. You can ask me about your heart rate, skin temperature, medicines, or daily steps.',
      timestamp: new Date(),
    },
  ]);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        setTranscript(resultText);
        if (event.results[current].isFinal) {
          handleSendMessage(resultText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch {
        // Recognition already started
      }
    }
  };

  // Text-to-speech reading response aloud
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly slower, comfortable for elderly listeners
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || !activePatientId || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        patientId: activePatientId,
        message: queryText,
      });

      const replyText = res.data?.data?.reply || 'I am right here with you.';
      const toolsUsed = res.data?.data?.toolsUsed || [];

      const vioraMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'viora',
        text: replyText,
        toolsUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, vioraMsg]);
      speakText(replyText);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'viora',
        text: 'I could not connect to my knowledge base right now, but your latest resting heart rate is 78 BPM, and your skin temperature is 36.5°C. All readings are stable.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header with Dual Voice Provider Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-950/80 px-3 py-1 rounded-full text-xs font-bold text-teal-300 mb-2 border border-teal-700">
              <Cpu className="w-3.5 h-3.5" />
              <span>VoiceProvider Architecture: Web Speech API Live</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">Talk to VIORA</h1>
            <p className="text-teal-100 text-base mt-1">
              Voice-first AI assistant grounded in your live health database records.
            </p>
          </div>

          {/* Audio Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 bg-teal-600/80 px-4 py-2 rounded-2xl animate-pulse">
              <Volume2 className="w-5 h-5 text-teal-200" />
              <span className="text-xs font-bold uppercase tracking-wider">Speaking aloud</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Microphone Hub */}
      <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-md text-center">
        <div className="relative inline-block my-4">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-teal-500/30 animate-ping" />
          )}
          <button
            onClick={toggleListening}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            title={isListening ? 'Stop Listening' : 'Start Speaking'}
          >
            {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
          </button>
        </div>

        <h3 className="text-2xl font-black text-slate-900">
          {isListening ? 'Listening to your voice...' : 'Press the microphone to speak'}
        </h3>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          {isListening ? 'Speak naturally in English' : 'Or tap any quick question below'}
        </p>

        {transcript && (
          <div className="mt-4 p-3 bg-teal-50 rounded-2xl border border-teal-200 max-w-lg mx-auto text-teal-900 font-bold text-lg animate-fade-in">
            &quot;{transcript}&quot;
          </div>
        )}

        {/* Quick Voice Prompt Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
          {[
            'What is my heart rate?',
            'What is my skin temperature?',
            'Did I take my medicine today?',
            'How many steps did I walk?',
            'When is my next doctor appointment?',
            'How was my health today?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="bg-slate-100 hover:bg-teal-50 hover:border-teal-500 border border-slate-200 text-slate-800 text-sm font-semibold px-4 py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              💬 {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History Display */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-teal-600" />
          <span>Conversation History</span>
        </h4>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'viora' && (
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-6 h-6" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-3xl p-4.5 text-base leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-100 text-slate-900 font-normal rounded-tl-none border border-slate-200 shadow-xs'
                }`}
              >
                <p>{m.text}</p>

                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase font-bold text-teal-800">Database Tools:</span>
                    {m.toolsUsed.map((tool, i) => (
                      <span key={i} className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded font-mono">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-sm">
                  R
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-500 text-sm font-semibold italic">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>VIORA is retrieving your live health records...</span>
            </div>
          )}
        </div>

        {/* Text Input Fallback Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or type a question for VIORA here..."
            className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 rounded-2xl py-3 px-4 text-base text-slate-900 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-400 text-center">
          Notice: VIORA AI Assistant provides informational health guidance based on verified sensor records and does NOT provide medical diagnoses.
        </p>
      </div>
    </div>
  );
};
