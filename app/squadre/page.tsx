'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { AdminSquadreButton } from '@/components/AdminButtons';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';

// Tipo per le squadre da Supabase
interface Team {
  id: string;
  name: string;
  girone: 'A' | 'B';
  logo_url: string | null;
  hasSuspendedPlayers: boolean; // ✅ Nuovo flag per l'avviso
}

export default function SquadrePage() {
  const { isStaffMode } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const supabase = createClient();
        
        // ✅ Query aggiornata per includere lo stato di squalifica dei giocatori
        const { data, error } = await supabase
          .from('teams')
          .select(`
            id, 
            name, 
            girone, 
            logo_url,
            players (is_suspended)
          `)
          .order('name', { ascending: true });

        if (error) throw error;

        // ✅ Mappiamo i dati per creare il flag hasSuspendedPlayers
        const mappedTeams: Team[] = (data || []).map((team: any) => ({
          id: team.id,
          name: team.name,
          girone: team.girone,
          logo_url: team.logo_url,
          hasSuspendedPlayers: Array.isArray(team.players) && team.players.some((p: any) => p.is_suspended === true)
        }));

        setTeams(mappedTeams);
      } catch (err: any) {
        setError(err.message || 'Errore nel caricamento squadre');
        console.error('Errore fetch teams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento squadre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600 font-bold mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#581C24] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#581C24]/90"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER CON IMMAGINE CAMPO */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image
          src="/header-teams.jpg"
          alt="Campo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        
        {/* PULSANTE ADMIN */}
        {isStaffMode && (
          <div className="absolute bottom-8 left-2 z-20">
            <AdminSquadreButton />
          </div>
        )}
        
        {/* Titolo */}
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            SQUADRE
          </h1>
        </div>
      </div>

      {/* LISTA SQUADRE */}
      <div className="relative z-10 -mt-6 px-3 sm:px-4 space-y-2">
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <p className="text-gray-500 font-bold">Nessuna squadra trovata</p>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/squadre/${team.id}`}
              className="block"
            >
              <div className="bg-white rounded-xl p-3 shadow-md border border-gray-100 flex items-center gap-3 hover:shadow-lg transition-shadow">
                {/* Logo squadra */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {team.logo_url ? (
                    <Image
                      src={team.logo_url}
                      alt={team.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[8px] text-gray-400">LOGO</span>
                  )}
                </div>
                
                {/* ✅ Nome squadra e eventuale avviso (senza alterare il layout) */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold text-sm text-[#581C24] uppercase tracking-wide truncate">
                    {team.name}
                  </span>
                  {team.hasSuspendedPlayers && (
                    <AlertTriangle 
                      className="w-4 h-4 text-red-600 flex-shrink-0" 
                    />
                  )}
                </div>
                
                {/* Girone badge */}
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                  {team.girone}
                </span>
                
                {/* Freccia */}
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}