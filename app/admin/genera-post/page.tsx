'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Download, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  home_score: number;
  away_score: number;
  home_penalties: number | null;
  away_penalties: number | null;
  status: string;
  match_date: string;
  match_time: string;
  phase: string;
  home_team: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  away_team: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  mvp_player?: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    team_id: string;
  };
}

interface PostStatus {
  preMatch: boolean;
  postMatch: boolean;
  mvp: boolean;
}

export default function GeneraPostAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, string>>({});
  const [postStatus, setPostStatus] = useState<Record<string, PostStatus>>({});

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, home_score, away_score, home_penalties, away_penalties, status, match_date, match_time, phase,
        home_team_id, away_team_id, mvp_player_id,
        home_team:teams!home_team_id(id, name, logo_url),
        away_team:teams!away_team_id(id, name, logo_url),
        mvp_player:players!mvp_player_id(id, first_name, last_name, photo_url, team_id)
      `)
      .eq('status', 'FINITA')
      .order('match_date', { ascending: false });

    if (error) {
      console.error('Errore fetch partite:', error);
      return;
    }

    const typedMatches = (data || []).map((m: any) => ({
      ...m,
      home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
      away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      mvp_player: Array.isArray(m.mvp_player) ? m.mvp_player[0] : m.mvp_player,
    }));

    setMatches(typedMatches);

    // Controlla quali post esistono già
    const { data: posts } = await supabase
      .from('match_posts')
      .select('match_id, type')
      .in('match_id', typedMatches.map((m: Match) => m.id));

    const statusMap: Record<string, PostStatus> = {};
    typedMatches.forEach((match: Match) => {
      const matchPosts = posts?.filter((p: any) => p.match_id === match.id) || [];
      statusMap[match.id] = {
        preMatch: matchPosts.some((p: any) => p.type === 'PRE_MATCH'),
        postMatch: matchPosts.some((p: any) => p.type === 'POST_MATCH'),
        mvp: matchPosts.some((p: any) => p.type === 'MVP'),
      };
    });

    setPostStatus(statusMap);
    setLoading(false);
  };

  const generatePost = async (matchId: string, type: 'PRE_MATCH' | 'POST_MATCH' | 'MVP') => {
    setGenerating((prev) => ({ ...prev, [`${matchId}_${type}`]: 'Generating...' }));

    try {
      const response = await fetch(`/api/matches/${matchId}/generate-post?type=${type}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) throw new Error('Generazione fallita');

      // Aggiorna lo stato
      setPostStatus((prev) => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [type === 'PRE_MATCH' ? 'preMatch' : type === 'POST_MATCH' ? 'postMatch' : 'mvp']: true,
        },
      }));
    } catch (error) {
      console.error('Errore generazione:', error);
      alert('Errore nella generazione del post');
    } finally {
      setGenerating((prev) => ({ ...prev, [`${matchId}_${type}`]: '' }));
    }
  };

  const downloadPost = async (matchId: string, type: 'PRE_MATCH' | 'POST_MATCH' | 'MVP') => {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('match_posts')
      .select('image_url')
      .eq('match_id', matchId)
      .eq('type', type)
      .single();

    if (!data?.image_url) {
      alert('Post non trovato');
      return;
    }

    const response = await fetch(data.image_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partita-${matchId}-${type.toLowerCase()}.png`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#581C24] mx-auto mb-4" />
          <p className="text-[#581C24] font-bold">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#581C24] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/partite" className="text-white/80 hover:text-white mb-4 inline-block">
            ← Torna alle partite
          </Link>
          <h1 className="text-3xl font-black uppercase">Genera Post Social</h1>
          <p className="text-white/80 mt-2">Genera immagini ottimizzate per Instagram e Facebook</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {matches.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-bold">Nessuna partita conclusa trovata</p>
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Info Partita */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center flex-1">
                      {match.home_team.logo_url && (
                        <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-12 h-12 mx-auto mb-1 rounded-full" />
                      )}
                      <p className="font-bold text-sm text-[#581C24]">{match.home_team.name}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-3xl font-black text-[#581C24]">
                        {match.home_score} - {match.away_score}
                      </p>
                      {match.home_penalties != null && (
                        <p className="text-xs text-purple-600 font-bold">
                          dcr {match.home_penalties}-{match.away_penalties}
                        </p>
                      )}
                    </div>
                    <div className="text-center flex-1">
                      {match.away_team.logo_url && (
                        <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-12 h-12 mx-auto mb-1 rounded-full" />
                      )}
                      <p className="font-bold text-sm text-[#581C24]">{match.away_team.name}</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  {new Date(match.match_date).toLocaleDateString('it-IT')} • {match.match_time}
                </p>
              </div>

              {/* Pulsanti Generazione */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generatePost(match.id, 'PRE_MATCH')}
                    disabled={!!generating[`${match.id}_PRE_MATCH`]}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating[`${match.id}_PRE_MATCH`] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : postStatus[match.id]?.preMatch ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Post Partita
                  </button>
                  <button
                    onClick={() => downloadPost(match.id, 'PRE_MATCH')}
                    disabled={!postStatus[match.id]?.preMatch}
                    className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generatePost(match.id, 'POST_MATCH')}
                    disabled={!!generating[`${match.id}_POST_MATCH`]}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating[`${match.id}_POST_MATCH`] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : postStatus[match.id]?.postMatch ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Risultato Finale
                  </button>
                  <button
                    onClick={() => downloadPost(match.id, 'POST_MATCH')}
                    disabled={!postStatus[match.id]?.postMatch}
                    className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    ↓
                  </button>
                </div>

                {match.mvp_player && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => generatePost(match.id, 'MVP')}
                      disabled={!!generating[`${match.id}_MVP`]}
                      className="flex-1 bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generating[`${match.id}_MVP`] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : postStatus[match.id]?.mvp ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      MVP: {match.mvp_player.first_name} {match.mvp_player.last_name}
                    </button>
                    <button
                      onClick={() => downloadPost(match.id, 'MVP')}
                      disabled={!postStatus[match.id]?.mvp}
                      className="px-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}