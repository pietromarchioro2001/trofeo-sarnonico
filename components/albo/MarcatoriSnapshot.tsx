'use client'

import Image from 'next/image'
import type { TopScorer } from '@/components/AdminButtons'

interface Props {
  scorers: TopScorer[]
}

const MedalIcon = ({
  type,
}: {
  type: 'gold' | 'silver' | 'bronze'
}) => {
  const colors = {
    gold: {
      bg: '#F9E4A8',
      border: '#C9B037',
      text: '#8B7508',
    },
    silver: {
      bg: '#E8E8E8',
      border: '#A0A0A0',
      text: '#606060',
    },
    bronze: {
      bg: '#E8C8A8',
      border: '#B87333',
      text: '#8B5A2B',
    },
  }

  const c = colors[type]

  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
      }}
    >
      <span
        className="text-[8px] font-black"
        style={{ color: c.text }}
      >
        {type === 'gold'
          ? '1°'
          : type === 'silver'
          ? '2°'
          : '3°'}
      </span>
    </div>
  )
}

export default function MarcatoriSnapshot({
  scorers,
}: Props) {
  return (
    <div className="px-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
          <div className="w-8 text-center flex-shrink-0">
            POS
          </div>

          <div className="flex-1 pl-2">
            GIOCATORE
          </div>

          <div className="w-20 text-center flex-shrink-0">
            SQUADRA
          </div>

          <div className="w-10 text-center flex-shrink-0">
            GOL
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {scorers.length === 0 ? (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              Giocatori non presenti
            </div>
          ) : (
            scorers.map((player, index) => (
              <div
                key={`${player.player}-${player.team}-${index}`}
                className="flex items-center px-3 py-2.5"
              >
                <div className="w-8 text-center flex-shrink-0">
                  {index === 0 ? (
                    <MedalIcon type="gold" />
                  ) : index === 1 ? (
                    <MedalIcon type="silver" />
                  ) : index === 2 ? (
                    <MedalIcon type="bronze" />
                  ) : (
                    <span className="font-bold text-xs text-gray-700">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 pl-2 flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <span className="text-[5px] text-gray-400">
                      L
                    </span>
                  </div>

                  <span className="font-bold text-[11px] text-[#000000] uppercase truncate">
                    {player.player}
                  </span>
                </div>

                <div className="w-20 text-center flex-shrink-0">
                  <span className="text-[10px] text-gray-600 uppercase truncate">
                    {player.team}
                  </span>
                </div>

                <div className="w-10 text-center flex-shrink-0">
                  <span className="font-black text-sm text-[#581C24]">
                    {player.goals}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
