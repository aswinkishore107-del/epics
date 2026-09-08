import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('viora_token');
    const savedUser = localStorage.getItem('viora_user');
    const savedPatientId = localStorage.getItem('viora_active_patient_id');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        if (savedPatientId) {
          setActivePatientId(savedPatientId);
        } else if (parsedUser.role === 'ELDERLY' && parsedUser.profile?.id) {
          setActivePatientId(parsedUser.profile.id);
        }
      } catch (err) {
        console.error('Failed to parse saved auth state', err);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('viora_token', newToken);
    localStorage.setItem('viora_user', JSON.stringify(newUser));

    // Automatically set active patient id for elderly
    if (newUser.role === 'ELDERLY' && (newUser as any).profile?.id) {
      const pId = (newUser as any).profile.id;
      setActivePatientId(pId);
      localStorage.setItem('viora_active_patient_id', pId);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActivePatientId(null);
    localStorage.removeItem('viora_token');
    localStorage.removeItem('viora_user');
    localStorage.removeItem('viora_active_patient_id');
    window.location.href = '/login';
  };

  const handleSetActivePatientId = (id: string | null) => {
    setActivePatientId(id);
    if (id) {
      localStorage.setItem('viora_active_patient_id', id);
    } else {
      localStorage.removeItem('viora_active_patient_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        activePatientId,
        setActivePatientId: handleSetActivePatientId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
