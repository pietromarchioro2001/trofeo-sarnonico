'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tv, Coins, Gift } from 'lucide-react';
import { BarTVView, BarCassaView, BarPremiView } from '@/components/BarArea';

const BAR_PASSWORD = 'BAR2026';

const BAR_TEAMS = [
  { id: '1', name: 'TAIO', logo: '/logos/taio.png' },
  { id: '2', name: 'CAVARENO', logo: '/logos/cavareno.png' },
  { id: '3', name: 'CASTELFONDO', logo: '/logos/castelfondo.png' },
  { id: '4', name: 'SARNONICO', logo: '/logos/sarnonico.png' },
  { id: '5', name: 'LOVER', logo: '/logos/lover.png' },
  { id: '6', name: 'ROMALLO', logo: '/logos/romallo.png' },
  { id: '7', name: 'FONDO', logo: '/logos/fondo.png' },
  { id: '8', name: "REVO'", logo: '/logos/revo.png' },
  { id: '9', name: 'ROMENO', logo: '/logos/romeno.png' },
  { id: '10', name: 'CLOZ', logo: '/logos/cloz.png' },
  { id: '11', name: 'DAMBEL', logo: '/logos/dambel.png' },
  { id: '12', name: 'DON/AMBLAR', logo: '/logos/don-amblar.png' },
];

export default function BarPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'menu' | 'tv' | 'cassa' | 'premi'>('menu');
  const [meters, setMeters] = useState<Record<string, number>>({ '1': 12, '4': 45, '7': 30 });
  const [celebrationTeam, setCelebrationTeam] = useState<string | null>(null);

  useEffect(() => {
    const savedPassword = localStorage.getItem('barPassword');
    if (savedPassword) {
      setPasswordInput(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // ✅ Listener ESC per tornare al menu dalla vista TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentView === 'tv') {
        setCurrentView('menu');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === BAR_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      if (rememberMe) {
        localStorage.setItem('barPassword', passwordInput);
      } else {
        localStorage.removeItem('barPassword');
      }
    } else {
      setError('Password non valida');
      setPasswordInput('');
    }
  };

  const handleAddMeter = (teamId: string, teamName: string) => {
    setMeters(prev => ({ ...prev, [teamId]: (prev[teamId] || 0) + 1 }));
    setCelebrationTeam(teamName);
    setTimeout(() => setCelebrationTeam(null), 3000);
  };

  const handleRemoveMeter = (teamId: string) => {
    setMeters(prev => {
      const current = prev[teamId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [teamId]: current - 1 };
    });
  };

  // --- SCHERMATA DI LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-[#581C24]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-10 h-10 text-[#581C24]" />
          </div>
          <h1 className="text-2xl font-black text-[#581C24] uppercase mb-2">Area Bar</h1>
          <p className="text-sm text-gray-500 mb-6">Inserisci la password per accedere</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#581C24]"
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#581C24] focus:ring-[#581C24] cursor-pointer"
              />
              <span>Salva password</span>
            </label>
            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            <button type="submit" className="w-full bg-[#581C24] text-white font-bold py-3 rounded-lg hover:bg-[#581C24]/90 transition-colors uppercase">
              Accedi
            </button>
          </form>
          <button onClick={() => router.push('/')} className="mt-6 text-sm text-gray-500 hover:text-[#581C24] font-bold uppercase flex items-center justify-center gap-2 mx-auto">
            <ArrowLeft size={16} /> Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  // --- MENU PRINCIPALE ---
  if (currentView === 'menu') {
    return (
      <div className="h-[100dvh] bg-[#F5F5F7] flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#581C24] font-bold hover:bg-white px-3 py-2 rounded-lg transition-colors">
            <ArrowLeft size={20} /> Esci
          </button>
          <h1 className="text-xl font-black text-[#581C24] uppercase">Menu Bar</h1>
          <div className="w-20" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-4xl mx-auto w-full overflow-y-auto">
          <button onClick={() => setCurrentView('tv')} className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center gap-4">
            <Tv className="w-16 h-16" />
            <span className="text-3xl font-black uppercase">Vista TV</span>
          </button>
          <button onClick={() => setCurrentView('cassa')} className="w-full bg-gradient-to-br from-green-600 to-green-800 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center gap-4">
            <Coins className="w-16 h-16" />
            <span className="text-3xl font-black uppercase">Cassa</span>
          </button>
          <button onClick={() => setCurrentView('premi')} className="w-full bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center gap-4">
            <Gift className="w-16 h-16" />
            <span className="text-3xl font-black uppercase">Premi</span>
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA TV (SCHERMO INTERO, NO HEADER, ESC PER USCIRE) ---
  if (currentView === 'tv') {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#581C24] via-[#7A2D3A] to-[#581C24]">
        <BarTVView meters={meters} celebrationTeam={celebrationTeam} />
      </div>
    );
  }

  // --- VISTA CASSA ---
  if (currentView === 'cassa') {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-[#F5F5F7] flex flex-col">
        <div className="bg-white shadow-sm p-2 flex items-center justify-between flex-shrink-0 z-30">
          <button onClick={() => setCurrentView('menu')} className="flex items-center gap-2 text-[#581C24] font-bold hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
            <ArrowLeft size={20} /> Indietro
          </button>
          <h2 className="text-lg font-black text-[#581C24] uppercase">Cassa Bar</h2>
          <div className="w-20" />
        </div>
        <BarCassaView teams={BAR_TEAMS} meters={meters} onAdd={handleAddMeter} onRemove={handleRemoveMeter} />
      </div>
    );
  }

  // --- VISTA PREMI ---
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F5F5F7] flex flex-col">
      <div className="bg-white shadow-sm p-2 flex items-center justify-between flex-shrink-0 z-30">
        <button onClick={() => setCurrentView('menu')} className="flex items-center gap-2 text-[#581C24] font-bold hover:bg-gray-100 px-3 py-2 rounded-lg">
          <ArrowLeft size={20} /> Indietro
        </button>
        <div className="w-20" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <BarPremiView />
      </div>
    </div>
  );
}