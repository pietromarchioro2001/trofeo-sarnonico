'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Vote, X } from 'lucide-react';
import { AdminMVPSelector, AdminStopVoting, AdminAddEvent } from '@/components/AdminButtons';
import { useAuth } from '@/lib/AuthContext';

const MATCH_DATA = {
  id: '1',
  homeTeam: { name: 'SARNONICO', logo: '/logos/sarnonico.png' },
  awayTeam: { name: 'RALO', logo: '/logos/ralo.png' },
  score: { home: 2, away: 1 },
  group: 'GIRONE A',
  round: '2° GIORNATA',
  date: 'Mer 29 Giu',
  time: '19:30',
  isLive: true,
  isScheduled: false,
};

const INITIAL_MVP_PLAYERS = [
  { id: 1, name: 'Ialetonas', team: 'Sarnonico', photo: '/players/ialetonas.jpg', votes: 0 },
  { id: 2, name: 'Zeraere', team: 'Ralo', photo: '/players/zeraere.jpg', votes: 0 },
  { id: 3, name: 'Mats Menie', team: 'Sarnonico', photo: '/players/mats.jpg', votes: 0 },
];

const MATCH_EVENTS = [
  { minute: 14, team: 'home', type: 'yellow', player: 'M. Rossi', shortName: 'M. Rossi' },
  { minute: 27, team: 'home', type: 'goal', player: 'L. Zucal', shortName: 'L. Zucal' },
  { minute: 27, team: 'away', type: 'goal', player: 'Balnoi', shortName: 'Balnoi' },
  { minute: 32, team: 'away', type: 'yellow', player: 'A. Endrizzi', shortName: 'A. Endrizzi' },
  { minute: 45, team: 'home', type: 'goal', player: 'M. Rossi', shortName: 'M. Rossi' },
  { minute: 60, team: 'away', type: 'red', player: 'Tizio', shortName: 'Tizio' },
];

const HOME_PLAYERS = [
  { id: 1, name: 'Marco Rossi', firstName: 'Marco', lastName: 'Rossi', shortName: 'M. Rossi', number: 10, photo: '/players/rossi.jpg', birthDate: '15/05/1995', goals: 2, yellow: 1, red: 0, mvp: 1, events: ['goal', 'goal'] },
  { id: 2, name: 'Luca Zucal', firstName: 'Luca', lastName: 'Zucal', shortName: 'L. Zucal', number: 9, photo: '/players/zucal.jpg', birthDate: '22/08/1998', goals: 1, yellow: 0, red: 0, mvp: 0, events: ['goal'] },
  { id: 3, name: 'Andrea Endrizzi', firstName: 'Andrea', lastName: 'Endrizzi', shortName: 'A. Endrizzi', number: 7, photo: '/players/endrizzi.jpg', birthDate: '10/03/1996', goals: 0, yellow: 1, red: 0, mvp: 0, events: ['yellow'] },
  { id: 4, name: 'Giovanni Bianchi', firstName: 'Giovanni', lastName: 'Bianchi', shortName: 'G. Bianchi', number: 1, photo: '/players/bianchi.jpg', birthDate: '05/12/1990', goals: 0, yellow: 0, red: 0, mvp: 0, events: [] },
  { id: 5, name: 'Paolo Verdi', firstName: 'Paolo', lastName: 'Verdi', shortName: 'P. Verdi', number: 4, photo: '/players/verdi.jpg', birthDate: '18/07/1997', goals: 0, yellow: 1, red: 0, mvp: 0, events: ['yellow'] },
];

const AWAY_PLAYERS = [
  { id: 1, name: 'Balnoi', firstName: 'Marco', lastName: 'Balnoi', shortName: 'Balnoi', number: 10, photo: '/players/balnoi.jpg', birthDate: '14/06/1995', goals: 1, yellow: 0, red: 0, mvp: 0, events: ['goal'] },
  { id: 2, name: 'Tizio', firstName: 'Luigi', lastName: 'Tizio', shortName: 'Tizio', number: 5, photo: '/players/tizio.jpg', birthDate: '30/01/1993', goals: 0, yellow: 0, red: 1, mvp: 0, events: ['red'] },
  { id: 3, name: 'Caio', firstName: 'Caio', lastName: 'Sempronio', shortName: 'Caio', number: 8, photo: '/players/caio.jpg', birthDate: '25/11/1996', goals: 0, yellow: 1, red: 0, mvp: 0, events: ['yellow'] },
  { id: 4, name: 'Sempronio', firstName: 'Sempronio', lastName: 'Caio', shortName: 'Sempronio', number: 1, photo: '/players/sempronio.jpg', birthDate: '08/09/1991', goals: 0, yellow: 0, red: 0, mvp: 0, events: [] },
];

const EventIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  if (type === 'goal') {
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
  if (type === 'yellow') {
    return <div className="bg-yellow-400 rounded-sm border border-yellow-600" style={{ width: size * 0.75, height: size }} />;
  }
  if (type === 'red') {
    return <div className="bg-red-600 rounded-sm border border-red-800" style={{ width: size * 0.75, height: size }} />;
  }
  return null;
};

// ==================== POPUP RIGORI ====================
interface PenaltyKick {
  team: 'home' | 'away';
  scored: boolean;
}

interface PenaltyShootoutPopupProps {
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  isAdmin: boolean;
  onClose: (winner: 'home' | 'away' | null) => void;
}

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
      const newKick: PenaltyKick = { team: kickingTeam, scored };
      setKicks(prev => [...prev, newKick]);
      
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

  const getTeamKicks = (team: 'home' | 'away') => kicks.filter(kick => kick.team === team);

  if (!started || !firstKicker) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-[#581C24] p-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Calci di Rigore</h2>
            {isAdmin && (
              <button onClick={() => onClose(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
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
            <button onClick={() => onClose(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
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

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const { isStaffMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'diretta' | 'giocatori' | 'media'>('diretta');
  const [mvpPlayers, setMvpPlayers] = useState(INITIAL_MVP_PLAYERS);
  const [votedPlayerId, setVotedPlayerId] = useState<number | null>(null);
  const [isVotingClosed, setIsVotingClosed] = useState(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  
  const [matchStatus, setMatchStatus] = useState<'PROGRAMMATA' | 'LIVE' | 'SUPP' | 'TERMINATA' | 'RIGORI'>(
    MATCH_DATA.isScheduled ? 'PROGRAMMATA' : MATCH_DATA.isLive ? 'LIVE' : 'TERMINATA'
  );
  const [showPenaltyPopup, setShowPenaltyPopup] = useState(false);
  const [penaltyWinner, setPenaltyWinner] = useState<'home' | 'away' | null>(null);
  const [finalScore, setFinalScore] = useState(MATCH_DATA.score);

  const handleVote = (playerId: number) => {
    if (!isVotingClosed && !votedPlayerId) {
      setVotedPlayerId(playerId);
      setMvpPlayers(prev => prev.map(p => p.id === playerId ? { ...p, votes: p.votes + 1 } : p));
    }
  };

  const handleEndVoting = () => {
    setIsVotingClosed(true);
    const winner = mvpPlayers.reduce((prev, current) => (prev.votes > current.votes) ? prev : current);
    setWinnerId(winner.id);
  };

  const handleShare = () => alert('Funzione Condividi: da implementare');
  const handleMedia = () => setActiveTab('media');

  const handleStartMatch = () => {
    if (confirm('Iniziare la partita?')) setMatchStatus('LIVE');
  };

  const handleEndMatch = () => {
    if (confirm('Terminare la partita? Verranno calcolate classifica e statistiche.')) {
      setMatchStatus('TERMINATA');
      console.log('Partita terminata - Calcolo classifica e statistiche...');
    }
  };

  const handleExtraTime = () => {
    if (confirm('Passare ai tempi supplementari?')) setMatchStatus('SUPP');
  };

  const handlePenalties = () => setShowPenaltyPopup(true);

  const handlePenaltyEnd = (winner: 'home' | 'away' | null) => {
    setPenaltyWinner(winner);
    setShowPenaltyPopup(false);
    if (winner) {
      console.log(`Vincitore ai rigori: ${winner === 'home' ? MATCH_DATA.homeTeam.name : MATCH_DATA.awayTeam.name}`);
    }
    setMatchStatus('TERMINATA');
  };

  const getStatusLabel = () => {
    switch (matchStatus) {
      case 'PROGRAMMATA': return 'PROGRAMMATA';
      case 'LIVE': return 'LIVE';
      case 'SUPP': return 'SUPP';
      case 'RIGORI': return 'RIGORI';
      case 'TERMINATA': return 'TERMINATA';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (matchStatus) {
      case 'LIVE': return 'text-red-400';
      case 'SUPP': return 'text-orange-400';
      case 'RIGORI': return 'text-purple-400';
      case 'PROGRAMMATA': return 'text-blue-500';
      case 'TERMINATA': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const isFinalPhase = true;
  const isTied = finalScore.home === finalScore.away;
  const isLiveStatus = matchStatus === 'LIVE' || matchStatus === 'SUPP' || matchStatus === 'RIGORI';

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image src="/header-match.jpg" alt="Campo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        
        <Link href="/partite" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>

        {/* PULSANTI ADMIN CONTROLLO PARTITA - ALZATI */}
        {isStaffMode && matchStatus !== 'TERMINATA' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {matchStatus === 'PROGRAMMATA' && (
              <button
                onClick={handleStartMatch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-green-700 transition-colors shadow-lg"
              >
                INIZIA
              </button>
            )}
            
            {matchStatus === 'LIVE' && (
              <>
                <button
                  onClick={handleEndMatch}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-red-700 transition-colors shadow-lg"
                >
                  TERMINA
                </button>
                {isFinalPhase && (
                  <button
                    onClick={handleExtraTime}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-orange-700 transition-colors shadow-lg"
                  >
                    SUPPLEMENTARI
                  </button>
                )}
              </>
            )}
            
            {matchStatus === 'SUPP' && (
              <button
                onClick={handlePenalties}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-purple-700 transition-colors shadow-lg"
              >
                RIGORI
              </button>
            )}
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button onClick={handleMedia} className="bg-white text-[#581C24] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={handleShare} className="bg-white text-[#581C24] p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* CARD RISULTATO */}
      <div className="relative z-10 -mt-16 px-4 mb-4">
        <div className={`rounded-xl shadow-xl ${isLiveStatus ? 'bg-[#581C24]' : 'bg-[#E8E8E8]'}`}>
          <div className="h-4" />
          <div className="grid grid-cols-3 items-center px-4 pb-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${isLiveStatus ? 'bg-white/10' : 'bg-gray-300'}`}>
                <span className={`text-[10px] ${isLiveStatus ? 'text-white/70' : 'text-gray-500'}`}>LOGO</span>
              </div>
              <span className={`font-bold text-xs sm:text-sm text-center truncate w-full ${isLiveStatus ? 'text-white' : 'text-[#581C24]'}`}>
                {MATCH_DATA.homeTeam.name}
              </span>
            </div>

            <div className="text-center">
              <div className={`text-4xl font-black tracking-wider font-oswald ${isLiveStatus ? 'text-white animate-pulse' : 'text-[#581C24]'}`}>
                {finalScore.home} - {finalScore.away}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${getStatusColor()}`}>
                {getStatusLabel()}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${isLiveStatus ? 'bg-white/10' : 'bg-gray-300'}`}>
                <span className={`text-[10px] ${isLiveStatus ? 'text-white/70' : 'text-gray-500'}`}>LOGO</span>
              </div>
              <span className={`font-bold text-xs sm:text-sm text-center truncate w-full ${isLiveStatus ? 'text-white' : 'text-[#581C24]'}`}>
                {MATCH_DATA.awayTeam.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-full p-1 shadow-sm flex">
          <button
            onClick={() => setActiveTab('diretta')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'diretta' ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-50'}`}
          >
            Diretta
          </button>
          <button
            onClick={() => setActiveTab('giocatori')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'giocatori' ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-50'}`}
          >
            Giocatori
          </button>
        </div>
      </div>

      {/* CONTENUTO */}
      <div className="px-4">
        {activeTab === 'diretta' ? (
          <>
            {/* MVP */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {isStaffMode && <AdminMVPSelector onSave={(ids) => console.log('MVP:', ids)} />}
                <h2 className="text-[#581C24] font-bold text-base uppercase tracking-wider text-center flex-1">MVP della Partita</h2>
                {isStaffMode && <AdminStopVoting onStop={() => console.log('Stop')} />}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {mvpPlayers.map((player) => {
                  const hasWon = winnerId === player.id;
                  const hasVoted = votedPlayerId === player.id;

                  return (
                    <div key={player.id} className={`rounded-xl p-3 flex flex-col items-center gap-2 relative transition-all ${
                      hasWon ? 'bg-gradient-to-b from-[#FFD700]/30 to-[#FFD700]/10 border-2 border-[#FFD700] shadow-lg scale-105'
                      : hasVoted ? 'bg-[#581C24] text-white border-2 border-[#581C24] shadow-lg'
                      : 'bg-white border border-gray-100 shadow-sm'
                    }`}>
                      {hasWon && (
                        <span className="absolute -top-2.5 bg-[#FFD700] text-[#581C24] text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm border border-[#C9B037]">VINCITORE</span>
                      )}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${hasVoted ? 'bg-white/20' : 'bg-gray-200'}`}>
                        <span className={`text-[10px] ${hasVoted ? 'text-white/70' : 'text-gray-400'}`}>FOTO</span>
                      </div>
                      <div className="text-center w-full">
                        <p className={`font-bold text-xs truncate w-full ${hasVoted ? 'text-white' : 'text-[#581C24]'}`}>{player.name}</p>
                        <p className={`text-[9px] truncate w-full ${hasVoted ? 'text-white/80' : 'text-gray-500'}`}>{player.team}</p>
                        <p className={`text-[10px] font-black mt-1 ${hasVoted ? 'text-white' : 'text-[#581C24]'}`}>{player.votes} {player.votes === 1 ? 'voto' : 'voti'}</p>
                      </div>
                      <button onClick={() => handleVote(player.id)} disabled={isVotingClosed || hasVoted} className={`w-full text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${
                        hasVoted ? 'bg-white text-[#581C24] cursor-default' 
                        : isVotingClosed ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#581C24] text-white hover:bg-[#581C24]/90'
                      }`}>
                        {hasVoted ? <>✓ VOTATO</> : <><Vote size={10} /> VOTA</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRONACA */}
            <div>
              <div className="flex items-center justify-between mb-4">
                {isStaffMode && <AdminAddEvent teamSide="home" onAddEvent={(e) => console.log(e)} />}
                <h2 className="text-[#581C24] font-bold text-base uppercase tracking-wider text-center flex-1">Cronaca</h2>
                {isStaffMode && <AdminAddEvent teamSide="away" onAddEvent={(e) => console.log(e)} />}
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="space-y-4">
                  {[...MATCH_EVENTS].sort((a, b) => a.minute - b.minute).map((event, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {event.team === 'home' ? (
                        <>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <EventIcon type={event.type} size={16} />
                            <span className="font-bold text-[#581C24] text-xs w-8 text-right">{event.minute}'</span>
                            <span className="font-medium text-xs truncate">{event.shortName}</span>
                          </div>
                          <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
                          <div className="flex-1" />
                        </>
                      ) : (
                        <>
                          <div className="flex-1" />
                          <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
                          <div className="flex items-center gap-2 flex-1 justify-start">
                            <span className="font-medium text-xs truncate">{event.shortName}</span>
                            <span className="font-bold text-[#581C24] text-xs w-8">{event.minute}'</span>
                            <EventIcon type={event.type} size={16} />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-[#581C24] font-bold text-sm uppercase tracking-wider mb-3 text-center border-b border-gray-200 pb-2">{MATCH_DATA.homeTeam.name}</h3>
                <div className="space-y-2">
                  {HOME_PLAYERS.map((player) => (
                    <div key={player.id} onClick={() => setSelectedPlayer(player)} className="flex items-center gap-2 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                      <span className="font-bold text-xs text-gray-400 w-6 group-hover:text-[#581C24] transition-colors">{player.number}</span>
                      <span className="font-medium text-xs flex-1 truncate group-hover:text-[#581C24] transition-colors">{player.shortName}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {player.events.filter(e => e === 'goal').length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <EventIcon type="goal" size={14} />
                            {player.events.filter(e => e === 'goal').length > 1 && <span className="text-[9px] font-bold text-[#581C24]">x{player.events.filter(e => e === 'goal').length}</span>}
                          </div>
                        )}
                        {player.events.filter(e => e !== 'goal').map((event, i) => <EventIcon key={i} type={event} size={14} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-gray-300 self-stretch" />
              <div className="flex-1">
                <h3 className="text-[#581C24] font-bold text-sm uppercase tracking-wider mb-3 text-center border-b border-gray-200 pb-2">{MATCH_DATA.awayTeam.name}</h3>
                <div className="space-y-2">
                  {AWAY_PLAYERS.map((player) => (
                    <div key={player.id} onClick={() => setSelectedPlayer(player)} className="flex items-center gap-2 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                      <span className="font-bold text-xs text-gray-400 w-6 group-hover:text-[#581C24] transition-colors">{player.number}</span>
                      <span className="font-medium text-xs flex-1 truncate group-hover:text-[#581C24] transition-colors">{player.shortName}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {player.events.filter(e => e === 'goal').length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <EventIcon type="goal" size={14} />
                            {player.events.filter(e => e === 'goal').length > 1 && <span className="text-[9px] font-bold text-[#581C24]">x{player.events.filter(e => e === 'goal').length}</span>}
                          </div>
                        )}
                        {player.events.filter(e => e !== 'goal').map((event, i) => <EventIcon key={i} type={event} size={14} />)}
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
            <button onClick={() => setSelectedPlayer(null)} className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
              <X size={18} className="text-gray-600" />
            </button>
            <div className="bg-gradient-to-b from-[#581C24] to-[#581C24]/80 p-6 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                  <span className="text-[10px] text-gray-400">FOTO</span>
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-0.5">Nome</p>
                  <h3 className="text-2xl font-black text-white uppercase leading-tight">{selectedPlayer.firstName}</h3>
                  <p className="text-xl font-bold text-white/90 uppercase">{selectedPlayer.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="w-20 flex-shrink-0">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-3xl font-black text-[#581C24] text-center">{selectedPlayer.number}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-0.5">Data di nascita</p>
                  <p className="text-white font-bold text-sm">{selectedPlayer.birthDate}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#1a1a1a"/><circle cx="12" cy="12" r="3" fill="white"/>
                    <path d="M12 2 L13 7 L12 12 L11 7 Z" fill="white"/><path d="M22 12 L17 13 L12 12 L17 11 Z" fill="white"/>
                    <path d="M12 22 L11 17 L12 12 L13 17 Z" fill="white"/><path d="M2 12 L7 11 L12 12 L7 13 Z" fill="white"/>
                  </svg>
                </div>
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">GOL</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.goals}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#581C24]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">MVP</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.mvp}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-8 bg-yellow-400 rounded-sm flex-shrink-0 border border-yellow-600" />
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">AMMONIZIONI</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.yellow}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-8 bg-red-600 rounded-sm flex-shrink-0 border border-red-800" />
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">ESPULSIONI</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.red}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RIGORI - ADMIN */}
      {isStaffMode && showPenaltyPopup && (
        <PenaltyShootoutPopup homeTeam={MATCH_DATA.homeTeam} awayTeam={MATCH_DATA.awayTeam} isAdmin={true} onClose={handlePenaltyEnd} />
      )}

      {/* POPUP RIGORI - USER */}
      {!isStaffMode && matchStatus === 'RIGORI' && (
        <PenaltyShootoutPopup homeTeam={MATCH_DATA.homeTeam} awayTeam={MATCH_DATA.awayTeam} isAdmin={false} onClose={() => {}} />
      )}
    </div>
  );
}