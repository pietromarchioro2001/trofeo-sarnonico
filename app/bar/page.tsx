'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Tv, Coins, Gift } from 'lucide-react';
import { BarTVView, BarCassaView, BarPremiView } from '@/components/BarArea';
import { createClient } from '@/lib/supabase/client';

const BAR_PASSWORD = 'BAR2026';

// ✅ COMPONENTE CALICI DI BIRRA CHE BRINDANO (design migliorato)
const ClinkingBeerMugs = () => (
  <div className="flex justify-center items-center gap-16 mt-6">
    {/* Wrapper per calice sinistro */}
    <div className="animate-clink-left-mug">
      <svg 
        width="120" 
        height="130" 
        viewBox="0 0 120 130"
      >
        {/* Definizioni gradienti */}
        <defs>
          <linearGradient id="beerLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:0.95}} />
            <stop offset="100%" style={{stopColor:'#FF8C00', stopOpacity:0.98}} />
          </linearGradient>
          <linearGradient id="foamLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FFFFFF', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#FFF8DC', stopOpacity:0.9}} />
          </linearGradient>
        </defs>
        
        {/* Ombra */}
        <ellipse cx="65" cy="125" rx="40" ry="6" fill="rgba(0,0,0,0.3)" />
        
        {/* Manico a SINISTRA - più grande e curvo */}
        <path d="M 30 50 Q 8 50 8 75 Q 8 100 30 100" fill="none" stroke="#FFD700" strokeWidth="8" strokeLinecap="round" />
        <path d="M 30 50 Q 12 50 12 75 Q 12 100 30 100" fill="none" stroke="#FFA500" strokeWidth="2" />
        
        {/* Corpo del boccale - forma trapezoidale */}
        <path d="M 35 45 L 105 45 L 100 110 L 40 110 Z" fill="url(#beerLeft)" stroke="#B8860B" strokeWidth="3" />
        
        {/* Riflesso verticale sul vetro */}
        <rect x="75" y="50" width="10" height="55" rx="3" fill="rgba(255,255,255,0.4)" />
        
        {/* Schiuma che trabocca */}
        <path d="M 35 45 Q 40 30 50 42 Q 55 25 65 40 Q 75 28 85 42 Q 95 30 105 45" fill="url(#foamLeft)" stroke="#F5F5F5" strokeWidth="1" />
        
        {/* Bolle nella schiuma */}
        <circle cx="45" cy="38" r="5" fill="white" opacity="0.9" />
        <circle cx="60" cy="33" r="6" fill="white" opacity="0.85" />
        <circle cx="75" cy="36" r="5" fill="white" opacity="0.9" />
        <circle cx="90" cy="40" r="4" fill="white" opacity="0.8" />
        <circle cx="52" cy="30" r="3" fill="white" opacity="0.7" />
        <circle cx="82" cy="32" r="3.5" fill="white" opacity="0.75" />
        
        {/* Bolle nella birra */}
        <circle cx="55" cy="70" r="2" fill="rgba(255,255,255,0.6)" />
        <circle cx="70" cy="85" r="2.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="62" cy="95" r="2" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>

    {/* Wrapper per calice destro */}
    <div className="animate-clink-right-mug">
      <svg 
        width="120" 
        height="130" 
        viewBox="0 0 120 130"
      >
        {/* Definizioni gradienti */}
        <defs>
          <linearGradient id="beerRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:0.95}} />
            <stop offset="100%" style={{stopColor:'#FF8C00', stopOpacity:0.98}} />
          </linearGradient>
          <linearGradient id="foamRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:'#FFFFFF', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#FFF8DC', stopOpacity:0.9}} />
          </linearGradient>
        </defs>
        
        {/* Ombra */}
        <ellipse cx="55" cy="125" rx="40" ry="6" fill="rgba(0,0,0,0.3)" />
        
        {/* Manico a DESTRA - più grande e curvo */}
        <path d="M 90 50 Q 112 50 112 75 Q 112 100 90 100" fill="none" stroke="#FFD700" strokeWidth="8" strokeLinecap="round" />
        <path d="M 90 50 Q 108 50 108 75 Q 108 100 90 100" fill="none" stroke="#FFA500" strokeWidth="2" />
        
        {/* Corpo del boccale - forma trapezoidale */}
        <path d="M 85 45 L 15 45 L 20 110 L 80 110 Z" fill="url(#beerRight)" stroke="#B8860B" strokeWidth="3" />
        
        {/* Riflesso verticale sul vetro */}
        <rect x="35" y="50" width="10" height="55" rx="3" fill="rgba(255,255,255,0.4)" />
        
        {/* Schiuma che trabocca */}
        <path d="M 85 45 Q 80 30 70 42 Q 65 25 55 40 Q 45 28 35 42 Q 25 30 15 45" fill="url(#foamRight)" stroke="#F5F5F5" strokeWidth="1" />
        
        {/* Bolle nella schiuma */}
        <circle cx="75" cy="38" r="5" fill="white" opacity="0.9" />
        <circle cx="60" cy="33" r="6" fill="white" opacity="0.85" />
        <circle cx="45" cy="36" r="5" fill="white" opacity="0.9" />
        <circle cx="30" cy="40" r="4" fill="white" opacity="0.8" />
        <circle cx="68" cy="30" r="3" fill="white" opacity="0.7" />
        <circle cx="38" cy="32" r="3.5" fill="white" opacity="0.75" />
        
        {/* Bolle nella birra */}
        <circle cx="65" cy="70" r="2" fill="rgba(255,255,255,0.6)" />
        <circle cx="50" cy="85" r="2.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="58" cy="95" r="2" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>
  </div>
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
          const previousMeters = meters[newTeamId] || 0;
          
          // Aggiorna i metri
          setMeters(prev => ({ ...prev, [newTeamId]: newMeters }));
          
          // ✅ Mostra celebrazione SOLO se il valore è aumentato (non su correzioni)
          if (newMeters > previousMeters) {
            const teamName = teamsMapRef.current[newTeamId]?.name || 'Squadra';
            setCelebrationTeam(teamName);
            setTimeout(() => setCelebrationTeam(null), 4000);
          }
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
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
            {/* Sfondo con bollicine animate */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#581C24]/95 via-[#7A2D3A]/95 to-[#581C24]/95 backdrop-blur-sm">
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
              <div className="absolute inset-2 rounded-full border-4 border-white/50" />
              
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#581C24] to-[#7A2D3A] flex flex-col items-center justify-center p-8 overflow-hidden">
                
                {/* ✅ Titolo NUOVO METRO! (più in alto) */}
                <div className="text-center mb-2">
                  <p className="text-5xl sm:text-6xl font-black text-[#FFD700] uppercase drop-shadow-lg">
                    +1 METRO
                  </p>
                </div>

                {/* ✅ Logo squadra (al centro) */}
                {(() => {
                  const team = Object.values(teamsMap).find(t => t.name === celebrationTeam);
                  return team?.logo_url ? (
                    <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-full flex items-center justify-center border-4 border-[#FFD700] shadow-lg mb-3 overflow-hidden">
                      <Image 
                        src={team.logo_url} 
                        alt={team.name} 
                        width={192} 
                        height={192} 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-3">
                      <span className="text-6xl"></span>
                    </div>
                  );
                })()}

                {/* ✅ Nome squadra (in basso nel cerchio) */}
                <p className="text-4xl sm:text-5xl font-black text-white uppercase text-center drop-shadow-lg">
                  {celebrationTeam}
                </p>
              </div>
            </div>

            {/* ✅ CALICI FUORI DAL CERCHIO, SOTTO */}
            <ClinkingBeerMugs />
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