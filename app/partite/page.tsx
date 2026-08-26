// app/partite/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminPartiteButton } from '@/components/AdminButtons';
import { useAuth } from '@/lib/AuthContext';

// Dati mock per le partite
const PARTITE_DATA = [
  {
    id: 1,
    date: '29 GIU',
    fullDate: 'Mer 29 Giu',
    time: '19:30',
    group: 'GIRONE A',
    homeTeam: { name: 'SARNONICO', logo: '/logos/sarnonico.png' },
    awayTeam: { name: 'ROMALLO', logo: '/logos/ralo.png' },
    score: { home: 5, away: 1 },
    isLive: true,
  },
  {
    id: 2,
    date: '29 GIU',
    fullDate: 'Mer 29 Giu',
    time: '19:30',
    group: 'GIRONE A',
    homeTeam: { name: 'TAIO', logo: '/logos/talo.png' },
    awayTeam: { name: 'CASTELFONDO', logo: '/logos/castelfondo.png' },
    score: { home: 4, away: 1 },
    isLive: false,
  },
  {
    id: 3,
    date: '29 GIU',
    fullDate: 'Mer 29 Giu',
    time: '19:30',
    group: 'GIRONE A',
    homeTeam: { name: 'CAVARENO', logo: '/logos/cavareno.png' },
    awayTeam: { name: 'LOVER', logo: '/logos/lover.png' },
    score: { home: 6, away: 2 },
    isLive: false,
  },
  {
    id: 4,
    date: '26 GIU',
    fullDate: 'Lun 26 Giu',
    time: '21:00',
    group: 'GIRONE B',
    homeTeam: { name: 'BANCO', logo: '/logos/banco.png' },
    awayTeam: { name: 'SEIO', logo: '/logos/seio.png' },
    score: { home: 2, away: 0 },
    isLive: false,
  },
  {
    id: 5,
    date: '30 GIU',
    fullDate: 'Mar 30 Giu',
    time: '20:30',
    group: 'GIRONE B',
    homeTeam: { name: 'SFRUZ', logo: '/logos/sfruz.png' },
    awayTeam: { name: 'DON', logo: '/logos/don.png' },
    score: { home: 1, away: 1 },
    isLive: false,
  },
  {
    id: 6,
    date: '1 LUG',
    fullDate: 'Sab 1 Lug',
    time: '18:00',
    group: 'GIRONE A',
    homeTeam: { name: 'ROMENO', logo: '/logos/romeno.png' },
    awayTeam: { name: 'COREDO', logo: '/logos/coredo.png' },
    score: { home: 0, away: 0 },
    isLive: false,
    isScheduled: true,
  },
];

const DATES = ['26 GIU', '30 GIU', '29 GIU', '1 LUG', '2 LUG', '5 LUG', '6 LUG', '8 LUG', '10 LUG', '12 LUG', '15 LUG', '18 LUG', '20 LUG', '22 LUG', '25 LUG'];

export default function PartitePage() {
  const { isStaffMode } = useAuth();
  const [selectedDate, setSelectedDate] = useState('29 GIU');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const selectedButton = dateButtonRefs.current[selectedDate];
    if (selectedButton && scrollContainerRef.current) {
      selectedButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedDate]);

  const filteredMatches = PARTITE_DATA.filter(match => match.date === selectedDate);

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

        {/* PULSANTE NUOVA PARTITA (solo staff) - POSIZIONATO SOPRA L'HEADER */}
        {isStaffMode && (
          <div className="absolute top-20 left-0 z-30">
            <AdminPartiteButton />
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
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto px-3 scrollbar-hide snap-x"
        >
          {DATES.map((date) => (
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
              <span className="text-[10px] uppercase mt-0.5">{date.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LISTA PARTITE */}
      <div className="px-3 sm:px-4 py-2 space-y-3">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Link 
              key={match.id} 
              href={`/partite/${match.id}`} 
              className="block no-underline"
            >
              <div
                className={`rounded-xl p-3.5 shadow-sm border transition-all hover:shadow-md ${
                  match.isLive
                    ? 'bg-[#581C24] border-[#581C24] shadow-[0_0_20px_rgba(88,28,36,0.3)]'
                    : 'bg-white border-gray-100'
                }`}
              >
                {/* Header card */}
                <div className="flex items-center justify-between mb-2.5">
                  {match.isLive && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {!match.isLive && !match.isScheduled && (
                    <span className={`${match.isLive ? 'text-white' : 'text-black'} text-sm font-bold`}>Risultato</span>
                  )}
                  {match.isScheduled && (
                    <span className="text-gray-500 text-sm font-bold">In programma</span>
                  )}
                  
                  {/* Girone centrato */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    match.isLive ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#581C24]'
                  }`}>
                    {match.group}
                  </span>
                  
                  <span className={`text-[10px] ${match.isLive ? 'text-white/90' : 'text-gray-500'}`}>
                    {match.fullDate} • {match.time}
                  </span>
                </div>

                {/* Squadre e risultato */}
                <div className="flex items-center justify-between">
                  {/* Squadra Casa */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                      match.isLive ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      <span className={`text-[10px] ${match.isLive ? 'text-white/70' : 'text-gray-400'}`}>LOGO</span>
                    </div>
                    <span className={`font-bold text-sm text-center truncate w-full ${
                      match.isLive ? 'text-white' : 'text-black'
                    }`}>
                      {match.homeTeam.name}
                    </span>
                  </div>

                  {/* Risultato */}
                  <div className="px-3.5">
                    <div className={`text-2xl font-black tracking-wider ${
                      match.isLive
                        ? 'text-white animate-pulse'
                        : match.isScheduled
                        ? 'text-gray-400'
                        : 'text-black'
                    }`}>
                      {match.isScheduled ? '-' : `${match.score.home} - ${match.score.away}`}
                    </div>
                  </div>

                  {/* Squadra Trasferta */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                      match.isLive ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      <span className={`text-[10px] ${match.isLive ? 'text-white/70' : 'text-gray-400'}`}>LOGO</span>
                    </div>
                    <span className={`font-bold text-sm text-center truncate w-full ${
                      match.isLive ? 'text-white' : 'text-black'
                    }`}>
                      {match.awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Nessuna partita per questa data</p>
          </div>
        )}
      </div>
    </div>
  );
}