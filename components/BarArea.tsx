'use client';

import { useState } from 'react';
import { Beer, Trophy, Minus, Sparkles } from 'lucide-react';
import Image from 'next/image';

const WHEEL_PRIZES = [
  'Birra Artigianale', 'Panino Gratis', 'Shot di Amaro', 'Caffè Offerto',
  'Doppia Birra', 'Patatine Fritte', 'Aperitivo Completo', 'Birra alla Spina',
];

// ============================================================
// VISTA TV - Classifica Metri in Tempo Reale
// ============================================================
export function BarTVView({ 
  meters, 
  teamsMap,
  celebrationTeam 
}: { 
  meters: Record<string, number>; 
  teamsMap: Record<string, { id: string; name: string; logo_url: string | null }>;
  celebrationTeam: string | null 
}) {
  // Ordina squadre per metri decrescente
  const sortedTeams = Object.entries(meters)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => ({ ...teamsMap[id], count }))
    .filter(t => t.name); // Filtra eventuali team non trovati

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#581C24] via-[#7A2D3A] to-[#581C24] text-white relative">

      {/* LAYOUT A 3 COLONNE: COPPA | Classifica | CHIOSCO */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* === LATO SINISTRO: Scritta COPPA === */}
        <div className="w-24 flex-shrink-0 flex items-center justify-center relative">
          <div 
            className="text-[#FFD700] font-black uppercase select-none"
            style={{ 
              writingMode: 'vertical-rl',
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              textShadow: '3px 3px 0 #581C24, 6px 6px 15px rgba(0,0,0,0.5)',
              letterSpacing: '0.3em',
              transform: 'rotate(180deg)'
            }}
          >
            COPPA
          </div>
        </div>

        {/* === CENTRO: Classifica === */}
        <div className="flex-1 flex flex-col min-h-0 px-4 py-2">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
            
            {/* PODIO - Prime 3 posizioni */}
            <div className="pt-8 p-4 pb-2 flex-shrink-0">
              <div className="flex items-end justify-center gap-6">
                
                {sortedTeams[1] && (
                  <div className="flex flex-col items-center flex-1 max-w-[140px]">
                    <div className="mb-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300 shadow-md overflow-hidden">
                        {sortedTeams[1].logo_url ? (
                          <Image src={sortedTeams[1].logo_url} alt="" width={64} height={64} className="object-cover" />
                        ) : <span className="text-[9px] text-gray-400 font-bold">LOGO</span>}
                      </div>
                    </div>
                    <div className="text-center mb-1">
                      <p className="font-bold text-base text-[#581C24] uppercase truncate w-full">{sortedTeams[1].name}</p>
                      <p className="text-3xl font-black text-[#581C24]">{sortedTeams[1].count}</p>
                      <p className="text-[9px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg shadow-md" />
                  </div>
                )}

                {sortedTeams[0] && (
                  <div className="flex flex-col items-center flex-1 max-w-[160px] -mt-4">
                    <div className="mb-1 relative">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#FFD700] shadow-lg overflow-hidden">
                        {sortedTeams[0].logo_url ? (
                          <Image src={sortedTeams[0].logo_url} alt="" width={80} height={80} className="object-cover" />
                        ) : <span className="text-[9px] text-gray-400 font-bold">LOGO</span>}
                      </div>
                      <div className="absolute -top-2 -right-2 bg-[#FFD700] text-[#581C24] px-2 py-1 rounded-full font-black text-sm shadow-lg">
                        1°
                      </div>
                    </div>
                    <div className="text-center mb-1">
                      <p className="font-bold text-lg text-[#581C24] uppercase truncate w-full">{sortedTeams[0].name}</p>
                      <p className="text-4xl font-black text-[#581C24]">{sortedTeams[0].count}</p>
                      <p className="text-[9px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-12 bg-gradient-to-b from-[#F9E4A8] to-[#C9B037] rounded-t-lg shadow-lg" />
                  </div>
                )}

                {sortedTeams[2] && (
                  <div className="flex flex-col items-center flex-1 max-w-[140px]">
                    <div className="mb-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#CD7F32] shadow-md overflow-hidden">
                        {sortedTeams[2].logo_url ? (
                          <Image src={sortedTeams[2].logo_url} alt="" width={64} height={64} className="object-cover" />
                        ) : <span className="text-[9px] text-gray-400 font-bold">LOGO</span>}
                      </div>
                    </div>
                    <div className="text-center mb-1">
                      <p className="font-bold text-base text-[#581C24] uppercase truncate w-full">{sortedTeams[2].name}</p>
                      <p className="text-3xl font-black text-[#581C24]">{sortedTeams[2].count}</p>
                      <p className="text-[9px] text-gray-500 uppercase">metri</p>
                    </div>
                    <div className="w-full h-6 bg-gradient-to-b from-[#E8C8A8] to-[#B87333] rounded-t-lg shadow-md" />
                  </div>
                )}
              </div>
            </div>

            {/* Classifica dal 4° al 12° */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                {sortedTeams.slice(3).map((team, index) => {
                  const pos = index + 4;
                  return (
                    <div key={team.id} className="flex items-center gap-3 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="w-8 text-center flex-shrink-0">
                        <span className="font-bold text-base text-gray-700">{pos}°</span>
                      </div>
                      <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-100 overflow-hidden">
                        {team.logo_url ? (
                          <Image src={team.logo_url} alt="" width={36} height={36} className="object-cover" />
                        ) : <span className="text-[7px] text-gray-400 font-bold">LOGO</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-base text-[#000000] uppercase truncate block">
                          {team.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg text-[#581C24] leading-tight">{team.count}</p>
                        <p className="text-[8px] text-gray-500 uppercase">metri</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* === LATO DESTRO: Scritta CHIOSCO === */}
        <div className="w-24 flex-shrink-0 flex items-center justify-center relative">
          <div 
            className="text-[#FFD700] font-black uppercase select-none"
            style={{ 
              writingMode: 'vertical-rl',
              fontSize: 'clamp(2.5rem, 5vw, 5rem)',
              textShadow: '3px 3px 0 #581C24, 6px 6px 15px rgba(0,0,0,0.5)',
              letterSpacing: '0.3em'
            }}
          >
            CHIOSCO
          </div>
        </div>
      </div>

      {/* Footer Partita in Corso (Placeholder per ora) */}
      <div className="bg-gradient-to-t from-[#581C24] to-[#7A2D3A] py-3 px-6 border-t-4 border-[#FFD700] flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center relative">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-lg font-bold uppercase tracking-wider">Partita in Corso</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-black uppercase">...</p>
            </div>
            <div className="text-5xl font-black bg-white/20 px-6 py-2 rounded-2xl">
              -
            </div>
            <div className="text-left">
              <p className="text-2xl font-black uppercase">...</p>
            </div>
          </div>
          <div className="w-48 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISTA CASSA - Gestione Metri con Supabase
// ============================================================
export function BarCassaView({ 
  teams, 
  meters, 
  onAdd, 
  onRemove 
}: { 
  teams: Array<{ id: string; name: string; logo_url: string | null }>;
  meters: Record<string, number>;
  onAdd: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#F5F5F7] p-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1">
        {teams.map((team) => {
          const count = meters[team.id] || 0;
          return (
            <div 
              key={team.id} 
              className="bg-white rounded-xl shadow-sm border-2 border-gray-100 flex flex-col justify-between overflow-hidden active:scale-95 transition-transform"
            >
              <div 
                onClick={() => onAdd(team.id, team.name)}
                className="flex flex-col items-center justify-center p-2 gap-1 cursor-pointer flex-1"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {team.logo_url ? (
                    <Image src={team.logo_url} alt="" width={40} height={40} className="object-cover" />
                  ) : <span className="text-[8px] text-gray-400 font-bold">LOGO</span>}
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#581C24] uppercase text-center leading-tight line-clamp-2">
                  {team.name}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Beer className="w-4 h-4 text-[#581C24]" />
                  <span className="text-2xl sm:text-3xl font-black text-gray-800">{count}</span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onRemove(team.id); }}
                disabled={count === 0}
                className="w-full bg-red-50 text-red-600 font-bold py-2 flex items-center justify-center gap-1 active:bg-red-100 border-t-2 border-red-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Minus className="w-4 h-4" /> 
                <span className="uppercase">Correggi</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// VISTA PREMI - Ruota della Fortuna (UI Only)
// ============================================================
export function BarPremiView() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);
    const newRotation = rotation + 1800 + Math.floor(Math.random() * 360);
    setRotation(newRotation);
    setTimeout(() => {
      setWinner(WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)]);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center p-4">
      <h2 className="text-4xl font-black text-[#581C24] uppercase text-center mb-8">Ruota della Fortuna</h2>
      <div className="relative mb-8">
        <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-8 border-[#581C24] shadow-2xl bg-white flex items-center justify-center">
          <div 
            className="w-full h-full rounded-full"
            style={{ 
              transform: `rotate(${rotation}deg)`, 
              transition: isSpinning ? 'transform 4s ease-out' : 'none',
              background: 'conic-gradient(from 0deg, #581C24 0deg 45deg, #FFD700 45deg 90deg, #581C24 90deg 135deg, #FFD700 135deg 180deg, #581C24 180deg 225deg, #FFD700 225deg 270deg, #581C24 270deg 315deg, #FFD700 315deg 360deg)'
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full border-8 border-[#581C24] flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-[#581C24]" />
        </div>
      </div>
      <button
        onClick={spinWheel}
        disabled={isSpinning}
        className="px-16 py-6 rounded-2xl font-black text-2xl uppercase bg-gradient-to-r from-[#581C24] to-[#7A2D3A] text-white disabled:bg-gray-300"
      >
        {isSpinning ? 'La ruota gira...' : 'Gira la Ruota!'}
      </button>
      {winner && !isSpinning && (
        <div className="mt-8 bg-gradient-to-br from-[#FFD700] to-[#FFA500] border-8 border-[#581C24] rounded-3xl p-8 text-center">
          <h3 className="text-4xl sm:text-5xl font-black text-[#581C24] uppercase mb-4">{winner}</h3>
        </div>
      )}
    </div>
  );
}