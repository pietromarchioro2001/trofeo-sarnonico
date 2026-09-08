'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isStaffMode: boolean;
  isCaptainMode: boolean;
  isBarMode: boolean;
  accessRole: string | null;
  accessTeamId: string | null;
  enableAccess: (role: string, teamId?: string) => void;
  disableAccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessRole, setAccessRole] = useState<string | null>(null);
  const [accessTeamId, setAccessTeamId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('access_role');
    const teamId = localStorage.getItem('access_team_id');
    if (role) {
      setAccessRole(role);
      setAccessTeamId(teamId);
    }
  }, []);

  const enableAccess = (role: string, teamId?: string) => {
    localStorage.setItem('access_role', role);
    if (teamId) localStorage.setItem('access_team_id', teamId);
    setAccessRole(role);
    setAccessTeamId(teamId || null);
  };

  const disableAccess = () => {
    localStorage.removeItem('access_code');
    localStorage.removeItem('access_role');
    localStorage.removeItem('access_team_id');
    localStorage.removeItem('staffCode');
    localStorage.removeItem('captainCode');
    localStorage.removeItem('barPassword');
    setAccessRole(null);
    setAccessTeamId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isStaffMode: accessRole === 'staff',
        isCaptainMode: accessRole === 'captain',
        isBarMode: accessRole === 'bar',
        accessRole,
        accessTeamId,
        enableAccess,
        disableAccess,
      }}
    >
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