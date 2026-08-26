// lib/AuthContext.tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isStaffMode: boolean;
  enableStaffMode: () => void;
  disableStaffMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isStaffMode: false,
  enableStaffMode: () => {},
  disableStaffMode: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isStaffMode, setIsStaffMode] = useState(false);

  const enableStaffMode = () => setIsStaffMode(true);
  const disableStaffMode = () => setIsStaffMode(false);

  return (
    <AuthContext.Provider value={{ isStaffMode, enableStaffMode, disableStaffMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);