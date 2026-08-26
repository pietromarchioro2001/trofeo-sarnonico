// app/classifiche/page.tsx
'use client';

import { useState, useEffect } from 'react'; // <-- AGGIUNTO useEffect
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Dati mock classifiche
const STANDINGS = {
  gironeA: [
    { pos: 1, team: 'TAIO', logo: '/logos/taio.png', pt: 21, pg: 8, v: 7, p: 0, s: 1, gf: 34, gs: 15, dr: 19 },
    { pos: 2, team: 'CAVARENO', logo: '/logos/cavareno.png', pt: 19, pg: 8, v: 6, p: 1, s: 1, gf: 35, gs: 17, dr: 18 },
    { pos: 3, team: 'CASTELFONDO', logo: '/logos/castelfondo.png', pt: 7, pg: 6, v: 2, p: 1, s: 3, gf: 9, gs: 9, dr: 0 },
    { pos: 4, team: 'SARNONICO', logo: '/logos/sarnonico.png', pt: 4, pg: 6, v: 1, p: 1, s: 4, gf: 16, gs: 22, dr: -6 },
    { pos: 5, team: 'LOVER', logo: '/logos/lover.png', pt: 3, pg: 5, v: 0, p: 3, s: 2, gf: 6, gs: 13, dr: -7 },
  ],
  gironeB: [
    { pos: 1, team: 'FONDO', logo: '/logos/fondo.png', pt: 18, pg: 8, v: 6, p: 0, s: 2, gf: 49, gs: 20, dr: 29 },
    { pos: 2, team: "REVO'", logo: '/logos/revo.png', pt: 16, pg: 8, v: 5, p: 1, s: 2, gf: 38, gs: 21, dr: 17 },
    { pos: 3, team: 'ROMENO', logo: '/logos/romeno.png', pt: 9, pg: 6, v: 2, p: 3, s: 1, gf: 19, gs: 14, dr: 5 },
    { pos: 4, team: 'CLOZ', logo: '/logos/cloz.png', pt: 7, pg: 6, v: 2, p: 1, s: 3, gf: 17, gs: 34, dr: -17 },
    { pos: 5, team: 'DAMBEL', logo: '/logos/dambel.png', pt: 3, pg: 5, v: 1, p: 0, s: 4, gf: 6, gs: 32, dr: -26 },
  ],
};

// Dati mock fase finale
const PHASE_DATA = {
  quarti: [
    { id: 1, team1: { name: 'TAIO', logo: '/logos/taio.png', score: 8 }, team2: { name: 'CLOZ', logo: '/logos/cloz.png', score: 1 }, nextMatch: 1 },
    { id: 2, team1: { name: 'FONDO', logo: '/logos/fondo.png', score: 2 }, team2: { name: 'CASTELFONDO', logo: '/logos/castelfondo.png', score: 1 }, nextMatch: 1 },
    { id: 3, team1: { name: "REVO'", logo: '/logos/revo.png', score: 4 }, team2: { name: 'SARNONICO', logo: '/logos/sarnonico.png', score: 3 }, nextMatch: 2 },
    { id: 4, team1: { name: 'CAVARENO V', logo: '/logos/cavareno.png', score: 3 }, team2: { name: 'ROMENO', logo: '/logos/romeno.png', score: 3 }, nextMatch: 2 },
  ],
  semifinali: [
    { id: 1, team1: { name: 'TAIO', logo: '/logos/taio.png', score: null }, team2: { name: 'FONDO', logo: '/logos/fondo.png', score: null }, nextMatch: 1 },
    { id: 2, team1: { name: "REVO'", logo: '/logos/revo.png', score: null }, team2: { name: 'CAVARENO V', logo: '/logos/cavareno.png', score: null }, nextMatch: 1 },
  ],
  finale: [
    { id: 1, team1: { name: 'TAIO', logo: '/logos/taio.png', score: null }, team2: { name: "REVO'", logo: '/logos/revo.png', score: null } },
  ],
};

// Dati mock marcatori
const TOP_SCORERS = [
  { pos: 1, name: 'LUCA LARCHER', team: 'CAVARENO', logo: '/logos/cavareno.png', goals: 22 },
  { pos: 2, name: 'SIMONE FERRARI', team: "REVO'", logo: '/logos/revo.png', goals: 15 },
  { pos: 3, name: 'FABIAN GEISER', team: 'FONDO', logo: '/logos/fondo.png', goals: 15 },
  { pos: 4, name: 'ENRICO CALLOVINI', team: 'FONDO', logo: '/logos/fondo.png', goals: 10 },
  { pos: 5, name: 'MASSIMO IORI', team: "REVO'", logo: '/logos/revo.png', goals: 7 },
  { pos: 6, name: 'YOUSEFF SABIL', team: 'CAVARENO', logo: '/logos/cavareno.png', goals: 7 },
  { pos: 7, name: 'TOMMASO BERTAGNOLLI', team: 'TAIO', logo: '/logos/taio.png', goals: 7 },
  { pos: 8, name: 'ALBERTO ZUCOL', team: 'SARNONICO', logo: '/logos/sarnonico.png', goals: 7 },
  { pos: 9, name: 'RENIS KUSI', team: 'FONDO', logo: '/logos/fondo.png', goals: 6 },
  { pos: 10, name: 'FRANCESCO ZANONI', team: 'CLOZ', logo: '/logos/cloz.png', goals: 5 },
  { pos: 11, name: 'LUCA MARTINI', team: "REVO'", logo: '/logos/revo.png', goals: 5 },
  { pos: 12, name: 'GABRIELE MARGONI', team: 'TAIO', logo: '/logos/taio.png', goals: 5 },
  { pos: 13, name: 'LUCA ZADRA', team: 'TAIO', logo: '/logos/taio.png', goals: 5 },
];

// Icona medaglia
const MedalIcon = ({ type }: { type: 'gold' | 'silver' | 'bronze' }) => {
  const colors = {
    gold: { bg: '#F9E4A8', border: '#C9B037', text: '#8B7508' },
    silver: { bg: '#E8E8E8', border: '#A0A0A0', text: '#606060' },
    bronze: { bg: '#E8C8A8', border: '#B87333', text: '#8B5A2B' },
  };
  const c = colors[type];
  return (
    <div 
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <span className="text-[8px] font-black" style={{ color: c.text }}>
        {type === 'gold' ? '1°' : type === 'silver' ? '2°' : '3°'}
      </span>
    </div>
  );
};

export default function ClassifichePage() {
  const [activeTab, setActiveTab] = useState<'gironi' | 'fase-finale' | 'marcatori' | 'coppa-chiosco'>('gironi');
  const [phaseSubTab, setPhaseSubTab] = useState<'quarti' | 'semifinali' | 'finale'>('quarti');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'marcatori') {
      setActiveTab('marcatori');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER CON IMMAGINE */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image
          src="/header-standing.jpg"
          alt="Classifiche"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        
        {/* Titolo */}
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            CLASSIFICHE
          </h1>
        </div>
      </div>

      {/* TAB NAVIGATION - a cavallo della foto */}
      <div className="relative z-20 -mt-8 px-2 sm:px-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-1.5 flex gap-1">
          <button
            onClick={() => setActiveTab('gironi')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'gironi'
                ? 'bg-[#581C24] text-white shadow-md'
                : 'text-[#581C24] hover:bg-gray-100'
            }`}
          >
            GIRONI
          </button>
          <button
            onClick={() => setActiveTab('fase-finale')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'fase-finale'
                ? 'bg-[#581C24] text-white shadow-md'
                : 'text-[#581C24] hover:bg-gray-100'
            }`}
          >
            FASE FINALE
          </button>
          <button
            onClick={() => setActiveTab('marcatori')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'marcatori'
                ? 'bg-[#581C24] text-white shadow-md'
                : 'text-[#581C24] hover:bg-gray-100'
            }`}
          >
            MARCATORI
          </button>
          <button
            onClick={() => setActiveTab('coppa-chiosco')}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'coppa-chiosco'
                ? 'bg-[#581C24] text-white shadow-md'
                : 'text-[#581C24] hover:bg-gray-100'
            }`}
          >
            COPPA CHIOSCO
          </button>
        </div>
      </div>

      {/* CONTENUTO TAB */}
      <div className="px-3 sm:px-4">
        {activeTab === 'gironi' && (
          <>
            {/* GIRONE A */}
            <div className="mb-6">
              <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-3">
                GIRONE A
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header tabella */}
                <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[8px] font-bold text-gray-600 uppercase">
                  <div className="w-5 text-center flex-shrink-0">#</div>
                  <div className="flex-1 pl-1">SQUADRA</div>
                  <div className="w-6 text-center flex-shrink-0">PT</div>
                  <div className="w-5 text-center flex-shrink-0">PG</div>
                  <div className="w-4 text-center flex-shrink-0">V</div>
                  <div className="w-4 text-center flex-shrink-0">P</div>
                  <div className="w-4 text-center flex-shrink-0">S</div>
                  <div className="w-5 text-center flex-shrink-0">GF</div>
                  <div className="w-5 text-center flex-shrink-0">GS</div>
                  <div className="w-6 text-center flex-shrink-0">DR</div>
                </div>

                {/* Righe classifica */}
                <div className="divide-y divide-gray-100">
                  {STANDINGS.gironeA.map((team) => (
                    <div key={team.pos} className="flex items-center px-3 py-2">
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="font-bold text-xs text-gray-700">{team.pos}</span>
                      </div>
                      <div className="flex-1 pl-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[5px] text-gray-400">L</span>
                        </div>
                        <span className="font-bold text-[11px] text-[#000000] uppercase truncate">
                          {team.team}
                        </span>
                      </div>
                      <div className="w-6 text-center flex-shrink-0">
                        <span className="font-black text-xs text-[#581C24]">{team.pt}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.pg}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.v}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.p}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.s}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.gf}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.gs}</span>
                      </div>
                      <div className="w-6 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.dr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GIRONE B */}
            <div>
              <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-3">
                GIRONE B
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header tabella */}
                <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[8px] font-bold text-gray-600 uppercase">
                  <div className="w-5 text-center flex-shrink-0">#</div>
                  <div className="flex-1 pl-1">SQUADRA</div>
                  <div className="w-6 text-center flex-shrink-0">PT</div>
                  <div className="w-5 text-center flex-shrink-0">PG</div>
                  <div className="w-4 text-center flex-shrink-0">V</div>
                  <div className="w-4 text-center flex-shrink-0">P</div>
                  <div className="w-4 text-center flex-shrink-0">S</div>
                  <div className="w-5 text-center flex-shrink-0">GF</div>
                  <div className="w-5 text-center flex-shrink-0">GS</div>
                  <div className="w-6 text-center flex-shrink-0">DR</div>
                </div>

                {/* Righe classifica */}
                <div className="divide-y divide-gray-100">
                  {STANDINGS.gironeB.map((team) => (
                    <div key={team.pos} className="flex items-center px-3 py-2">
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="font-bold text-xs text-gray-700">{team.pos}</span>
                      </div>
                      <div className="flex-1 pl-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[5px] text-gray-400">L</span>
                        </div>
                        <span className="font-bold text-[11px] text-[#000000] uppercase truncate">
                          {team.team}
                        </span>
                      </div>
                      <div className="w-6 text-center flex-shrink-0">
                        <span className="font-black text-xs text-[#581C24]">{team.pt}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.pg}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.v}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.p}</span>
                      </div>
                      <div className="w-4 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.s}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.gf}</span>
                      </div>
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.gs}</span>
                      </div>
                      <div className="w-6 text-center flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{team.dr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'fase-finale' && (
          <>
            {/* SUB-TAB FASE FINALE */}
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-1.5 flex gap-1">
                <button
                  onClick={() => setPhaseSubTab('quarti')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    phaseSubTab === 'quarti'
                      ? 'bg-[#581C24] text-white shadow-md'
                      : 'text-[#581C24] hover:bg-gray-100'
                  }`}
                >
                  QUARTI
                </button>
                <button
                  onClick={() => setPhaseSubTab('semifinali')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    phaseSubTab === 'semifinali'
                      ? 'bg-[#581C24] text-white shadow-md'
                      : 'text-[#581C24] hover:bg-gray-100'
                  }`}
                >
                  SEMIFINALI
                </button>
                <button
                  onClick={() => setPhaseSubTab('finale')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    phaseSubTab === 'finale'
                      ? 'bg-[#581C24] text-white shadow-md'
                      : 'text-[#581C24] hover:bg-gray-100'
                  }`}
                >
                  FINALI
                </button>
              </div>
            </div>

            {/* BRACKET */}
            <div className="px-4 pb-8">
              {phaseSubTab === 'quarti' && (
                <div className="space-y-4 max-w-[220px] mx-auto">
                  {/* Card 1 - TAIO vs CLOZ */}
                  <Link href="/partite/1" className="block relative">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">TAIO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">CLOZ</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">1</span>
                      </div>
                    </div>
                    {/* Linea orizzontale */}
                    <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                  </Link>

                  {/* Card 2 - FONDO vs CASTELFONDO */}
                  <Link href="/partite/2" className="block relative">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">FONDO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">CASTELFONDO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">1</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                  </Link>

                  {/* Spazio tra bracket */}
                  <div className="h-2" />

                  {/* Card 3 - REVO' vs SARNONICO */}
                  <Link href="/partite/3" className="block relative">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">REVO'</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">4</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">SARNONICO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">3</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                  </Link>

                  {/* Card 4 - CAVARENO V vs ROMENO */}
                  <Link href="/partite/4" className="block relative">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">CAVARENO V</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">ROMENO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">3</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                  </Link>
                </div>
              )}

              {phaseSubTab === 'semifinali' && (
                <div className="relative max-w-[220px] mx-auto">
                  {/* PRIMA SEMIFINALE */}
                  <div className="relative mb-32">
                    {/* Linee di convergenza da sinistra */}
                    <div className="absolute -left-12 top-1/2 w-6 h-px bg-gray-300" />
                    <div className="absolute -left-6 top-1/2 w-px h-[100px] bg-gray-300" /> 
                    <div className="absolute -left-12 top-[140px] w-6 h-px bg-gray-300" /> 
                    <div className="absolute -left-6 top-[88px] w-6 h-px bg-gray-300" /> 

                    {/* Card Semifinale 1 - traslata con translate-y */}
                    <Link href="/partite/5" className="block relative translate-y-11">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[6px] text-gray-400">L</span>
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">TAIO</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">-</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[6px] text-gray-400">L</span>
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">FONDO</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">-</span>
                        </div>
                      </div>
                      {/* Linea orizzontale a destra */}
                      <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                    </Link>
                  </div>

                  {/* SECONDA SEMIFINALE */}
                  <div className="relative">
                    {/* Linee di convergenza da sinistra */}
                    <div className="absolute -left-12 top-1/2 w-6 h-px bg-gray-300" />
                    <div className="absolute -left-6 top-1/2 w-px h-[100px] bg-gray-300" /> 
                    <div className="absolute -left-12 top-[140px] w-6 h-px bg-gray-300" /> 
                    <div className="absolute -left-6 top-[88px] w-6 h-px bg-gray-300" />

                    {/* Card Semifinale 2 - traslata con translate-y */}
                    <Link href="/partite/6" className="block relative translate-y-12">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[6px] text-gray-400">L</span>
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">REVO'</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">-</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[6px] text-gray-400">L</span>
                            </div>
                            <span className="font-bold text-xs text-[#000000] uppercase truncate">CAVARENO V</span>
                          </div>
                          <span className="font-black text-base text-[#581C24] ml-2">-</span>
                        </div>
                      </div>
                      {/* Linea orizzontale a destra */}
                      <div className="absolute top-1/2 -right-12 w-12 h-px bg-gray-300" />
                    </Link>
                  </div>
                </div>
              )}
              {phaseSubTab === 'finale' && (
                <div className="relative max-w-[220px] mx-auto pt-8 pb-32">
                  {/* Linee dalle semifinali */}
                  <div className="absolute -left-12 top-24 w-6 h-px bg-gray-300" />
                  <div className="absolute -left-6 top-24 w-px h-[165px] bg-gray-300" />
                
                  <div className="absolute -left-12 top-[260px] w-6 h-px bg-gray-300" />
                  <div className="absolute -left-6 top-[180px] w-6 h-px bg-gray-300" />

                  {/* Card FINALE - ORO (1°-2° posto) */}
                  <Link href="/partite/7" className="block relative translate-y-[110px]">
                    <div className="bg-gradient-to-br from-[#F9E4A8] to-[#E8D49A] rounded-xl shadow-md border-2 border-[#C9B037] p-3 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">TAIO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">-</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">CAVARENO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">-</span>
                      </div>
                    </div>
                    {/* Linea verticale che scende dalla finale */}
                    <div className="absolute left-1/2 -bottom-16 w-px h-16 bg-gray-300 -translate-x-1/2" />
                  </Link>

                  {/* Card 3°-4° POSTO - BRONZO */}
                  <Link href="/partite/8" className="block relative translate-y-[160px]">
                    <div className="bg-gradient-to-br from-[#E8C8A8] to-[#D4B494] rounded-xl shadow-md border-2 border-[#B87333] p-3 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">FONDO</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">-</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[6px] text-gray-400">L</span>
                          </div>
                          <span className="font-bold text-xs text-[#000000] uppercase truncate">REVO'</span>
                        </div>
                        <span className="font-black text-base text-[#581C24] ml-2">-</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'marcatori' && (
          <div className="px-3 sm:px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header tabella */}
              <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                <div className="w-8 text-center flex-shrink-0">POS</div>
                <div className="flex-1 pl-2">GIOCATORE</div>
                <div className="w-20 text-center flex-shrink-0">SQUADRA</div>
                <div className="w-10 text-center flex-shrink-0">GOL</div>
              </div>

              {/* Righe marcatori */}
              <div className="divide-y divide-gray-100">
                {TOP_SCORERS.map((player) => (
                  <div key={player.pos} className="flex items-center px-3 py-2.5">
                    {/* POSIZIONE */}
                    <div className="w-8 text-center flex-shrink-0">
                      {player.pos === 1 ? (
                        <MedalIcon type="gold" />
                      ) : player.pos === 2 ? (
                        <MedalIcon type="silver" />
                      ) : player.pos === 3 ? (
                        <MedalIcon type="bronze" />
                      ) : (
                        <span className="font-bold text-xs text-gray-700">{player.pos}</span>
                      )}
                    </div>

                    {/* GIOCATORE */}
                    <div className="flex-1 pl-2 flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[5px] text-gray-400">L</span>
                      </div>
                      <span className="font-bold text-[11px] text-[#000000] uppercase truncate">
                        {player.name}
                      </span>
                    </div>

                    {/* SQUADRA */}
                    <div className="w-20 text-center flex-shrink-0">
                      <span className="text-[10px] text-gray-600 uppercase">
                        {player.team}
                      </span>
                    </div>

                    {/* GOL */}
                    <div className="w-10 text-center flex-shrink-0">
                      <span className="font-black text-sm text-[#581C24]">{player.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coppa-chiosco' && (
          <div className="px-3 sm:px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* PODIO - Prime 3 posizioni */}
              <div className="p-6 pb-8">
                <div className="flex items-end justify-center gap-4 sm:gap-8">
                  
                  {/* 2° POSTO - Argento */}
                  <div className="flex flex-col items-center flex-1 max-w-[100px]">
                    <div className="mb-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                        <span className="text-[8px] text-gray-400">LOGO</span>
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="font-bold text-xs text-[#581C24] uppercase">Sarnonico</p>
                      <p className="text-2xl font-black text-[#581C24]">57</p>
                      <p className="text-[8px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg shadow-md" />
                  </div>

                  {/* 1° POSTO - Oro */}
                  <div className="flex flex-col items-center flex-1 max-w-[120px] -mt-4">
                    <div className="mb-2 relative">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#FFD700]">
                        <span className="text-[8px] text-gray-400">LOGO</span>
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="font-bold text-sm text-[#581C24] uppercase">Amblar-Don</p>
                      <p className="text-3xl font-black text-[#581C24]">64</p>
                      <p className="text-[8px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-12 bg-gradient-to-b from-[#F9E4A8] to-[#C9B037] rounded-t-lg shadow-lg" />
                  </div>

                  {/* 3° POSTO - Bronzo */}
                  <div className="flex flex-col items-center flex-1 max-w-[100px]">
                    <div className="mb-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#CD7F32]">
                        <span className="text-[8px] text-gray-400">LOGO</span>
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="font-bold text-xs text-[#581C24] uppercase">Revò</p>
                      <p className="text-2xl font-black text-[#581C24]">43</p>
                      <p className="text-[8px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-6 bg-gradient-to-b from-[#E8C8A8] to-[#B87333] rounded-t-lg shadow-md" />
                  </div>
                </div>
              </div>

              {/* Classifica dal 4° all'8° posto */}
              <div className="border-t border-gray-200 px-3 py-4">
                <div className="space-y-3">
                  {[
                    { pos: 4, team: 'Castelfondo', meters: 26, logo: '/logos/castelfondo.png' },
                    { pos: 5, team: 'Lover', meters: 17, logo: '/logos/lover.png' },
                    { pos: 6, team: 'Romallo', meters: 17, logo: '/logos/romallo.png' },
                    { pos: 7, team: 'Fondo', meters: 12, logo: '/logos/fondo.png' },
                    { pos: 8, team: 'Cloz', meters: 11, logo: '/logos/cloz.png' },
                  ].map((item) => (
                    <div key={item.pos} className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                      {/* Posizione */}
                      <div className="w-6 text-center">
                        <span className="font-bold text-sm text-gray-700">{item.pos}</span>
                      </div>

                      {/* Logo */}
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[6px] text-gray-400">L</span>
                      </div>

                      {/* Nome squadra */}
                      <div className="flex-1">
                        <span className="font-bold text-xs text-[#000000] uppercase">
                          {item.team}
                        </span>
                      </div>

                      {/* Metri */}
                      <div className="text-right">
                        <p className="font-black text-sm text-[#581C24]">{item.meters}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}