'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  AdminTeamEditor, 
  AdminTeamPhotoEditor, 
  AdminAddPlayerButton, 
  AdminPlayerEditor,
  type PlayerData 
} from '@/components/AdminButtons';

// Dati mock squadra (Modificato per testare SARNONICO con ID 12, abbinato al codice 1234)
const INITIAL_TEAM_DATA = {
  id: '12', 
  name: 'SARNONICO', 
  logo: '', 
  group: 'GIRONE A',
  teamPhoto: '', 
  stats: {
    pt: 45,
    v: 14,
    p: 3,
    s: 5,
    gf: 48,
    gs: 24,
    dr: 24,
  },
  players: [
    { 
      number: '10', 
      name: 'LORENZO PANCHERI', 
      firstName: 'Lorenzo',
      lastName: 'Pancheri',
      birthDate: '1995-05-12',
      photo: '', 
      goals: 12, 
      assists: 1, 
      yellow: 4, 
      red: 1, 
      mvp: 3 
    },
    { 
      number: '-', 
      name: 'SIMONE PANCHERI', 
      firstName: 'Simone',
      lastName: 'Pancheri',
      birthDate: '1990-01-01',
      photo: '', 
      goals: 0, 
      assists: 0, 
      yellow: 0, 
      red: 0, 
      mvp: 0 
    },
  ],
};

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const { isStaffMode } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<typeof INITIAL_TEAM_DATA.players[0] | null>(null);
  const [teamData, setTeamData] = useState(INITIAL_TEAM_DATA);
  
  // Stati per l'editor giocatori
  const [isPlayerEditorOpen, setIsPlayerEditorOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null);

  // Stati per verificare se l'utente è il capitano di QUESTA squadra
  const [isCaptain, setIsCaptain] = useState(false);
  const [captainTeamId, setCaptainTeamId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const captainStatus = localStorage.getItem('isCaptain') === 'true';
      const teamId = localStorage.getItem('captainTeamId') || '';
      setIsCaptain(captainStatus);
      setCaptainTeamId(teamId);
    }
  }, []);

  const handleTeamUpdate = (field: 'name' | 'group' | 'logo' | 'teamPhoto', value: string) => {
    setTeamData(prev => ({ ...prev, [field]: value }));
    console.log(`✅ Aggiornato ${field}:`, value);
  };

  const handleAddPlayer = (newPlayer: PlayerData) => {
    const playerWithStats = {
      ...newPlayer,
      name: `${newPlayer.firstName.toUpperCase()} ${newPlayer.lastName.toUpperCase()}`,
      photo: newPlayer.photo || '',
      goals: 0, assists: 0, yellow: 0, red: 0, mvp: 0,
    };
    setTeamData(prev => ({ ...prev, players: [...prev.players, playerWithStats] }));
    console.log('✅ Giocatore aggiunto:', newPlayer);
  };

  const handleUpdatePlayer = (updatedData: PlayerData) => {
    if (editingPlayer) {
      setTeamData(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.firstName === editingPlayer.firstName && p.lastName === editingPlayer.lastName
            ? { ...p, ...updatedData, name: `${updatedData.firstName.toUpperCase()} ${updatedData.lastName.toUpperCase()}`, photo: updatedData.photo || p.photo }
            : p
        )
      }));
      console.log('✅ Giocatore aggiornato:', updatedData);
    }
    setEditingPlayer(null);
    setIsPlayerEditorOpen(false);
  };

  const handlePlayerClick = (player: typeof INITIAL_TEAM_DATA.players[0]) => {
    if (isStaffMode || isMyTeam) {
      setEditingPlayer({ photo: player.photo, firstName: player.firstName, lastName: player.lastName, number: player.number, birthDate: player.birthDate });
      setIsPlayerEditorOpen(true);
    } else {
      setSelectedPlayer(player);
    }
  };

  // Verifica se il capitano sta guardando la SUA squadra
  const isMyTeam = isCaptain && captainTeamId === params.id;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* HEADER CON IMMAGINE CAMPO */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-team.jpg" alt="Campo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <Link href="/squadre" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>
      </div>

      {/* CARD NOME SQUADRA E GIRONE */}
      <div className="relative z-10 -mt-12 px-4 mb-4">
        {isStaffMode ? (
          <AdminTeamEditor name={teamData.name} group={teamData.group} logo={teamData.logo} onUpdate={handleTeamUpdate} />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
              {teamData.logo ? (
                <Image src={teamData.logo} alt="Logo" fill className="object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; const p = e.currentTarget.nextElementSibling; if (p) (p as HTMLElement).style.display = 'flex'; }} />
              ) : null}
              <span className="text-[10px] text-gray-400">LOGO</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#581C24] uppercase tracking-wider">{teamData.name}</h1>
              <p className="text-sm font-bold text-gray-600 uppercase block mt-0.5">{teamData.group}</p>
            </div>
          </div>
        )}
      </div>

      {/* FOTO SQUADRA */}
      <div className="px-4 mb-6">
        {isStaffMode ? (
          <AdminTeamPhotoEditor teamPhoto={teamData.teamPhoto} onUpdate={(url) => handleTeamUpdate('teamPhoto', url)} />
        ) : (
          <div className="rounded-xl overflow-hidden shadow-md bg-gray-300 relative h-40">
            {teamData.teamPhoto ? (
              <Image src={teamData.teamPhoto} alt="Foto Squadra" fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; const p = e.currentTarget.nextElementSibling; if (p) (p as HTMLElement).style.display = 'flex'; }} />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">FOTO SQUADRA</span>
            </div>
          </div>
        )}
      </div>

      {/* AREA CAPITANO (TEST) - Visibile SOLO se il capitano è nella sua squadra */}
      {isMyTeam && (
        <div className="px-4 mb-6">
          <div className="bg-[#FFD700]/10 border-2 border-[#FFD700] rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-[#581C24] uppercase mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Pannello Capitano - {teamData.name}
            </p>
            <CaptainTestButton teamId={params.id} teamName={teamData.name} />
          </div>
        </div>
      )}

      {/* STATISTICHE SQUADRA */}
      <div className="px-4 mb-6">
        <div className="flex items-end">
          <div className="w-8" />
          <div className="flex flex-col items-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">PT</p>
            <p className="text-[2.5rem] font-black text-[#581C24] leading-none">{teamData.stats.pt}</p>
          </div>
          <div className="w-12" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">V</p>
            <p className="text-base font-bold text-gray-700">{teamData.stats.v}</p>
          </div>
          <div className="w-1" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">P</p>
            <p className="text-base font-bold text-gray-700">{teamData.stats.p}</p>
          </div>
          <div className="w-1" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">S</p>
            <p className="text-base font-bold text-gray-700">{teamData.stats.s}</p>
          </div>
          <div className="w-16" />
        </div>
        <div className="flex items-end mt-1">
          <div className="w-10" />
          <div className="w-[2.5rem]" />
          <div className="w-12" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">GF</p>
            <p className="text-base font-bold text-gray-700">{teamData.stats.gf}</p>
          </div>
          <div className="w-1" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">GS</p>
            <p className="text-base font-bold text-gray-700">{teamData.stats.gs}</p>
          </div>
          <div className="w-1" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">DR</p>
            <p className="text-base font-bold text-gray-700">+{teamData.stats.dr}</p>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* GIOCATORI */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mt-10 mb-3">
          <h2 className="text-[20px] font-black text-[#581C24] uppercase tracking-wider">GIOCATORI</h2>
          {(isStaffMode || isMyTeam) && <AdminAddPlayerButton onAdd={handleAddPlayer} />}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[9px] font-bold text-gray-600 uppercase">
            <div className="w-8 text-center flex-shrink-0">FOTO</div>
            <div className="w-6 text-center flex-shrink-0">N.</div>
            <div className="flex-1 pl-2">NOME</div>
            <div className="w-8 text-center flex-shrink-0">GOL</div>
            <div className="w-6 text-center flex-shrink-0">AMM</div>
            <div className="w-6 text-center flex-shrink-0">ESP</div>
            <div className="w-6 text-center flex-shrink-0">MVP</div>
          </div>

          <div className="divide-y divide-gray-100">
            {teamData.players.map((player, index) => (
              <div key={index} onClick={() => handlePlayerClick(player)} className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-8 flex justify-center flex-shrink-0 relative">
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {player.photo ? (
                      <Image src={player.photo} alt={player.name} fill className="object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; const p = e.currentTarget.nextElementSibling; if (p) (p as HTMLElement).style.display = 'flex'; }} />
                    ) : null}
                    <span className="text-[6px] text-gray-400">FOTO</span>
                  </div>
                </div>
                <div className="w-6 text-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">{player.number}</span>
                </div>
                <div className="flex-1 pl-2">
                  <span className="font-bold text-[11px] text-[#581C24] uppercase truncate block">{player.name}</span>
                </div>
                <div className="w-6 text-center flex-shrink-0"><span className="text-xs font-bold text-gray-800">{player.goals}</span></div>
                <div className="w-6 text-center flex-shrink-0"><span className="text-xs font-bold text-gray-800">{player.yellow}</span></div>
                <div className="w-7 text-center flex-shrink-0"><span className="text-xs font-bold text-gray-800">{player.red}</span></div>
                <div className="w-6 text-center flex-shrink-0"><span className="text-xs font-bold text-gray-800">{player.mvp}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP EDITOR GIOCATORE (SOLO ADMIN) */}
      <AdminPlayerEditor player={editingPlayer} isOpen={isPlayerEditorOpen} onClose={() => { setIsPlayerEditorOpen(false); setEditingPlayer(null); }} onSave={handleUpdatePlayer} />

      {/* POPUP DETTAGLI GIOCATORE (SOLO UTENTE NORMALE) */}
      {selectedPlayer && !isStaffMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPlayer(null)} className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
              <X size={18} className="text-gray-600" />
            </button>
            <div className="bg-gradient-to-b from-[#581C24] to-[#581C24]/80 p-6 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden relative">
                  {selectedPlayer.photo ? (
                    <Image src={selectedPlayer.photo} alt={selectedPlayer.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; const p = e.currentTarget.nextElementSibling; if (p) (p as HTMLElement).style.display = 'flex'; }} />
                  ) : null}
                  <span className="text-[10px] text-gray-400">FOTO</span>
                </div>
                <div className="flex-1">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-0.5">Nome</p>
                  <h3 className="text-2xl font-black text-white uppercase leading-tight">{selectedPlayer.firstName}</h3>
                  <p className="text-xl font-bold text-white/90 uppercase">{selectedPlayer.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-10 mt-4">
                <div className="w-15 flex-shrink-0">
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
                  <svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a1a1a"/><circle cx="12" cy="12" r="3" fill="white"/><path d="M12 2 L13 7 L12 12 L11 7 Z" fill="white"/><path d="M22 12 L17 13 L12 12 L17 11 Z" fill="white"/><path d="M12 22 L11 17 L12 12 L13 17 Z" fill="white"/><path d="M2 12 L7 11 L12 12 L7 13 Z" fill="white"/></svg>
                </div>
                <div className="flex-1"><p className="text-[#581C24] font-bold uppercase text-sm">GOL</p></div>
                <p className="text-2xl font-black text-[#581C24]">{selectedPlayer.goals}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#581C24]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
    </div>
  );
}