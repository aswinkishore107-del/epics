import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastTelemetry: any | null;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStarted: (conversationId: string, senderName: string) => void;
  sendTypingStopped: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, activePatientId } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTelemetry, setLastTelemetry] = useState<any | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io('/', {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (activePatientId) {
        newSocket.emit('join_patient', activePatientId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // When activePatientId changes, join that patient room
  useEffect(() => {
    if (socket && activePatientId && isConnected) {
      socket.emit('join_patient', activePatientId);
    }
  }, [socket, activePatientId, isConnected]);

  const joinConversation = (conversationId: string) => {
    socket?.emit('join_conversation', conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socket?.emit('leave_conversation', conversationId);
  };

  const sendTypingStarted = (conversationId: string, senderName: string) => {
    socket?.emit('typing_started', { conversationId, senderName });
  };

  const sendTypingStopped = (conversationId: string) => {
    socket?.emit('typing_stopped', { conversationId });
  };

  // Listen for real-time vitals and device status
  useEffect(() => {
    if (!socket) return;
    const handleVitals = (data: any) => {
      setLastTelemetry((prev: any) => ({ ...prev, ...data }));
    };
    const handleDevice = (data: any) => {
      setLastTelemetry((prev: any) => ({ ...prev, ...data }));
    };

    socket.on('vitals_updated', handleVitals);
    socket.on('device_status_updated', handleDevice);

    return () => {
      socket.off('vitals_updated', handleVitals);
      socket.off('device_status_updated', handleDevice);
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastTelemetry,
        joinConversation,
        leaveConversation,
        sendTypingStarted,
        sendTypingStopped,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
