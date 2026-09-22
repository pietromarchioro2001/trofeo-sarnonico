'use client'

import Image from 'next/image'

export interface TeamStats {
  id: string
  name: string
  logo_url: string | null
  pt: number
  pg: number
  v: number
  p: number
  s: number
  gf: number
  gs: number
  dr: number
}

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
            {/* intestazione */}
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
                  key={team.id}
                  className="flex items-center px-3 py-2"
                >
                  <div className="w-5 text-center font-bold text-xs">
                    {index + 1}
                  </div>

                  <div className="flex-1 pl-1 flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                      {team.logo_url && (
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      )}
                    </div>

                    <span className="font-bold text-[11px] uppercase truncate">
                      {team.name}
                    </span>
                  </div>

                  <div className="w-6 text-center font-black text-xs text-[#581C24]">
                    {team.pt}
                  </div>

                  <div className="w-5 text-center text-[10px]">{team.pg}</div>
                  <div className="w-4 text-center text-[10px]">{team.v}</div>
                  <div className="w-4 text-center text-[10px]">{team.p}</div>
                  <div className="w-4 text-center text-[10px]">{team.s}</div>
                  <div className="w-5 text-center text-[10px]">{team.gf}</div>
                  <div className="w-5 text-center text-[10px]">{team.gs}</div>

                  <div className="w-6 text-center text-[10px]">
                    {team.dr > 0 ? `+${team.dr}` : team.dr}
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
