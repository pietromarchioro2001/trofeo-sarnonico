'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Tv, Coins, Gift } from 'lucide-react';
import { BarTVView, BarCassaView, BarPremiView } from '@/components/BarArea';
import { createClient } from '@/lib/supabase/client';

const BAR_PASSWORD = 'BAR2026';

// ✅ COMPONENTE CALICI CHE BRINDANO
const ClinkingGlasses = () => (
  <svg width="120" height="100" viewBox="0 0 120 100" className="mx-auto">
    {/* Calice sinistro */}
    <g className="animate-clink-left">
      <path d="M 20 10 L 20 50 Q 20 60 30 60 L 40 60 Q 50 60 50 50 L 50 10 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
      <path d="M 35 60 L 35 80 L 30 90 L 40 90 L 35 80 L 35 60" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
      <ellipse cx="35" cy="10" rx="15" ry="3" fill="#FFF8DC" stroke="#B8860B" strokeWidth="1" />
      {/* Schiuma */}
      <ellipse cx="35" cy="15" rx="13" ry="2" fill="white" opacity="0.8" />
    </g>
    
    {/* Calice destro */}
    <g className="animate-clink-right">
      <path d="M 70 10 L 70 50 Q 70 60 80 60 L 90 60 Q 100 60 100 50 L 100 10 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
      <path d="M 85 60 L 85 80 L 80 90 L 90 90 L 85 80 L 85 60" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
      <ellipse cx="85" cy="10" rx="15" ry="3" fill="#FFF8DC" stroke="#B8860B" strokeWidth="1" />
      {/* Schiuma */}
      <ellipse cx="85" cy="15" rx="13" ry="2" fill="white" opacity="0.8" />
    </g>
    
    {/* Stelle scintillanti */}
    <g className="animate-sparkle">
      <circle cx="60" cy="30" r="2" fill="white" />
      <circle cx="55" cy="35" r="1.5" fill="white" />
      <circle cx="65" cy="35" r="1.5" fill="white" />
      <circle cx="58" cy="25" r="1" fill="white" />
      <circle cx="62" cy="25" r="1" fill="white" />
    </g>
  </svg>
);

export default function BarPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'menu' | 'tv' | 'cassa' | 'premi'>('menu');
  
  // Stati dati reali
  const [meters, setMeters] = useState<Record<string, number>>({});
  const [teams, setTeams] = useState<Array<{ id: string; name: string; logo_url: string | null }>>([]);
  const [teamsMap, setTeamsMap] = useState<Record<string, { id: string; name: string; logo_url: string | null }>>({});
  const [celebrationTeam, setCelebrationTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carica password salvata
  useEffect(() => {
    const savedPassword = localStorage.getItem('barPassword');
    if (savedPassword) {
      setPasswordInput(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Ref per accedere a teamsMap senza causare re-render dell'effetto
  const teamsMapRef = useRef(teamsMap);
  
  // Aggiorna la ref ogni volta che teamsMap cambia
  useEffect(() => {
    teamsMapRef.current = teamsMap;
  }, [teamsMap]);

  // Fetch dati da Supabase e setup Realtime
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const supabase = createClient();

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .order('name');

        if (teamsError) throw teamsError;

        if (teamsData) {
          setTeams(teamsData);
          const map: Record<string, { id: string; name: string; logo_url: string | null }> = {};
          teamsData.forEach(t => { map[t.id] = t; });
          setTeamsMap(map);
        }

        const { data: metersData, error: metersError } = await supabase
          .from('bar_meters')
          .select('team_id, total_meters');

        if (metersError) throw metersError;

        if (metersData) {
          const metersMap: Record<string, number> = {};
          metersData.forEach(m => { metersMap[m.team_id] = m.total_meters; });
          setMeters(metersMap);
        }
      } catch (err) {
        console.error('Errore fetch bar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // ✅ LISTENER REALTIME: Aggiorna metri E triggera celebrazione su tutti i dispositivi
    const channel = supabase
      .channel('bar-meters-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bar_meters',
        },
        (payload) => {
          const newTeamId = payload.new.team_id;
          const newMeters = payload.new.total_meters;
          
          // ✅ Usa la ref per ottenere il nome senza causare loop infinito
          const teamName = teamsMapRef.current[newTeamId]?.name || 'Squadra';
          
          // Aggiorna i metri
          setMeters(prev => ({ ...prev, [newTeamId]: newMeters }));
          
          // Triggera celebrazione su TUTTI i dispositivi
          setCelebrationTeam(teamName);
          setTimeout(() => setCelebrationTeam(null), 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]); // ✅ RIMOSSO teamsMap dalle dipendenze!

  // Listener ESC per tornare al menu dalla vista TV
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

  const handleAddMeter = async (teamId: string, teamName: string) => {
    const supabase = createClient();
    
    // Ottieni valore attuale
    const current = meters[teamId] || 0;
    const newValue = current + 1;

    // Aggiorna Supabase
    const { error } = await supabase
      .from('bar_meters')
      .update({ total_meters: newValue, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);

    if (!error) {
      // Aggiorna stato locale immediatamente
      setMeters(prev => ({ ...prev, [teamId]: newValue }));
      setCelebrationTeam(teamName);
      setTimeout(() => setCelebrationTeam(null), 3000);
    } else {
      console.error('Errore aggiornamento metri:', error);
      alert('Errore nel salvataggio');
    }
  };

  const handleRemoveMeter = async (teamId: string) => {
    const supabase = createClient();
    const current = meters[teamId] || 0;
    if (current <= 0) return;

    const newValue = current - 1;

    const { error } = await supabase
      .from('bar_meters')
      .update({ total_meters: newValue, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);

    if (!error) {
      setMeters(prev => ({ ...prev, [teamId]: newValue }));
    } else {
      console.error('Errore rimozione metri:', error);
      alert('Errore nel salvataggio');
    }
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

  // Loading state dopo login
  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento dati bar...</p>
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

  // --- VISTA TV ---
  if (currentView === 'tv') {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#581C24] via-[#7A2D3A] to-[#581C24]">
        {/*  Animazione di festeggiamento GLOBALE */}
        {celebrationTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Sfondo con bollicine animate */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#581C24]/95 via-[#7A2D3A]/95 to-[#581C24]/95 backdrop-blur-sm">
              {/* Bollicine generate dinamicamente */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="bubble"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 30 + 10}px`,
                    height: `${Math.random() * 30 + 10}px`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Popup ovale con animazione */}
            <div 
              className="relative bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FFD700] rounded-full p-1 shadow-2xl animate-[pop-in_0.5s_ease-out]"
              style={{
                width: 'min(90vw, 500px)',
                height: 'min(90vw, 500px)',
              }}
            >
              {/* Bordo decorativo */}
              <div className="absolute inset-2 rounded-full border-4 border-white/50" />
              
              {/* Contenuto interno */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#581C24] to-[#7A2D3A] flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Titolo +1 METRO */}
                <div className="text-center mb-4">
                  <p className="text-5xl sm:text-6xl font-black text-[#FFD700] uppercase drop-shadow-lg">
                    +1 METRO
                  </p>
                </div>

                {/* Calici che brindano */}
                <div className="mb-4">
                  <ClinkingGlasses />
                </div>

                {/* Logo squadra (se disponibile) */}
                {(() => {
                  const team = Object.values(teamsMap).find(t => t.name === celebrationTeam);
                  return team?.logo_url ? (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full flex items-center justify-center border-4 border-[#FFD700] shadow-lg mb-4 overflow-hidden">
                      <Image 
                        src={team.logo_url} 
                        alt={team.name} 
                        width={160} 
                        height={160} 
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Nome squadra */}
                <p className="text-4xl sm:text-5xl font-black text-white uppercase text-center drop-shadow-lg">
                  {celebrationTeam}
                </p>
              </div>
            </div>
          </div>
        )}
        <BarTVView 
          meters={meters} 
          teamsMap={teamsMap}
          celebrationTeam={celebrationTeam} 
        />
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
        <BarCassaView 
          teams={teams} 
          meters={meters} 
          onAdd={handleAddMeter} 
          onRemove={handleRemoveMeter} 
        />
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