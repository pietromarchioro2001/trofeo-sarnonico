'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { AdminCreateQuarters } from '@/components/AdminButtons';

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

interface BarMeterData {
  team_id: string;
  total_meters: number;
  team: {
    name: string;
    logo_url: string | null;
  } | null;
}

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
  const { isStaffMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'gironi' | 'fase-finale' | 'marcatori' | 'coppa-chiosco'>('gironi');
  const [phaseSubTab, setPhaseSubTab] = useState<'quarti' | 'semifinali' | 'finale'>('quarti');
  const [hasFinalPhase, setHasFinalPhase] = useState(false);
  const searchParams = useSearchParams();

  const [standings, setStandings] = useState<{ gironeA: TeamStats[], gironeB: TeamStats[] }>({ gironeA: [], gironeB: [] });
  const [phaseMatches, setPhaseMatches] = useState<MatchData[]>([]);
  const [topScorers, setTopScorers] = useState<PlayerData[]>([]);
  const [barMeters, setBarMeters] = useState<BarMeterData[]>([]);
  const [liveMatchesMap, setLiveMatchesMap] = useState<Map<string, { matchId: string; score: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'marcatori') {
      setActiveTab('marcatori');
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. CLASSIFICA GIRONI (solo se NON siamo ancora in fase finale)
      const { data: finalPhaseMatches } = await supabase
        .from('matches')
        .select('phase')
        .in('phase', ['QUARTI', 'SEMIFINALI', 'FINALE', 'FINALE_3_4'])
        .limit(1);

      const hasFinalPhase = finalPhaseMatches && finalPhaseMatches.length > 0;

      // Se siamo già in fase finale, NON aggiornare le classifiche
      if (!hasFinalPhase) {
        const { data: allTeams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url, girone');

        if (teamsError) throw teamsError;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_score, away_score, status, phase')
          .eq('phase', 'GIRONI') // ✅ Solo partite dei gironi
          .in('status', ['FINITA', 'LIVE', 'SUPP', 'RIGORI']);

        if (matchesError) throw matchesError;

        const statsMap = new Map<string, TeamStats>();
        const newLiveMap = new Map<string, { matchId: string; score: string }>();

        (allTeams || []).forEach(t => {
          statsMap.set(t.id, { 
            id: t.id, name: t.name, logo_url: t.logo_url, girone: t.girone, 
            pt: 0, pg: 0, v: 0, p: 0, s: 0, gf: 0, gs: 0, dr: 0 
          });
        });

        matchesData?.forEach((m: any) => {
          const homeStats = statsMap.get(m.home_team_id);
          const awayStats = statsMap.get(m.away_team_id);
          if (!homeStats || !awayStats) return;

          const hScore = m.home_score || 0;
          const aScore = m.away_score || 0;

          homeStats.pg += 1;
          awayStats.pg += 1;
          homeStats.gf += hScore;
          homeStats.gs += aScore;
          homeStats.dr = homeStats.gf - homeStats.gs;
          
          awayStats.gf += aScore;
          awayStats.gs += hScore;
          awayStats.dr = awayStats.gf - awayStats.gs;

          if (hScore > aScore) {
            homeStats.v += 1; homeStats.pt += 3; awayStats.s += 1;
          } else if (aScore > hScore) {
            awayStats.v += 1; awayStats.pt += 3; homeStats.s += 1;
          } else {
            homeStats.p += 1; homeStats.pt += 1;
            awayStats.p += 1; awayStats.pt += 1;
          }

          if (m.status === 'LIVE' || m.status === 'SUPP' || m.status === 'RIGORI') {
            newLiveMap.set(m.home_team_id, { matchId: m.id, score: `${hScore} - ${aScore}` });
            newLiveMap.set(m.away_team_id, { matchId: m.id, score: `${hScore} - ${aScore}` });
          }
        });

        const allStats = Array.from(statsMap.values());
        const sortFn = (a: TeamStats, b: TeamStats) => b.pt - a.pt || b.dr - a.dr || b.gf - a.gf;

        setStandings({
          gironeA: allStats.filter(t => t.girone === 'A').sort(sortFn),
          gironeB: allStats.filter(t => t.girone === 'B').sort(sortFn),
        });
        setLiveMatchesMap(newLiveMap);
      }
      // ✅ Se siamo in fase finale, le classifiche rimangono congelate (non facciamo nulla)

      // 2. FASE FINALE
      const { data: phaseMatchesData, error: phaseError } = await supabase
        .from('matches')
        .select('id, match_key, phase, status, home_score, away_score, home_team_id, away_team_id')
        .in('phase', ['QUARTI', 'SEMIFINALI', 'FINALE', 'FINALE_3_4'])
        .order('match_key', { ascending: true });

      if (phaseError) throw phaseError;

      const phaseTeamIds = Array.from(
        new Set((phaseMatchesData || []).flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean))
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
        id: m.id, match_key: m.match_key, phase: m.phase, status: m.status,
        home_score: m.home_score, away_score: m.away_score,
        home_team: phaseTeamsData.find((t: any) => t.id === m.home_team_id) || null,
        away_team: phaseTeamsData.find((t: any) => t.id === m.away_team_id) || null,
      }));
      setPhaseMatches(mappedPhaseMatches);
      // ✅ CONTROLLA SE ESISTE LA FASE FINALE
      const hasFinal = mappedPhaseMatches.length > 0;
      setHasFinalPhase(hasFinal);
      
      // Se c'è la fase finale, imposta come default
      if (hasFinal) {
        setActiveTab('fase-finale');
        // Salva nel localStorage per le visite successive
        localStorage.setItem('classifiche_default_tab', 'fase-finale');
      } else {
        // Altrimenti controlla se c'era un salvataggio precedente
        const savedTab = localStorage.getItem('classifiche_default_tab');
        if (savedTab === 'fase-finale') {
          setActiveTab('fase-finale');
        }
      }

      // 3. MARCATORI
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name, goals, team_id')
        .order('goals', { ascending: false })
        .limit(50);

      if (playersError) throw playersError;

      const playerTeamIds = Array.from(new Set((allPlayers || []).map(p => p.team_id).filter(Boolean)));
      let playerTeamsData: any[] = [];
      if (playerTeamIds.length > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', playerTeamIds);
        if (teamsError) throw teamsError;
        playerTeamsData = teams || [];
      }

      setTopScorers((allPlayers || []).map((p: any) => ({
        id: p.id, first_name: p.first_name, last_name: p.last_name, goals: p.goals,
        team: playerTeamsData.find((t: any) => t.id === p.team_id) || null,
      })));

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

      setBarMeters((metersData || []).map((m: any) => ({
        team_id: m.team_id,
        total_meters: m.total_meters,
        team: meterTeamsData.find((t: any) => t.id === m.team_id) || null,
      })));

    } catch (err) {
      console.error('Errore fetch classifiche:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ REALTIME: Aggiorna classifica e coppa chiosco in tempo reale
  useEffect(() => {
    const supabase = createClient();
    
    const matchesChannel = supabase
      .channel('classifiche-matches-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const barChannel = supabase
      .channel('classifiche-bar-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bar_meters' },
        (payload) => {
          const updatedTeamId = payload.new.team_id;
          const newMeters = payload.new.total_meters;
          
          setBarMeters(prev => {
            const updated = prev.map(item => 
              item.team_id === updatedTeamId ? { ...item, total_meters: newMeters } : item
            );
            return updated.sort((a, b) => b.total_meters - a.total_meters);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(barChannel);
    };
  }, [fetchData]);

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
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">Squadre non presenti</div>
                      ) : (
                        teams.map((team, index) => {
                          const isLive = liveMatchesMap.has(team.id);
                          const liveData = liveMatchesMap.get(team.id);

                          return (
                            <div key={team.id} className={`flex items-center px-3 py-2 transition-colors ${isLive ? 'bg-[#581C24]/5' : ''}`}>
                              <div className="w-5 text-center flex-shrink-0">
                                <span className={`font-bold text-xs ${isLive ? 'text-[#581C24]' : 'text-gray-700'}`}>{index + 1}</span>
                              </div>
                              <div className="flex-1 pl-1 flex items-center gap-1.5 min-w-0">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLive ? 'bg-[#581C24]/10' : 'bg-gray-100'}`}>
                                  {team.logo_url ? (
                                    <Image src={team.logo_url} alt={team.name} width={20} height={20} className="object-cover" />
                                  ) : (
                                    <span className="text-[5px] text-gray-400">L</span>
                                  )}
                                </div>
                                <span className={`font-bold text-[11px] uppercase truncate ${isLive ? 'text-[#581C24]' : 'text-[#000000]'}`}>{team.name}</span>
                                {isLive && (
                                  <Link href={`/partite/${liveData!.matchId}`} className="flex-shrink-0 px-1.5 py-0.5 bg-[#581C24] text-white text-[8px] font-bold rounded animate-pulse flex items-center gap-1 shadow-sm">
                                    <span className="w-1 h-1 bg-white rounded-full" />
                                    {liveData!.score}
                                  </Link>
                                )}
                              </div>
                              <div className="w-6 text-center flex-shrink-0"><span className={`font-black text-xs ${isLive ? 'text-[#581C24]' : 'text-[#581C24]'}`}>{team.pt}</span></div>
                              <div className="w-5 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.pg}</span></div>
                              <div className="w-4 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.v}</span></div>
                              <div className="w-4 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.p}</span></div>
                              <div className="w-4 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.s}</span></div>
                              <div className="w-5 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.gf}</span></div>
                              <div className="w-5 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.gs}</span></div>
                              <div className="w-6 text-center flex-shrink-0"><span className={`text-[10px] ${isLive ? 'text-[#581C24]/70' : 'text-gray-600'}`}>{team.dr > 0 ? `+${team.dr}` : team.dr}</span></div>
                            </div>
                          );
                        })
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
                <>
                  {/* ✅ PULSANTE CREA FASE FINALE (visibile solo allo staff e se non ci sono ancora quarti) */}
                  {isStaffMode && phaseMatches.filter(m => m.phase === 'QUARTI').length === 0 && (
                    <div className="mb-8 max-w-md mx-auto">
                      <AdminCreateQuarters onSuccess={() => fetchData()} />
                    </div>
                  )}

                  <div className="space-y-4 max-w-[220px] mx-auto">
                    {phaseMatches.filter(m => m.phase === 'QUARTI').length === 0 && !isStaffMode ? (
                      <div className="text-center py-8 text-gray-500 text-sm font-bold uppercase">
                        Quarti di finale non ancora programmati
                      </div>
                    ) : (
                      phaseMatches.filter(m => m.phase === 'QUARTI').map((match) => {
                        const isMatchLive = match.status === 'LIVE' || match.status === 'SUPP' || match.status === 'RIGORI';
                        return (
                          <Link key={match.id} href={`/partite/${match.id}`} className="block relative">
                            <div className={`rounded-xl shadow-sm border p-3 transition-shadow relative ${
                              isMatchLive 
                                ? 'bg-[#581C24] text-white border-[#581C24] shadow-[0_0_15px_rgba(88,28,36,0.3)]' 
                                : 'bg-white border-gray-100 hover:shadow-md'
                            }`}>
                              {isMatchLive && (
                                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse z-10">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    {match.home_team?.logo_url ? (
                                      <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                                    ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                                  </div>
                                  <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.home_team?.name || 'TBD'}</span>
                                </div>
                                <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.home_score ?? '-'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    {match.away_team?.logo_url ? (
                                      <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                                    ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                                  </div>
                                  <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.away_team?.name || 'TBD'}</span>
                                </div>
                                <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.away_score ?? '-'}</span>
                              </div>
                            </div>
                            <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                          </Link>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {phaseSubTab === 'semifinali' && (
                <div className="relative max-w-[220px] mx-auto">
                  {phaseMatches.filter(m => m.phase === 'SEMIFINALI').map((match, idx) => {
                    const isMatchLive = match.status === 'LIVE' || match.status === 'SUPP' || match.status === 'RIGORI';
                    return (
                      <div key={match.id} className={`relative ${idx === 0 ? 'mb-32' : ''}`}>
                        <div className="absolute -left-12 top-1/2 w-6 h-px bg-gray-300" />
                        <div className="absolute -left-6 top-1/2 w-px h-[100px] bg-gray-300" /> 
                        <div className="absolute -left-12 top-[140px] w-6 h-px bg-gray-300" /> 
                        <div className="absolute -left-6 top-[88px] w-6 h-px bg-gray-300" /> 

                        <Link href={`/partite/${match.id}`} className={`block relative ${idx === 0 ? 'translate-y-11' : 'translate-y-12'}`}>
                          <div className={`rounded-xl shadow-sm border p-3 transition-shadow relative ${
                            isMatchLive 
                              ? 'bg-[#581C24] text-white border-[#581C24] shadow-[0_0_15px_rgba(88,28,36,0.3)]' 
                              : 'bg-white border-gray-100 hover:shadow-md'
                          }`}>
                            {isMatchLive && (
                              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse z-10">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                                  {match.home_team?.logo_url ? (
                                    <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                                  ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                                </div>
                                <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.home_team?.name || 'TBD'}</span>
                              </div>
                              <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.home_score ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                                  {match.away_team?.logo_url ? (
                                    <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                                  ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                                </div>
                                <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.away_team?.name || 'TBD'}</span>
                              </div>
                              <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.away_score ?? '-'}</span>
                            </div>
                          </div>
                          <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              {phaseSubTab === 'finale' && (
                <div className="relative max-w-[220px] mx-auto pt-8 pb-32">
                  {phaseMatches.some(m => m.phase === 'FINALE' || m.phase === 'FINALE_3_4') && (
                    <>
                      <div className="absolute -left-12 top-24 w-6 h-px bg-gray-300" />
                      <div className="absolute -left-6 top-24 w-px h-[165px] bg-gray-300" />
                      <div className="absolute -left-12 top-[260px] w-6 h-px bg-gray-300" />
                      <div className="absolute -left-6 top-[180px] w-6 h-px bg-gray-300" />
                    </>
                  )}

                  {phaseMatches.filter(m => m.phase === 'FINALE').map((match) => {
                    const isMatchLive = match.status === 'LIVE' || match.status === 'SUPP' || match.status === 'RIGORI';
                    return (
                      <Link key={match.id} href={`/partite/${match.id}`} className="block relative translate-y-[110px]">
                        <div className={`rounded-xl shadow-md border-2 p-3 transition-shadow relative ${
                          isMatchLive
                            ? 'bg-[#581C24] text-white border-[#581C24] shadow-[0_0_20px_rgba(88,28,36,0.4)]'
                            : 'bg-gradient-to-br from-[#F9E4A8] to-[#E8D49A] border-[#C9B037] hover:shadow-lg'
                        }`}>
                          {isMatchLive && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse z-10">
                              <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-white/80'}`}>
                                {match.home_team?.logo_url ? (
                                  <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                              </div>
                              <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.home_team?.name || 'TBD'}</span>
                            </div>
                            <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.home_score ?? '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-white/80'}`}>
                                {match.away_team?.logo_url ? (
                                  <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                              </div>
                              <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.away_team?.name || 'TBD'}</span>
                            </div>
                            <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.away_score ?? '-'}</span>
                          </div>
                        </div>
                        <div className="absolute left-1/2 -bottom-16 w-px h-16 bg-gray-300 -translate-x-1/2" />
                      </Link>
                    );
                  })}

                  {phaseMatches.filter(m => m.phase === 'FINALE_3_4').map((match) => {
                    const isMatchLive = match.status === 'LIVE' || match.status === 'SUPP' || match.status === 'RIGORI';
                    return (
                      <Link key={match.id} href={`/partite/${match.id}`} className="block relative translate-y-[160px]">
                        <div className={`rounded-xl shadow-md border-2 p-3 transition-shadow relative ${
                          isMatchLive
                            ? 'bg-[#581C24] text-white border-[#581C24] shadow-[0_0_20px_rgba(88,28,36,0.4)]'
                            : 'bg-gradient-to-br from-[#E8C8A8] to-[#D4B494] border-[#B87333] hover:shadow-lg'
                        }`}>
                          {isMatchLive && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse z-10">
                              <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-white/80'}`}>
                                {match.home_team?.logo_url ? (
                                  <Image src={match.home_team.logo_url} alt={match.home_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                              </div>
                              <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.home_team?.name || 'TBD'}</span>
                            </div>
                            <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.home_score ?? '-'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isMatchLive ? 'bg-white/10' : 'bg-white/80'}`}>
                                {match.away_team?.logo_url ? (
                                  <Image src={match.away_team.logo_url} alt={match.away_team.name} width={24} height={24} className="object-cover" />
                                ) : <span className={`text-[6px] ${isMatchLive ? 'text-white/70' : 'text-gray-400'}`}>L</span>}
                              </div>
                              <span className={`font-bold text-xs uppercase truncate ${isMatchLive ? 'text-white' : 'text-[#000000]'}`}>{match.away_team?.name || 'TBD'}</span>
                            </div>
                            <span className={`font-black text-base ml-2 ${isMatchLive ? 'text-white' : 'text-[#581C24]'}`}>{match.away_score ?? '-'}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">Giocatori non presenti</div>
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
    </div>
  );
}