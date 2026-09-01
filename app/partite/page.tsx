'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminPartiteButton, AdminDeleteMatchButton } from '@/components/AdminButtons';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';

// Tipo corretto per i dati partita
interface MatchData {
  id: string;
  match_date: string | null;
  match_time: string | null;
  phase: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: { name: string; logo_url: string | null; girone?: 'A' | 'B' } | null;
  away_team: { name: string; logo_url: string | null; girone?: 'A' | 'B' } | null;
}

// Funzione helper per parsare le date
const parseDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const isoDate = dateStr.replace(' ', 'T');
  const d = new Date(isoDate);
  return isNaN(d.getTime()) ? null : d;
};

export default function PartitePage() {
  const { isStaffMode } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 1. AGGIUNTO: Stato "interruttore" per forzare il ricaricamento
  const [refreshKey, setRefreshKey] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Scroll automatico alla data selezionata
  useEffect(() => {
    const selectedButton = dateButtonRefs.current[selectedDate];
    if (selectedButton && scrollContainerRef.current) {
      selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDate]);

  // Fetch partite da Supabase
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. Prendi le partite
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            match_time,
            phase,
            status,
            home_score,
            away_score,
            home_team_id,
            away_team_id
          `)
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true });

        if (matchesError) throw matchesError;

        // 2. Raccogli gli ID delle squadre
        const teamIds = Array.from(
          new Set(
            (matchesData || [])
              .flatMap(m => [m.home_team_id, m.away_team_id])
              .filter(Boolean)
          )
        );

        // 3. Prendi i dati delle squadre
        let teamsData: any[] = [];
        if (teamIds.length > 0) {
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name, logo_url, girone') 
            .in('id', teamIds);
          
          if (teamsError) throw teamsError;
          teamsData = teams || [];
        }

        // 4. Mappa i dati unendo partite e squadre
        const mappedMatches: MatchData[] = (matchesData || []).map((m: any) => {
          const homeTeam = teamsData.find((t: any) => t.id === m.home_team_id) || null;
          const awayTeam = teamsData.find((t: any) => t.id === m.away_team_id) || null;

          return {
            id: m.id,
            match_date: m.match_date,
            match_time: m.match_time,
            phase: m.phase,
            status: m.status,
            home_score: m.home_score,
            away_score: m.away_score,
            home_team: homeTeam,
            away_team: awayTeam
          };
        });

        // 5. Estrai le date uniche
        const dates = Array.from(new Set((mappedMatches || []).map(m => {
          const d = parseDate(m.match_date);
          if (!d) return 'DA DEFINIRE';
          return `${d.getDate()} ${d.toLocaleString('it-IT', { month: 'short' }).toUpperCase()}`;
        })));
        
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]);
        }
        setMatches(mappedMatches);
      } catch (err) {
        console.error('Errore fetch partite:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  // ✅ 2. MODIFICATO: Aggiunto refreshKey alle dipendenze. 
  // Ora il fetch si riesegue ogni volta che refreshKey cambia.
  }, [refreshKey]); 

    // ==========================================
  // ✅ REALTIME: Aggiornamenti live su Partite
  // ==========================================
  useEffect(() => {
    const supabase = createClient();

    // Ascolta cambiamenti sulle partite
    const matchesChannel = supabase
      .channel('partite-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          console.log('🔄 Partita aggiornata, ricarico lista...');
          setRefreshKey(k => k + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  // Filtra le partite per la data selezionata
  const filteredMatches = matches.filter(match => {
    const d = parseDate(match.match_date);
    if (!d) return selectedDate === 'DA DEFINIRE';
    const dateStr = `${d.getDate()} ${d.toLocaleString('it-IT', { month: 'short' }).toUpperCase()}`;
    return dateStr === selectedDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento partite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER CON IMMAGINE CAMPO */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image
          src="/header-partite.jpg"
          alt="Partite"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        
        {isStaffMode && (
          <div className="absolute top-20 left-0 z-30 px-4">
            {/* ✅ 3. MODIFICATO: Passiamo la funzione che incrementa refreshKey al salvataggio */}
            <AdminPartiteButton onMatchCreated={() => setRefreshKey(k => k + 1)} />
          </div>
        )}
        
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            PARTITE
          </h1>
        </div>
      </div>

      {/* STRISCIA DATE SCROLLABILE */}
      <div className="relative z-20 -mt-6 mb-3">
        <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto px-3 scrollbar-hide snap-x">
          {availableDates.map((date) => (
            <button
              key={date}
              ref={(el) => { dateButtonRefs.current[date] = el; }}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center font-bold transition-all snap-center ${
                selectedDate === date
                  ? 'bg-[#581C24] text-white shadow-lg scale-105'
                  : 'bg-gray-200 text-gray-600 shadow-sm hover:shadow-md'
              }`}
            >
              <span className="text-xl font-black">{date.split(' ')[0]}</span>
              <span className="text-[10px] uppercase mt-0.5">{date.split(' ')[1] || ''}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LISTA PARTITE */}
      <div className="px-3 sm:px-4 py-2 space-y-3">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => {
            const isLive = match.status === 'LIVE' || match.status === 'SUPP';
            const isScheduled = match.status === 'PROGRAMMATA';
            
            return (
              <Link key={match.id} href={`/partite/${match.id}`} className="block no-underline">
                <div className={`rounded-xl p-3.5 shadow-sm border transition-all hover:shadow-md ${
                  isLive ? 'bg-[#581C24] border-[#581C24] shadow-[0_0_20px_rgba(88,28,36,0.3)]' : 'bg-white border-gray-100'
                }`}>
                  {/* Header card */}
                  <div className="flex items-center justify-between mb-2.5">
                    {isLive && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                      </span>
                    )}
                    {!isLive && !isScheduled && (
                      <span className={`text-sm font-bold ${isLive ? 'text-white' : 'text-black'}`}>Risultato</span>
                    )}
                    {isScheduled && <span className="text-gray-500 text-sm font-bold">In programma</span>}
                    
                    {/* Spazio vuoto al centro per bilanciare */}
                    <div className="flex-1" />
                    
                    {/* Girone a destra */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isLive ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#581C24]'
                    }`}>
                      {match.phase === 'GIRONI' ? `GIRONE ${match.home_team?.girone || 'A'}` : match.phase}
                    </span>

                    {/* ✅ PULSANTE ELIMINA - Solo per staff */}
                    {isStaffMode && (
                      <AdminDeleteMatchButton 
                        matchId={match.id} 
                        onDeleteSuccess={() => setRefreshKey(k => k + 1)} 
                      />
                    )}
                  </div>

                  {/* Squadre e risultato */}
                  <div className="flex items-center justify-between">
                    {/* Squadra Casa */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                        {match.home_team?.logo_url ? (
                          <Image src={match.home_team.logo_url} alt={match.home_team.name} width={56} height={56} className="object-cover" />
                        ) : (
                          <span className={`text-[10px] ${isLive ? 'text-white/70' : 'text-gray-400'}`}>LOGO</span>
                        )}
                      </div>
                      <span className={`font-bold text-sm text-center truncate w-full ${isLive ? 'text-white' : 'text-black'}`}>
                        {match.home_team?.name || 'TBD'}
                      </span>
                    </div>

                    {/* Orario + Risultato allineati */}
                    <div className="px-3.5 flex flex-col items-center justify-center gap-1">
                      {/* Orario spostato qui */}
                      <span className={`text-[10px] font-bold ${isLive ? 'text-white/90' : 'text-gray-500'}`}>
                        {match.match_time || '--:--'}
                      </span>
                      {/* Risultato */}
                      <div className={`text-2xl font-black tracking-wider ${
                        isLive ? 'text-white animate-pulse' : isScheduled ? 'text-gray-400' : 'text-black'
                      }`}>
                        {isScheduled ? '-' : `${match.home_score ?? 0} - ${match.away_score ?? 0}`}
                      </div>
                    </div>

                    {/* Squadra Trasferta */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isLive ? 'bg-white/10' : 'bg-gray-100'}`}>
                        {match.away_team?.logo_url ? (
                          <Image src={match.away_team.logo_url} alt={match.away_team.name} width={56} height={56} className="object-cover" />
                        ) : (
                          <span className={`text-[10px] ${isLive ? 'text-white/70' : 'text-gray-400'}`}>LOGO</span>
                        )}
                      </div>
                      <span className={`font-bold text-sm text-center truncate w-full ${isLive ? 'text-white' : 'text-black'}`}>
                        {match.away_team?.name || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Nessuna partita per questa data</p>
          </div>
        )}
      </div>
    </div>
  );
}