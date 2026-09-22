// components/albo/FaseFinaleSnapshot.tsx

'use client'

import Image from 'next/image'
import type { MatchCard } from '@/components/AdminButtons'

interface Props {
  quarti: MatchCard[]
  semifinali: MatchCard[]
  finale: MatchCard | null
  terzoQuarto: MatchCard | null
}

interface PhaseSectionProps {
  title: string
  matches: MatchCard[]
}

function MatchCardView({ match }: { match: MatchCard }) {
  const isFinished =
    match.played &&
    match.homeScore !== null &&
    match.awayScore !== null

  let homeWon = false
  let awayWon = false

  if (isFinished) {
    if (match.homeScore! > match.awayScore!) {
      homeWon = true
    } else if (match.awayScore! > match.homeScore!) {
      awayWon = true
    }
  }

  const homeLost = isFinished && awayWon
  const awayLost = isFinished && homeWon

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-3 py-3">

        {/* CASA */}
        <div
          className={`flex items-center justify-between gap-3 transition-opacity ${
            homeLost ? 'opacity-30' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
              {match.homeLogo ? (
                <Image
                  src={match.homeLogo}
                  alt={match.home}
                  width={28}
                  height={28}
                  className="object-cover"
                />
              ) : (
                <span className="text-[7px] text-gray-400">
                  L
                </span>
              )}
            </div>

            <span className="font-bold text-xs uppercase truncate">
              {match.home}
            </span>
          </div>

          <span className="font-black text-lg text-[#581C24]">
            {match.homeScore ?? '-'}
          </span>
        </div>

        {/* OSPITE */}
        <div
          className={`flex items-center justify-between gap-3 mt-2 transition-opacity ${
            awayLost ? 'opacity-30' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
              {match.awayLogo ? (
                <Image
                  src={match.awayLogo}
                  alt={match.away}
                  width={28}
                  height={28}
                  className="object-cover"
                />
              ) : (
                <span className="text-[7px] text-gray-400">
                  L
                </span>
              )}
            </div>

            <span className="font-bold text-xs uppercase truncate">
              {match.away}
            </span>
          </div>

          <span className="font-black text-lg text-[#581C24]">
            {match.awayScore ?? '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

function PhaseSection({
  title,
  matches,
}: PhaseSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-3">
        {title}
      </h2>

      {matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-5 text-center">
          <p className="text-xs text-gray-400 font-bold uppercase">
            Partite non disponibili
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, index) => (
            <MatchCardView
              key={`${title}-${match.home}-${match.away}-${index}`}
              match={match}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function FaseFinaleSnapshot({
  quarti,
  semifinali,
  finale,
  terzoQuarto,
}: Props) {
  return (
    <div className="space-y-7">
      <PhaseSection
        title="QUARTI DI FINALE"
        matches={quarti}
      />

      <PhaseSection
        title="SEMIFINALI"
        matches={semifinali}
      />

      {terzoQuarto && (
        <PhaseSection
          title="3° / 4° POSTO"
          matches={[terzoQuarto]}
        />
      )}

      {finale && (
        <PhaseSection
          title="FINALE"
          matches={[finale]}
        />
      )}
    </div>
  )
}
