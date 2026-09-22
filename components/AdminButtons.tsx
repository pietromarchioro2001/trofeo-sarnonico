// components/AdminButtons.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Download, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import GironiSnapshot from '@/components/albo/GironiSnapshot';
import MarcatoriSnapshot from '@/components/albo/MarcatoriSnapshot';
import FaseFinaleSnapshot from '@/components/albo/FaseFinaleSnapshot'
import { toBlob } from 'html-to-image';

type TabType = "gironi" | "marcatori" | "fase-finale" | "media"

// ==================== TIPI DATI (NUOVI) ===================
export interface UploadedDocument {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TeamLiberatorie {
  teamId: string;
  teamName: string;
  documents: UploadedDocument[];
}

// ===== Tipi Albo d'Oro =====

export type TeamStats = {
  team: string;
  logo?: string | null;
  punti: number;
  giocate: number;
  vittorie: number;
  pareggi: number;
  sconfitte: number;
  gol_fatti: number;
  gol_subiti: number;
  diff: number;
};

export type TopScorer = {
  player: string;
  team: string;
  goals: number;
};

export type MatchCard = {
  home: string;
  away: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
};

export type AlboDoroData = {
  id?: string;

  year: number;

  winner: string;
  runnerUp: string;

  topScorer: string;
  mvp: string;

  standings_snapshot: {
    gironeA: TeamStats[];
    gironeB: TeamStats[];
  };

  scorers_snapshot: TopScorer[];

  bracket_snapshot: {
    quarti: MatchCard[];
    semifinali: MatchCard[];
    finale: MatchCard | null;
    terzoQuarto: MatchCard | null;
  };

  media_zip_url?: string | null;
};

export interface EventoProloco {
  id: string;
  url: string;
  type: 'image' | 'pdf';
  uploadedAt: string;
}

export interface Sponsor {
  id: string;
  logoUrl: string;
  name: string;
  website?: string;
}

export interface ContattiData {
  phone: string;
  email: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

// Aggiungi questo dopo le altre interfacce esistenti
export interface EventData {
  id: string;
  minute: number | null;
  event_type: string;
  player_id: string | null;
  team_id: string | null;
  phase?: string; // ✅ Aggiunto per la colorazione della linea
  player: {
    first_name: string;
    last_name: string;
  } | null;
}

// ==================== TIPI DATI ESISTENTI ====================
interface PenaltyKick {
  team: 'home' | 'away';
  scored: boolean;
  kickerId: string;
}

// ==================== COMPONENTE RIUTILIZZABILE PER MAIUSCOLO ====================
const UppercaseInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '' 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string; 
  className?: string;
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value.toUpperCase())}
    placeholder={placeholder}
    className={`uppercase ${className}`}
    style={{ textTransform: 'uppercase' }}
  />
);
// ================================================================================

export const AdminPartiteButton = ({ onMatchCreated }: { onMatchCreated?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<'A' | 'B'>('A');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchTeams = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('teams').select('id, name, girone').order('name');
        if (data) setTeams(data);
      };
      fetchTeams();
    }
  }, [isOpen]);

  const filteredTeams = teams.filter(t => t.girone === selectedGroup);

  const handleSave = async () => {
  if (!homeTeam || !awayTeam || !matchDate || !matchTime) {
    setError('⚠️ Compila tutti i campi!');
    return;
  }

  if (homeTeam === awayTeam) {
    setError('⚠️ Le squadre devono essere diverse!');
    return;
  }

  const supabase = createClient();

  const matchId = crypto.randomUUID();

  const { data, error } = await supabase
    .from("matches")
    .insert({
      id: matchId,
      home_team_id: homeTeam,
      away_team_id: awayTeam,
      match_date: matchDate,
      match_time: matchTime,
      status: "PROGRAMMATA",
      phase: "GIRONI",
      media_folder_path: `match-media/${matchId}`,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    setError("Errore nel salvataggio");
    return;
  }

  if (data?.id) {
    fetch(
      `/api/matches/${data.id}/generate-post?type=PRE_MATCH`
    ).catch(console.error);
  }

  alert("✅ Partita creata con successo!");

  setIsOpen(false);
  setHomeTeam('');
  setAwayTeam('');
  setMatchDate('');
  setMatchTime('');
  setError('');

  if (onMatchCreated) {
    onMatchCreated();
  }
};

  const handleClose = () => { setIsOpen(false); setHomeTeam(''); setAwayTeam(''); setMatchDate(''); setMatchTime(''); setError(''); };

  return (
    <>
      <div className="px-3 sm:px-4 mb-2">
        <button onClick={() => setIsOpen(true)} className="bg-[#581C24] text-white font-bold py-1.5 px-3 rounded-lg shadow-lg hover:bg-[#581C24]/90 transition-colors flex items-center gap-1.5 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          NUOVA PARTITA
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#581C24] p-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Nuova Partita</h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Girone</label>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedGroup('A'); setHomeTeam(''); setAwayTeam(''); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${selectedGroup === 'A' ? 'bg-[#581C24] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>GIRONE A</button>
                  <button onClick={() => { setSelectedGroup('B'); setHomeTeam(''); setAwayTeam(''); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${selectedGroup === 'B' ? 'bg-[#581C24] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>GIRONE B</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Squadra Casa</label>
                  <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
                    <option value="">Seleziona...</option>
                    {filteredTeams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Squadra Ospite</label>
                  <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
                    <option value="">Seleziona...</option>
                    {filteredTeams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-center text-[#581C24] font-black text-lg">VS</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Data</label><input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Ora</label><input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" /></div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">Annulla</button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#581C24] text-white rounded-xl py-3 font-bold"
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// MVP Selector REALE (con Supabase)
// ============================================================
interface AdminMVPSelectorProps { 
  onSave: (playerIds: string[]) => void; 
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
}

export const AdminMVPSelector: React.FC<AdminMVPSelectorProps> = ({ onSave, matchId, homeTeamId, awayTeamId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const fetchPlayers = async () => {
        const supabase = createClient();
        const { data: h } = await supabase.from('players').select('id, first_name, last_name').eq('team_id', homeTeamId);
        const { data: a } = await supabase.from('players').select('id, first_name, last_name').eq('team_id', awayTeamId);
        if (h) setHomePlayers(h);
        if (a) setAwayPlayers(a);
      };
      fetchPlayers();
    }
  }, [isOpen, homeTeamId, awayTeamId]);

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    else { if (selectedPlayers.length < 3) setSelectedPlayers([...selectedPlayers, playerId]); else alert('Puoi selezionare massimo 3 giocatori'); }
  };
  
  const handleSave = async () => { 
    if (selectedPlayers.length === 0) { alert('Seleziona almeno un giocatore'); return; } 
    
    const supabase = createClient();
    await supabase.from('mvp_candidates').upsert({
      match_id: matchId,
      candidate_1_id: selectedPlayers[0],
      candidate_2_id: selectedPlayers[1],
      candidate_3_id: selectedPlayers[2],
      voting_closed: false
    }, { onConflict: 'match_id' });
    
    onSave(selectedPlayers); 
    setIsOpen(false); 
    setSelectedPlayers([]); 
  };
  
  const handleClose = () => { setIsOpen(false); setSelectedPlayers([]); };
  
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-[10px] font-bold text-[#581C24] bg-[#581C24]/10 px-3 py-1.5 rounded-full border border-[#581C24]/20 hover:bg-[#581C24]/20 transition-colors flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#581C24] p-3 flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Seleziona Candidati MVP</h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-3">
              <div className="text-center text-xs font-bold text-gray-600 mb-3">Selezionati: {selectedPlayers.length}/3</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-[#581C24] font-bold text-xs uppercase tracking-wider mb-2">CASA</h3>
                  <div className="space-y-1">
                    {homePlayers.length === 0 && <p className="text-xs text-gray-500 py-2">Nessun giocatore</p>}
                    {homePlayers.map((player) => (
                      <button key={player.id} onClick={() => togglePlayer(player.id)} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${selectedPlayers.includes(player.id) ? 'bg-[#581C24] text-white font-bold' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        {player.first_name} {player.last_name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[#581C24] font-bold text-xs uppercase tracking-wider mb-2">TRASFERTA</h3>
                  <div className="space-y-1">
                    {awayPlayers.length === 0 && <p className="text-xs text-gray-500 py-2">Nessun giocatore</p>}
                    {awayPlayers.map((player) => (
                      <button key={player.id} onClick={() => togglePlayer(player.id)} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${selectedPlayers.includes(player.id) ? 'bg-[#581C24] text-white font-bold' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        {player.first_name} {player.last_name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button onClick={handleClose} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-xs">Annulla</button>
              <button onClick={handleSave} className="flex-1 px-3 py-2 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-xs shadow-md">INVIA</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// AdminStopVoting REALE
// ============================================================
interface AdminStopVotingProps { onStop: () => void; matchId: string; }
export const AdminStopVoting: React.FC<AdminStopVotingProps> = ({ onStop, matchId }) => {
  const handleStop = async () => { 
    if (!confirm('Vuoi concludere la votazione?')) return; 
    
    const supabase = createClient();
    await supabase.from('mvp_candidates').update({ voting_closed: true }).eq('match_id', matchId);
    
    const { data: votes } = await supabase.from('mvp_votes').select('player_id').eq('match_id', matchId);
    if (votes && votes.length > 0) {
      const counts: Record<string, number> = {};
      votes.forEach(v => { counts[v.player_id] = (counts[v.player_id] || 0) + 1; });
      const winnerId = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0];
      
      if (winnerId) {
        await supabase.from('matches').update({ mvp_player_id: winnerId }).eq('id', matchId);
        const { data: player } = await supabase.from('players').select('mvp_wins').eq('id', winnerId).single();
        if (player) {
          await supabase.from('players').update({ mvp_wins: (player.mvp_wins || 0) + 1 }).eq('id', winnerId);
        }
      }
    }
    onStop(); 
  };
  
  return (
    <button onClick={handleStop} className="text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
    </button>
  );
};

// ============================================================
// AdminAddEvent REALE (CORRETTO - con gestione squalifiche)
// ============================================================
interface AdminAddEventProps { 
  teamSide: 'home' | 'away'; 
  matchId: string;
}

export const AdminAddEvent: React.FC<AdminAddEventProps> = ({ teamSide, matchId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventType, setEventType] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [minute, setMinute] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && matchId) {
      const fetchPlayers = async () => {
        const supabase = createClient();
        const { data: match } = await supabase.from('matches').select('home_team_id, away_team_id').eq('id', matchId).single();
        if (match) {
          const teamId = teamSide === 'home' ? match.home_team_id : match.away_team_id;
          const { data } = await supabase
            .from('players')
            .select('id, first_name, last_name, jersey_number, goals, yellow_cards, red_cards, is_suspended')
            .eq('team_id', teamId)
            .order('last_name', { ascending: true });
          if (data) setPlayers(data);
        }
      };
      fetchPlayers();
    }
  }, [isOpen, matchId, teamSide]);

  const handleSave = async () => {
    if (!eventType || !selectedPlayer || !minute) { setError('⚠️ Compila tutti i campi!'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: match } = await supabase.from('matches').select('id, home_team_id, away_team_id, home_score, away_score, status').eq('id', matchId).single();
      if (!match) throw new Error('Partita non trovata');

      const teamId = teamSide === 'home' ? match.home_team_id : match.away_team_id;
      const dbEventType = eventType === 'goal' ? 'GOAL' : eventType === 'yellow' ? 'YELLOW_CARD' : 'RED_CARD';
      
      // ✅ Determina la fase in base allo stato della partita
      let eventPhase = 'LIVE';
      if (match.status === 'SUPP') eventPhase = 'SUPP';
      if (match.status === 'RIGORI') eventPhase = 'RIGORI';
      
      // 1. INSERT EVENTO con la fase
      const { error: eventError } = await supabase.from('match_events').insert({
        match_id: matchId,
        player_id: selectedPlayer,
        event_type: dbEventType,
        minute: parseInt(minute),
        team_id: teamId,
        phase: eventPhase
      });
      if (eventError) throw eventError;

      const player = players.find(p => p.id === selectedPlayer);
      let shouldSuspend = false;

      // 2. LOGICA SQUALIFICHE
      if (eventType === 'yellow') {
        const { data: matchEvents } = await supabase
          .from('match_events')
          .select('event_type')
          .eq('match_id', matchId)
          .eq('player_id', selectedPlayer);
        
        const yellowsInThisMatch = (matchEvents || []).filter(e => e.event_type === 'YELLOW_CARD').length;
        
        if (yellowsInThisMatch >= 2) {  
          shouldSuspend = true;
          await supabase.from('match_events').insert({
            match_id: matchId,
            player_id: selectedPlayer,
            event_type: 'RED_CARD',
            minute: parseInt(minute),
            team_id: teamId,
            phase: eventPhase
          });
        }

        const totalYellows = (player?.yellow_cards || 0) + 1;
        if (totalYellows >= 3) {
          shouldSuspend = true;
        }
      } 
      
      if (eventType === 'red') {
        shouldSuspend = true;
      }

      // 3. APPLICA SQUALIFICA
      if (shouldSuspend) {
        await supabase.from('players').update({ is_suspended: true }).eq('id', selectedPlayer);
      }

      // 4. AGGIORNA STATISTICHE
      if (player) {
        const updates: any = {};
        if (eventType === 'goal') updates.goals = (player.goals || 0) + 1;
        if (eventType === 'yellow') updates.yellow_cards = (player.yellow_cards || 0) + 1;
        if (eventType === 'red') updates.red_cards = (player.red_cards || 0) + 1;
        
        if (Object.keys(updates).length > 0) {
          await supabase.from('players').update(updates).eq('id', selectedPlayer);
        }
      }

      // 5. AGGIORNA PUNTEGGIO
      if (eventType === 'goal') {
        const currentScore = teamSide === 'home' ? match.home_score : match.away_score;
        const newScore = (currentScore || 0) + 1;
        await supabase.from('matches').update({
          [teamSide === 'home' ? 'home_score' : 'away_score']: newScore
        }).eq('id', matchId);
      }

      setIsOpen(false); 
      setEventType(''); 
      setSelectedPlayer(''); 
      setMinute(''); 
      setError('');
    } catch (err) {
      console.error(err);
      setError('Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { 
    setIsOpen(false); 
    setEventType(''); 
    setSelectedPlayer(''); 
    setMinute(''); 
    setError(''); 
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-[10px] font-bold text-[#581C24] bg-[#581C24]/10 px-3 py-1.5 rounded-full border border-[#581C24]/20 hover:bg-[#581C24]/20 transition-colors flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        EVENTO
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#581C24] p-3 flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Evento - {teamSide === 'home' ? 'Casa' : 'Trasferta'}</h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tipo Evento</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
                  <option value="">Seleziona...</option>
                  <option value="goal">⚽ GOL</option>
                  <option value="yellow">🟨 AMMONIZIONE</option>
                  <option value="red">🟥 ESPULSIONE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Giocatore</label>
                <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
                  <option value="">Seleziona...</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.jersey_number ? `${player.jersey_number}. ` : ''}{player.first_name} {player.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Minuto</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120" 
                  value={minute} 
                  onChange={(e) => setMinute(e.target.value)} 
                  placeholder="Es: 45" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" 
                />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button onClick={handleClose} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-xs">Annulla</button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="flex-1 px-3 py-2 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-xs shadow-md disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'SALVA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const AdminSquadreButton = ({ onTeamCreated }: { onTeamCreated?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [group, setGroup] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!teamName.trim() || !group || !logoFile) { 
      setError('⚠️ Nome, Girone e Logo sono obbligatori!'); 
      return; 
    }
    
    setIsSaving(true);
    setError('');
    const supabase = createClient();

    try {
      let logoUrl = null;
      let photoUrl = null;

      // 1. Upload Logo nel bucket tournament-files/team-logos
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}_logo_${teamName.replace(/\s+/g, '_')}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('tournament-files')
          .upload(`team-logos/${fileName}`, logoFile);
        
        if (uploadError) throw new Error(`Errore upload logo: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('tournament-files')
          .getPublicUrl(`team-logos/${fileName}`);
        logoUrl = publicUrl;
      }

      // 2. Upload Foto Squadra nel bucket tournament-files/team-photos (opzionale)
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}_photo_${teamName.replace(/\s+/g, '_')}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('tournament-files')
          .upload(`team-photos/${fileName}`, photoFile);
        
        if (uploadError) throw new Error(`Errore upload foto: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('tournament-files')
          .getPublicUrl(`team-photos/${fileName}`);
        photoUrl = publicUrl;
      }

      // 3. Inserimento nel Database
      const { error: dbError } = await supabase.from('teams').insert({
        name: teamName.trim().toUpperCase(),
        girone: group,
        logo_url: logoUrl,
        team_photo_url: photoUrl  // ✅ Nome colonna corretto
      });

      if (dbError) throw new Error(`Errore database: ${dbError.message}`);

      alert('✅ Squadra creata con successo!');
      setIsOpen(false);
      setTeamName(''); 
      setGroup(''); 
      setLogoFile(null); 
      setPhotoFile(null);
      
      if (onTeamCreated) onTeamCreated();

    } catch (err: any) {
      console.error('Errore creazione squadra:', err);
      setError(err.message || 'Errore imprevisto durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => { 
    setIsOpen(false); 
    setTeamName(''); 
    setGroup(''); 
    setLogoFile(null); 
    setPhotoFile(null); 
    setError(''); 
  };

  return (
    <>
      <div className="px-3 sm:px-4 mb-2">
        <button onClick={() => setIsOpen(true)} className="bg-[#581C24] text-white font-bold py-1.5 px-3 rounded-lg shadow-lg hover:bg-[#581C24]/90 transition-colors flex items-center gap-1.5 text-xs uppercase">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          NUOVA SQUADRA
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#581C24] p-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Nuova Squadra</h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Nome Squadra</label>
                <UppercaseInput
                  value={teamName}
                  onChange={setTeamName}
                  placeholder="Nome squadra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Girone</label>
                <select value={group} onChange={(e) => setGroup(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
                  <option value="">Seleziona Girone...</option>
                  <option value="A">GIRONE A</option>
                  <option value="B">GIRONE B</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Logo Squadra *</label>
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90 cursor-pointer" />
                {logoFile && <p className="text-xs text-green-700 mt-1 font-medium">✓ {logoFile.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Foto Squadra (Opzionale)</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90 cursor-pointer" />
                {photoFile && <p className="text-xs text-green-700 mt-1 font-medium">✓ {photoFile.name}</p>}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={handleClose} disabled={isSaving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase disabled:opacity-50">Annulla</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Salvataggio...
                  </>
                ) : 'SALVA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface AdminTeamEditorProps { 
  name: string; 
  group: string; 
  logo: string; 
  onUpdate: (field: 'name' | 'group', value: string) => void;
  onLogoUpload: (file: File) => void; // NUOVO
}

export const AdminTeamEditor: React.FC<AdminTeamEditorProps> = ({ 
  name, group, logo, onUpdate, onLogoUpload 
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [tempGroup, setTempGroup] = useState(group);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    setTempName(name); 
    setTempGroup(group); 
  }, [name, group]);
  
  const handleNameSave = () => { 
    if (tempName.trim() !== '') {
      onUpdate('name', tempName.trim().toUpperCase());
    } else {
      setTempName(name);
    }
    setIsEditingName(false); 
  };
  
  const handleGroupSave = (newGroup: string) => { 
    onUpdate('group', newGroup); 
    setIsEditingGroup(false); 
  };
  
  // Questa funzione ora chiama onLogoUpload invece di onUpdate
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) {
      onLogoUpload(file); // Upload su Supabase
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors relative overflow-hidden group" onClick={() => logoInputRef.current?.click()} title="Clicca per cambiare il logo">
        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
        {logo ? <Image src={logo} alt="Logo" fill className="object-cover rounded-full" /> : <span className="text-[10px] text-gray-400">LOGO</span>}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>
      <div className="flex-1">
        {isEditingName ? (
          <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleNameSave} onKeyDown={(e) => e.key === 'Enter' && handleNameSave()} autoFocus className="text-2xl font-black text-[#581C24] uppercase tracking-wider bg-gray-100 border-2 border-[#581C24] rounded px-2 py-1 w-full focus:outline-none" />
        ) : (
          <h1 className="text-2xl font-black text-[#581C24] uppercase tracking-wider cursor-pointer hover:bg-gray-100 rounded px-1 -ml-1 transition-colors block" onClick={() => setIsEditingName(true)} title="Clicca per modificare il nome">{name}</h1>
        )}
        {isEditingGroup ? (
          <select value={tempGroup} onChange={(e) => handleGroupSave(e.target.value)} onBlur={() => setIsEditingGroup(false)} autoFocus className="text-sm font-bold text-gray-600 uppercase bg-gray-100 border-2 border-[#581C24] rounded px-2 py-0.5 focus:outline-none mt-1 block">
            <option value="GIRONE A">GIRONE A</option>
            <option value="GIRONE B">GIRONE B</option>
          </select>
        ) : (
          <p className="text-sm font-bold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 rounded px-1 -ml-1 transition-colors block mt-1" onClick={() => setIsEditingGroup(true)} title="Clicca per modificare il girone">{group}</p>
        )}
      </div>
    </div>
  );
};

interface AdminTeamPhotoEditorProps { 
  teamPhoto: string; 
  onPhotoUpload: (file: File) => void; // CAMBIATO
}

export const AdminTeamPhotoEditor: React.FC<AdminTeamPhotoEditorProps> = ({ 
  teamPhoto, onPhotoUpload 
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) {
      onPhotoUpload(file); // Upload su Supabase
    }
  };
  
  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-gray-300 relative h-40 cursor-pointer group" onClick={() => photoInputRef.current?.click()}>
      <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
      {teamPhoto ? <Image src={teamPhoto} alt="Foto Squadra" fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><span className="text-gray-500 text-sm font-medium">FOTO SQUADRA</span></div>}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col items-center text-white">
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs font-bold uppercase">Cambia Foto Squadra</span>
        </div>
      </div>
    </div>
  );
};

export interface PlayerData { 
  photo?: string; 
  photoFile?: File; // ✅ Aggiunto per gestire l'upload reale del file
  firstName: string; 
  lastName: string; 
  number: string; 
  birthDate: string; 
  id?: string; 
}

interface AdminPlayerEditorProps { 
  player?: PlayerData | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (player: PlayerData) => void;
  onDelete?: () => void; // NUOVO: prop opzionale per l'eliminazione
}

export const AdminPlayerEditor: React.FC<AdminPlayerEditorProps> = ({ player, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<PlayerData>({ photo: '', firstName: '', lastName: '', number: '-', birthDate: '' });
  const [error, setError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (player) setFormData({ photo: player.photo || '', firstName: player.firstName || '', lastName: player.lastName || '', number: player.number || '-', birthDate: player.birthDate || '' });
    else setFormData({ photo: '', firstName: '', lastName: '', number: '-', birthDate: '' });
    setError('');
  }, [player, isOpen]);
  
  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) { setError('⚠️ Inserisci nome e cognome!'); return; }
    onSave({ ...formData, firstName: formData.firstName.trim(), lastName: formData.lastName.trim() });
    onClose();
  };
  
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        photo: URL.createObjectURL(file),
        photoFile: file // ✅ Salviamo il file reale per l'upload
      })); 
    }
  };
  
  if (!isOpen) return null;
  const isEditing = !!player;
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* HEADER SOLO CON TITOLO E CHIUSURA */}
        <div className="bg-[#581C24] p-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">{isEditing ? 'Modifica Giocatore' : 'Nuovo Giocatore'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* CESTINO - visibile solo in modifica, in alto a sinistra nella zona bianca */}
          {isEditing && onDelete && (
            <div className="flex justify-start mb-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-bold uppercase"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors relative overflow-hidden group" onClick={() => photoInputRef.current?.click()}>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              {formData.photo ? <Image src={formData.photo} alt="Foto" fill className="object-cover" /> : <span className="text-sm text-gray-400 font-medium">FOTO</span>}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Nome</label>
            <UppercaseInput
              value={formData.firstName}
              onChange={(val) => setFormData(prev => ({ ...prev, firstName: val }))}
              placeholder="Nome"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Cognome</label>
            <UppercaseInput
              value={formData.lastName}
              onChange={(val) => setFormData(prev => ({ ...prev, lastName: val }))}
              placeholder="Cognome"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm placeholder:text-gray-400"
            />
          </div>
          <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Numero di maglia</label><input type="text" value={formData.number} onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))} placeholder="-" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm placeholder:text-gray-400" /></div>
          <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Data di nascita</label><input type="date" value={formData.birthDate} onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
        </div>
        
        {/* FOOTER SOLO CON ANNULLA E AGGIORNA */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase">
            Annulla
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase">
            {isEditing ? 'Aggiorna' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminAddPlayerButtonProps { onAdd: (player: PlayerData) => void; }
export const AdminAddPlayerButton: React.FC<AdminAddPlayerButtonProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-[10px] font-bold text-[#581C24] bg-[#581C24]/10 px-3 py-1.5 rounded-full border border-[#581C24]/20 hover:bg-[#581C24]/20 transition-colors flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </button>
      <AdminPlayerEditor player={null} isOpen={isOpen} onClose={() => setIsOpen(false)} onSave={(player) => { onAdd(player); setIsOpen(false); }} />
    </>
  );
};

// ========================================================================
// NUOVI COMPONENTI PER PAGINA "ALTRO" (SOLO STAFF PER ORA)
// ========================================================================

interface AdminLiberatorieManagerProps {
  teams: TeamLiberatorie[];
  templateDoc?: UploadedDocument;
  userRole: 'staff' | 'captain';
  userTeamId?: string;
  onUpdate: (teams: TeamLiberatorie[]) => void;
  onTemplateUpload: (doc: UploadedDocument) => void;
  isTournamentLocked?: boolean;
}

export const AdminLiberatorieManager: React.FC<AdminLiberatorieManagerProps> = ({
  teams, templateDoc, userRole, userTeamId, onUpdate, onTemplateUpload, isTournamentLocked = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamLiberatorie | null>(null);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleTemplateUpload = async (file: File) => {
  const fileName = `template_${Date.now()}.pdf`;
  const path = `documents/${fileName}`;

  // 1. Upload nello Storage
  const { error: uploadError } = await supabase.storage
    .from("tournament-files")
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    alert(uploadError.message);
    return;
  }

  // 2. URL pubblico
  const { data } = supabase.storage
    .from("tournament-files")
    .getPublicUrl(path);

  // 3. Salva nella tabella documents
  const { data: row, error: dbError } = await supabase
    .from("documents")
    .insert({
      file_name: file.name,
      file_url: data.publicUrl,
      file_type: "pdf",
      document_category: "template_liberatoria",
    })
    .select()
    .single();

  if (dbError) {
    alert(dbError.message);
    return;
  }

  // 4. Aggiorna la UI
  onTemplateUpload({
    id: row.id,
    url: row.file_url,
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
    uploadedBy: "staff",
  });
};

  const handleTeamDocumentUpload = (teamId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate(teams.map(team =>
        team.teamId === teamId ? { ...team, documents: [...team.documents, {
          id: Date.now().toString(), url: URL.createObjectURL(file), fileName: file.name,
          uploadedAt: new Date().toISOString(), uploadedBy: userRole
        }] } : team
      ));
    }
  };

  const handleDeleteDocument = (teamId: string, docId: string) => {
    onUpdate(teams.map(team =>
      team.teamId === teamId ? { ...team, documents: team.documents.filter(d => d.id !== docId) } : team
    ));
  };

  const handleDeleteTemplate = async () => {
    if (!templateDoc) return;

    const storagePath = templateDoc.url.split("/documents/")[1];

    if (storagePath) {
      await supabase.storage
        .from("tournament-files")
        .remove([storagePath]);
    }

    await supabase
      .from("documents")
      .delete()
      .eq("id", templateDoc.id);

    onTemplateUpload(undefined as any);
  };

 return (
  <div className="space-y-4">

    {/* STAFF: Gestione modello */}
{userRole === "staff" && (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bebas text-[#6B1E1E]">
        MODELLO DA COMPILARE
      </h3>

      {templateDoc && (
        <button
          onClick={handleDeleteTemplate}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>

    {!templateDoc ? (
      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#581C24]/30 rounded-xl cursor-pointer hover:bg-[#581C24]/5 transition">
        <Upload className="w-8 h-8 text-[#581C24] mb-2" />
        <span className="font-bold text-[#581C24]">
          Carica modello PDF
        </span>
        <span className="text-xs text-gray-500 mt-1">
          Documento che scaricheranno i capitani
        </span>

        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleTemplateUpload(file);
          }}
        />
      </label>
    ) : (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-[#581C24]" />
          <span className="text-sm font-medium">
            {templateDoc.fileName}
          </span>
        </div>

        <div className="flex gap-2">
          <label className="px-3 py-1.5 border border-[#581C24] text-[#581C24] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#581C24]/5 transition">
            Sostituisci
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTemplateUpload(file);
              }}
            />
          </label>

          <a
            href={templateDoc.url}
            download
            className="px-3 py-1.5 bg-[#581C24] text-white text-xs font-bold rounded-lg hover:bg-[#581C24]/90 transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Scarica
          </a>
        </div>
      </div>
    )}
  </div>
)}

    {/* CAPITANI: Solo download */}
    {userRole === "captain" && templateDoc && (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
          TEMPLATE CAPITANI
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
          <div>
            <p className="font-bold">{templateDoc.fileName}</p>
            <p className="text-xs text-gray-500">
              {new Date(templateDoc.uploadedAt).toLocaleDateString("it-IT")}
            </p>
          </div>

          <a
            href={templateDoc.url}
            download
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-5 h-5 text-[#581C24]" />
          </a>
        </div>
      </div>
    )}

      {/* 3. LISTA SQUADRE E UPLOAD DOCUMENTI */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[#581C24] uppercase">
          {userRole === 'staff' ? 'Gestione Liberatorie Squadre' : 'Carica le tue Liberatorie'}
        </h3>
        {teams.map(team => {
          const hasDocs = team.documents.length > 0;
          const canEdit = userRole === 'staff' || (userRole === 'captain' && team.teamId === userTeamId);
          const isLockedForCaptain = isTournamentLocked && userRole === 'captain';
          
          return (
            <div 
              key={team.teamId} 
              onClick={() => {
                if (isLockedForCaptain) {
                  alert('⚠️ Siamo nella fase finale, non puoi più inserire o modificare liberatorie.');
                  return;
                }
                if (canEdit) setSelectedTeam(team);
              }} 
              className={`bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between transition-all ${
                canEdit && !isLockedForCaptain
                  ? 'border-gray-100 cursor-pointer hover:shadow-md hover:border-[#581C24]/30' 
                  : 'border-gray-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${hasDocs ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`font-bold text-sm ${canEdit && !isLockedForCaptain ? 'text-[#581C24]' : 'text-gray-500'}`}>
                  {team.teamName} {userRole === 'captain' && team.teamId === userTeamId && '(La tua squadra)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{team.documents.length} file</span>
                {canEdit && !isLockedForCaptain && <Eye className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. POPUP DETTAGLIO SQUADRA */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#581C24] p-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase">
                {selectedTeam.teamName} - Liberatorie
              </h2>
              <button onClick={() => setSelectedTeam(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {userRole === 'staff' || (userRole === 'captain' && selectedTeam.teamId === userTeamId) ? (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    Carica Documento Firmato
                  </label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={(e) => handleTeamDocumentUpload(selectedTeam.teamId, e)} 
                    className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90 cursor-pointer" 
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
                  Non hai i permessi per caricare documenti per questa squadra.
                </p>
              )}

              <div>
                <h3 className="text-xs font-bold text-gray-600 uppercase mb-2">Storico Documenti</h3>
                <div className="space-y-2">
                  {selectedTeam.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Download className="w-4 h-4 text-[#581C24] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString('it-IT')}</p>
                        </div>
                      </div>
                      {(userRole === 'staff' || doc.uploadedBy === userRole) && (
                        <button 
                          onClick={() => handleDeleteDocument(selectedTeam.teamId, doc.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {selectedTeam.documents.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Nessun documento caricato</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP UPLOAD TEMPLATE (Solo Staff) */}
      {showTemplateUpload && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[#581C24] uppercase mb-4">Carica Modello Base</h3>
            <input type="file" accept=".pdf,.doc,.docx" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])} className="w-full mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowTemplateUpload(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-sm">Annulla</button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-[#581C24] text-white rounded-lg font-bold text-sm">Carica</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminMultiUploadProps {
  items: any[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  accept: string;
  title: string;
  showPreview?: boolean;
}

export const AdminMultiUpload: React.FC<AdminMultiUploadProps> = ({ items, onUpload, onDelete, accept, title, showPreview = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#581C24] uppercase">{title}</h3>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 bg-[#581C24] text-white rounded-lg text-xs font-bold hover:bg-[#581C24]/90 transition-colors">
          <Upload className="w-3.5 h-3.5" /> Carica
        </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onUpload(e.target.files)} accept={accept} multiple className="hidden" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item: any) => (
          <div key={item.id} className="relative group">
            {showPreview && item.type === 'image' ? (
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={item.url} alt={item.name || ''} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <Download className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <button onClick={() => onDelete(item.id)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">Nessun file caricato</div>}
    </div>
  );
};

interface AdminRegolamentoManagerProps {
  regolamento?: UploadedDocument;
  onUpload: (doc: UploadedDocument) => void;
}

export const AdminRegolamentoManager: React.FC<AdminRegolamentoManagerProps> = ({
  regolamento,
  onUpload,
}) => {
  const supabase = createClient();

  const handleUpload = async (file: File) => {
    const fileName = `regolamento_${Date.now()}.pdf`;
    const path = `documents/${fileName}`;

    // Upload nello Storage
    const { error: uploadError } = await supabase.storage
      .from("tournament-files")
      .upload(path, file, {
        contentType: "application/pdf",
        upsert: true,
      });
    
    if (uploadError) {
      alert(uploadError.message);
      return;
    }
    
    // Ottieni URL pubblico
    const { data: publicData } = supabase.storage
      .from("tournament-files")
      .getPublicUrl(path);
    
    const publicUrl = publicData.publicUrl;

    const { data: row, error: dbError } = await supabase
      .from("documents")
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: "pdf",
        document_category: "regolamento",
      })
      .select()
      .single();
    
    if (dbError) {
      alert(dbError.message);
      return;
    }
    
    onUpload({
      id: row.id,
      url: row.file_url,
      fileName: row.file_name,
      uploadedAt: row.uploaded_at,
      uploadedBy: "staff",
    });
  };

  const handleDelete = async () => {
    if (!regolamento) return;

    const storagePath = regolamento.url.split("/documents/")[1];

    if (storagePath) {
      await supabase.storage
      .from("tournament-files")
      .remove([storagePath]);
    }

    await supabase
      .from("documents")
      .delete()
      .eq("id", regolamento.id);

    onUpload(undefined as any);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bebas text-[#6B1E1E]">
          REGOLAMENTO
        </h3>

        {regolamento && (
          <button onClick={handleDelete}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {!regolamento ? (
        <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer">
          <Upload className="w-8 h-8 mb-2 text-[#581C24]" />
          <span>Carica PDF regolamento</span>

          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </label>
      ) : (
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <span>{regolamento.fileName}</span>

          <a href={regolamento.url} download>
            <Download className="w-5 h-5 text-[#581C24]" />
          </a>
        </div>
      )}
    </div>
  );
};

interface AdminContactsEditorProps {
  contacts: ContattiData;
  onSave: (contacts: ContattiData) => void;
}

export const AdminContactsEditor: React.FC<AdminContactsEditorProps> = ({ contacts, onSave }) => {
  const [formData, setFormData] = useState(contacts);
  return (
    <div className="space-y-4">
      <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Telefono</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="+39 012 3456789" /></div>
      <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="info@proloco.it" /></div>
      <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Facebook</label><input type="url" value={formData.facebook || ''} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://facebook.com/..." /></div>
      <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Instagram</label><input type="url" value={formData.instagram || ''} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://instagram.com/..." /></div>
      <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">WhatsApp</label><input type="tel" value={formData.whatsapp || ''} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="+39 333 1234567" /></div>
      <button onClick={() => onSave(formData)} className="w-full py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase">Salva Contatti</button>
    </div>
  );
};

// ============================================================
// Admin Delete Match Button
// ============================================================
interface AdminDeleteMatchButtonProps {
  matchId: string;
  onDeleteSuccess?: () => void;
}

export const AdminDeleteMatchButton: React.FC<AdminDeleteMatchButtonProps> = ({
  matchId,
  onDeleteSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const isConfirmed = window.confirm(
      "⚠️ Sei sicuro di voler eliminare questa partita?\n\nVerranno eliminati anche i post PRE MATCH e FULL TIME.\n\nQuesta azione è irreversibile."
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      // Elimina i post collegati dalla Storage
      const filesToDelete = [
        `match-posts/${matchId}_PRE_MATCH_matchday.png`,
        `match-posts/${matchId}_POST_MATCH_matchday.png`,
      ];

      const { error: storageError } = await supabase.storage
        .from("tournament-files")
        .remove(filesToDelete);

      if (storageError) {
        console.warn("Errore eliminazione post:", storageError.message);
      }

      // Elimina la partita dal database
      const { error: matchError } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (matchError) throw matchError;

      alert("✅ Partita eliminata con successo");

      onDeleteSuccess?.();

    } catch (err) {
      console.error("Errore eliminazione partita:", err);
      alert("❌ Errore nell'eliminazione della partita");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center"
      title="Elimina partita"
    >
      {isDeleting ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
};

// ============================================================
// Admin Edit Event
// ============================================================
export interface AdminEditEventProps {
  event: EventData;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  currentHomeScore: number;
  currentAwayScore: number;
  onUpdate: () => void;
  onClose: () => void;
}

export const AdminEditEvent: React.FC<AdminEditEventProps> = ({ 
  event, matchId, homeTeamId, awayTeamId, currentHomeScore, currentAwayScore, onUpdate, onClose 
}) => {
  const [eventType, setEventType] = useState(
    event.event_type === 'GOAL' ? 'goal' : event.event_type === 'YELLOW_CARD' ? 'yellow' : 'red'
  );
  const [selectedPlayer, setSelectedPlayer] = useState(event.player_id || '');
  const [minute, setMinute] = useState(event.minute?.toString() || '');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!eventType || !selectedPlayer || !minute) {
      setError('⚠️ Compila tutti i campi!');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const dbEventType = eventType === 'goal' ? 'GOAL' : eventType === 'yellow' ? 'YELLOW_CARD' : 'RED_CARD';
    const oldType = event.event_type;
    
    try {
      const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
      const newTeamId = selectedPlayerObj?.team_id || event.team_id;

      // 1. Calcola differenze per il giocatore
      const playerUpdates: any = {};
      if (oldType === 'GOAL' && dbEventType !== 'GOAL') playerUpdates.goals = -1;
      if (oldType === 'YELLOW_CARD' && dbEventType !== 'YELLOW_CARD') playerUpdates.yellow_cards = -1;
      if (oldType === 'RED_CARD' && dbEventType !== 'RED_CARD') playerUpdates.red_cards = -1;

      if (dbEventType === 'GOAL' && oldType !== 'GOAL') playerUpdates.goals = (playerUpdates.goals || 0) + 1;
      if (dbEventType === 'YELLOW_CARD' && oldType !== 'YELLOW_CARD') playerUpdates.yellow_cards = (playerUpdates.yellow_cards || 0) + 1;
      if (dbEventType === 'RED_CARD' && oldType !== 'RED_CARD') playerUpdates.red_cards = (playerUpdates.red_cards || 0) + 1;

      // 2. Calcola differenze per il punteggio
      let scoreDiff = 0;
      if (oldType === 'GOAL' && dbEventType !== 'GOAL') scoreDiff = -1;
      if (dbEventType === 'GOAL' && oldType !== 'GOAL') scoreDiff = 1;

      // 3. Applica aggiornamenti giocatore
      if (Object.keys(playerUpdates).length > 0 && event.player_id) {
        const { data: currentPlayer } = await supabase.from('players').select('goals, yellow_cards, red_cards').eq('id', event.player_id).single();
        if (currentPlayer) {
          const newGoals = Math.max(0, (currentPlayer.goals || 0) + (playerUpdates.goals || 0));
          const newYellow = Math.max(0, (currentPlayer.yellow_cards || 0) + (playerUpdates.yellow_cards || 0));
          const newRed = Math.max(0, (currentPlayer.red_cards || 0) + (playerUpdates.red_cards || 0));
          
          await supabase.from('players').update({
            goals: newGoals,
            yellow_cards: newYellow,
            red_cards: newRed
          }).eq('id', event.player_id);
        }
      }

      // 4. Applica aggiornamenti punteggio
      if (scoreDiff !== 0) {
        const isHome = event.team_id === homeTeamId;
        const currentScore = isHome ? currentHomeScore : currentAwayScore;
        const newScore = Math.max(0, currentScore + scoreDiff);
        
        await supabase.from('matches').update({
          [isHome ? 'home_score' : 'away_score']: newScore
        }).eq('id', matchId);
      }

      // 5. Aggiorna l'evento
      const { error: eventError } = await supabase.from('match_events').update({
        event_type: dbEventType,
        player_id: selectedPlayer,
        minute: parseInt(minute),
        team_id: newTeamId
      }).eq('id', event.id);

      if (eventError) throw eventError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ Eliminare questo evento? Verranno aggiornati risultati e statistiche.')) return;
    setLoading(true);
    const supabase = createClient();
    const oldType = event.event_type;

    try {
      // 1. Revert giocatore
      if (event.player_id) {
        const { data: currentPlayer } = await supabase.from('players').select('goals, yellow_cards, red_cards').eq('id', event.player_id).single();
        if (currentPlayer) {
          const updates: any = {};
          if (oldType === 'GOAL') updates.goals = Math.max(0, (currentPlayer.goals || 0) - 1);
          if (oldType === 'YELLOW_CARD') updates.yellow_cards = Math.max(0, (currentPlayer.yellow_cards || 0) - 1);
          if (oldType === 'RED_CARD') updates.red_cards = Math.max(0, (currentPlayer.red_cards || 0) - 1);
          
          if (Object.keys(updates).length > 0) {
            await supabase.from('players').update(updates).eq('id', event.player_id);
          }
        }
      }

      // 2. Revert punteggio
      if (oldType === 'GOAL') {
        const isHome = event.team_id === homeTeamId;
        const currentScore = isHome ? currentHomeScore : currentAwayScore;
        await supabase.from('matches').update({
          [isHome ? 'home_score' : 'away_score']: Math.max(0, currentScore - 1)
        }).eq('id', matchId);
      }

      // 3. Elimina evento
      await supabase.from('match_events').delete().eq('id', event.id);

      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Errore nell\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#581C24] p-3 flex items-center justify-between">
          <h2 className="text-base font-black text-white uppercase tracking-wider">Modifica Evento</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} disabled={loading} className="text-red-300 hover:text-red-100 p-1 rounded-full hover:bg-red-600/50 transition-colors" title="Elimina evento">
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tipo Evento</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
              <option value="goal">⚽ GOL</option>
              <option value="yellow">🟨 AMMONIZIONE</option>
              <option value="red">🟥 ESPULSIONE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Giocatore</label>
            <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold">
              <option value="">Seleziona...</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.jersey_number ? `${player.jersey_number}. ` : ''}{player.first_name} {player.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Minuto</label>
            <input type="number" min="1" max="120" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="Es: 45" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
        </div>
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-xs">Annulla</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-3 py-2 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-xs shadow-md disabled:opacity-50">
            {loading ? 'Salvataggio...' : 'SALVA'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Admin Create Quarters (Crea Fase Finale - Quarti)
// ============================================================
interface AdminCreateQuartersProps {
  onSuccess: () => void;
}

export const AdminCreateQuarters: React.FC<AdminCreateQuartersProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchups, setMatchups] = useState<any[]>([]);

  // Calcola classifica e prepara gli abbinamenti all'apertura
  useEffect(() => {
    if (isOpen) {
      const calculateStandings = async () => {
        setLoading(true);
        const supabase = createClient();
        
        // 1. Prendi tutte le squadre
        const { data: teams } = await supabase.from('teams').select('id, name, logo_url, girone');
        // 2. Prendi tutte le partite finite
        const { data: matches } = await supabase.from('matches').select('home_team_id, away_team_id, home_score, away_score').eq('status', 'FINITA');

        if (teams && matches) {
          const stats: any = {};
          teams.forEach((t: any) => {
            stats[t.id] = { ...t, pt: 0, gf: 0, gs: 0, dr: 0 };
          });

          matches.forEach((m: any) => {
            const h = stats[m.home_team_id];
            const a = stats[m.away_team_id];
            if (!h || !a) return;
            const hs = m.home_score || 0;
            const as_ = m.away_score || 0;
            h.gf += hs; h.gs += as_; h.dr = h.gf - h.gs;
            a.gf += as_; a.gs += hs; a.dr = a.gf - a.gs;
            if (hs > as_) { h.pt += 3; } 
            else if (as_ > hs) { a.pt += 3; } 
            else { h.pt += 1; a.pt += 1; }
          });

          const allTeams = Object.values(stats);
          const groupA = allTeams.filter((t: any) => t.girone === 'A').sort((a: any, b: any) => b.pt - a.pt || b.dr - a.dr || b.gf - a.gf);
          const groupB = allTeams.filter((t: any) => t.girone === 'B').sort((a: any, b: any) => b.pt - a.pt || b.dr - a.dr || b.gf - a.gf);

          // Abbinamenti: 1A-4B, 2B-3A, 2A-3B, 1B-4A
          const newMatchups = [
            { home: groupA[0], away: groupB[3], date: '', time: '' }, // 1A vs 4B
            { home: groupB[1], away: groupA[2], date: '', time: '' }, // 2B vs 3A
            { home: groupA[1], away: groupB[2], date: '', time: '' }, // 2A vs 3B
            { home: groupB[0], away: groupA[3], date: '', time: '' }, // 1B vs 4A
          ];
          setMatchups(newMatchups);
        }
        setLoading(false);
      };
      calculateStandings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Validazione: tutte le date e ore devono essere compilate
    if (matchups.some(m => !m.date || !m.time)) {
      alert('⚠️ Compila data e ora per tutti gli scontri!');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const matchesToInsert = matchups.map(m => ({
      home_team_id: m.home.id,
      away_team_id: m.away.id,
      match_date: m.date,
      match_time: m.time,
      status: 'PROGRAMMATA',
      phase: 'QUARTI'
    }));

    const { error } = await supabase.from('matches').insert(matchesToInsert);

    if (error) {
      console.error(error);
      alert('Errore nel salvataggio dei quarti di finale.');
    } else {
      alert('✅ Quarti di Finale creati con successo! Le rose delle squadre sono ora bloccate.');
      localStorage.setItem('classifiche_default_tab', 'fase-finale');
      setIsOpen(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full py-3 bg-[#581C24] text-white font-black rounded-xl shadow-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        CREA FASE FINALE (QUARTI)
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#581C24] p-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Crea Quarti di Finale</h2>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-bold">Calcolo classifiche e abbinamenti...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchups.map((match, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Squadre */}
                        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto justify-center sm:justify-start">
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.home.logo_url ? <Image src={match.home.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.home.name}</span>
                          </div>
                          
                          <span className="text-xl font-black text-gray-400">-</span>
                          
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.away.logo_url ? <Image src={match.away.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.away.name}</span>
                          </div>
                        </div>

                        {/* Data e Ora */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                          <input 
                            type="date" 
                            value={match.date}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].date = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                          <input 
                            type="time" 
                            value={match.time}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].time = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase">
                Annulla
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'SALVA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// Admin Create Semifinals (Crea Semifinali)
// ============================================================
interface AdminCreateSemifinalsProps {
  onSuccess: () => void;
}

export const AdminCreateSemifinals: React.FC<AdminCreateSemifinalsProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchups, setMatchups] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const calculateSemifinals = async () => {
        setLoading(true);
        setError('');
        const supabase = createClient();
        
        // 1. Prendi tutte le partite dei Quarti FINITE
        const { data: quarters } = await supabase
          .from('matches')
          .select('id, home_score, away_score, home_penalties, away_penalties, status, home_team_id, away_team_id, match_key')
          .eq('phase', 'QUARTI')
          .eq('status', 'FINITA')
          .order('match_key', { ascending: true }); // ✅ ORDINA PER match_key (Q1, Q2, Q3, Q4)

        if (!quarters || quarters.length < 4) {
          setError('⚠️ Completa tutte e 4 le partite dei Quarti di Finale prima di procedere.');
          setLoading(false);
          return;
        }

        // 2. Recupera i dati delle squadre
        const teamIds = Array.from(new Set(quarters.flatMap(q => [q.home_team_id, q.away_team_id])));
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', teamIds);

        // 3. Funzione helper per determinare il vincitore
        const getWinner = (q: any) => {
          if (q.home_score > q.away_score) return teams?.find(t => t.id === q.home_team_id);
          if (q.away_score > q.home_score) return teams?.find(t => t.id === q.away_team_id);
          
          // Se pari, controlla i rigori
          const hPen = q.home_penalties ?? 0;
          const aPen = q.away_penalties ?? 0;
          if (hPen > aPen) return teams?.find(t => t.id === q.home_team_id);
          if (aPen > hPen) return teams?.find(t => t.id === q.away_team_id);
          
          return null; // Caso improbabile
        };

        // 4. Crea gli abbinamenti: Vincitore Q1 vs Vincitore Q2, Vincitore Q3 vs Vincitore Q4
        const winner1 = getWinner(quarters[0]);
        const winner2 = getWinner(quarters[1]);
        const winner3 = getWinner(quarters[2]);
        const winner4 = getWinner(quarters[3]);

        setMatchups([
          { home: winner1, away: winner2, date: '', time: '' },
          { home: winner3, away: winner4, date: '', time: '' }
        ]);
        setLoading(false);
      };
      calculateSemifinals();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (matchups.some(m => !m.date || !m.time)) {
      alert('⚠️ Compila data e ora per tutte le semifinali!');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const matchesToInsert = matchups.map(m => ({
      home_team_id: m.home?.id,
      away_team_id: m.away?.id,
      match_date: m.date,
      match_time: m.time,
      status: 'PROGRAMMATA',
      phase: 'SEMIFINALI'
    }));

    const { error } = await supabase.from('matches').insert(matchesToInsert);

    if (error) {
      console.error(error);
      alert('Errore nel salvataggio delle semifinali.');
    } else {
      alert('✅ Semifinali create con successo!');
      setIsOpen(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full py-3 bg-[#581C24] text-white font-black rounded-xl shadow-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        CREA SEMIFINALI
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#581C24] p-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Crea Semifinali</h2>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-bold">Calcolo vincitori Quarti...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600 font-bold text-sm">{error}</div>
              ) : (
                <div className="space-y-4">
                  {matchups.map((match, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto justify-center sm:justify-start">
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.home?.logo_url ? <Image src={match.home.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.home?.name || 'TBD'}</span>
                          </div>
                          <span className="text-xl font-black text-gray-400">-</span>
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.away?.logo_url ? <Image src={match.away.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.away?.name || 'TBD'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                          <input 
                            type="date" 
                            value={match.date}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].date = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                          <input 
                            type="time" 
                            value={match.time}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].time = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!error && (
              <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
                <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase">
                  Annulla
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase disabled:opacity-50"
                >
                  {loading ? 'Salvataggio...' : 'SALVA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================
// Admin Create Finals (Crea Finali)
// ============================================================
interface AdminCreateFinalsProps {
  onSuccess: () => void;
}

export const AdminCreateFinals: React.FC<AdminCreateFinalsProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchups, setMatchups] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const calculateFinals = async () => {
        setLoading(true);
        setError('');
        const supabase = createClient();
        
        // 1. Prendi tutte le partite delle Semifinali FINITE, ordinate per match_key
        const { data: semis } = await supabase
          .from('matches')
          .select('id, home_score, away_score, home_penalties, away_penalties, status, home_team_id, away_team_id, match_key')
          .eq('phase', 'SEMIFINALI')
          .eq('status', 'FINITA')
          .order('match_key', { ascending: true });

        if (!semis || semis.length < 2) {
          setError('⚠️ Completa tutte e 2 le partite delle Semifinali prima di procedere.');
          setLoading(false);
          return;
        }

        // 2. Recupera i dati delle squadre
        const teamIds = Array.from(new Set(semis.flatMap(s => [s.home_team_id, s.away_team_id])));
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', teamIds);

        // 3. Funzione helper per determinare il vincitore
        const getWinner = (s: any) => {
          if (s.home_score > s.away_score) return teams?.find(t => t.id === s.home_team_id);
          if (s.away_score > s.home_score) return teams?.find(t => t.id === s.away_team_id);
          
          const hPen = s.home_penalties ?? 0;
          const aPen = s.away_penalties ?? 0;
          if (hPen > aPen) return teams?.find(t => t.id === s.home_team_id);
          if (aPen > hPen) return teams?.find(t => t.id === s.away_team_id);
          
          return null;
        };

        // 4. Funzione helper per determinare il perdente
        const getLoser = (s: any) => {
          const winner = getWinner(s);
          if (!winner) return null;
          const homeTeam = teams?.find(t => t.id === s.home_team_id);
          const awayTeam = teams?.find(t => t.id === s.away_team_id);
          return winner.id === homeTeam?.id ? awayTeam : homeTeam;
        };

        // 5. Crea gli abbinamenti: Vincitore S1 vs Vincitore S2 (Finale 1-2), Perdente S1 vs Perdente S2 (Finale 3-4)
        const winner1 = getWinner(semis[0]);
        const winner2 = getWinner(semis[1]);
        const loser1 = getLoser(semis[0]);
        const loser2 = getLoser(semis[1]);

        setMatchups([
          { home: winner1, away: winner2, date: '', time: '', phase: 'FINALE' },
          { home: loser1, away: loser2, date: '', time: '', phase: 'FINALE_3_4' }
        ]);
        setLoading(false);
      };
      calculateFinals();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (matchups.some(m => !m.date || !m.time)) {
      alert('️ Compila data e ora per tutte le finali!');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const matchesToInsert = matchups.map(m => ({
      home_team_id: m.home?.id,
      away_team_id: m.away?.id,
      match_date: m.date,
      match_time: m.time,
      status: 'PROGRAMMATA',
      phase: m.phase,
      match_key: m.phase === 'FINALE' ? 'F1' : 'F2'
    }));

    const { error } = await supabase.from('matches').insert(matchesToInsert);

    if (error) {
      console.error(error);
      alert('Errore nel salvataggio delle finali.');
    } else {
      alert('✅ Finali create con successo!');
      setIsOpen(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full py-3 bg-[#581C24] text-white font-black rounded-xl shadow-lg hover:bg-[#581C24]/90 transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        CREA FINALI
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#581C24] p-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Crea Finali</h2>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-bold">Calcolo vincitori Semifinali...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600 font-bold text-sm">{error}</div>
              ) : (
                <div className="space-y-4">
                  {matchups.map((match, idx) => (
                    <div key={idx} className={`rounded-xl p-4 border-2 ${match.phase === 'FINALE' ? 'border-[#FFD700] bg-gradient-to-br from-[#F9E4A8]/30 to-white' : 'border-[#CD7F32] bg-gradient-to-br from-[#E8C8A8]/30 to-white'}`}>
                      <div className="text-center text-xs font-black uppercase mb-3" style={{ color: match.phase === 'FINALE' ? '#B8860B' : '#8B5A2B' }}>
                        {match.phase === 'FINALE' ? '🏆 FINALE 1°-2° POSTO' : '🥉 FINALE 3°-4° POSTO'}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto justify-center sm:justify-start">
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.home?.logo_url ? <Image src={match.home.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.home?.name || 'TBD'}</span>
                          </div>
                          <span className="text-xl font-black text-gray-400">-</span>
                          <div className="flex flex-col items-center w-20">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden mb-1">
                              {match.away?.logo_url ? <Image src={match.away.logo_url} alt="" width={40} height={40} className="object-cover" /> : <span className="text-[6px]">LOGO</span>}
                            </div>
                            <span className="text-[10px] font-bold text-[#581C24] uppercase text-center leading-tight">{match.away?.name || 'TBD'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                          <input 
                            type="date" 
                            value={match.date}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].date = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                          <input 
                            type="time" 
                            value={match.time}
                            onChange={(e) => {
                              const newMatchups = [...matchups];
                              newMatchups[idx].time = e.target.value;
                              setMatchups(newMatchups);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#581C24] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!error && (
              <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
                <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase">
                  Annulla
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase disabled:opacity-50"
                >
                  {loading ? 'Salvataggio...' : 'SALVA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

interface AdminSaveAlboDoroProps {
  onSave: (data: AlboDoroData) => void;
  currentYear: number;
}

export const AdminSaveAlboDoro: React.FC<AdminSaveAlboDoroProps> = ({ onSave, currentYear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AlboDoroData>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewTab, setPreviewTab] = useState<TabType>("gironi")
  const [password, setPassword] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [previewStandings, setPreviewStandings] = useState<{
    gironeA: TeamStats[];
    gironeB: TeamStats[];
  }>({
    gironeA: [],
    gironeB: [],
  });
  const gironeA = previewStandings.gironeA;
  const gironeB = previewStandings.gironeB;
  const [previewScorers, setPreviewScorers] = useState<TopScorer[]>([]);
  const [previewBracket, setPreviewBracket] =
  useState<AlboDoroData['bracket_snapshot']>({
    quarti: [],
    semifinali: [],
    finale: null,
    terzoQuarto: null,
  })

  const gironiCaptureRef = useRef<HTMLDivElement>(null);
  const marcatoriCaptureRef = useRef<HTMLDivElement>(null);
  const faseFinaleCaptureRef = useRef<HTMLDivElement>(null);
  
  const screenshotsRef = useRef<{
    gironi: Blob | null;
    marcatori: Blob | null;
    faseFinale: Blob | null;
  }>({
    gironi: null,
    marcatori: null,
    faseFinale: null,
  });

  const loadPreviewStandings = async () => {
  setPreviewLoading(true);

  try {
    const supabase = createClient();

    const { data: allTeams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url, girone");

    if (teamsError) throw teamsError;

    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select(
        "home_team_id, away_team_id, home_score, away_score, status, phase"
      )
      .eq("phase", "GIRONI")
      .in("status", ["FINITA", "LIVE", "SUPP", "RIGORI"]);

    if (matchesError) throw matchesError;

    const statsMap = new Map<string, TeamStats>();

    (allTeams || []).forEach((team) => {
      statsMap.set(team.id, {
        team: team.name,
        logo: team.logo_url,
        punti: 0,
        giocate: 0,
        vittorie: 0,
        pareggi: 0,
        sconfitte: 0,
        gol_fatti: 0,
        gol_subiti: 0,
        diff: 0,
      });
    });

    (matchesData || []).forEach((match: any) => {
      const homeStats = statsMap.get(match.home_team_id);
      const awayStats = statsMap.get(match.away_team_id);

      if (!homeStats || !awayStats) return;

      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;

      homeStats.giocate += 1;
      awayStats.giocate += 1;

      homeStats.gol_fatti += homeScore;
      homeStats.gol_subiti += awayScore;

      awayStats.gol_fatti += awayScore;
      awayStats.gol_subiti += homeScore;

      homeStats.diff =
        homeStats.gol_fatti - homeStats.gol_subiti;

      awayStats.diff =
        awayStats.gol_fatti - awayStats.gol_subiti;

      if (homeScore > awayScore) {
        homeStats.vittorie += 1;
        homeStats.punti += 3;
        awayStats.sconfitte += 1;
      } else if (awayScore > homeScore) {
        awayStats.vittorie += 1;
        awayStats.punti += 3;
        homeStats.sconfitte += 1;
      } else {
        homeStats.pareggi += 1;
        awayStats.pareggi += 1;
        homeStats.punti += 1;
        awayStats.punti += 1;
      }
    });

    const allStats = Array.from(statsMap.values());

    const teamDataMap = new Map(
      (allTeams || []).map((team) => [team.name, team])
    );

    const sortFn = (a: TeamStats, b: TeamStats) =>
      b.punti - a.punti ||
      b.diff - a.diff ||
      b.gol_fatti - a.gol_fatti;

    const snapshot = {
          gironeA: allStats
            .filter((team) => teamDataMap.get(team.team)?.girone === "A")
            .sort(sortFn),
    
          gironeB: allStats
            .filter((team) => teamDataMap.get(team.team)?.girone === "B")
            .sort(sortFn),
        };
    
        setPreviewStandings(snapshot);
    
        setFormData((prev) => ({
          ...prev,
          standings_snapshot: snapshot,
        }));
      } catch (error) {
        console.error("Errore caricamento classifica preview:", error);
      } finally {
        setPreviewLoading(false);
      }
    };

  const loadPreviewScorers = async () => {
  try {
    const supabase = createClient();

    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, first_name, last_name, goals, team_id')
      .order('goals', { ascending: false })
      .limit(50);

    if (playersError) throw playersError;

    const playerTeamIds = Array.from(
      new Set(
        (allPlayers || [])
          .map((player) => player.team_id)
          .filter(Boolean)
      )
    );

    let teamsData: any[] = [];

    if (playerTeamIds.length > 0) {
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', playerTeamIds);

      if (teamsError) throw teamsError;

      teamsData = teams || [];
    }

    const snapshot: TopScorer[] = (allPlayers || [])
      .map((player: any) => ({
        player: `${player.first_name} ${player.last_name}`,
        team:
          teamsData.find(
            (team: any) => team.id === player.team_id
          )?.name || '',
        goals: player.goals ?? 0,
      }))
      .slice(0, 10);

    setPreviewScorers(snapshot);

    setFormData((prev) => ({
      ...prev,
      scorers_snapshot: snapshot,
    }));
  } catch (error) {
    console.error(
      'Errore caricamento marcatori preview:',
      error
    );
  }
};

  const loadPreviewBracket = async () => {
  try {
    const supabase = createClient()

    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(
        'id, phase, status, match_key, home_score, away_score, home_penalties, away_penalties, home_team_id, away_team_id'
      )
      .in('phase', [
        'QUARTI',
        'SEMIFINALI',
        'FINALE',
        'FINALE_3_4',
      ])
      .order('match_key', { ascending: true })
      .order('id', { ascending: true })

    if (matchesError) throw matchesError

    const teamIds = Array.from(
      new Set(
        (matches || [])
          .flatMap((match: any) => [
            match.home_team_id,
            match.away_team_id,
          ])
          .filter(Boolean)
      )
    )

    let teams: any[] = []

    if (teamIds.length > 0) {
      const { data: teamsData, error: teamsError } =
        await supabase
          .from('teams')
          .select('id, name, logo_url')
          .in('id', teamIds)

      if (teamsError) throw teamsError

      teams = teamsData || []
    }

    const getTeam = (id: string | null) =>
      teams.find((team) => team.id === id)

    const mapMatch = (match: any): MatchCard => {
      const homeTeam = getTeam(match.home_team_id)
      const awayTeam = getTeam(match.away_team_id)

      return {
        home: homeTeam?.name || 'TBD',
        away: awayTeam?.name || 'TBD',
        homeLogo: homeTeam?.logo_url || null,
        awayLogo: awayTeam?.logo_url || null,
        homeScore: match.home_score,
        awayScore: match.away_score,
        played: match.status === 'FINITA',
      }
    }

    const quarti = (matches || [])
      .filter((match: any) => match.phase === 'QUARTI')
      .map(mapMatch)

    const semifinali = (matches || [])
      .filter((match: any) => match.phase === 'SEMIFINALI')
      .map(mapMatch)

    const finaleMatch =
      (matches || []).find(
        (match: any) => match.phase === 'FINALE'
      ) || null

    const terzoQuartoMatch =
      (matches || []).find(
        (match: any) => match.phase === 'FINALE_3_4'
      ) || null

    const snapshot = {
      quarti,
      semifinali,
      finale: finaleMatch ? mapMatch(finaleMatch) : null,
      terzoQuarto: terzoQuartoMatch
        ? mapMatch(terzoQuartoMatch)
        : null,
    }

    setPreviewBracket(snapshot)

    setFormData((prev) => ({
      ...prev,
      bracket_snapshot: snapshot,
    }))
  } catch (error) {
    console.error(
      'Errore caricamento fase finale preview:',
      error
    )
  }
}

  const captureSection = async (node: HTMLElement) => {
    const images = Array.from(node.querySelectorAll('img'));
  
    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }
  
        // Forza il caricamento anche se l'immagine è lazy-loaded
        img.loading = 'eager';
  
        return new Promise<void>((resolve) => {
          let finished = false;
  
          const finish = () => {
            if (finished) return;
            finished = true;
  
            clearTimeout(timeout);
            img.removeEventListener('load', finish);
            img.removeEventListener('error', finish);
  
            resolve();
          };
  
          const timeout = window.setTimeout(finish, 2000);
  
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        });
      })
    );
  
    await document.fonts?.ready;
  
    const blob = await toBlob(node, {
      cacheBust: true,
      backgroundColor: '#F5F5F7',
      width: node.scrollWidth,
      height: node.scrollHeight,
    });
  
    if (!blob) {
      throw new Error('Impossibile generare lo screenshot');
    }
  
    return blob;
  };

  const generateScreenshots = async () => {
  if (
    !gironiCaptureRef.current ||
    !marcatoriCaptureRef.current ||
    !faseFinaleCaptureRef.current
  ) {
    throw new Error('Elementi screenshot non disponibili');
  }

  screenshotsRef.current = {
    gironi: await captureSection(gironiCaptureRef.current),
    marcatori: await captureSection(marcatoriCaptureRef.current),
    faseFinale: await captureSection(faseFinaleCaptureRef.current),
  };
};
  
  const handleSave = async () => {
  if (!formData.winner || !formData.topScorer || !formData.mvp) {
    alert("Completa tutti i dati dell'Albo d'Oro.");
    return;
  }

  const year = formData.year || currentYear;

  const screenshots = screenshotsRef.current;

  if (
    !screenshots.gironi ||
    !screenshots.marcatori ||
    !screenshots.faseFinale
  ) {
    alert("Screenshot non disponibili. Torna indietro e premi AVANTI.");
    return;
  }

  setSaving(true);

  try {
    const supabase = createClient();

    // ============================================================
    // 1. UPLOAD DEI 3 SCREENSHOT
    // ============================================================

    const screenshotFiles = [
      {
        name: "gironi.png",
        blob: screenshots.gironi,
      },
      {
        name: "marcatori.png",
        blob: screenshots.marcatori,
      },
      {
        name: "fase-finale.png",
        blob: screenshots.faseFinale,
      },
    ];

    for (const file of screenshotFiles) {
      const path = `albo-doro/${year}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("tournament-files")
        .upload(path, file.blob, {
          upsert: true,
          contentType: "image/png",
          cacheControl: "31536000",
        });

      if (uploadError) {
        throw uploadError;
      }
    }

    // ============================================================
    // 2. CREA LO ZIP DI TUTTE LE CARTELLE MATCH-MEDIA
    // ============================================================

    const mediaResponse = await fetch(
      `/api/albo-doro/media?year=${year}`
    );

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      throw new Error(
        errorText || "Errore generazione archivio media"
      );
    }

    const mediaData = await mediaResponse.json();

    if (!mediaData.success || !mediaData.url) {
      throw new Error(
        "Archivio media non generato correttamente"
      );
    }

    // ============================================================
    // 3. SALVA ALBO D'ORO
    // ============================================================

    await onSave({
      year,
      winner: formData.winner,
      runnerUp: formData.runnerUp || "",
      topScorer: formData.topScorer,
      mvp: formData.mvp,
      standings_snapshot:
        formData.standings_snapshot!,
      scorers_snapshot:
        formData.scorers_snapshot!,
      bracket_snapshot:
        formData.bracket_snapshot!,
      media_zip_url: mediaData.url,
    });

    // ============================================================
    // 4. PULIZIA
    // ============================================================

    screenshotsRef.current = {
      gironi: null,
      marcatori: null,
      faseFinale: null,
    };

    setShowPassword(false);
    setPassword("");

    alert(
      `✅ Albo d'Oro ${year} salvato correttamente!`
    );

  } catch (error) {
    console.error(
      "Errore salvataggio Albo d'Oro:",
      error
    );

    alert(
      "Errore durante il salvataggio dell'Albo d'Oro."
    );
  } finally {
    setSaving(false);
  }
};
  return (
    <>
      <button
      onClick={async () => {
        setShowPreview(true)
      
        await Promise.all([
          loadPreviewStandings(),
          loadPreviewScorers(),
          loadPreviewBracket(),
        ])
      }}
        className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#581C24] font-black rounded-xl shadow-lg hover:shadow-xl transition-shadow text-sm uppercase tracking-wider"
      >
        Salva nell'Albo d'Oro
      </button>
  
      {/* ================= PREVIEW ================= */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#F5F5F7] w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
  
            {/* Header */}
            <div className="relative h-40">
              <Image
                src="/header-standing.jpg"
                alt="Albo d'Oro"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-white text-3xl font-black uppercase">
                  {currentYear}
                </h1>
              </div>
            </div>
  
            {/* TAB NAVIGATION */}
            <div className="relative z-20 -mt-8 px-3 mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
                {(['gironi', 'marcatori', 'fase-finale', 'media'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${
                      previewTab === tab
                        ? "bg-[#581C24] text-white shadow-md"
                        : "text-[#581C24] hover:bg-gray-100"
                    }`}
                  >
                    {tab === "gironi"
                      ? "GIRONI"
                      : tab === "marcatori"
                      ? "MARCATORI"
                      : tab === "fase-finale"
                      ? "FASE FINALE"
                      : "MEDIA"}
                  </button>
                ))}
              </div>
            </div>
  
            <div className="p-4">

            {previewTab === "gironi" && (
            <div id="preview-gironi">
              {previewLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-[#581C24] uppercase">
                    Caricamento classifiche...
                  </p>
                </div>
              ) : (
                <GironiSnapshot
                  gironeA={gironeA}
                  gironeB={gironeB}
                />
              )}
            </div>
          )}
          
            {previewTab === "marcatori" && (
              <div id="preview-marcatori">
                <MarcatoriSnapshot
                  scorers={previewScorers}
                />
              </div>
            )}
          
            {previewTab === "fase-finale" && (
              <div id="preview-fase-finale">
                <FaseFinaleSnapshot
                  quarti={previewBracket.quarti}
                  semifinali={previewBracket.semifinali}
                  finale={previewBracket.finale}
                  terzoQuarto={previewBracket.terzoQuarto}
                />
              </div>
            )}
          
            {previewTab === "media" && (
              <div>
                <h3 className="font-black text-[#581C24] mb-3">MEDIA</h3>
          
                <div className="bg-white rounded-xl border p-6 text-center">
                  <svg className="w-10 h-10 mx-auto text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 4 9-4M3 17l9 4 9-4M3 12l9 4 9-4"/>
                  </svg>
          
                  <p className="font-bold mt-3">Archivio foto del torneo</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Verrà creato automaticamente uno ZIP con le cartelle delle partite
                  </p>
                </div>
              </div>
            )}
          
          </div>
            
            {/* Footer */}
            <div className="bg-white border-t p-4 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 border border-gray-300 rounded-xl py-3 font-bold"
              >
                Annulla
              </button>
  
              <button
                onClick={async () => {
                  try {
                    await generateScreenshots();
                
                    setShowPreview(false);
                    setShowPassword(true);
                  } catch (error) {
                    console.error('Errore generazione screenshot:', error);
                    alert('Errore durante la generazione degli screenshot');
                  }
                }}
                className="flex-1 bg-[#581C24] text-white rounded-xl py-3 font-bold"
              >
                AVANTI
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ================= SCREENSHOT CAPTURE ================= */}
      <div
        className="absolute left-[-10000px] top-0 w-[448px]"
        aria-hidden="true"
      >
        <div
          ref={gironiCaptureRef}
          className="w-[448px] bg-[#F5F5F7] p-4"
        >
          <GironiSnapshot
            gironeA={gironeA}
            gironeB={gironeB}
          />
        </div>

        <div
          ref={marcatoriCaptureRef}
          className="w-[448px] bg-[#F5F5F7] p-4"
        >
          <MarcatoriSnapshot
            scorers={previewScorers}
          />
        </div>

        <div
          ref={faseFinaleCaptureRef}
          className="w-[448px] bg-[#F5F5F7] p-4"
        >
          <FaseFinaleSnapshot
            quarti={previewBracket.quarti}
            semifinali={previewBracket.semifinali}
            finale={previewBracket.finale}
            terzoQuarto={previewBracket.terzoQuarto}
          />
        </div>
      </div>
  
      {/* ================= PASSWORD ================= */}
      {showPassword && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-black text-[#581C24] text-center mb-2 uppercase">
              Conferma salvataggio
            </h2>
  
            <p className="text-sm text-gray-600 text-center mb-5">
              Questa operazione chiuderà definitivamente il torneo e creerà l'Albo d'Oro.
            </p>
  
            <input
              type="password"
              placeholder="Password staff"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 mb-4 text-center font-bold tracking-widest"
            />
  
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPassword(false);
                  setPassword("");
                }}
                className="flex-1 border rounded-xl py-3 font-bold"
              >
                Indietro
              </button>
  
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#581C24] text-white rounded-xl py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "SALVATAGGIO..." : "CONFERMA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
