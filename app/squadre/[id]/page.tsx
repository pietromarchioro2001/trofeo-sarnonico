'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  AdminTeamEditor, 
  AdminTeamPhotoEditor, 
  AdminAddPlayerButton, 
  AdminPlayerEditor,
  type PlayerData 
} from '@/components/AdminButtons';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const { isStaffMode } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  // Fetch dati da Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const teamId = params.id;

      try {
        // 1. Fetch Dati Squadra
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id, name, girone, logo_url, team_photo_url')
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;

        // 2. Fetch Giocatori
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('id, first_name, last_name, jersey_number, birth_date, photo_url, goals, yellow_cards, red_cards, mvp_wins')
          .eq('team_id', teamId)
          .order('jersey_number', { ascending: true, nullsFirst: false });

        if (playersError) throw playersError;

        // 3. Fetch Partite per Calcolo Statistiche (solo partite finite)
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('home_team_id, away_team_id, home_score, away_score')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .eq('status', 'FINITA');

        let stats = { pt: 0, v: 0, p: 0, s: 0, gf: 0, gs: 0, dr: 0 };

        if (matches && !matchesError) {
          matches.forEach((m: any) => {
            const isHome = m.home_team_id === teamId;
            const myScore = isHome ? (m.home_score || 0) : (m.away_score || 0);
            const oppScore = isHome ? (m.away_score || 0) : (m.home_score || 0);

            stats.gf += myScore;
            stats.gs += oppScore;

            if (myScore > oppScore) {
              stats.v += 1;
              stats.pt += 3;
            } else if (myScore === oppScore) {
              stats.p += 1;
              stats.pt += 1;
            } else {
              stats.s += 1;
            }
          });
          stats.dr = stats.gf - stats.gs;
        }

        // Mappa giocatori per corrispondere alla struttura UI
        const mappedPlayers = (players || []).map((p: any) => ({
          id: p.id,
          number: p.jersey_number || '-',
          name: `${p.first_name.toUpperCase()} ${p.last_name.toUpperCase()}`,
          firstName: p.first_name,
          lastName: p.last_name,
          birthDate: p.birth_date || '',
          photo: p.photo_url || '',
          goals: p.goals || 0,
          yellow: p.yellow_cards || 0,
          red: p.red_cards || 0,
          mvp: p.mvp_wins || 0,
        }));

        setTeamData({
          id: team.id,
          name: team.name,
          logo: team.logo_url || '',
          group: team.girone ? `GIRONE ${team.girone}` : 'N/A',
          teamPhoto: team.team_photo_url || '',
          stats: stats,
          players: mappedPlayers,
        });

      } catch (err) {
        console.error('Errore fetch team:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  // Aggiorna dati squadra (Nome, Girone, Logo, Foto)
  const handleTeamUpdate = async (field: 'name' | 'group' | 'logo' | 'teamPhoto', value: string) => {
    const supabase = createClient();
    const updateData: any = {};
    
    if (field === 'name') updateData.name = value;
    if (field === 'group') updateData.girone = value.replace('GIRONE ', '');
    if (field === 'logo') updateData.logo_url = value;
    if (field === 'teamPhoto') updateData.team_photo_url = value;

    const { error } = await supabase.from('teams').update(updateData).eq('id', params.id);

    if (error) {
      console.error('Errore aggiornamento squadra:', error);
      alert('Errore nel salvataggio');
      return;
    }

    setTeamData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Aggiungi Giocatore (Salva su Supabase)
  const handleAddPlayer = async (newPlayer: PlayerData) => {
    const supabase = createClient();
    const playerData = {
      team_id: params.id,
      first_name: newPlayer.firstName.trim(),
      last_name: newPlayer.lastName.trim(),
      jersey_number: newPlayer.number === '-' ? null : newPlayer.number,
      birth_date: newPlayer.birthDate || null,
      photo_url: newPlayer.photo || null,
    };

    const { data, error } = await supabase.from('players').insert(playerData).select().single();

    if (error) {
      console.error('Errore aggiunta giocatore:', error);
      alert('Errore nel salvataggio del giocatore');
      return;
    }

    const mappedPlayer = {
      id: data.id,
      number: data.jersey_number || '-',
      name: `${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}`,
      firstName: data.first_name,
      lastName: data.last_name,
      birthDate: data.birth_date || '',
      photo: data.photo_url || '',
      goals: 0, yellow: 0, red: 0, mvp: 0,
    };

    setTeamData((prev: any) => ({ ...prev, players: [...prev.players, mappedPlayer] }));
  };

  // Modifica Giocatore (Aggiorna su Supabase)
  const handleUpdatePlayer = async (updatedData: PlayerData) => {
    if (!editingPlayer) return;
    const supabase = createClient();
    
    const currentPlayer = teamData.players.find((p: any) => p.firstName === editingPlayer.firstName && p.lastName === editingPlayer.lastName);
    if (!currentPlayer || !currentPlayer.id) return;

    const { error } = await supabase
      .from('players')
      .update({
        first_name: updatedData.firstName.trim(),
        last_name: updatedData.lastName.trim(),
        jersey_number: updatedData.number === '-' ? null : updatedData.number,
        birth_date: updatedData.birthDate || null,
        photo_url: updatedData.photo || currentPlayer.photo,
      })
      .eq('id', currentPlayer.id);

    if (error) {
      console.error('Errore aggiornamento giocatore:', error);
      alert('Errore nell\'aggiornamento del giocatore');
      return;
    }

    setTeamData((prev: any) => ({
      ...prev,
      players: prev.players.map((p: any) => 
        p.id === currentPlayer.id
          ? { 
              ...p, 
              firstName: updatedData.firstName.trim(),
              lastName: updatedData.lastName.trim(),
              number: updatedData.number,
              birthDate: updatedData.birthDate,
              photo: updatedData.photo || p.photo,
              name: `${updatedData.firstName.trim().toUpperCase()} ${updatedData.lastName.trim().toUpperCase()}`
            }
          : p
      )
    }));
    setEditingPlayer(null);
    setIsPlayerEditorOpen(false);
  };

  const handleDeletePlayer = async () => {
        if (!editingPlayer) return;
        
        // ⚠️ CONFERMA DI SICUREZZA
        const isConfirmed = window.confirm(
          `⚠️ Eliminare definitivamente ${editingPlayer.firstName} ${editingPlayer.lastName}?\n\nQuesta azione è irreversibile.`
        );
        
        if (!isConfirmed) return;

        try {
          const supabase = createClient();
          
          // Trova il giocatore nel database per ottenere l'ID
          const currentPlayer = teamData.players.find((p: any) => 
            p.firstName === editingPlayer.firstName && p.lastName === editingPlayer.lastName
          );
          
          if (!currentPlayer || !currentPlayer.id) {
            alert('Giocatore non trovato');
            return;
          }

          // Elimina dal database
          const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', currentPlayer.id);

          if (error) {
            console.error('Errore eliminazione:', error);
            alert('Errore nell\'eliminazione del giocatore');
            return;
          }

          // Aggiorna lo stato locale rimuovendo il giocatore
          setTeamData((prev: any) => ({
            ...prev,
            players: prev.players.filter((p: any) => p.id !== currentPlayer.id)
          }));

          alert('✅ Giocatore eliminato con successo');
          setIsPlayerEditorOpen(false);
          setEditingPlayer(null);
          
        } catch (err) {
          console.error('Errore:', err);
          alert('Errore nell\'eliminazione');
        }
      };

  const handlePlayerClick = (player: any) => {
    if (isStaffMode || isMyTeam) {
      setEditingPlayer({ 
        photo: player.photo, 
        firstName: player.firstName, 
        lastName: player.lastName, 
        number: player.number, 
        birthDate: player.birthDate 
      });
      setIsPlayerEditorOpen(true);
    } else {
      setSelectedPlayer(player);
    }
  };

  const isMyTeam = isCaptain && captainTeamId === params.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento squadra...</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <p className="text-[#581C24] font-bold uppercase">Squadra non trovata</p>
      </div>
    );
  }

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

      {/* AREA CAPITANO - Visibile SOLO se il capitano è nella sua squadra */}
      {isMyTeam && (
        <div className="px-4 mb-6">
          <div className="bg-[#FFD700]/10 border-2 border-[#FFD700] rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-[#581C24] uppercase mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Pannello Capitano - {teamData.name}
            </p>
            <p className="text-xs text-gray-600">Funzionalità capitano attive per questa squadra.</p>
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
            <p className="text-base font-bold text-gray-700">{teamData.stats.dr > 0 ? `+${teamData.stats.dr}` : teamData.stats.dr}</p>
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
            {teamData.players.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-500 text-sm">Nessun giocatore registrato</div>
            ) : (
              teamData.players.map((player: any) => (
                <div key={player.id} onClick={() => handlePlayerClick(player)} className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
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
              ))
            )}
          </div>
        </div>
      </div>

      // Poi nel JSX, trova dove usi AdminPlayerEditor e modificalo così:
      <AdminPlayerEditor 
        player={editingPlayer} 
        isOpen={isPlayerEditorOpen} 
        onClose={() => { setIsPlayerEditorOpen(false); setEditingPlayer(null); }} 
        onSave={handleUpdatePlayer}
        onDelete={handleDeletePlayer} // NUOVO: passa la funzione di eliminazione
      />

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
                <div className="flex-shrink-0">
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