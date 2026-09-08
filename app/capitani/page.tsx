'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/AuthContext';

export default function CapitaniPage() {
  const { isCaptainMode, enableAccess, disableAccess } = useAuth();
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isCaptainMode) return;
    const savedCode = localStorage.getItem('captainCode');
    if (savedCode) {
      setCode(savedCode);
      setRememberMe(true);
    }
  }, [isCaptainMode]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('access_codes')
        .select('role, team_id')
        .eq('code', code.trim().toUpperCase())
        .eq('role', 'captain')
        .eq('is_active', true)
        .single();

      if (error || !data || !data.team_id) {
        setError('Codice non valido');
      } else {
        // Recupero il nome della squadra per l'alert
        const { data: teamData } = await supabase.from('teams').select('name').eq('id', data.team_id).single();
        const tName = teamData?.name || 'Squadra';

        localStorage.setItem('access_code', code.trim().toUpperCase());
        if (rememberMe) localStorage.setItem('captainCode', code.trim().toUpperCase());
        else localStorage.removeItem('captainCode');
        
        enableAccess('captain', data.team_id);
        alert(`✅ Accesso attivato per: ${tName}\n\nOra vedrai le funzioni capitano.`);
        window.location.href = '/';
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    disableAccess();
    setCode('');
    setRememberMe(false);
  };

  if (isCaptainMode) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <h2 className="text-xl font-black text-[#581C24] uppercase mb-4">Già Accesso</h2>
          <p className="text-sm text-gray-500 mb-6">Sei già loggato come capitano.</p>
          <button onClick={() => window.location.href = '/'} className="w-full bg-[#581C24] text-white font-bold py-3 rounded-lg mb-3">Vai alla Home</button>
          <button onClick={handleClearCredentials} className="text-xs text-red-600 font-bold uppercase">Esci e dimentica codice</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <div className="relative h-40 sm:h-48 w-full overflow-hidden flex-shrink-0">
        <Image src="/header-altro.jpg" alt="Area Capitani" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <Link href="/" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">AREA CAPITANI</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#581C24]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-xl font-black text-[#581C24] uppercase">Accesso Capitano</h2>
            <p className="text-xs text-gray-500 mt-1">Inserisci il codice della tua squadra</p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Codice Squadra</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Inserisci codice" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" />
            </div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-[#581C24] border-gray-300 rounded focus:ring-[#581C24]" />
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-700">Ricordami</span>
              </div>
            </label>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center animate-pulse">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-[#581C24] text-white font-bold py-3 rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
            {rememberMe && (
              <button onClick={handleClearCredentials} className="text-xs text-red-600 hover:text-red-800 font-bold uppercase transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Dimentica codice
              </button>
            )}
            <Link href="/" className="text-xs text-gray-500 hover:text-[#581C24] font-bold uppercase transition-colors">Torna alla Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}