'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { AdminSquadreButton } from '@/components/AdminButtons';

// Dati mock delle squadre
const TEAMS = [
  { id: 1, name: 'CLOZ', logo: '/logos/cloz.png' },
  { id: 2, name: 'ROMALLO', logo: '/logos/romallo.png' },
  { id: 3, name: 'REVO\'', logo: '/logos/revo.png' },
  { id: 4, name: 'DON/AMBLAR', logo: '/logos/don-amblar.png' },
  { id: 5, name: 'CAVARENO', logo: '/logos/cavareno.png' },
  { id: 6, name: 'TAIO', logo: '/logos/taio.png' },
  { id: 7, name: 'LOVER', logo: '/logos/lover.png' },
  { id: 8, name: 'ROMENO', logo: '/logos/romeno.png' },
  { id: 9, name: 'CASTELFONDO', logo: '/logos/castelfondo.png' },
  { id: 10, name: 'DAMBEL', logo: '/logos/dambel.png' },
  { id: 11, name: 'FONDO', logo: '/logos/fondo.png' },
  { id: 12, name: 'SARNONICO', logo: '/logos/sarnonico.png' },
  { id: 13, name: 'RALO', logo: '/logos/ralo.png' },
  { id: 14, name: 'SEIO', logo: '/logos/seio.png' },
  { id: 15, name: 'BANCO', logo: '/logos/banco.png' },
  { id: 16, name: 'SFRUZ', logo: '/logos/sfruz.png' },
  { id: 17, name: 'COREDO', logo: '/logos/coredo.png' },
  { id: 18, name: 'DON', logo: '/logos/don.png' },
];

export default function SquadrePage() {
  const { isStaffMode } = useAuth();

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
        
        {/* PULSANTE ADMIN - POSIZIONATO IN ALTO A DESTRA */}
        {isStaffMode && (
          <div className="absolute bottom-8 left-2 z-20">
            <AdminSquadreButton />
          </div>
        )}
        
        {/* Titolo - stesso stile di PARTITE */}
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            SQUADRE
          </h1>
        </div>
      </div>

      {/* LISTA SQUADRE */}
      <div className="relative z-10 -mt-6 px-3 sm:px-4 space-y-2">
        {TEAMS.map((team) => (
          <Link
            key={team.id}
            href={`/squadre/${team.id}`}
            className="block"
          >
            <div className="bg-white rounded-xl p-3 shadow-md border border-gray-100 flex items-center gap-3 hover:shadow-lg transition-shadow">
              {/* Logo squadra */}
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-gray-400">LOGO</span>
              </div>

              {/* Nome squadra */}
              <span className="font-bold text-sm text-[#581C24] uppercase tracking-wide flex-1">
                {team.name}
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
        ))}
      </div>
    </div>
  );
}