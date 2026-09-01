'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Vote, X } from 'lucide-react';
import { AdminMVPSelector, AdminStopVoting, AdminAddEvent } from '@/components/AdminButtons';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';

// ==================== TIPI DATI ====================
interface TeamData {
  id: string;
  name: string;
  logo_url: string | null;
}

interface MatchData {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  phase: string;
  match_date: string | null;
  match_time: string | null;
  home_team: TeamData;
  away_team: TeamData;
}

interface MatchPlayerData {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: string | null;
  photo_url: string | null;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  mvp_wins: number;
  team_id: string;
}

interface EventPlayerData {
  first_name: string;
  last_name: string;
}

interface EventData {
  id: string;
  minute: number | null;
  event_type: string;
  player_id: string | null;
  team_id: string | null;
  player: EventPlayerData | null;
}

interface MvpPlayerData {
  id: string;
  name: string;
  team_id: string;
  photo: string | null;
  votes: number;
}

interface PenaltyKick {
  team: 'home' | 'away';
  scored: boolean;
}

interface PenaltyShootoutPopupProps {
  homeTeam: { name: string; logo_url: string | null };
  awayTeam: { name: string; logo_url: string | null };
  isAdmin: boolean;
  onClose: (winner: 'home' | 'away' | null) => void;
}

// ==================== COMPONENTE POPUP RIGORI ====================
const PenaltyShootoutPopup: React.FC<PenaltyShootoutPopupProps> = ({
  homeTeam,
  awayTeam,
  isAdmin,
  onClose
}) => {
  const [started, setStarted] = useState(false);
  const [firstKicker, setFirstKicker] = useState<'home' | 'away' | null>(null);
  const [penaltyScore, setPenaltyScore] = useState({ home: 0, away: 0 });
  const [kicks, setKicks] = useState<PenaltyKick[]>([]);
  const [currentKick, setCurrentKick] = useState(0);
  const [lightState, setLightState] = useState<'none' | 'green' | 'red'>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFirstKickerSelect = (team: 'home' | 'away') => {
    setFirstKicker(team);
    setStarted(true);
  };

  const handleKick = (scored: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const kickingTeam = currentKick % 2 === 0
      ? firstKicker!
      : (firstKicker === 'home' ? 'away' : 'home');

    setLightState(scored ? 'green' : 'red');

    setTimeout(() => {
      setKicks(prev => [...prev, { team: kickingTeam, scored }]);
      if (scored) {
        setPenaltyScore(prev => ({
          ...prev,
          [kickingTeam]: prev[kickingTeam] + 1
        }));
      }
      setCurrentKick(prev => prev + 1);
      setLightState('none');
      setIsProcessing(false);
    }, 3000);
  };

  const handleEnd = () => {
    const winner = penaltyScore.home > penaltyScore.away
      ? 'home'
      : penaltyScore.away > penaltyScore.home
        ? 'away'
        : null;
    onClose(winner);
  };

  const getTeamKicks = (team: 'home' | 'away') =>
    kicks.filter(kick => kick.team === team);

  if (!started || !firstKicker) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-[#581C24] p-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Calci di Rigore</h2>
            {isAdmin && (
              <button onClick={() => onClose(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20">
                <X size={20} />
              </button>
            )}
          </div>
          <div className="p-6">
            <p className="text-center text-sm font-bold text-gray-600 mb-4 uppercase">Chi inizia i rigori?</p>
            <div className="flex gap-4">
              <button onClick={() => handleFirstKickerSelect('home')} className="flex-1 flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">LOGO</span>
                </div>
                <span className="font-bold text-sm text-[#581C24]">{homeTeam.name}</span>
              </button>
              <button onClick={() => handleFirstKickerSelect('away')} className="flex-1 flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">LOGO</span>
                </div>
                <span className="font-bold text-sm text-[#581C24]">{awayTeam.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#581C24] p-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Calci di Rigore</h2>
          {isAdmin && (
            <button onClick={() => onClose(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <span className="text-[8px] text-gray-500">LOGO</span>
              </div>
              <span className="font-bold text-xs text-[#581C24]">{homeTeam.name}</span>
              <div className="flex gap-1 mt-2">
                {getTeamKicks('home').map((kick, idx) => (
                  <div key={idx} className={`w-2.5 h-2.5 rounded-full ${kick.scored ? 'bg-green-500' : 'bg-red-600'}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 px-6">
              <span className="text-4xl font-black text-[#581C24]">{penaltyScore.home}</span>
              <span className="text-2xl text-gray-400">-</span>
              <span className="text-4xl font-black text-[#581C24]">{penaltyScore.away}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <span className="text-[8px] text-gray-500">LOGO</span>
              </div>
              <span className="font-bold text-xs text-[#581C24]">{awayTeam.name}</span>
              <div className="flex gap-1 mt-2">
                {getTeamKicks('away').map((kick, idx) => (
                  <div key={idx} className={`w-2.5 h-2.5 rounded-full ${kick.scored ? 'bg-green-500' : 'bg-red-600'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${
              lightState === 'green' ? 'bg-green-500 border-green-700 shadow-lg shadow-green-500/50'
              : lightState === 'red' ? 'bg-red-600 border-red-800 shadow-lg shadow-red-600/50'
              : 'bg-gray-300 border-gray-400'
            }`} />
          </div>
          {isAdmin && (
            <>
              <div className="flex gap-3 mb-4">
                <button onClick={() => handleKick(false)} disabled={isProcessing} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm uppercase">
                  Sbagliato
                </button>
                <button onClick={() => handleKick(true)} disabled={isProcessing} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm uppercase">
                  Gol
                </button>
              </div>
              <button onClick={handleEnd} className="w-full bg-gray-600 text-white font-bold py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm uppercase">
                Fine
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER ====================
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
};

const EventIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  if (type === 'GOAL') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#581C24]">
        <circle cx="12" cy="12" r="10" fill="#1a1a1a"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
        <path d="M12 2 L13 7 L12 12 L11 7 Z" fill="white"/>
        <path d="M22 12 L17 13 L12 12 L17 11 Z" fill="white"/>
        <path d="M12 22 L11 17 L12 12 L13 17 Z" fill="white"/>
        <path d="M2 12 L7 11 L12 12 L7 13 Z" fill="white"/>
      </svg>
    );
  }
  if (type === 'YELLOW_CARD') {
    return <div className="bg-yellow-400 rounded-sm border border-yellow-600" style={{ width: size * 0.75, height: size }} />;
  }
  if (type === 'RED_CARD') {
    return <div className="bg-red-600 rounded-sm border border-red-800" style={{ width: size * 0.75, height: size }} />;
  }
  return null;
};

// ==================== COMPONENTE PRINCIPALE ====================
export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const { isStaffMode } = useAuth();

  // Stati dati
  const [match, setMatch] = useState<MatchData | null>(null);
  const [homePlayers, setHomePlayers] = useState<MatchPlayerData[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchPlayerData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [mvpPlayers, setMvpPlayers] = useState<MvpPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false); // ✅ NUOVO: stato per partita non trovata

  // Stati UI
  const [activeTab, setActiveTab] = useState<'diretta' | 'giocatori' | 'media'>('diretta');
  const [votedPlayerId, setVotedPlayerId] = useState<string | null>(null);
  const [isVotingClosed, setIsVotingClosed] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayerData | null>(null);
  const [showPenaltyPopup, setShowPenaltyPopup] = useState(false);

  // Fetch dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotFound(false); // ✅ Resetta lo stato notFound
      const supabase = createClient();
      const matchId = params.id;

      try {
        // 1. Prendi i dati della partita SENZA relazioni annidate
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, status, phase, match_date, match_time, home_team_id, away_team_id')
          .eq('id', matchId)
          .maybeSingle(); 
          
        if (matchError) throw matchError;

        // ✅ CONTROLLO: se la partita non esiste, mostra messaggio
        if (!matchData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // 2. Prendi i dati delle squadre separatamente
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', [matchData.home_team_id, matchData.away_team_id]);
          
        if (teamsError) throw teamsError;

        // 3. Unisci i dati manualmente per creare l'oggetto MatchData completo
        const homeTeam = teamsData?.find(t => t.id === matchData.home_team_id) || null;
        const awayTeam = teamsData?.find(t => t.id === matchData.away_team_id) || null;
        
        const typedMatch: MatchData = {
          ...matchData,
          home_team: homeTeam as TeamData,
          away_team: awayTeam as TeamData
        };
        
        setMatch(typedMatch);

        // 4. Players con null check
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, first_name, last_name, jersey_number, photo_url, goals, yellow_cards, red_cards, mvp_wins, team_id')
          .in('team_id', [typedMatch.home_team.id, typedMatch.away_team.id])
          .order('jersey_number', { ascending: true, nullsFirst: false });
        if (playersError) throw playersError;

        const typedPlayers = (playersData || []) as MatchPlayerData[];
        setHomePlayers(typedPlayers.filter(p => p.team_id === typedMatch.home_team.id));
        setAwayPlayers(typedPlayers.filter(p => p.team_id === typedMatch.away_team.id));

        // 5. Events con gestione corretta del player nullable
        const { data: eventsData, error: eventsError } = await supabase
          .from('match_events')
          .select('id, minute, event_type, player_id, team_id, player:players(first_name, last_name)')
          .eq('match_id', matchId)
          .order('minute', { ascending: true });
        if (eventsError) throw eventsError;

        const typedEvents: EventData[] = (eventsData || []).map((e: any) => ({
          id: e.id,
          minute: e.minute,
          event_type: e.event_type,
          player_id: e.player_id,
          team_id: e.team_id,
          player: e.player && !Array.isArray(e.player) ? {
            first_name: e.player.first_name,
            last_name: e.player.last_name
          } : null
        }));
        setEvents(typedEvents);

        // 6. MVP - Usa .maybeSingle() invece di .single()
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('mvp_candidates')
          .select('candidate_1_id, candidate_2_id, candidate_3_id, voting_closed')
          .eq('match_id', matchId)
          .maybeSingle(); // ✅ Cambiato da .single() a .maybeSingle()

        // Ignora l'errore "nessun risultato trovato" (codice PGRST116)
        if (candidatesError && candidatesError.code !== 'PGRST116') {
          console.error('Errore MVP:', candidatesError);
        }

        if (candidatesData) {
          setIsVotingClosed(candidatesData.voting_closed);
          const candidateIds = [
            candidatesData.candidate_1_id,
            candidatesData.candidate_2_id,
            candidatesData.candidate_3_id
          ].filter(Boolean);

          if (candidateIds.length > 0) {
            const { data: candidatePlayers } = await supabase
              .from('players')
              .select('id, first_name, last_name, team_id, photo_url')
              .in('id', candidateIds);

            const { data: votesData } = await supabase
              .from('mvp_votes')
              .select('player_id')
              .eq('match_id', matchId);

            const voteCounts: Record<string, number> = {};
            (votesData || []).forEach((v: any) => {
              voteCounts[v.player_id] = (voteCounts[v.player_id] || 0) + 1;
            });

            if (candidatePlayers && candidatePlayers.length > 0) {
              const mappedMvp: MvpPlayerData[] = (candidatePlayers as any[]).map((p: any) => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                team_id: p.team_id,
                photo: p.photo_url,
                votes: voteCounts[p.id] || 0
              }));
              setMvpPlayers(mappedMvp);

              if (candidatesData.voting_closed && mappedMvp.length > 0) {
                const winner = mappedMvp.reduce((prev, current) =>
                  (prev.votes > current.votes) ? prev : current
                );
                setWinnerId(winner.id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Errore fetch partita:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

    // ==========================================
  // ✅ REALTIME: Ascolta gli aggiornamenti live
  // ==========================================
  useEffect(() => {
    const supabase = createClient();
    const matchId = params.id;

    // 1. Ascolta cambiamenti sulla partita (stato, punteggio, etc.)
    const matchChannel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Ascolta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Cambiamento partita:', payload);
          setMatch((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    // 2. Ascolta nuovi eventi (gol, cartellini)
    const eventsChannel = supabase
      .channel(`events-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        async () => {
          console.log('Nuovo evento!');
          // Ricarica tutti gli eventi per avere i dati completi
          const { data: newEvents } = await supabase
            .from('match_events')
            .select('id, minute, event_type, player_id, team_id, player:players(first_name, last_name)')
            .eq('match_id', matchId)
            .order('minute', { ascending: true });

          if (newEvents) {
            const typedEvents: EventData[] = newEvents.map((e: any) => ({
              id: e.id,
              minute: e.minute,
              event_type: e.event_type,
              player_id: e.player_id,
              team_id: e.team_id,
              player: e.player && !Array.isArray(e.player) ? {
                first_name: e.player.first_name,
                last_name: e.player.last_name
              } : null
            }));
            setEvents(typedEvents);
          }
        }
      )
      .subscribe();

    // 3. Ascolta aggiornamenti statistiche giocatori
    const playersChannel = supabase
      .channel(`players-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
        },
        (payload) => {
          console.log('Giocatore aggiornato:', payload);
          const updatedPlayer = payload.new as MatchPlayerData;
          
          setHomePlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
          setAwayPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        }
      )
      .subscribe();

    // Cleanup quando esci dalla pagina
    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [params.id]);

  // --- HANDLERS ---
  const handleAddEvent = async (teamSide: 'home' | 'away', eventType: string, playerId: string, minute: number) => {
    if (!match) return;
    const supabase = createClient();
    const teamId = teamSide === 'home' ? match.home_team.id : match.away_team.id;

    // Mappatura dei valori
    const eventTypeMap: Record<string, string> = {
      'goal': 'GOAL',
      'yellow': 'YELLOW_CARD',
      'red': 'RED_CARD'
    };

    const dbEventType = eventTypeMap[eventType] || eventType;

    // 1. Inserisci l'evento
    const { error: eventError } = await supabase.from('match_events').insert({
      match_id: match.id,
      player_id: playerId,
      event_type: dbEventType,
      minute: minute,
      team_id: teamId
    });

    if (eventError) {
      console.error('Errore aggiunta evento:', eventError);
      alert('Errore nel salvataggio dell\'evento');
      return;
    }

    // 2. ✅ SE È UN GOL, AGGIORNA IL PUNTEGGIO
    if (eventType === 'goal') {
      const currentScore = teamSide === 'home' ? match.home_score : match.away_score;
      const newScore = (currentScore || 0) + 1;

      const { error: scoreError } = await supabase
        .from('matches')
        .update({
          [teamSide === 'home' ? 'home_score' : 'away_score']: newScore
        })
        .eq('id', match.id);

      if (scoreError) {
        console.error('Errore aggiornamento punteggio:', scoreError);
      } else {
        // Aggiorna lo stato locale immediatamente
        setMatch(prev => prev ? {
          ...prev,
          [teamSide === 'home' ? 'home_score' : 'away_score']: newScore
        } : null);
      }
    }

    // 3. Aggiorna anche i gol del giocatore
    if (eventType === 'goal') {
      await supabase.rpc('increment_player_goals', { player_id: playerId });
    }

    // 4. Aggiorna la lista eventi localmente
    const player = [...homePlayers, ...awayPlayers].find(p => p.id === playerId);
    const newEvent: EventData = {
      id: Date.now().toString(),
      minute,
      event_type: dbEventType,
      player_id: playerId,
      team_id: teamId,
      player: player ? { first_name: player.first_name, last_name: player.last_name } : null
    };
    setEvents(prev => [...prev, newEvent].sort((a, b) => (a.minute || 0) - (b.minute || 0)));
  };

  const handleSaveMvpCandidates = async (playerIds: string[]) => {
    if (!match) return;
    const supabase = createClient();
    const payload: any = { match_id: match.id, voting_closed: false };
    if (playerIds[0]) payload.candidate_1_id = playerIds[0];
    if (playerIds[1]) payload.candidate_2_id = playerIds[1];
    if (playerIds[2]) payload.candidate_3_id = playerIds[2];

    const { error } = await supabase
      .from('mvp_candidates')
      .upsert(payload, { onConflict: 'match_id' });
    if (error) {
      console.error('Errore salvataggio candidati:', error);
      alert('Errore nel salvataggio');
      return;
    }

    const selectedPlayers = [...homePlayers, ...awayPlayers].filter(p => playerIds.includes(p.id));
    setMvpPlayers(selectedPlayers.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      team_id: p.team_id,
      photo: p.photo_url,
      votes: 0
    })));
  };

  const handleStopVoting = async () => {
    if (!confirm('Concludere la votazione?') || !match) return;
    const supabase = createClient();

    await supabase
      .from('mvp_candidates')
      .update({ voting_closed: true })
      .eq('match_id', match.id);
    setIsVotingClosed(true);

    const winner = mvpPlayers.reduce((prev, current) =>
      (prev.votes > current.votes) ? prev : current
    );
    setWinnerId(winner.id);

    try {
      await supabase
        .from('matches')
        .update({ mvp_player_id: winner.id } as any)
        .eq('id', match.id);
    } catch (e) {
      console.warn('Colonna mvp_player_id non presente:', e);
    }

    const { data: playerData } = await supabase
      .from('players')
      .select('mvp_wins')
      .eq('id', winner.id)
      .single();

    if (playerData) {
      await supabase
        .from('players')
        .update({ mvp_wins: (playerData.mvp_wins || 0) + 1 })
        .eq('id', winner.id);
    }
  };

  const handleVote = async (playerId: string) => {
    if (isVotingClosed || votedPlayerId || !match) return;
    const supabase = createClient();

    const { error } = await supabase
      .from('mvp_votes')
      .insert({ match_id: match.id, player_id: playerId, voter_id: null });
    if (error) {
      console.error('Errore voto:', error);
      return;
    }

    setVotedPlayerId(playerId);
    setMvpPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, votes: p.votes + 1 } : p
    ));
  };

  const handleStartMatch = async () => {
    if (!match || !confirm('Iniziare la partita?')) return;
    const supabase = createClient();
    await supabase.from('matches').update({ status: 'LIVE' }).eq('id', match.id);
    setMatch({ ...match, status: 'LIVE' });
  };

  const handleEndMatch = async () => {
    if (!match || !confirm('Terminare la partita?')) return;
    const supabase = createClient();
    await supabase.from('matches').update({ status: 'FINITA' }).eq('id', match.id);
    setMatch({ ...match, status: 'FINITA' });
  };

  const handleExtraTime = async () => {
    if (!match || !confirm('Passare ai tempi supplementari?')) return;
    const supabase = createClient();
    await supabase.from('matches').update({ status: 'SUPP' }).eq('id', match.id);
    setMatch({ ...match, status: 'SUPP' });
  };

  const handlePenalties = () => setShowPenaltyPopup(true);

  const handlePenaltyEnd = async (winner: 'home' | 'away' | null) => {
    setShowPenaltyPopup(false);
    if (!match) return;
    const supabase = createClient();
    await supabase.from('matches').update({ status: 'FINITA' }).eq('id', match.id);
    setMatch({ ...match, status: 'FINITA' });
  };

  const getStatusLabel = () => {
    if (!match) return '';
    switch (match.status) {
      case 'PROGRAMMATA': return 'PROGRAMMATA';
      case 'LIVE': return 'LIVE';
      case 'SUPP': return 'SUPP';
      case 'RIGORI': return 'RIGORI';
      case 'FINITA': return 'FINITA';
      default: return match.status;
    }
  };

  const getStatusColor = () => {
    if (!match) return 'text-gray-500';
    switch (match.status) {
      case 'LIVE': return 'text-red-400';
      case 'SUPP': return 'text-orange-400';
      case 'RIGORI': return 'text-purple-400';
      case 'PROGRAMMATA': return 'text-blue-500';
      case 'FINITA': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  // ✅ SEPARA IL CONTROLLO DI LOADING DA QUELLO DI NOT FOUND
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento partita...</p>
        </div>
      </div>
    );
  }

  // ✅ MOSTRA MESSAGGIO SE LA PARTITA NON ESISTE
  if (notFound || !match) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center flex-col gap-4">
        <p className="text-[#581C24] font-bold uppercase text-xl">Partita non trovata</p>
        <Link href="/partite" className="text-sm text-gray-600 hover:text-[#581C24] font-bold underline">
          ← Torna alla lista partite
        </Link>
      </div>
    );
  }

  const isLiveStatus = match.status === 'LIVE' || match.status === 'SUPP' || match.status === 'RIGORI';
  const isFinalPhase = match.phase !== 'GIRONI';

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image src="/header-match.jpg" alt="Campo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />

        <Link href="/partite" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>

        {isStaffMode && match.status !== 'FINITA' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {match.status === 'PROGRAMMATA' && (
              <button onClick={handleStartMatch} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-green-700 transition-colors shadow-lg">INIZIA</button>
            )}
            {match.status === 'LIVE' && (
              <>
                <button onClick={handleEndMatch} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-red-700 transition-colors shadow-lg">TERMINA</button>
                {isFinalPhase && <button onClick={handleExtraTime} className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-orange-700 transition-colors shadow-lg">SUPPLEMENTARI</button>}
              </>
            )}
            {match.status === 'SUPP' && (
              <button onClick={handlePenalties} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-purple-700 transition-colors shadow-lg">RIGORI</button>
            )}
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button onClick={() => setActiveTab('media')} className="bg-white text-[#581C24] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      {/* CARD RISULTATO */}
      <div className="relative z-10 -mt-16 px-4 mb-4">
        <div className={`rounded-xl shadow-xl ${isLiveStatus ? 'bg-[#581C24]' : 'bg-[#E8E8E8]'}`}>
          <div className="h-4" />
          <div className="grid grid-cols-3 items-center px-4 pb-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLiveStatus ? 'bg-white/10' : 'bg-gray-300'}`}>
                {match.home_team.logo_url ? <Image src={match.home_team.logo_url} alt={match.home_team.name} width={64} height={64} className="object-cover" /> : <span className={`text-[10px] ${isLiveStatus ? 'text-white/70' : 'text-gray-500'}`}>LOGO</span>}
              </div>
              <span className={`font-bold text-xs sm:text-sm text-center truncate w-full ${isLiveStatus ? 'text-white' : 'text-[#581C24]'}`}>{match.home_team.name}</span>
            </div>

            <div className="text-center">
              <div className={`text-4xl font-black tracking-wider font-oswald ${isLiveStatus ? 'text-white animate-pulse' : 'text-[#581C24]'}`}>
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${getStatusColor()}`}>{getStatusLabel()}</div>
              <div className="text-[10px] text-gray-500 mt-1">{formatDate(match.match_date)} • {match.match_time || '--:--'}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLiveStatus ? 'bg-white/10' : 'bg-gray-300'}`}>
                {match.away_team.logo_url ? <Image src={match.away_team.logo_url} alt={match.away_team.name} width={64} height={64} className="object-cover" /> : <span className={`text-[10px] ${isLiveStatus ? 'text-white/70' : 'text-gray-500'}`}>LOGO</span>}
              </div>
              <span className={`font-bold text-xs sm:text-sm text-center truncate w-full ${isLiveStatus ? 'text-white' : 'text-[#581C24]'}`}>{match.away_team.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-full p-1 shadow-sm flex">
          <button onClick={() => setActiveTab('diretta')} className={`flex-1 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'diretta' ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-50'}`}>Diretta</button>
          <button onClick={() => setActiveTab('giocatori')} className={`flex-1 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'giocatori' ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-50'}`}>Giocatori</button>
        </div>
      </div>

      {/* CONTENUTO */}
      <div className="px-4">
        {activeTab === 'diretta' ? (
          <>
            {/* MVP */}
            {(isStaffMode || mvpPlayers.length > 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  {isStaffMode && match && (
                    <AdminMVPSelector 
                      matchId={match.id}
                      homeTeamId={match.home_team.id}
                      awayTeamId={match.away_team.id}
                      onSave={handleSaveMvpCandidates} 
                    />
                  )}
                  <h2 className="text-[#581C24] font-bold text-base uppercase tracking-wider text-center flex-1">MVP della Partita</h2>
                  {isStaffMode && !isVotingClosed && mvpPlayers.length > 0 && match && (
                    <AdminStopVoting 
                      matchId={match.id}
                      onStop={handleStopVoting} 
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {mvpPlayers.length === 0 ? (
                    <div className="col-span-3 text-center py-4 text-gray-500 text-sm">Nessun candidato selezionato</div>
                  ) : (
                    mvpPlayers.map((player) => {
                      const hasWon = winnerId === player.id;
                      const hasVoted = votedPlayerId === player.id;
                      return (
                        <div key={player.id} className={`rounded-xl p-3 flex flex-col items-center gap-2 relative transition-all ${hasWon ? 'bg-gradient-to-b from-[#FFD700]/30 to-[#FFD700]/10 border-2 border-[#FFD700] shadow-lg scale-105' : hasVoted ? 'bg-[#581C24] text-white border-2 border-[#581C24] shadow-lg' : 'bg-white border border-gray-100 shadow-sm'}`}>
                          {hasWon && <span className="absolute -top-2.5 bg-[#FFD700] text-[#581C24] text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm border border-[#C9B037]">VINCITORE</span>}
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${hasVoted ? 'bg-white/20' : 'bg-gray-200'}`}>
                            {player.photo ? <Image src={player.photo} alt={player.name} width={56} height={56} className="object-cover" /> : <span className={`text-[10px] ${hasVoted ? 'text-white/70' : 'text-gray-400'}`}>FOTO</span>}
                          </div>
                          <div className="text-center w-full">
                            <p className={`font-bold text-xs truncate w-full ${hasVoted ? 'text-white' : 'text-[#581C24]'}`}>{player.name}</p>
                            <p className={`text-[10px] font-black mt-1 ${hasVoted ? 'text-white' : 'text-[#581C24]'}`}>{player.votes} {player.votes === 1 ? 'voto' : 'voti'}</p>
                          </div>
                          <button onClick={() => handleVote(player.id)} disabled={isVotingClosed || hasVoted} className={`w-full text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${hasVoted ? 'bg-white text-[#581C24] cursor-default' : isVotingClosed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#581C24] text-white hover:bg-[#581C24]/90'}`}>
                            {hasVoted ? <>✓ VOTATO</> : <><Vote size={10} /> VOTA</>}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CRONACA - Titolo sempre visibile */}
            <div>
              <div className="flex items-center justify-between mb-4">
                {isStaffMode && match.status !== 'FINITA' && (
                  <>
                    <AdminAddEvent 
                      matchId={match.id}
                      teamSide="home" 
                      onAddEvent={(e) => handleAddEvent('home', e.type, e.playerId, e.minute)} 
                    />
                    <h2 className="text-[#581C24] font-bold text-base uppercase tracking-wider text-center flex-1">Cronaca</h2>
                    <AdminAddEvent 
                      matchId={match.id}
                      teamSide="away" 
                      onAddEvent={(e) => handleAddEvent('away', e.type, e.playerId, e.minute)} 
                    />
                  </>
                )}
                {/* Titolo visibile per tutti (anche senza eventi) */}
                {!isStaffMode && (
                  <h2 className="text-[#581C24] font-bold text-base uppercase tracking-wider text-center w-full">Cronaca</h2>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Nessun evento registrato</div>
                  ) : (
                    events.map((event, i) => {
                      const isHome = event.team_id === match.home_team.id;
                      const playerName = event.player
                        ? `${event.player.first_name?.[0] || ''}. ${event.player.last_name || ''}`
                        : 'Sconosciuto';
                      return (
                        <div key={event.id} className="flex items-center gap-2">
                          {isHome ? (
                            <>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <EventIcon type={event.event_type} size={16} />
                                <span className="font-bold text-[#581C24] text-xs w-8 text-right">{event.minute}'</span>
                                <span className="font-medium text-xs truncate">{playerName}</span>
                              </div>
                              <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
                              <div className="flex-1" />
                            </>
                          ) : (
                            <>
                              <div className="flex-1" />
                              <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
                              <div className="flex items-center gap-2 flex-1 justify-start">
                                <span className="font-medium text-xs truncate">{playerName}</span>
                                <span className="font-bold text-[#581C24] text-xs w-8">{event.minute}'</span>
                                <EventIcon type={event.event_type} size={16} />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-[#581C24] font-bold text-sm uppercase tracking-wider mb-3 text-center border-b border-gray-200 pb-2">{match.home_team.name}</h3>
                <div className="space-y-2">
                  {homePlayers.map((player) => (
                    <div key={player.id} onClick={() => setSelectedPlayer(player)} className="flex items-center gap-2 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                      <span className="font-bold text-xs text-gray-400 w-6 group-hover:text-[#581C24] transition-colors">{player.jersey_number || '-'}</span>
                      <span className="font-medium text-xs flex-1 truncate group-hover:text-[#581C24] transition-colors">{player.first_name?.[0] || ''}. {player.last_name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {player.goals > 0 && <EventIcon type="GOAL" size={14} />}
                        {player.yellow_cards > 0 && <EventIcon type="YELLOW_CARD" size={14} />}
                        {player.red_cards > 0 && <EventIcon type="RED_CARD" size={14} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-gray-300 self-stretch" />
              <div className="flex-1">
                <h3 className="text-[#581C24] font-bold text-sm uppercase tracking-wider mb-3 text-center border-b border-gray-200 pb-2">{match.away_team.name}</h3>
                <div className="space-y-2">
                  {awayPlayers.map((player) => (
                    <div key={player.id} onClick={() => setSelectedPlayer(player)} className="flex items-center gap-2 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                      <span className="font-bold text-xs text-gray-400 w-6 group-hover:text-[#581C24] transition-colors">{player.jersey_number || '-'}</span>
                      <span className="font-medium text-xs flex-1 truncate group-hover:text-[#581C24] transition-colors">{player.first_name?.[0] || ''}. {player.last_name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {player.goals > 0 && <EventIcon type="GOAL" size={14} />}
                        {player.yellow_cards > 0 && <EventIcon type="YELLOW_CARD" size={14} />}
                        {player.red_cards > 0 && <EventIcon type="RED_CARD" size={14} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POPUP DETTAGLI GIOCATORE */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPlayer(null)} className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"><X size={18} className="text-gray-600" /></button>
            <div className="bg-gradient-to-b from-[#581C24] to-[#581C24]/80 p-6 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                  {selectedPlayer.photo_url ? <Image src={selectedPlayer.photo_url} alt={selectedPlayer.first_name} width={80} height={80} className="object-cover" /> : <span className="text-[10px] text-gray-400">FOTO</span>}
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-0.5">Nome</p>
                  <h3 className="text-2xl font-black text-white uppercase leading-tight">{selectedPlayer.first_name}</h3>
                  <p className="text-xl font-bold text-white/90 uppercase">{selectedPlayer.last_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="w-20 flex-shrink-0">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-3xl font-black text-[#581C24] text-center">{selectedPlayer.jersey_number || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center flex-shrink-0"><EventIcon type="GOAL" size={20} /></div>
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">GOL</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.goals}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-[#581C24]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">MVP</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.mvp_wins}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-8 bg-yellow-400 rounded-sm flex-shrink-0 border border-yellow-600" />
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">AMMONIZIONI</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.yellow_cards}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-8 bg-red-600 rounded-sm flex-shrink-0 border border-red-800" />
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">ESPULSIONI</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.red_cards}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RIGORI */}
      {isStaffMode && showPenaltyPopup && (
        <PenaltyShootoutPopup
          homeTeam={{ name: match.home_team.name, logo_url: match.home_team.logo_url }}
          awayTeam={{ name: match.away_team.name, logo_url: match.away_team.logo_url }}
          isAdmin={true}
          onClose={handlePenaltyEnd}
        />
      )}
      {!isStaffMode && match.status === 'RIGORI' && (
        <PenaltyShootoutPopup
          homeTeam={{ name: match.home_team.name, logo_url: match.home_team.logo_url }}
          awayTeam={{ name: match.away_team.name, logo_url: match.away_team.logo_url }}
          isAdmin={false}
          onClose={() => {}}
        />
      )}
    </div>
  );
}