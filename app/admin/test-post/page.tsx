'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Check, AlertCircle, Copy } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  status: string;
  home_team: { name: string };
  away_team: { name: string };
  match_date: string;
}

export default function TestPostAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{ id: string; type: string; success: boolean; message: string }[]>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('matches')
      .select(`
        id, status, match_date,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name)
      `)
      .order('match_date', { ascending: false })
      .limit(5);
    
    if (data) {
      const typed = data.map((m: any) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      }));
      setMatches(typed);
    }
  };

  const testSingleMatch = async (matchId: string, type: 'PRE_MATCH' | 'POST_MATCH') => {
    setTesting(true);
    setResults([]);

    try {
      const res = await fetch(`/api/matches/${matchId}/generate-post?type=${type}`);
      
      if (res.ok) {
        setResults([{ id: matchId, type, success: true, message: '✅ Post generato con successo!' }]);
      } else {
        const errorText = await res.text();
        setResults([{ id: matchId, type, success: false, message: `❌ Errore ${res.status}: ${errorText}` }]);
      }
    } catch (err) {
      setResults([{ id: matchId, type, success: false, message: `❌ Errore: ${(err as Error).message}` }]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#581C24] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/partite" className="text-white/80 hover:text-white mb-4 inline-block">
            ← Torna alle partite
          </Link>
          <h1 className="text-3xl font-black uppercase">Test Generazione Post</h1>
          <p className="text-white/80 mt-2">Testa la generazione su 2 partite specifiche</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Istruzioni */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-blue-900 font-bold mb-2">📋 Istruzioni</h3>
          <p className="text-sm text-blue-800">
            Clicca sui pulsanti per testare la generazione. Se funziona, vedrai l'immagine generata e il file salvato nello storage.
          </p>
        </div>

        {/* Risultati test */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-[#581C24] uppercase mb-4">Risultato Test</h2>
            {results.map((result, idx) => (
              <div key={idx} className={`p-4 rounded-lg mb-2 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {result.success ? <Check className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className={`font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.type === 'PRE_MATCH' ? 'Post "In Programma"' : 'Post "Risultato Finale"'}
                    </p>
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                    {result.success && (
                      <p className="text-xs text-gray-600 mt-2">
                        File salvato in: <code className="bg-white px-2 py-1 rounded">tournament-files/match-posts/{result.id}_{result.type}.png</code>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista partite per test */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-[#581C24] uppercase mb-4">Seleziona Partita per Test</h2>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#581C24]">
                      {match.home_team.name} vs {match.away_team.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(match.match_date).toLocaleDateString('it-IT')} • Status: {match.status}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    match.status === 'FINITA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {match.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testSingleMatch(match.id, 'PRE_MATCH')}
                    disabled={testing}
                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Test POST_MATCH'}
                  </button>
                  <button
                    onClick={() => testSingleMatch(match.id, 'POST_MATCH')}
                    disabled={testing}
                    className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Test PRE_MATCH'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link diretto per test manuale */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-[#581C24] uppercase mb-4">Test Manuale</h2>
          <p className="text-sm text-gray-600 mb-3">
            Copia uno di questi URL e incollalo nel browser per vedere l'immagine generata:
          </p>
          <div className="space-y-2">
            {matches.slice(0, 2).map((match) => (
              <div key={match.id} className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-100 p-2 rounded break-all">
                  /api/matches/{match.id}/generate-post?type=POST_MATCH
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`/api/matches/${match.id}/generate-post?type=POST_MATCH`)}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}