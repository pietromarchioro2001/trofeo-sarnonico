'use client'

import Image from 'next/image'
import type { TeamStats } from '@/components/AdminButtons'

interface Props {
  gironeA: TeamStats[]
  gironeB: TeamStats[]
}

export default function GironiSnapshot({
  gironeA,
  gironeB,
}: Props) {
  const groups = [
    { title: 'GIRONE A', teams: gironeA },
    { title: 'GIRONE B', teams: gironeB },
  ]

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-3">
            {g.title}
          </h2>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

            <div className="flex items-center px-3 py-2 bg-gray-50 border-b text-[8px] font-bold text-gray-600 uppercase">
              <div className="w-5 text-center">#</div>
              <div className="flex-1 pl-1">Squadra</div>
              <div className="w-6 text-center">PT</div>
              <div className="w-5 text-center">PG</div>
              <div className="w-4 text-center">V</div>
              <div className="w-4 text-center">P</div>
              <div className="w-4 text-center">S</div>
              <div className="w-5 text-center">GF</div>
              <div className="w-5 text-center">GS</div>
              <div className="w-6 text-center">DR</div>
            </div>

            <div className="divide-y divide-gray-100">
              {g.teams.map((team, index) => (
                <div
                  key={`${g.title}-${team.team}-${index}`}
                  className="flex items-center px-3 py-2"
                >
                  <div className="w-5 text-center font-bold text-xs">
                    {index + 1}
                  </div>

                  <div className="flex-1 pl-1 flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {team.logo && (
                        <Image
                          src={team.logo}
                          alt={team.team}
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      )}
                    </div>

                    <span className="font-bold text-[11px] uppercase truncate">
                      {team.team}
                    </span>
                  </div>

                  <div className="w-6 text-center font-black text-xs text-[#581C24]">
                    {team.punti}
                  </div>

                  <div className="w-5 text-center text-[10px]">
                    {team.giocate}
                  </div>

                  <div className="w-4 text-center text-[10px]">
                    {team.vittorie}
                  </div>

                  <div className="w-4 text-center text-[10px]">
                    {team.pareggi}
                  </div>

                  <div className="w-4 text-center text-[10px]">
                    {team.sconfitte}
                  </div>

                  <div className="w-5 text-center text-[10px]">
                    {team.gol_fatti}
                  </div>

                  <div className="w-5 text-center text-[10px]">
                    {team.gol_subiti}
                  </div>

                  <div className="w-6 text-center text-[10px]">
                    {team.diff > 0 ? `+${team.diff}` : team.diff}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}
