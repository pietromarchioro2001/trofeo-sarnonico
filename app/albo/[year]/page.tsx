'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type TabType = "gironi" | "marcatori" | "fase-finale" | "media"

interface TeamStats {
  id: string
  name: string
  logo_url: string | null
  girone: "A" | "B"
  pt: number
  pg: number
  v: number
  p: number
  s: number
  gf: number
  gs: number
  dr: number
}

interface MatchCard {
  id: string
  phase: string
  home_team: {
    name: string
    logo_url: string | null
  }
  away_team: {
    name: string
    logo_url: string | null
  }
  home_score: number
  away_score: number
  home_penalties?: number | null
  away_penalties?: number | null
}

interface TopScorer {
  id: string
  first_name: string
  last_name: string
  goals: number
  team: {
    name: string
    logo_url: string | null
  }
}

interface AlboDoroSnapshot {
  id: string
  year: number
  winner: string
  runner_up: string

  standings_snapshot: {
    gironeA: TeamStats[]
    gironeB: TeamStats[]
  }

  scorers_snapshot: TopScorer[]

  bracket_snapshot: {
    quarti: MatchCard[]
    semifinali: MatchCard[]
    finali: MatchCard[]
  }

  media_zip_url: string | null
}

export default function AlboDoroPage() {
  const { year } = useParams<{ year: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<AlboDoroSnapshot | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>("gironi")
  const [phaseSubTab, setPhaseSubTab] = useState<"quarti" | "semifinali" | "finale">("quarti")

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("albo_doro")
        .select("*")
        .eq("year", Number(year))
        .single()

      if (!error && data) {
        setSnapshot(data)

        if (data.bracket_snapshot.finali.length > 0)
          setPhaseSubTab("finale")
        else if (data.bracket_snapshot.semifinali.length > 0)
          setPhaseSubTab("semifinali")
        else
          setPhaseSubTab("quarti")
      }

      setLoading(false)
    }

    load()
  }, [year])

  const gironeA = snapshot?.standings_snapshot.gironeA ?? []
  const gironeB = snapshot?.standings_snapshot.gironeB ?? []
  const marcatori = snapshot?.scorers_snapshot ?? []
  const quarti = snapshot?.bracket_snapshot.quarti ?? []
  const semifinali = snapshot?.bracket_snapshot.semifinali ?? []
  const finali = snapshot?.bracket_snapshot.finali ?? []

  const currentMatches =
  phaseSubTab === "quarti"
    ? quarti
    : phaseSubTab === "semifinali"
    ? semifinali
    : finali;

  const MedalIcon = ({ type }: { type: "gold" | "silver" | "bronze" }) => {
    const colors = {
      gold: ["#F9E4A8", "#C9B037"],
      silver: ["#E8E8E8", "#A0A0A0"],
      bronze: ["#E8C8A8", "#B87333"],
    };
  
    const c = colors[type];
  
    return (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center border"
        style={{ background: c[0], borderColor: c[1] }}
      >
        <span className="text-[8px] font-black">
          {type === "gold" ? "1°" : type === "silver" ? "2°" : "3°"}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-standing.jpg" alt="Classifiche" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            TROFEO SARNONICO {year}
          </h1>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="relative z-20 -mt-8 px-2 sm:px-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-1.5 flex gap-1">
          {(['gironi', 'marcatori', 'fase-finale', 'media'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-100'
              }`}
            >
              {tab === 'gironi' ? 'GIRONI' : tab === 'marcatori' ? 'MARCATORI' : tab === 'fase-finale' ? 'FASE FINALE' : tab === 'media' ? 'MEDIA'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENUTO TAB */}
      <div className="px-3 sm:px-4">
        {/* === GIRONI === */}
        {activeTab === "gironi" && (
          <>
            {[
              { title: "GIRONE A", teams: gironeA },
              { title: "GIRONE B", teams: gironeB }
            ].map((g) => (
              <div key={g.title} className="mb-6">
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
                      <div key={team.id} className="flex items-center px-3 py-2">
        
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
        
                        <div className="w-6 text-center font-black text-xs text-[#581C24]">{team.pt}</div>
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
          </>
        )}

        {/* === MARCATORI === */}
        {activeTab === "marcatori" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        
            <div className="flex items-center px-3 py-2 bg-gray-50 border-b text-[10px] font-bold uppercase text-gray-600">
              <div className="w-8 text-center">Pos</div>
              <div className="flex-1 pl-2">Giocatore</div>
              <div className="w-10 text-center">Gol</div>
            </div>
        
            {marcatori.slice(0,10).map((p, index) => (
              <div key={p.id} className="flex items-center px-3 py-2.5 border-b last:border-0">
        
                <div className="w-8 flex justify-center">
                  {index===0 ? <MedalIcon type="gold"/> :
                   index===1 ? <MedalIcon type="silver"/> :
                   index===2 ? <MedalIcon type="bronze"/> :
                   <span className="font-bold text-xs">{index+1}</span>}
                </div>
        
                <div className="flex-1 flex items-center gap-2 min-w-0">
        
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                    {p.team.logo_url && (
                      <Image
                        src={p.team.logo_url}
                        alt={p.team.name}
                        width={20}
                        height={20}
                      />
                    )}
                  </div>
        
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] uppercase truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[9px] uppercase text-gray-500 truncate">
                      {p.team.name}
                    </p>
                  </div>
        
                </div>
        
                <div className="w-10 text-center font-black text-[#581C24] text-lg">
                  {p.goals}
                </div>
        
              </div>
            ))}
        
          </div>
        )}

        {/* === FASE FINALE === */}
        {activeTab === 'fase-finale' && (
          <>
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-1.5 flex gap-1">
                {(['quarti', 'semifinali', 'finale'] as const).map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setPhaseSubTab(subTab)}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                      phaseSubTab === subTab ? 'bg-[#581C24] text-white shadow-md' : 'text-[#581C24] hover:bg-gray-100'
                    }`}
                  >
                    {subTab === 'quarti' ? 'QUARTI' : subTab === 'semifinali' ? 'SEMIFINALI' : 'FINALI'}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-8">
              {currentMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-xl shadow-sm border p-3 mb-3"
                >
                  {/* Squadra casa */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.home_team.logo_url && (
                        <Image
                          src={match.home_team.logo_url}
                          alt={match.home_team.name}
                          width={26}
                          height={26}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-bold text-xs uppercase truncate">
                        {match.home_team.name}
                      </span>
                    </div>
            
                    <span className="font-black text-lg text-[#581C24]">
                      {match.home_score}
                    </span>
                  </div>
            
                  {/* Eventuali rigori */}
                  {match.home_penalties != null &&
                    match.away_penalties != null && (
                      <div className="text-[10px] text-right text-purple-600 font-bold py-1">
                        dcr ({match.home_penalties}-{match.away_penalties})
                      </div>
                    )}
            
                  {/* Squadra ospite */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.away_team.logo_url && (
                        <Image
                          src={match.away_team.logo_url}
                          alt={match.away_team.name}
                          width={26}
                          height={26}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-bold text-xs uppercase truncate">
                        {match.away_team.name}
                      </span>
                    </div>
            
                    <span className="font-black text-lg text-[#581C24]">
                      {match.away_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* === MEDIA === */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#581C24]/10 flex items-center justify-center mb-4">
              <svg
                  className="w-10 h-10 text-[#581C24]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7l9 4 9-4M3 17l9 4 9-4M3 12l9 4 9-4"
                  />
                </svg>
            </div>
          
            <h3 className="font-black text-[#581C24] uppercase">
              Media Trofeo {year}
            </h3>
          
            <p className="text-sm text-gray-500 mt-2 mb-5">
              Archivio completo delle fotografie del torneo.
            </p>
          
            {snapshot?.media_zip_url ? (
              <a
                href={snapshot.media_zip_url}
                download
                className="inline-flex items-center gap-2 bg-[#581C24] text-white px-5 py-3 rounded-xl font-bold"
              >
                Scarica archivio ZIP
              </a>
            ) : (
              <p className="text-sm italic text-gray-400">
                Archivio non disponibile
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
