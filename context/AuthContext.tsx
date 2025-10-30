'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminProfile } from '@/types';

interface AuthContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (adminProfile: AdminProfile) => void;
  logout: () => void;
  updateAdmin: (adminProfile: AdminProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch admin profile from server on mount
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.adminProfile) {
          setAdmin(data.adminProfile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (adminProfile: AdminProfile) => {
    setAdmin(adminProfile);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAdmin(null);
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateAdmin = (adminProfile: AdminProfile) => {
    setAdmin(adminProfile);
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

