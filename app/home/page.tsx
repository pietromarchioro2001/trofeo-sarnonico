'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Tipi dati semplificati per la home
interface TeamData {
  id: string;
  name: string;
  logo_url: string | null;
}

interface MatchSummary {
  id: string;
  status: string;
  match_date: string | null;
  match_time: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team: TeamData;
  away_team: TeamData;
}

interface StandingTeam {
  id: string;
  name: string;
  logo_url: string | null;
  girone: 'A' | 'B' | null;
  pt: number;
  gf: number;
  gs: number;
}

interface TopScorer {
  id: string;
  first_name: string;
  last_name: string;
  goals: number;
  team: { name: string; logo_url: string | null } | null;
}

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
  
  // Stati UI
  const [isCaptain, setIsCaptain] = useState(false);
  const [activeGroup, setActiveGroup] = useState<'A' | 'B'>('A');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Stati Dati
  const [lastMatch, setLastMatch] = useState<MatchSummary | null>(null);
  const [nextMatch, setNextMatch] = useState<MatchSummary | null>(null);
  const [standingsA, setStandingsA] = useState<StandingTeam[]>([]);
  const [standingsB, setStandingsB] = useState<StandingTeam[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  // Leggi stato capitano
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCaptain(localStorage.getItem('isCaptain') === 'true');
    }
  }, []);

  // Fetch dati iniziali
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0]; // Data di oggi 'YYYY-MM-DD'

      try {
        // 1. ULTIMA PARTITA (Live o ultima finita)
        const { data: lastMatchArray } = await supabase
          .from('matches')
          .select('id, status, match_date, match_time, home_score, away_score, home_team_id, away_team_id')
          .or('status.eq.LIVE,status.eq.FINITA')
          .order('match_date', { ascending: false })
          .order('match_time', { ascending: false })
          .limit(1);
        
        if (lastMatchArray && lastMatchArray.length > 0) {
          const match = lastMatchArray[0];
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', [match.home_team_id, match.away_team_id]);
          
          const homeTeam = teamsData?.find(t => t.id === match.home_team_id) || null;
          const awayTeam = teamsData?.find(t => t.id === match.away_team_id) || null;
          
          setLastMatch({ ...match, home_team: homeTeam as TeamData, away_team: awayTeam as TeamData });
        }

        // 2. PROSSIMA PARTITA (SOLO DATE FUTURE O ODIERNE)
        const { data: nextMatchArray } = await supabase
          .from('matches')
          .select('id, status, match_date, match_time, home_score, away_score, home_team_id, away_team_id')
          .eq('status', 'PROGRAMMATA')
          .gte('match_date', today) // ✅ FILTRO CRUCIALE: solo partite da oggi in poi
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true })
          .limit(1);
        
        if (nextMatchArray && nextMatchArray.length > 0) {
          const match = nextMatchArray[0];
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', [match.home_team_id, match.away_team_id]);
          
          const homeTeam = teamsData?.find(t => t.id === match.home_team_id) || null;
          const awayTeam = teamsData?.find(t => t.id === match.away_team_id) || null;
          
          setNextMatch({ ...match, home_team: homeTeam as TeamData, away_team: awayTeam as TeamData });
        }

        // 3. CLASSIFICHE (Calcolate al volo dalle partite finite)
        const { data: allMatches } = await supabase
          .from('matches')
          .select('home_team_id, away_team_id, home_score, away_score, status')
          .eq('status', 'FINITA');

        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, logo_url, girone');

        if (allMatches && teams) {
          const statsMap = new Map<string, StandingTeam>();
          
          teams.forEach(t => {
            statsMap.set(t.id, { ...t, pt: 0, gf: 0, gs: 0 });
          });

          allMatches.forEach(m => {
            const h = statsMap.get(m.home_team_id);
            const a = statsMap.get(m.away_team_id);
            if (!h || !a) return;

            const hs = m.home_score || 0;
            const as_ = m.away_score || 0;

            h.gf += hs; h.gs += as_;
            a.gf += as_; a.gs += hs;

            if (hs > as_) { h.pt += 3; }
            else if (as_ > hs) { a.pt += 3; }
            else { h.pt += 1; a.pt += 1; }
          });

          const sorted = Array.from(statsMap.values()).sort((a, b) => b.pt - a.pt || (b.gf - b.gs) - (a.gf - a.gs));
          setStandingsA(sorted.filter(t => t.girone === 'A').slice(0, 4));
          setStandingsB(sorted.filter(t => t.girone === 'B').slice(0, 4));
        }

        // 4. TOP SCORERS
        const { data: scorersArray } = await supabase
          .from('players')
          .select('id, first_name, last_name, goals, team_id')
          .order('goals', { ascending: false })
          .limit(3);

        if (scorersArray && scorersArray.length > 0) {
          const teamIds = scorersArray.map(s => s.team_id).filter(Boolean);
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', teamIds);

          const mappedScorers: TopScorer[] = scorersArray.map(s => ({
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            goals: s.goals,
            team: teamsData?.find(t => t.id === s.team_id) || null
          }));
          setTopScorers(mappedScorers);
        }

      } catch (err) {
        console.error('Errore fetch home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

    // Countdown per prossima partita
    useEffect(() => {
      if (!nextMatch?.match_date) return;
      
      // ✅ Estrai solo la parte YYYY-MM-DD (funziona sia con spazio che con 'T')
      const dateStr = nextMatch.match_date.split(/[ T]/)[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = (nextMatch.match_time || '00:00').split(':').map(Number);
      
      const updateCountdown = () => {
        const now = new Date();
        const target = new Date(year, month - 1, day, hours, minutes, 0);
        const diff = target.getTime() - now.getTime();
        
        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };
      
      updateCountdown(); // Chiama subito
      const timer = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(timer);
    }, [nextMatch]);

  // Logout
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

  const isLive = lastMatch?.status === 'LIVE';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento...</p>
        </div>
      </div>
    );
  }

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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <Link href="/staff" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all">Area Staff</Link>
              <Link href="/capitani" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all">Area Capitani</Link>
              <Link href="/bar" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-4 text-[#581C24] font-bold hover:bg-[#581C24]/5 border-l-4 border-transparent hover:border-[#581C24] transition-all">Area Bar</Link>
            </div>
            <div className="border-t border-gray-200" />
            <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-4 text-gray-600 font-bold hover:bg-red-50 hover:text-red-700 border-l-4 border-transparent hover:border-red-700 transition-all w-full text-left">Logout</button>
            <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">Trofeo Sarnonico 2026</div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden flex-shrink-0">
        <Image src="/campo-sarnonico.jpg" alt="Campo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-3 text-white px-4">
          <button onClick={() => setIsMenuOpen(true)} className="absolute top-3 left-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
            <svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          {(isStaffMode || isCaptain) && (
            <div className="absolute top-3 right-3 z-20">
              {isStaffMode ? (
                <div className="bg-[#581C24] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg border-2 border-white/20">S</div>
              ) : (
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg border-2 border-white/20">C</div>
              )}
            </div>
          )}
          <div className="absolute w-32 sm:w-40 h-32 sm:h-40 bg-black/70 rounded-full blur-2xl" />
          <div className="absolute w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-b from-black/80 via-black/60 to-transparent rounded-full blur-xl" />
          <Image src="/logo.png" alt="Trofeo Sarnonico" width={120} height={120} className="drop-shadow-2xl mb-1 relative z-10" />
        </div>
      </div>

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex-1 max-w-md mx-auto px-3 sm:px-4 -mt-6 relative z-10 w-full flex flex-col gap-[3vh] pb-28">
        
        {/* 1. COUNTDOWN (se c'è una prossima partita) */}
        {nextMatch && (
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
                {nextMatch.home_team.name} vs {nextMatch.away_team.name}
              </p>
            </div>
          </div>
        )}

        {/* 2. ULTIMA PARTITA / LIVE (se esiste) */}
        {lastMatch && (
          <Link href={`/partite/${lastMatch.id}`} className="block">
            <div className={`${isLive ? 'bg-[#581C24] text-white' : 'bg-white text-[#581C24] border-2 border-[#581C24]'} rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12" />
                {isLive ? (
                  <span className="bg-red-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="bg-gray-200 text-[#581C24] text-[9px] font-bold px-2.5 py-0.5 rounded-full">TERMINATA</span>
                )}
                <div className="w-12" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLive ? 'bg-white/10' : 'bg-[#581C24]/10'}`}>
                    {lastMatch.home_team.logo_url ? <Image src={lastMatch.home_team.logo_url} alt={lastMatch.home_team.name} width={56} height={56} className="object-cover" /> : <span className={`text-[10px] ${isLive ? 'text-white' : 'text-[#581C24]'}`}>LOGO</span>}
                  </div>
                  <span className="font-bold text-sm text-center truncate w-full">{lastMatch.home_team.name}</span>
                </div>
                <div className={`text-3xl font-bold tracking-wider font-oswald flex-shrink-0 px-3 ${isLive ? 'text-white' : 'text-[#581C24]'}`}>
                  {lastMatch.home_score ?? '-'} - {lastMatch.away_score ?? '-'}
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLive ? 'bg-white/10' : 'bg-[#581C24]/10'}`}>
                    {lastMatch.away_team.logo_url ? <Image src={lastMatch.away_team.logo_url} alt={lastMatch.away_team.name} width={56} height={56} className="object-cover" /> : <span className={`text-[10px] ${isLive ? 'text-white' : 'text-[#581C24]'}`}>LOGO</span>}
                  </div>
                  <span className="font-bold text-sm text-center truncate w-full">{lastMatch.away_team.name}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 3. PROSSIMA PARTITA (Card dettagliata, se esiste) */}
        {nextMatch && (
          <Link href={`/partite/${nextMatch.id}`} className="block">
            <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[#581C24] font-bold text-xs uppercase tracking-wide">PROSSIMA PARTITA</h3>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                  <div className="flex items-center gap-0.5">
                    <CalendarDays className="w-3 h-3 flex-shrink-0" />
                    <span>{new Date(nextMatch.match_date!).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{nextMatch.match_time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {nextMatch.home_team.logo_url ? <Image src={nextMatch.home_team.logo_url} alt={nextMatch.home_team.name} width={44} height={44} className="object-cover" /> : <span className="text-[9px]">LOGO</span>}
                  </div>
                  <span className="font-bold text-xs text-center">{nextMatch.home_team.name}</span>
                </div>
                <div className="flex flex-col items-center justify-center"><span className="text-[#D4AF37] font-bold text-xl">VS</span></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {nextMatch.away_team.logo_url ? <Image src={nextMatch.away_team.logo_url} alt={nextMatch.away_team.name} width={44} height={44} className="object-cover" /> : <span className="text-[9px]">LOGO</span>}
                  </div>
                  <span className="font-bold text-xs text-center">{nextMatch.away_team.name}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* GRIGLIA CLASSIFICHE E MARCATORI */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* CLASSIFICA LAMPO CON SWIPE */}
          <div 
            className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 touch-pan-y"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.startX = touch.clientX.toString();
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || '0');
              const diff = touch.clientX - startX;
              
              // Swipe di almeno 50px
              if (Math.abs(diff) > 50) {
                if (diff > 0 && activeGroup === 'B') {
                  setActiveGroup('A'); // Swipe destra → Girone A
                } else if (diff < 0 && activeGroup === 'A') {
                  setActiveGroup('B'); // Swipe sinistra → Girone B
                }
              }
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1 min-w-0">
                <Trophy size={12} className="text-[#D4AF37] flex-shrink-0" strokeWidth={2.5} />
                <h2 className="text-[#581C24] font-bold text-xs uppercase tracking-wider truncate">Girone</h2>
                <div className="flex gap-1 ml-1 flex-shrink-0">
                  <button onClick={() => setActiveGroup('A')} className={`h-1.5 rounded-full transition-all ${activeGroup === 'A' ? 'bg-[#581C24] w-3' : 'bg-gray-300 w-1.5'}`} />
                  <button onClick={() => setActiveGroup('B')} className={`h-1.5 rounded-full transition-all ${activeGroup === 'B' ? 'bg-[#581C24] w-3' : 'bg-gray-300 w-1.5'}`} />
                </div>
              </div>
              <Link href="/classifiche" className="text-[#581C24] text-[9px] font-bold uppercase flex-shrink-0 flex items-center gap-0.5">Vedi <ChevronRight size={10}/></Link>
            </div>
            <div className="space-y-1 pt-0.5">
              {(activeGroup === 'A' ? standingsA : standingsB).map((team, idx) => (
                <div key={team.id} className="flex items-center justify-between text-[10px] py-0.5">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`font-bold w-3 flex-shrink-0 ${idx === 0 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{idx + 1}</span>
                    <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {team.logo_url ? <Image src={team.logo_url} alt="" width={16} height={16} className="object-cover" /> : <span className="text-[5px] text-gray-400">L</span>}
                    </div>
                    <span className="font-bold truncate text-[10px]">{team.name}</span>
                  </div>
                  <span className="font-black text-[#581C24] w-5 text-right flex-shrink-0 text-[10px]">{team.pt}</span>
                </div>
              ))}
              {(activeGroup === 'A' ? standingsA : standingsB).length === 0 && (
                <div className="text-center py-2 text-[9px] text-gray-400">Nessun dato</div>
              )}
            </div>
          </div>

          {/* TOP MARCATORI */}
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1 min-w-0">
                <SoccerShoe size={12} className="text-[#D4AF37] flex-shrink-0" />
                <h2 className="text-[#581C24] font-bold text-xs uppercase tracking-wider truncate">Marcatori</h2>
              </div>
              <Link href="/classifiche?tab=marcatori" className="text-[#581C24] text-[9px] font-bold uppercase flex-shrink-0 flex items-center gap-0.5">Vedi <ChevronRight size={10}/></Link>
            </div>
            <div className="space-y-1 pt-0.5">
              {topScorers.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between text-[10px] py-0.5">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className={`font-bold w-3 flex-shrink-0 ${idx === 0 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{idx + 1}</span>
                    <div className="flex-1 min-w-0 ml-0.5">
                      <p className="font-bold truncate text-[10px] uppercase">{player.first_name[0]}. {player.last_name}</p>
                      <p className="text-[7px] text-gray-500 truncate">{player.team?.name}</p>
                    </div>
                  </div>
                  <span className="font-black text-[#581C24] w-4 text-right flex-shrink-0 text-[10px]">{player.goals}</span>
                </div>
              ))}
              {topScorers.length === 0 && (
                <div className="text-center py-2 text-[9px] text-gray-400">Nessun gol</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}