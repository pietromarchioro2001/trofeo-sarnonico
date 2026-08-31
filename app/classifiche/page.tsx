'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Tipi corretti per Supabase
interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  girone: 'A' | 'B' | null;
}

interface TeamStats extends Team {
  pt: number;
  pg: number;
  v: number;
  p: number;
  s: number;
  gf: number;
  gs: number;
  dr: number;
}

// Tipo per i dati partita da Supabase (con relazioni corrette)
interface MatchData {
  id: string;
  match_key: string | null;
  phase: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  away_team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

// Tipo per i marcatori
interface PlayerData {
  id: string;
  first_name: string;
  last_name: string;
  goals: number;
  team: {
    name: string;
    logo_url: string | null;
  } | null;
}

// Tipo per Coppa Chiosco
interface BarMeterData {
  total_meters: number;
  team: {
    name: string;
    logo_url: string | null;
  } | null;
}

// Icona medaglia
const MedalIcon = ({ type }: { type: 'gold' | 'silver' | 'bronze' }) => {
  const colors = {
    gold: { bg: '#F9E4A8', border: '#C9B037', text: '#8B7508' },
    silver: { bg: '#E8E8E8', border: '#A0A0A0', text: '#606060' },
    bronze: { bg: '#E8C8A8', border: '#B87333', text: '#8B5A2B' },
  };
  const c = colors[type];
  return (
    <div 
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <span className="text-[8px] font-black" style={{ color: c.text }}>
        {type === 'gold' ? '1°' : type === 'silver' ? '2°' : '3°'}
      </span>
    </div>
  );
};

export default function ClassifichePage() {
  const [activeTab, setActiveTab] = useState<'gironi' | 'fase-finale' | 'marcatori' | 'coppa-chiosco'>('gironi');
  const [phaseSubTab, setPhaseSubTab] = useState<'quarti' | 'semifinali' | 'finale'>('quarti');
  const searchParams = useSearchParams();

  const [standings, setStandings] = useState<{ gironeA: TeamStats[], gironeB: TeamStats[] }>({ gironeA: [], gironeB: [] });
  const [phaseMatches, setPhaseMatches] = useState<MatchData[]>([]);
  const [topScorers, setTopScorers] = useState<PlayerData[]>([]);
  const [barMeters, setBarMeters] = useState<BarMeterData[]>([]);
  const [loading, setLoading] = useState(true);

  // Gestione tab da URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'marcatori') {
      setActiveTab('marcatori');
    }
  }, [searchParams]);

  // Fetch dati da Supabase
    // Fetch dati da Supabase (VERSIONE CORRETTA SENZA RELAZIONI ANNIDATE)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. CLASSIFICA GIRONI (Calcolata dalle partite finite)
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('home_team_id, away_team_id, home_score, away_score, status')
          .eq('status', 'FINITA');

        if (matchesError) throw matchesError;

        // Raccogli tutti gli ID delle squadre unici
        const teamIds = Array.from(
          new Set(
            (matchesData || [])
              .flatMap(m => [m.home_team_id, m.away_team_id])
              .filter(Boolean)
          )
        );

        let teamsData: any[] = [];
        if (teamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url, girone')
            .in('id', teamIds);
          if (teamsError) throw teamsError;
          teamsData = teams || [];
        }

        const statsMap = new Map<string, TeamStats>();

        // Inizializza la mappa con i dati delle squadre
        teamsData.forEach(t => {
          statsMap.set(t.id, { 
            id: t.id, 
            name: t.name, 
            logo_url: t.logo_url, 
            girone: t.girone, 
            pt: 0, pg: 0, v: 0, p: 0, s: 0, gf: 0, gs: 0, dr: 0 
          });
        });

        matchesData?.forEach((m: any) => {
          const homeStats = statsMap.get(m.home_team_id);
          const awayStats = statsMap.get(m.away_team_id);
          if (!homeStats || !awayStats) return;

          homeStats.pg += 1;
          awayStats.pg += 1;
          homeStats.gf += m.home_score || 0;
          homeStats.gs += m.away_score || 0;
          homeStats.dr = homeStats.gf - homeStats.gs;
          
          awayStats.gf += m.away_score || 0;
          awayStats.gs += m.home_score || 0;
          awayStats.dr = awayStats.gf - awayStats.gs;

          if ((m.home_score || 0) > (m.away_score || 0)) {
            homeStats.v += 1;
            homeStats.pt += 3;
            awayStats.s += 1;
          } else if ((m.home_score || 0) < (m.away_score || 0)) {
            awayStats.v += 1;
            awayStats.pt += 3;
            homeStats.s += 1;
          } else {
            homeStats.p += 1;
            homeStats.pt += 1;
            awayStats.p += 1;
            awayStats.pt += 1;
          }
        });

        const allStats = Array.from(statsMap.values());
        const sortFn = (a: TeamStats, b: TeamStats) => b.pt - a.pt || b.dr - a.dr || b.gf - a.gf;

        setStandings({
          gironeA: allStats.filter(t => t.girone === 'A').sort(sortFn),
          gironeB: allStats.filter(t => t.girone === 'B').sort(sortFn),
        });

        // 2. FASE FINALE
        const { data: phaseMatchesData, error: phaseError } = await supabase
          .from('matches')
          .select('id, match_key, phase, status, home_score, away_score, home_team_id, away_team_id')
          .in('phase', ['QUARTI', 'SEMIFINALI', 'FINALE', 'FINALE_3_4'])
          .order('match_key', { ascending: true });

        if (phaseError) throw phaseError;

        const phaseTeamIds = Array.from(
          new Set(
            (phaseMatchesData || [])
              .flatMap(m => [m.home_team_id, m.away_team_id])
              .filter(Boolean)
          )
        );

        let phaseTeamsData: any[] = [];
        if (phaseTeamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', phaseTeamIds);
          if (teamsError) throw teamsError;
          phaseTeamsData = teams || [];
        }

        const mappedPhaseMatches: MatchData[] = (phaseMatchesData || []).map((m: any) => ({
          id: m.id,
          match_key: m.match_key,
          phase: m.phase,
          status: m.status,
          home_score: m.home_score,
          away_score: m.away_score,
          home_team: phaseTeamsData.find((t: any) => t.id === m.home_team_id) || null,
          away_team: phaseTeamsData.find((t: any) => t.id === m.away_team_id) || null,
        }));
        setPhaseMatches(mappedPhaseMatches);

        // 3. MARCATORI
        const { data: scorersData, error: scorersError } = await supabase
          .from('players')
          .select('id, first_name, last_name, goals, team_id')
          .gt('goals', 0)
          .order('goals', { ascending: false })
          .limit(20);

        if (scorersError) throw scorersError;

        const scorerTeamIds = Array.from(new Set((scorersData || []).map(p => p.team_id).filter(Boolean)));
        let scorerTeamsData: any[] = [];
        if (scorerTeamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', scorerTeamIds);
          if (teamsError) throw teamsError;
          scorerTeamsData = teams || [];
        }

        const mappedScorers: PlayerData[] = (scorersData || []).map((p: any) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          goals: p.goals,
          team: scorerTeamsData.find((t: any) => t.id === p.team_id) || null,
        }));
        setTopScorers(mappedScorers);

        // 4. COPPA CHIOSCO
        const { data: metersData, error: metersError } = await supabase
          .from('bar_meters')
          .select('total_meters, team_id')
          .order('total_meters', { ascending: false });

        if (metersError) throw metersError;

        const meterTeamIds = Array.from(new Set((metersData || []).map(m => m.team_id).filter(Boolean)));
        let meterTeamsData: any[] = [];
        if (meterTeamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .in('id', meterTeamIds);
          if (teamsError) throw teamsError;
          meterTeamsData = teams || [];
        }

        const mappedMeters: BarMeterData[] = (metersData || []).map((m: any) => ({
          total_meters: m.total_meters,
          team: meterTeamsData.find((t: any) => t.id === m.team_id) || null,
        }));
        setBarMeters(mappedMeters);

      } catch (err) {
        console.error('Errore fetch classifiche:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento classifiche...</p>
        </div>
      </div>
    );
  }
  
  // Mantieni TUTTO il codice JSX originale delle ~600 righe
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-standing.jpg" alt="Classifiche" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            CLASSIFICHE
          </h1>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="relative z-20 -mt-8 px-2 sm:px-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-1.5 flex gap-1">
          {(['gironi', 'fase-finale', 'marcatori', 'coppa-chiosco'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-100'
              }`}
            >
              {tab === 'gironi' ? 'GIRONI' : tab === 'fase-finale' ? 'FASE FINALE' : tab === 'marcatori' ? 'MARCATORI' : 'COPPA CHIOSCO'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENUTO TAB */}
      <div className="px-3 sm:px-4">
        {/* === GIRONI === */}
        {activeTab === 'gironi' && (
          <>
            {(['gironeA', 'gironeB'] as const).map((gironeKey) => {
              const gironeName = gironeKey === 'gironeA' ? 'GIRONE A' : 'GIRONE B';
              const teams = standings[gironeKey];
              
              return (
                <div key={gironeKey} className="mb-6">
                  <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-3">{gironeName}</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[8px] font-bold text-gray-600 uppercase">
                      <div className="w-5 text-center flex-shrink-0">#</div>
                      <div className="flex-1 pl-1">SQUADRA</div>
                      <div className="w-6 text-center flex-shrink-0">PT</div>
                      <div className="w-5 text-center flex-shrink-0">PG</div>
                      <div className="w-4 text-center flex-shrink-0">V</div>
                      <div className="w-4 text-center flex-shrink-0">P</div>
                      <div className="w-4 text-center flex-shrink-0">S</div>
                      <div className="w-5 text-center flex-shrink-0">GF</div>
                      <div className="w-5 text-center flex-shrink-0">GS</div>
                      <div className="w-6 text-center flex-shrink-0">DR</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {teams.length === 0 ? (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">Nessuna partita giocata</div>
                      ) : (
                        teams.map((team, index) => (
                          <div key={team.id} className="flex items-center px-3 py-2">
                            <div className="w-5 text-center flex-shrink-0">
                              <span className="font-bold text-xs text-gray-700">{index + 1}</span>
                            </div>
                            <div className="flex-1 pl-1 flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {team.logo_url ? (
                                  <Image src={team.logo_url} alt={team.name} width={20} height={20} className="object-cover" />
                                ) : (
                                  <span className="text-[5px] text-gray-400">L</span>
                                )}
                              </div>
                              <span className="font-bold text-[11px] text-[#000000] uppercase truncate">{team.name}</span>
                            </div>
                            <div className="w-6 text-center flex-shrink-0"><span className="font-black text-xs text-[#581C24]">{team.pt}</span></div>
                            <div className="w-5 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.pg}</span></div>
                            <div className="w-4 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.v}</span></div>
                            <div className="w-4 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.p}</span></div>
                            <div className="w-4 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.s}</span></div>
                            <div className="w-5 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.gf}</span></div>
                            <div className="w-5 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.gs}</span></div>
                            <div className="w-6 text-center flex-shrink-0"><span className="text-[10px] text-gray-600">{team.dr > 0 ? `+${team.dr}` : team.dr}</span></div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* === FASE FINALE === */}
        {activeTab === 'fase-finale' && (
          <>
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-1.5 flex gap-1">
                {(['quarti', 'semifinali', 'finale'] as const).map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setPhaseSubTab(subTab)}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                      phaseSubTab === subTab ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-100'
                    }`}
                  >
                    {subTab === 'quarti' ? 'QUARTI' : subTab === 'semifinali' ? 'SEMIFINALI' : 'FINALI'}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-8">
              {phaseSubTab === 'quarti' && (
                <div className="space-y-4 max-w-[220px] mx-auto">
                  {phaseMatches.filter(m => m.phase === 'QUARTI').map((match) => (
                    <Link key={match.id} href={`/partite/${match.id}`} className="block relative">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.home_team?.logo_url ? (
                                <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.home_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.home_score ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.away_team?.logo_url ? (
                                <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.away_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.away_score ?? '-'}</span>
                        </div>
                      </div>
                      <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                    </Link>
                  ))}
                </div>
              )}

              {phaseSubTab === 'semifinali' && (
                <div className="relative max-w-[220px] mx-auto">
                  {phaseMatches.filter(m => m.phase === 'SEMIFINALI').map((match, idx) => (
                    <div key={match.id} className={`relative ${idx === 0 ? 'mb-32' : ''}`}>
                      <div className="absolute -left-12 top-1/2 w-6 h-px bg-gray-300" />
                      <div className="absolute -left-6 top-1/2 w-px h-[100px] bg-gray-300" /> 
                      <div className="absolute -left-12 top-[140px] w-6 h-px bg-gray-300" /> 
                      <div className="absolute -left-6 top-[88px] w-6 h-px bg-gray-300" /> 

                      <Link href={`/partite/${match.id}`} className={`block relative ${idx === 0 ? 'translate-y-11' : 'translate-y-12'}`}>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {match.home_team?.logo_url ? (
                                  <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className="text-[6px] text-gray-400">L</span>}
                              </div>
                              <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.home_team?.name || 'TBD'}</span>
                            </div>
                            <span className="font-black text-base text-[#581C24] ml-2">{match.home_score ?? '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {match.away_team?.logo_url ? (
                                  <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className="text-[6px] text-gray-400">L</span>}
                              </div>
                              <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.away_team?.name || 'TBD'}</span>
                            </div>
                            <span className="font-black text-base text-[#581C24] ml-2">{match.away_score ?? '-'}</span>
                          </div>
                        </div>
                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {phaseSubTab === 'finale' && (
                <div className="relative max-w-[220px] mx-auto pt-8 pb-32">
                  <div className="absolute -left-12 top-24 w-6 h-px bg-gray-300" />
                  <div className="absolute -left-6 top-24 w-px h-[165px] bg-gray-300" />
                  <div className="absolute -left-12 top-[260px] w-6 h-px bg-gray-300" />
                  <div className="absolute -left-6 top-[180px] w-6 h-px bg-gray-300" />

                  {phaseMatches.filter(m => m.phase === 'FINALE').map((match) => (
                    <Link key={match.id} href={`/partite/${match.id}`} className="block relative translate-y-[110px]">
                      <div className="bg-gradient-to-br from-[#F9E4A8] to-[#E8D49A] rounded-xl shadow-md border-2 border-[#C9B037] p-3 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.home_team?.logo_url ? (
                                <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.home_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.home_score ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.away_team?.logo_url ? (
                                <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.away_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.away_score ?? '-'}</span>
                        </div>
                      </div>
                      <div className="absolute left-1/2 -bottom-16 w-px h-16 bg-gray-300 -translate-x-1/2" />
                    </Link>
                  ))}

                  {phaseMatches.filter(m => m.phase === 'FINALE_3_4').map((match) => (
                    <Link key={match.id} href={`/partite/${match.id}`} className="block relative translate-y-[160px]">
                      <div className="bg-gradient-to-br from-[#E8C8A8] to-[#D4B494] rounded-xl shadow-md border-2 border-[#B87333] p-3 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.home_team?.logo_url ? (
                                <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.home_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.home_score ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {match.away_team?.logo_url ? (
                                <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                              ) : <span className="text-[6px] text-gray-400">L</span>}
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">{match.away_team?.name || 'TBD'}</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">{match.away_score ?? '-'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* === MARCATORI === */}
        {activeTab === 'marcatori' && (
          <div className="px-3 sm:px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                <div className="w-8 text-center flex-shrink-0">POS</div>
                <div className="flex-1 pl-2">GIOCATORE</div>
                <div className="w-20 text-center flex-shrink-0">SQUADRA</div>
                <div className="w-10 text-center flex-shrink-0">GOL</div>
              </div>
              <div className="divide-y divide-gray-100">
                {topScorers.length === 0 ? (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">Nessun marcatore</div>
                ) : (
                  topScorers.map((player, index) => (
                    <div key={player.id} className="flex items-center px-3 py-2.5">
                      <div className="w-8 text-center flex-shrink-0">
                        {index === 0 ? <MedalIcon type="gold" /> : index === 1 ? <MedalIcon type="silver" /> : index === 2 ? <MedalIcon type="bronze" /> : <span className="font-bold text-xs text-gray-700">{index + 1}</span>}
                      </div>
                      <div className="flex-1 pl-2 flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                           {player.team?.logo_url ? (
                             <Image src={player.team.logo_url} alt={player.team.name} width={20} height={20} className="object-cover" />
                           ) : <span className="text-[5px] text-gray-400">L</span>}
                        </div>
                        <span className="font-bold text-[11px] text-[#000000] uppercase truncate">{player.first_name} {player.last_name}</span>
                      </div>
                      <div className="w-20 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600 uppercase">{player.team?.name}</span>
                      </div>
                      <div className="w-10 text-center flex-shrink-0">
                        <span className="font-black text-sm text-[#581C24]">{player.goals}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* === COPPA CHIOSCO === */}
        {activeTab === 'coppa-chiosco' && (
          <div className="px-3 sm:px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 pb-8">
                <div className="flex items-end justify-center gap-4 sm:gap-8">
                  {barMeters[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[100px]">
                      <div className="mb-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300 overflow-hidden">
                          {barMeters[1].team?.logo_url ? (
                            <Image src={barMeters[1].team.logo_url} alt={barMeters[1].team.name} width={64} height={64} className="object-cover" />
                          ) : <span className="text-[8px] text-gray-400">LOGO</span>}
                        </div>
                      </div>
                      <div className="text-center mb-2">
                        <p className="font-bold text-xs text-[#581C24] uppercase">{barMeters[1].team?.name}</p>
                        <p className="text-2xl font-black text-[#581C24]">{barMeters[1].total_meters}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                      <div className="w-full h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg shadow-md" />
                    </div>
                  )}
                  {barMeters[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[120px] -mt-4">
                      <div className="mb-2 relative">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#FFD700] overflow-hidden">
                          {barMeters[0].team?.logo_url ? (
                            <Image src={barMeters[0].team.logo_url} alt={barMeters[0].team.name} width={80} height={80} className="object-cover" />
                          ) : <span className="text-[8px] text-gray-400">LOGO</span>}
                        </div>
                      </div>
                      <div className="text-center mb-2">
                        <p className="font-bold text-sm text-[#581C24] uppercase">{barMeters[0].team?.name}</p>
                        <p className="text-3xl font-black text-[#581C24]">{barMeters[0].total_meters}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                      <div className="w-full h-12 bg-gradient-to-b from-[#F9E4A8] to-[#C9B037] rounded-t-lg shadow-lg" />
                    </div>
                  )}
                  {barMeters[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[100px]">
                      <div className="mb-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#CD7F32] overflow-hidden">
                          {barMeters[2].team?.logo_url ? (
                            <Image src={barMeters[2].team.logo_url} alt={barMeters[2].team.name} width={64} height={64} className="object-cover" />
                          ) : <span className="text-[8px] text-gray-400">LOGO</span>}
                        </div>
                      </div>
                      <div className="text-center mb-2">
                        <p className="font-bold text-xs text-[#581C24] uppercase">{barMeters[2].team?.name}</p>
                        <p className="text-2xl font-black text-[#581C24]">{barMeters[2].total_meters}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                      <div className="w-full h-6 bg-gradient-to-b from-[#E8C8A8] to-[#B87333] rounded-t-lg shadow-md" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 px-3 py-4">
                <div className="space-y-3">
                  {barMeters.slice(3).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                      <div className="w-6 text-center">
                        <span className="font-bold text-sm text-gray-700">{index + 4}</span>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.team?.logo_url ? (
                          <Image src={item.team.logo_url} alt={item.team.name} width={32} height={32} className="object-cover" />
                        ) : <span className="text-[6px] text-gray-400">L</span>}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-xs text-[#000000] uppercase">{item.team?.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-[#581C24]">{item.total_meters}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-3 sm:px-4">
      </div>
    </div>
  );
}