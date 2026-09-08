import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Conversation, Message } from '../../types';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCheck,
  Circle,
  Smile,
} from 'lucide-react';

export const ElderlyMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, sendTypingStarted, sendTypingStopped } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch user conversations
  useEffect(() => {
    api.get('/messages/conversations')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setConversations(res.data.data);
          setActiveConvId(res.data.data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching conversations:', err))
      .finally(() => setLoading(false));
  }, []);

  // When activeConvId changes, fetch messages & join socket room
  useEffect(() => {
    if (!activeConvId) return;

    joinConversation(activeConvId);

    api.get(`/messages/conversations/${activeConvId}/messages`)
      .then((res) => {
        if (res.data?.data) {
          setMessages(res.data.data);
        }
      })
      .catch((err) => console.error('Error fetching messages:', err));

    return () => {
      leaveConversation(activeConvId);
    };
  }, [activeConvId]);

  // Real-time message events
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (msg: Message) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('typing_started', (data: { conversationId: string; senderName: string }) => {
      if (data.conversationId === activeConvId) {
        setTypingUser(data.senderName);
      }
    });

    socket.on('typing_stopped', (data: { conversationId: string }) => {
      if (data.conversationId === activeConvId) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_started');
      socket.off('typing_stopped');
    };
  }, [socket, activeConvId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;

    const messageContent = text;
    setText('');
    sendTypingStopped(activeConvId);

    try {
      await api.post(`/messages/conversations/${activeConvId}/messages`, {
        content: messageContent,
        messageType: 'TEXT',
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (!activeConvId) return;
    if (val.trim()) {
      sendTypingStarted(activeConvId, user?.firstName || 'Rajesh');
    } else {
      sendTypingStopped(activeConvId);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-8rem)]">
      {/* Conversation Channels List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-4 flex flex-col shrink-0">
        <h3 className="text-xl font-black text-slate-900 mb-3 px-2">Family & Care Team</h3>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {conversations.map((conv) => {
            const isCurrent = conv.id === activeConvId;
            const otherParticipant = conv.participants.find((p) => p.userId !== user?.id)?.user;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-md font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {otherParticipant?.firstName?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold truncate">
                      {conv.title || `${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                    </h4>
                    <span className={`text-xs truncate block ${isCurrent ? 'text-teal-100' : 'text-slate-400'}`}>
                      {otherParticipant?.role === 'DOCTOR' ? 'Doctor / Cardiology' : 'Caregiver / Family'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Workspace */}
      <div className="flex-1 flex flex-col justify-between bg-white h-full">
        {/* Active Conversation Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {activeConv?.title || 'Care Conversation'}
            </h3>
            <span className="text-xs text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
              <Circle className="w-2 h-2 fill-current text-emerald-500" />
              <span>Real-Time Socket Connected</span>
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
          {messages.map((m) => {
            const isMe = m.senderId === user?.id;

            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md rounded-3xl p-4 text-base leading-relaxed ${
                    isMe
                      ? 'bg-teal-600 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-slate-100 text-slate-900 font-medium rounded-tl-none border border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-bold block mb-1 ${isMe ? 'text-teal-200' : 'text-slate-500'}`}>
                    {isMe ? 'You' : `${m.sender.firstName} (${m.sender.role})`}
                  </span>
                  <p>{m.content}</p>
                  <span className={`text-[10px] block mt-1.5 text-right ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {typingUser && (
            <div className="text-xs text-slate-400 italic font-semibold px-2 animate-pulse">
              {typingUser} is typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box (Large touch target) */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message to Priya or Dr. Sharma..."
            className="flex-1 bg-white border-2 border-slate-200 focus:border-teal-500 rounded-2xl py-3.5 px-4 text-base text-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2 text-base"
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
