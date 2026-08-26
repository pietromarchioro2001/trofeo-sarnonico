'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

// --- DATI MOCK ---
const MOCK_LIVE_MATCH = null; 
const MOCK_LAST_MATCH = {
  id: '1',
  homeTeam: { name: 'SARNONICO', logo: '/logos/sarnonico.png' },
  awayTeam: { name: 'ROMALLO', logo: '/logos/romallo.png' },
  score: { home: 2, away: 1 },
  group: 'GIRONE A',
  status: 'finished',
};
const MOCK_FIRST_MATCH = {
  id: '0',
  date: new Date('2026-07-15T21:00:00'),
  homeTeam: { name: 'CAVARENO', logo: '/logos/cavareno.png' },
  awayTeam: { name: 'TAIO', logo: '/logos/taio.png' },
  group: 'GIRONE A',
};
const MOCK_NEXT_MATCH = {
  id: '2',
  date: 'Dom 20 Lug',
  time: '21:00',
  group: 'GIRONE B',
  homeTeam: { name: 'CAVARENO', logo: '/logos/cavareno.png' },
  awayTeam: { name: 'TAIO', logo: '/logos/taio.png' },
};
const MOCK_LAST_RESULTS = [
  { id: '1', home: 'COREDO', homeLogo: '/logos/coredo.png', homeScore: 3, away: 'SEIO', awayLogo: '/logos/seio.png', awayScore: 1 },
  { id: '2', home: 'DON', homeLogo: '/logos/don.png', homeScore: 0, away: 'ROMENO', awayLogo: '/logos/romeno.png', awayScore: 2 },
  { id: '3', home: 'BANCO', homeLogo: '/logos/banco.png', homeScore: 4, away: 'SFRUZ', awayLogo: '/logos/sfruz.png', awayScore: 2 },
];
const MOCK_STANDINGS = [
  { pos: 1, team: 'CAVARENO', logo: '/logos/cavareno.png', pts: 6 },
  { pos: 2, team: 'SARNONICO', logo: '/logos/sarnonico.png', pts: 6 },
  { pos: 3, team: 'COREDO', logo: '/logos/coredo.png', pts: 3 },
  { pos: 4, team: 'RALO', logo: '/logos/ralo.png', pts: 0 },
];
const MOCK_STANDINGS_GROUP_B = [
  { pos: 1, team: 'CAVARENO', logo: '/logos/cavareno.png', pts: 6 },
  { pos: 2, team: 'TAIO', logo: '/logos/taio.png', pts: 4 },
  { pos: 3, team: 'SEIO', logo: '/logos/seio.png', pts: 3 },
  { pos: 4, team: 'ROMENO', logo: '/logos/romeno.png', pts: 0 },
];
const MOCK_TOP_SCORERS = [
  { rank: 1, name: 'Marco Rossi', team: 'Cavareno', goals: 5 },
  { rank: 2, name: 'Luca Zucal', team: 'Sarnonico', goals: 4 },
  { rank: 3, name: 'Andrea Endrizzi', team: 'Romeno', goals: 4 },
];

const SoccerShoe = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7l2.5 1.8L13.5 12h-3L9.5 8.8z" />
    <path d="M12 7V3" />
    <path d="M14.5 8.8l3-2" />
    <path d="M13.5 12h3.5" />
    <path d="M10.5 12L7.5 14" />
    <path d="M9.5 8.8l-3-2" />
  </svg>
);

export default function HomePage() {
  const { isStaffMode, disableStaffMode } = useAuth();
  const router = useRouter();
  
  // Stato per verificare se l'utente è un capitano loggato
  const [isCaptain, setIsCaptain] = useState(false);

  // ✅ TUTTI GLI STATI DEVONO ESSERE DENTRO IL COMPONENTE
  const [activeGroup, setActiveGroup] = useState<'A' | 'B'>('A');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasMatches, setHasMatches] = useState(true);

  // Leggi lo stato di capitano dal localStorage al montaggio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCaptain(localStorage.getItem('isCaptain') === 'true');
    }
  }, []);

  // Countdown per la prima partita
  useEffect(() => {
    if (!hasMatches && MOCK_FIRST_MATCH) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = MOCK_FIRST_MATCH.date.getTime() - now.getTime();
        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [hasMatches]);

  // Funzione di Logout completa
  const handleLogout = () => {
    disableStaffMode();
    localStorage.removeItem('isCaptain');
    localStorage.removeItem('captainTeamId');
    localStorage.removeItem('captainTeamName');
    localStorage.removeItem('captainCode');
    localStorage.removeItem('staffCode');
    
    setIsCaptain(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  const mainMatch = MOCK_LIVE_MATCH || MOCK_LAST_MATCH;
  const isLive = MOCK_LIVE_MATCH !== null;
  const showCountdown = !hasMatches && !mainMatch;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 overflow-x-hidden relative">
      
      {/* MENU LATERALE */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#581C24] text-white">
              <span className="font-bold text-lg font-oswald uppercase tracking-wider">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <Link 
                href="/staff" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Area Staff
              </Link>
              <Link 
                href="/capitani" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Area Capitani
              </Link>
              <Link 
                href="/bar" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Area Bar
              </Link>
            </div>

            <div className="border-t border-gray-200" />

            {/* PULSANTE LOGOUT AGGIORNATO */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 text-gray-600 font-bold hover:bg-red-50 hover:text-red-700 border-l-4 border-transparent hover:border-red-700 transition-all w-full text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">
              Trofeo Sarnonico 2026
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden flex-shrink-0">
        <Image src="/campo-sarnonico.jpg" alt="Campo da calcio Sarnonico" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-3 text-white px-4">
          
          {/* Bottone Menu (Sinistra) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="absolute top-3 left-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            aria-label="Apri menu"
          >
            <svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* ✅ BADGE DI ACCESSO (Destra) */}
          {(isStaffMode || isCaptain) && (
            <div className="absolute top-3 right-3 z-20">
              {isStaffMode ? (
                <div 
                  className="bg-[#581C24] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg border-2 border-white/20 animate-in fade-in zoom-in duration-300" 
                  title="Accesso Staff Attivo"
                >
                  S
                </div>
              ) : (
                <div 
                  className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg border-2 border-white/20 animate-in fade-in zoom-in duration-300" 
                  title="Accesso Capitano Attivo"
                >
                  C
                </div>
              )}
            </div>
          )}

          {/* Logo e sfondo */}
          <div className="absolute w-32 sm:w-40 h-32 sm:h-40 bg-black/70 rounded-full blur-2xl" />
          <div className="absolute w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-b from-black/80 via-black/60 to-transparent rounded-full blur-xl" />
          <Image src="/logo.png" alt="Trofeo Sarnonico" width={120} height={120} className="drop-shadow-2xl mb-1 relative z-10" />
        </div>
      </div>

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex-1 max-w-md mx-auto px-3 sm:px-4 -mt-6 relative z-10 w-full flex flex-col gap-[3vh] pb-28">
        {showCountdown ? (
          <div className="bg-gray-300 rounded-xl p-4 shadow-lg">
            <div className="text-center">
              <p className="text-gray-700 font-bold text-xs uppercase mb-3">Inizio Torneo tra</p>
              <div className="flex items-center justify-center gap-2 text-2xl font-black text-gray-800 font-oswald">
                <span>{countdown.days}g</span><span className="text-gray-500">:</span>
                <span>{countdown.hours}h</span><span className="text-gray-500">:</span>
                <span>{countdown.minutes}m</span><span className="text-gray-500">:</span>
                <span>{countdown.seconds}s</span>
              </div>
              <p className="text-gray-600 text-[10px] mt-2 font-bold uppercase">
                {MOCK_FIRST_MATCH?.homeTeam.name} vs {MOCK_FIRST_MATCH?.awayTeam.name}
              </p>
            </div>
          </div>
        ) : mainMatch ? (
          <Link href={`/partite/${mainMatch.id}`} className="block">
            <div className={`${isLive ? 'bg-[#581C24] text-white' : 'bg-white text-[#581C24] border-2 border-[#581C24]'} rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12" />
                {isLive ? (
                  <button className="bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </button>
                ) : (
                  <span className="bg-gray-200 text-[#581C24] text-[9px] font-bold px-2.5 py-0.5 rounded-full">TERMINATA</span>
                )}
                <div className="w-12" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-white/10' : 'bg-[#581C24]/10'}`}>
                    <span className={`text-[10px] ${isLive ? 'text-white' : 'text-[#581C24]'}`}>LOGO</span>
                  </div>
                  <span className="font-bold text-sm text-center truncate w-full">{mainMatch.homeTeam.name}</span>
                </div>
                <div className={`text-3xl font-bold tracking-wider font-oswald flex-shrink-0 px-3 ${isLive ? 'text-white' : 'text-[#581C24]'}`}>
                  {mainMatch.score?.home ?? '-'} - {mainMatch.score?.away ?? '-'}
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-white/10' : 'bg-[#581C24]/10'}`}>
                    <span className={`text-[10px] ${isLive ? 'text-white' : 'text-[#581C24]'}`}>LOGO</span>
                  </div>
                  <span className="font-bold text-sm text-center truncate w-full">{mainMatch.awayTeam.name}</span>
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        <Link href={`/partite/${MOCK_NEXT_MATCH.id}`} className="block">
          <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#581C24] font-bold text-xs uppercase tracking-wide">PROSSIMA PARTITA</h3>
              <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                <div className="flex items-center gap-0.5">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>{MOCK_NEXT_MATCH.date}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{MOCK_NEXT_MATCH.time}</span>
                </div>
                <span className="bg-[#D4AF37]/20 text-[#581C24] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{MOCK_NEXT_MATCH.group}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[9px]">LOGO</span></div>
                <span className="font-bold text-xs text-center">{MOCK_NEXT_MATCH.homeTeam.name}</span>
              </div>
              <div className="flex flex-col items-center justify-center"><span className="text-[#D4AF37] font-bold text-xl">VS</span></div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[9px]">LOGO</span></div>
                <span className="font-bold text-xs text-center">{MOCK_NEXT_MATCH.awayTeam.name}</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[#581C24] font-bold text-xs uppercase tracking-wider">Ultimi Risultati</h2>
            <Link href="/partite" className="text-[#581C24] text-[10px] font-bold uppercase hover:underline flex-shrink-0">VEDI &gt;</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MOCK_LAST_RESULTS.map((match) => (
              <Link key={match.id} href={`/partite/${match.id}`} className="block">
                <div className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[7px]">L</span></div>
                      <span className="text-[9px] font-bold truncate">{match.home}</span>
                    </div>
                    <span className="font-bold text-xs flex-shrink-0 ml-1">{match.homeScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[7px]">L</span></div>
                      <span className="text-[9px] font-bold truncate">{match.away}</span>
                    </div>
                    <span className="font-bold text-xs flex-shrink-0 ml-1">{match.awayScore}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1 min-w-0">
                <Trophy size={12} className="text-[#D4AF37] flex-shrink-0" strokeWidth={2.5} />
                <h2 className="text-[#581C24] font-bold text-xs uppercase tracking-wider truncate">Girone</h2>
                <div className="flex gap-1 ml-1 flex-shrink-0">
                  <button onClick={() => setActiveGroup('A')} className={`h-1.5 rounded-full transition-all ${activeGroup === 'A' ? 'bg-[#581C24] w-3' : 'bg-gray-300 w-1.5'}`} aria-label="Girone A" />
                  <button onClick={() => setActiveGroup('B')} className={`h-1.5 rounded-full transition-all ${activeGroup === 'B' ? 'bg-[#581C24] w-3' : 'bg-gray-300 w-1.5'}`} aria-label="Girone B" />
                </div>
              </div>
              <Link href="/classifiche" className="text-[#581C24] text-[9px] font-bold uppercase flex-shrink-0">Vedi &gt;</Link>
            </div>
            <div className="space-y-1 pt-0.5">
              {(activeGroup === 'A' ? MOCK_STANDINGS.slice(0, 4) : MOCK_STANDINGS_GROUP_B.slice(0, 4)).map((team) => (
                <div key={team.pos} className="flex items-center justify-between text-[10px] py-0.5">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`font-bold w-3 flex-shrink-0 ${team.pos === 1 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{team.pos}</span>
                    <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[6px] text-gray-400">L</span></div>
                    <span className="font-bold truncate text-[10px]">{team.team}</span>
                  </div>
                  <span className="font-black text-[#581C24] w-5 text-right flex-shrink-0 text-[10px]">{team.pts}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1 min-w-0">
                <SoccerShoe size={12} className="text-[#D4AF37] flex-shrink-0" />
                <h2 className="text-[#581C24] font-bold text-xs uppercase tracking-wider truncate">Marcatori</h2>
              </div>
              <Link href="/classifiche?tab=marcatori" className="text-[#581C24] text-[9px] font-bold uppercase flex-shrink-0">Vedi &gt;</Link>
            </div>
            <div className="space-y-1 pt-0.5">
              {MOCK_TOP_SCORERS.slice(0, 3).map((player) => (
                <div key={player.rank} className="flex items-center justify-between text-[10px] py-0.5">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`font-bold w-3 flex-shrink-0 ${player.rank === 1 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{player.rank}</span>
                    <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[6px] flex-shrink-0">F</div>
                    <div className="flex-1 min-w-0 ml-0.5">
                      <p className="font-bold truncate text-[10px] uppercase">{player.name}</p>
                      <p className="text-[7px] text-gray-500 truncate">{player.team}</p>
                    </div>
                  </div>
                  <span className="font-black text-[#581C24] w-4 text-right flex-shrink-0 text-[10px]">{player.goals}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}