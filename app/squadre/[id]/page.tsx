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
  const [loading, setLoading] = useState(false);
  
  const [isPlayerEditorOpen, setIsPlayerEditorOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const teamId = params.id;

      try {
        // 1. Dati squadra
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id, name, girone, logo_url, team_photo_url')
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;

        // 2. Dati giocatori
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('id, first_name, last_name, jersey_number, birth_date, photo_url, goals, yellow_cards, red_cards, mvp_wins')
          .eq('team_id', teamId)
          .order('jersey_number', { ascending: true, nullsFirst: false });

        if (playersError) throw playersError;

        // 3. Statistiche partite
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

        // 4. ✅ CONTROLLO BLOCCO TORNEO (Spostato DENTRO la funzione async)
        const { count: finalPhaseCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .in('phase', ['QUARTI', 'SEMIFINALI', 'FINALE', 'FINALE_3_4']);

        const isTournamentLocked = (finalPhaseCount || 0) > 0;

        // 5. Mappa giocatori
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

        // 6. Salva dati
        setTeamData({
          id: team.id,
          name: team.name,
          logo: team.logo_url || '',
          group: team.girone ? `GIRONE ${team.girone}` : 'N/A',
          teamPhoto: team.team_photo_url || '',
          stats: stats,
          players: mappedPlayers,
          isTournamentLocked: isTournamentLocked, // <-- Ora funziona correttamente
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

  // Aggiorna dati testo (Nome, Girone)
  const handleTeamUpdate = async (field: 'name' | 'group', value: string) => {
    const supabase = createClient();
    const updateData: any = {};
    
    if (field === 'name') updateData.name = value;
    if (field === 'group') updateData.girone = value.replace('GIRONE ', '');

    const { error } = await supabase.from('teams').update(updateData).eq('id', params.id);

    if (error) {
      console.error('Errore aggiornamento squadra:', error);
      alert('Errore nel salvataggio');
      return;
    }

    setTeamData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file || !teamData) return;
    setLoading(true);
    const supabase = createClient();
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_logo_${teamData.name.replace(/\s/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('tournament-files').upload(`team-logos/${fileName}`, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('tournament-files').getPublicUrl(`team-logos/${fileName}`);
      const { error: updateError } = await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', params.id);
      if (updateError) throw updateError;
      setTeamData((prev: any) => ({ ...prev, logo: publicUrl }));
      alert('✅ Logo caricato con successo!');
    } catch (err) {
      console.error('Errore upload logo:', err);
      alert('Errore nel caricamento del logo');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPhotoUpload = async (file: File) => {
    if (!file || !teamData) return;
    setLoading(true);
    const supabase = createClient();
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_photo_${teamData.name.replace(/\s/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('tournament-files').upload(`team-photos/${fileName}`, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('tournament-files').getPublicUrl(`team-photos/${fileName}`);
      const { error: updateError } = await supabase.from('teams').update({ team_photo_url: publicUrl }).eq('id', params.id);
      if (updateError) throw updateError;
      setTeamData((prev: any) => ({ ...prev, teamPhoto: publicUrl }));
      alert('✅ Foto squadra caricata con successo!');
    } catch (err) {
      console.error('Errore upload foto:', err);
      alert('Errore nel caricamento della foto');
    } finally {
      setLoading(false);
    }
  };

  // Aggiungi Giocatore
  const handleAddPlayer = async (newPlayer: PlayerData) => {
    setLoading(true);
    const supabase = createClient();
    let photoUrl: string | undefined = newPlayer.photo;
    if (newPlayer.photo && newPlayer.photo.startsWith('blob:')) {
      alert('⚠️ Per caricare la foto, seleziona nuovamente il file');
      photoUrl = undefined;
    }
    const playerData = {
      team_id: params.id,
      first_name: newPlayer.firstName.trim(),
      last_name: newPlayer.lastName.trim(),
      jersey_number: newPlayer.number === '-' ? null : newPlayer.number,
      birth_date: newPlayer.birthDate || null,
      photo_url: photoUrl,
    };

    try {
      const { data, error } = await supabase.from('players').insert(playerData).select().single();
      if (error) throw error;
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
      alert('✅ Giocatore aggiunto con successo!');
    } catch (err) {
      console.error('Errore aggiunta giocatore:', err);
      alert('Errore nel salvataggio del giocatore');
    } finally {
      setLoading(false);
    }
  };

  // Modifica Giocatore
  const handleUpdatePlayer = async (updatedData: PlayerData) => {
    if (!editingPlayer) return;
    setLoading(true);
    const supabase = createClient();
    const currentPlayer = teamData.players.find((p: any) => p.id === editingPlayer.id);
    if (!currentPlayer) { setLoading(false); return; }

    let photoUrl = updatedData.photo || currentPlayer.photo;
    if (updatedData.photo && updatedData.photo.startsWith('blob:')) {
      alert('⚠️ Per aggiornare la foto, seleziona nuovamente il file');
      photoUrl = currentPlayer.photo;
    }

    try {
      const { error } = await supabase.from('players').update({
        first_name: updatedData.firstName.trim(),
        last_name: updatedData.lastName.trim(),
        jersey_number: updatedData.number === '-' ? null : updatedData.number,
        birth_date: updatedData.birthDate || null,
        photo_url: photoUrl,
      }).eq('id', currentPlayer.id);

      if (error) throw error;

      setTeamData((prev: any) => ({
        ...prev,
        players: prev.players.map((p: any) => 
          p.id === currentPlayer.id ? { 
            ...p, 
            firstName: updatedData.firstName.trim(),
            lastName: updatedData.lastName.trim(),
            number: updatedData.number,
            birthDate: updatedData.birthDate,
            photo: photoUrl,
            name: `${updatedData.firstName.trim().toUpperCase()} ${updatedData.lastName.trim().toUpperCase()}`
          } : p
        )
      }));
      alert('✅ Giocatore aggiornato con successo!');
    } catch (err) {
      console.error('Errore aggiornamento giocatore:', err);
      alert('Errore nell\'aggiornamento del giocatore');
    } finally {
      setLoading(false);
      setEditingPlayer(null);
      setIsPlayerEditorOpen(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!editingPlayer) return;
    const isConfirmed = window.confirm(`⚠️ Eliminare definitivamente ${editingPlayer.firstName} ${editingPlayer.lastName}?\n\nQuesta azione è irreversibile.`);
    if (!isConfirmed) return;

    setLoading(true);
    const supabase = createClient();
    const currentPlayer = teamData.players.find((p: any) => p.id === editingPlayer.id);
    if (!currentPlayer || !currentPlayer.id) { alert('Giocatore non trovato'); setLoading(false); return; }

    try {
      const { error } = await supabase.from('players').delete().eq('id', currentPlayer.id);
      if (error) throw error;
      setTeamData((prev: any) => ({ ...prev, players: prev.players.filter((p: any) => p.id !== currentPlayer.id) }));
      alert('✅ Giocatore eliminato con successo');
    } catch (err) {
      console.error('Errore:', err);
      alert('Errore nell\'eliminazione');
    } finally {
      setLoading(false);
      setIsPlayerEditorOpen(false);
      setEditingPlayer(null);
    }
  };

  const handlePlayerClick = (player: any) => {
    if (isStaffMode || isMyTeam) {
      setEditingPlayer({ 
        id: player.id,
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

  // ✅ Il capitano ha i permessi SOLO se è la sua squadra E il torneo NON è bloccato
  const isMyTeam = isCaptain && captainTeamId === params.id && !teamData?.isTournamentLocked;

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

  if (!teamData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <p className="text-[#581C24] font-bold uppercase">Squadra non trovata</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-team.jpg" alt="Campo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <Link href="/squadre" className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
          <ArrowLeft size={20} className="text-[#581C24]" />
        </Link>
      </div>

      {/* CARD NOME SQUADRA */}
      <div className="relative z-10 -mt-12 px-4 mb-4">
        {isStaffMode ? (
          <AdminTeamEditor 
            name={teamData.name} 
            group={teamData.group} 
            logo={teamData.logo} 
            onUpdate={handleTeamUpdate}
            onLogoUpload={handleLogoUpload}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {teamData.logo ? (
                <Image src={teamData.logo} alt="Logo" fill className="object-cover rounded-full" />
              ) : <span className="text-[10px] text-gray-400">LOGO</span>}
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
          <AdminTeamPhotoEditor 
            teamPhoto={teamData.teamPhoto} 
            onPhotoUpload={handleTeamPhotoUpload} 
          />
        ) : (
          <div className="rounded-xl overflow-hidden shadow-md bg-gray-300 relative h-40">
            {teamData.teamPhoto ? (
              <Image src={teamData.teamPhoto} alt="Foto Squadra" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">FOTO SQUADRA</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ AREA CAPITANO / BLOCCO ROSA AGGIORNATA */}
      {isCaptain && captainTeamId === params.id && (
        <div className="px-4 mb-6">
          {teamData?.isTournamentLocked ? (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Rosa Bloccata - Fase Finale
              </p>
              <p className="text-xs text-gray-500">
                Le modifiche alla rosa sono disattivate. Per eventuali cambiamenti, contatta direttamente lo staff del torneo.
              </p>
            </div>
          ) : (
            <div className="bg-[#FFD700]/10 border-2 border-[#FFD700] rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-[#581C24] uppercase mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pannello Capitano - {teamData.name}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATISTICHE SQUADRA */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center border-r border-gray-200 pr-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">PT</p>
            <p className="text-4xl font-black text-[#581C24]">{teamData.stats.pt || 0}</p>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 pl-4">
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">V</p>
              <p className="text-lg font-bold text-[#581C24]">{teamData.stats.v || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">P</p>
              <p className="text-lg font-bold text-[#581C24]">{teamData.stats.p || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">S</p>
              <p className="text-lg font-bold text-[#581C24]">{teamData.stats.s || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">GF</p>
              <p className="text-lg font-bold text-[#581C24]">{teamData.stats.gf || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">GS</p>
              <p className="text-lg font-bold text-[#581C24]">{teamData.stats.gs || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">DR</p>
              <p className="text-lg font-bold text-[#581C24]">
                {(teamData.stats.dr || 0) > 0 ? `+${teamData.stats.dr}` : teamData.stats.dr || 0}
              </p>
            </div>
          </div>
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
                        <Image src={player.photo} alt={player.name} fill className="object-cover rounded-full" />
                      ) : <span className="text-[6px] text-gray-400">FOTO</span>}
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

      <AdminPlayerEditor 
        player={editingPlayer} 
        isOpen={isPlayerEditorOpen} 
        onClose={() => { setIsPlayerEditorOpen(false); setEditingPlayer(null); }} 
        onSave={handleUpdatePlayer}
        onDelete={handleDeletePlayer}
      />

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
    </div>
  );
}