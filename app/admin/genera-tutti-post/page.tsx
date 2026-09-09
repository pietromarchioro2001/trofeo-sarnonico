'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  status: string;
  home_team: { name: string };
  away_team: { name: string };
}

export default function GeneraTuttiPostAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('matches')
      .select(`
        id, status,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name)
      `)
      .order('match_date', { ascending: false });
    
    if (data) {
      const typed = data.map((m: any) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      }));
      setMatches(typed);
      setTotal(typed.length);
    }
  };

  const generateAllPosts = async () => {
    if (!confirm(`Generare post per tutte le ${matches.length} partite?\n\n- Partite future: post "In programma"\n- Partite finite: post "Risultato"`)) return;

    setProcessing(true);
    setCompleted(0);
    setErrors([]);

    for (const match of matches) {
      try {
        const type = match.status === 'FINITA' ? 'POST_MATCH' : 'PRE_MATCH';
        
        const res = await fetch(`/api/matches/${match.id}/generate-post?type=${type}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        setCompleted(prev => prev + 1);
        await new Promise(r => setTimeout(r, 500)); // Pausa per non sovraccaricare
      } catch (err) {
        setErrors(prev => [...prev, `${match.home_team.name} vs ${match.away_team.name}: ${(err as Error).message}`]);
      }
    }

    setProcessing(false);
    alert(`✅ Completato!\nGenerate: ${completed}/${matches.length}\nErrori: ${errors.length}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#581C24] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/partite" className="text-white/80 hover:text-white mb-4 inline-block">
            ← Torna alle partite
          </Link>
          <h1 className="text-3xl font-black uppercase">Genera Tutti i Post</h1>
          <p className="text-white/80 mt-2">Crea automaticamente i post per tutte le partite esistenti</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-[#581C24] uppercase mb-4">Riepilogo</h2>
          <p className="text-gray-600 mb-4">
            Trovate <strong>{matches.length}</strong> partite nel database.
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>• Partite <strong>FINITE</strong> → genererà post <strong>"Risultato Finale"</strong></li>
            <li>• Partite <strong>PROGRAMMATE/LIVE</strong> → genererà post <strong>"Prossima Partita"</strong></li>
          </ul>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-700 font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Errori ({errors.length})
              </h3>
              <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={generateAllPosts}
            disabled={processing || matches.length === 0}
            className="w-full py-3 bg-[#581C24] text-white font-black rounded-xl shadow-lg hover:bg-[#581C24]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase"
          >
            {processing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generazione in corso... ({completed}/{total})
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                GENERA TUTTI I POST
              </>
            )}
          </button>

          {completed > 0 && !processing && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-bold">
                ✅ Generazione completata! {completed} post creati nello storage.
              </p>
              <p className="text-sm text-green-600 mt-1">
                I file sono salvati in: <code className="bg-white px-2 py-1 rounded">tournament-files/match-posts/</code>
              </p>
            </div>
          )}
        </div>

        {/* Lista partite */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-600 uppercase">Partite trovate:</h3>
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
              <span className="font-bold text-sm text-[#581C24]">
                {match.home_team.name} vs {match.away_team.name}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                match.status === 'FINITA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {match.status === 'FINITA' ? 'POST_MATCH' : 'PRE_MATCH'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}