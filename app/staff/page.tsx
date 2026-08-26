// app/staff/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Codice mock per l'accesso staff (puoi cambiarlo con quello che preferisci)
const STAFF_CODE = 'ADMIN'; 

export default function StaffPage() {
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { enableStaffMode } = useAuth();
  const router = useRouter();

  // Carica credenziali salvate al montaggio del componente
  useEffect(() => {
    const savedCode = localStorage.getItem('staffCode');
    if (savedCode) {
      setCode(savedCode);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code !== STAFF_CODE) {
      setError(`Codice non valido. (Per testare usa: ${STAFF_CODE})`);
      return;
    }

    setIsLoading(true);

    // Simulazione ritardo di rete per realismo
    setTimeout(() => {
      if (rememberMe) {
        localStorage.setItem('staffCode', code);
      } else {
        localStorage.removeItem('staffCode');
      }
      
      // Attiva la modalità staff nel contesto globale
      enableStaffMode();
      
      setIsLoading(false);
      alert('✅ Accesso Staff attivato con successo!');
      router.push('/');
    }, 800);
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('staffCode');
    setCode('');
    setRememberMe(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden flex-shrink-0">
        <Image src="/header-altro.jpg" alt="Area Staff" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        
        <Link href="/" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>

        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            AREA STAFF
          </h1>
        </div>
      </div>

      {/* FORM DI ACCESSO */}
      <div className="flex-1 flex items-center justify-center p-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#581C24]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-[#581C24] uppercase">Accesso Riservato</h2>
            <p className="text-xs text-gray-500 mt-1">Inserisci il codice di accesso staff</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Codice Staff</label>
              <input 
                type="password" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Inserisci codice"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm"
              />
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#581C24] border-gray-300 rounded focus:ring-[#581C24]"
              />
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-700">Ricordami</span>
              </div>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#581C24] text-white font-bold py-3 rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accesso...
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
            {rememberMe && (
              <button 
                onClick={handleClearCredentials}
                className="text-xs text-red-600 hover:text-red-800 font-bold uppercase transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Dimentica codice
              </button>
            )}
            <Link href="/" className="text-xs text-gray-500 hover:text-[#581C24] font-bold uppercase transition-colors">
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}