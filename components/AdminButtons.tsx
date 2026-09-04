// components/AdminButtons.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Download, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ==================== TIPI DATI (NUOVI) ====================
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

export interface AlboDoroData {
  year: number;
  winner: string;
  runnerUp: string;
  topScorer: { name: string; team: string; goals: number };
  mvp: { name: string; team: string };
  groupStandings: any[];
  playoffBracket: any[];
}

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

interface PenaltyShootoutPopupProps {
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  isAdmin: boolean;
  onClose: (winner: 'home' | 'away' | null) => void;
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

export const PenaltyShootoutPopup: React.FC<PenaltyShootoutPopupProps> = ({
  homeTeam, awayTeam, isAdmin, onClose
}) => {
  const [started, setStarted] = useState(false);
  const [firstKicker, setFirstKicker] = useState<'home' | 'away' | null>(null);
  const [penaltyScore, setPenaltyScore] = useState({ home: 0, away: 0 });
  const [kicks, setKicks] = useState<PenaltyKick[]>([]);
  const [currentKick, setCurrentKick] = useState(0);
  const [lightState, setLightState] = useState<'none' | 'green' | 'red'>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFirstKickerSelect = (team: 'home' | 'away') => { setFirstKicker(team); setStarted(true); };

  const handleKick = (scored: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const kickingTeam = currentKick % 2 === 0 ? (firstKicker === 'home' ? 'home' : 'away') : (firstKicker === 'home' ? 'away' : 'home');
    setLightState(scored ? 'green' : 'red');
    setTimeout(() => {
      setKicks([...kicks, { team: kickingTeam, scored, kickerId: `kick-${currentKick}` }]);
      if (scored) setPenaltyScore(prev => ({ ...prev, [kickingTeam]: prev[kickingTeam] + 1 }));
      setCurrentKick(prev => prev + 1);
      setLightState('none');
      setIsProcessing(false);
    }, 3000);
  };

  const handleEnd = () => {
    const winner = penaltyScore.home > penaltyScore.away ? 'home' : penaltyScore.away > penaltyScore.home ? 'away' : null;
    onClose(winner);
  };

  const getTeamKicks = (team: 'home' | 'away') => kicks.filter(kick => kick.team === team);

  if (!started || !firstKicker) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-[#581C24] p-4"><h2 className="text-lg font-black text-white uppercase tracking-wider text-center">Calci di Rigore</h2></div>
          <div className="p-6">
            <p className="text-center text-sm font-bold text-gray-600 mb-4 uppercase">Chi inizia i rigori?</p>
            <div className="flex gap-4">
              <button onClick={() => handleFirstKickerSelect('home')} className="flex-1 flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center"><span className="text-[10px] text-gray-500">LOGO</span></div>
                <span className="font-bold text-sm text-[#581C24]">{homeTeam.name}</span>
              </button>
              <button onClick={() => handleFirstKickerSelect('away')} className="flex-1 flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center"><span className="text-[10px] text-gray-500">LOGO</span></div>
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
        <div className="bg-[#581C24] p-4"><h2 className="text-lg font-black text-white uppercase tracking-wider text-center">Calci di Rigore</h2></div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2"><span className="text-[8px] text-gray-500">LOGO</span></div>
              <span className="font-bold text-xs text-[#581C24]">{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-4 px-6">
              <span className="text-4xl font-black text-[#581C24]">{penaltyScore.home}</span>
              <span className="text-2xl text-gray-400">-</span>
              <span className="text-4xl font-black text-[#581C24]">{penaltyScore.away}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2"><span className="text-[8px] text-gray-500">LOGO</span></div>
              <span className="font-bold text-xs text-[#581C24]">{awayTeam.name}</span>
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${lightState === 'green' ? 'bg-green-500 border-green-700 shadow-lg shadow-green-500/50' : lightState === 'red' ? 'bg-red-600 border-red-800 shadow-lg shadow-red-600/50' : 'bg-gray-300 border-gray-400'}`} />
          </div>
          <div className="flex justify-between mb-6 px-4">
            <div className="flex-1 space-y-2">{getTeamKicks('home').map((kick, idx) => (<div key={idx} className="flex items-center justify-center"><div className={`w-3 h-3 rounded-full ${kick.scored ? 'bg-green-500' : 'bg-red-600'}`} /></div>))}</div>
            <div className="flex-1 space-y-2">{getTeamKicks('away').map((kick, idx) => (<div key={idx} className="flex items-center justify-center"><div className={`w-3 h-3 rounded-full ${kick.scored ? 'bg-green-500' : 'bg-red-600'}`} /></div>))}</div>
          </div>
          {isAdmin && (
            <>
              <div className="flex gap-3 mb-4">
                <button onClick={() => handleKick(false)} disabled={isProcessing} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm uppercase">Sbagliato</button>
                <button onClick={() => handleKick(true)} disabled={isProcessing} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm uppercase">Gol</button>
              </div>
              <button onClick={handleEnd} className="w-full bg-gray-600 text-white font-bold py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm uppercase">Fine</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface AdminMatchControlsProps {
  matchStatus: 'PROGRAMMATA' | 'LIVE' | 'SUPP' | 'TERMINATA' | 'RIGORI';
  isFinalPhase: boolean;
  matchId: string;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  currentScore: { home: number; away: number };
  onStatusChange: (status: 'PROGRAMMATA' | 'LIVE' | 'SUPP' | 'TERMINATA' | 'RIGORI') => void;
}

export const AdminMatchControls: React.FC<AdminMatchControlsProps> = ({ matchStatus, isFinalPhase, matchId, homeTeam, awayTeam, currentScore, onStatusChange }) => {
  const [showPenaltyPopup, setShowPenaltyPopup] = useState(false);
  const handleStartMatch = () => { if (confirm('Iniziare la partita?')) onStatusChange('LIVE'); };
  const handleExtraTime = () => { if (confirm('Passare ai tempi supplementari?')) onStatusChange('SUPP'); };
  const handlePenalties = () => { setShowPenaltyPopup(true); };
  const handleEndMatch = () => { if (confirm('Terminare la partita? Verranno calcolate classifica e statistiche.')) { onStatusChange('TERMINATA'); console.log('Partita terminata'); } };
  const handlePenaltyEnd = (winner: 'home' | 'away' | null) => { setShowPenaltyPopup(false); if (winner) console.log(`Vincitore ai rigori: ${winner === 'home' ? homeTeam.name : awayTeam.name}`); onStatusChange('TERMINATA'); };
  const getButtonLabel = () => { if (matchStatus === 'PROGRAMMATA') return 'INIZIA'; if (matchStatus === 'LIVE') return 'TERMINA'; if (matchStatus === 'SUPP') return 'RIGORI'; return ''; };
  const getExtraTimeButtonLabel = () => { if (matchStatus === 'LIVE' && isFinalPhase && currentScore.home === currentScore.away) return 'SUPPLEMENTARI'; return null; };
  const extraTimeLabel = getExtraTimeButtonLabel();

  return (
    <>
      <div className="flex gap-2">
        {matchStatus !== 'TERMINATA' && (
          <>
            <button onClick={matchStatus === 'PROGRAMMATA' ? handleStartMatch : handleEndMatch} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors shadow-lg ${matchStatus === 'PROGRAMMATA' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>{getButtonLabel()}</button>
            {extraTimeLabel && <button onClick={handleExtraTime} className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-orange-700 transition-colors shadow-lg">{extraTimeLabel}</button>}
            {matchStatus === 'SUPP' && <button onClick={handlePenalties} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-purple-700 transition-colors shadow-lg">RIGORI</button>}
          </>
        )}
      </div>
      {showPenaltyPopup && <PenaltyShootoutPopup homeTeam={homeTeam} awayTeam={awayTeam} isAdmin={true} onClose={handlePenaltyEnd} />}
    </>
  );
};

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
    if (!homeTeam || !awayTeam || !matchDate || !matchTime) { setError('⚠️ Compila tutti i campi!'); return; }
    if (homeTeam === awayTeam) { setError('⚠️ Le squadre devono essere diverse!'); return; }
    
    const supabase = createClient();
    const { error } = await supabase.from('matches').insert({
      home_team_id: homeTeam,
      away_team_id: awayTeam,
      match_date: matchDate,
      match_time: matchTime,
      status: 'PROGRAMMATA',
      phase: 'GIRONI'
    });

    if (error) {
      setError('Errore nel salvataggio');
      return;
    }

    alert('✅ Partita creata con successo!');
    setIsOpen(false);
    setHomeTeam(''); setAwayTeam(''); setMatchDate(''); setMatchTime(''); setError('');
    
    // ✅ 2. Aggiungi questa riga alla fine di handleSave
    if (onMatchCreated) onMatchCreated();
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
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md">SALVA</button>
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
      
      const { data: match } = await supabase.from('matches').select('id, home_team_id, away_team_id, home_score, away_score').eq('id', matchId).single();
      if (!match) throw new Error('Partita non trovata');

      const teamId = teamSide === 'home' ? match.home_team_id : match.away_team_id;
      const dbEventType = eventType === 'goal' ? 'GOAL' : eventType === 'yellow' ? 'YELLOW_CARD' : 'RED_CARD';
      
      // 1. INSERT EVENTO
      const { error: eventError } = await supabase.from('match_events').insert({
        match_id: matchId,
        player_id: selectedPlayer,
        event_type: dbEventType,
        minute: parseInt(minute),
        team_id: teamId
      });
      if (eventError) throw eventError;

      const player = players.find(p => p.id === selectedPlayer);
      let shouldSuspend = false;

      // 2. LOGICA SQUALIFICHE
      if (eventType === 'yellow') {
        // Controllo doppio giallo nella STESSA partita
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
            team_id: teamId
          });
        }

        // Controllo 3° giallo accumulato
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

export const AdminSquadreButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [group, setGroup] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const handleSave = () => {
    if (!teamName || !group || !logoFile || !photoFile) { setError('⚠️ Compila tutti i campi e carica le immagini!'); return; }
    const newTeam = { id: Date.now().toString(), name: teamName.toUpperCase(), group: `GIRONE ${group}`, logo: URL.createObjectURL(logoFile), photo: URL.createObjectURL(photoFile) };
    console.log('✅ Nuova squadra creata:', newTeam);
    alert(`✅ Squadra creata con successo!\n\nNome: ${newTeam.name}\nGirone: ${newTeam.group}`);
    setIsOpen(false); resetForm();
  };
  const resetForm = () => { setTeamName(''); setGroup(''); setLogoFile(null); setPhotoFile(null); setError(''); };
  const handleClose = () => { setIsOpen(false); resetForm(); };
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
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
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
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Girone</label><select value={group} onChange={(e) => setGroup(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm font-bold"><option value="">Seleziona Girone...</option><option value="A">GIRONE A</option><option value="B">GIRONE B</option></select></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Logo Squadra</label><input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90 cursor-pointer" />{logoFile && <p className="text-xs text-green-700 mt-1 font-medium">✓ {logoFile.name}</p>}</div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Foto Squadra</label><input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90 cursor-pointer" />{photoFile && <p className="text-xs text-green-700 mt-1 font-medium">✓ {photoFile.name}</p>}</div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">{error}</div>}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase">Annulla</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase">SALVA</button>
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
  firstName: string; 
  lastName: string; 
  number: string; 
  birthDate: string; 
  id?: string; // Aggiungi questo per identificare il giocatore
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
    if (file) setFormData(prev => ({ ...prev, photo: URL.createObjectURL(file) })); 
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

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTemplateUpload({
        id: Date.now().toString(), url: URL.createObjectURL(file), fileName: file.name,
        uploadedAt: new Date().toISOString(), uploadedBy: 'staff'
      });
      setShowTemplateUpload(false);
    }
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

  return (
    <div className="space-y-4">
      {/* 1. DOWNLOAD MODELLO (Visibile a TUTTI se esiste) */}
      {templateDoc && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-[#581C24] uppercase mb-3">Modello da Compilare</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[#581C24]" />
              <span className="text-sm font-medium">{templateDoc.fileName}</span>
            </div>
            <a 
              href={templateDoc.url} 
              download 
              className="px-3 py-1.5 bg-[#581C24] text-white text-xs font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Scarica
            </a>
          </div>
        </div>
      )}

      {/* 2. GESTIONE TEMPLATE (Solo Staff) */}
      {userRole === 'staff' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-[#581C24] uppercase mb-3">Gestione Modello (Solo Staff)</h3>
          {templateDoc ? (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-xs font-medium text-red-700">Il modello è già caricato. Puoi sostituirlo o eliminarlo.</span>
              <button onClick={() => onTemplateUpload({} as any)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowTemplateUpload(true)} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#581C24] hover:text-[#581C24] transition-colors text-sm font-medium">
              + Carica Nuovo Modello
            </button>
          )}
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
          const isLockedForCaptain = isTournamentLocked && userRole === 'captain'; // ✅ Blocco specifico per capitani
          
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
              {/* Upload per chi ha i permessi */}
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

              {/* Storico */}
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
                      {/* Elimina solo se sei staff o se hai caricato tu il file */}
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
            <input type="file" accept=".pdf,.doc,.docx" ref={fileInputRef} onChange={handleTemplateUpload} className="w-full mb-4" />
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

export const AdminDeleteMatchButton: React.FC<AdminDeleteMatchButtonProps> = ({ matchId, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Previene la navigazione al click sulla card
    
    const isConfirmed = window.confirm(
      '⚠️ Sei sicuro di voler eliminare questa partita?\n\nQuesta azione è irreversibile.'
    );
    
    if (!isConfirmed) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      alert('✅ Partita eliminata con successo');
      if (onDeleteSuccess) onDeleteSuccess(); // Notifica la pagina padre di aggiornarsi
      
    } catch (err) {
      console.error('Errore eliminazione partita:', err);
      alert('Errore nell\'eliminazione della partita');
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
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

    useEffect(() => {
      const fetchPlayers = async () => {
        const supabase = createClient();
        
        // ✅ MODIFICA QUI: .order('last_name', { ascending: true })
        const { data } = await supabase
          .from('players')
          .select('id, first_name, last_name, jersey_number, team_id, goals, yellow_cards, red_cards')
          .in('team_id', [homeTeamId, awayTeamId])
          .order('last_name', { ascending: true });
          
        if (data) setPlayers(data);
      };
      fetchPlayers();
    }, [homeTeamId, awayTeamId]);

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
            { home: groupA[0], away: groupB[3], date: '', time: '' },
            { home: groupB[1], away: groupA[2], date: '', time: '' },
            { home: groupA[1], away: groupB[2], date: '', time: '' },
            { home: groupB[0], away: groupA[3], date: '', time: '' },
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

interface AdminSaveAlboDoroProps {
  onSave: (data: AlboDoroData) => void;
  currentYear: number;
}

export const AdminSaveAlboDoro: React.FC<AdminSaveAlboDoroProps> = ({ onSave, currentYear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AlboDoroData>>({ year: currentYear });
  const handleSave = () => {
    if (formData.winner && formData.topScorer && formData.mvp) {
      onSave({
        year: formData.year || currentYear,
        winner: formData.winner,
        runnerUp: formData.runnerUp || '',
        topScorer: formData.topScorer!,
        mvp: formData.mvp!,
        groupStandings: [],
        playoffBracket: []
      });
      setIsOpen(false);
      alert('✅ Albo d\'Oro aggiornato!');
    }
  };
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#581C24] font-black rounded-xl shadow-lg hover:shadow-xl transition-shadow text-sm uppercase tracking-wider">
        Salva nell'Albo d'Oro
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#581C24] p-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase">Salva Albo d'Oro {currentYear}</h2>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Squadra Vincitrice</label><input type="text" value={formData.winner || ''} onChange={(e) => setFormData({ ...formData, winner: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold" placeholder="Nome squadra" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Finalista</label><input type="text" value={formData.runnerUp || ''} onChange={(e) => setFormData({ ...formData, runnerUp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold" placeholder="Nome squadra" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Capocannoniere</label><input type="text" value={formData.topScorer?.name || ''} onChange={(e) => setFormData({ ...formData, topScorer: { ...formData.topScorer!, name: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nome" /></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Gol</label><input type="number" value={formData.topScorer?.goals || ''} onChange={(e) => setFormData({ ...formData, topScorer: { ...formData.topScorer!, goals: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="N." /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">MVP Torneo</label><input type="text" value={formData.mvp?.name || ''} onChange={(e) => setFormData({ ...formData, mvp: { ...formData.mvp!, name: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nome giocatore" /></div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setIsOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-sm">Annulla</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[#581C24] text-white rounded-lg font-bold text-sm">Salva</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};