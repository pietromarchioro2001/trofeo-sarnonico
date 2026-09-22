'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type TabType = "gironi" | "marcatori" | "fase-finale" | "media"

interface AlboDoroSnapshot {
  id: string
  year: number
  winner: string
  runner_up: string
  media_zip_url: string | null
}

type ScreenshotKey = 'gironi' | 'marcatori' | 'faseFinale'

export default function AlboDoroPage() {
  const { year } = useParams<{ year: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<AlboDoroSnapshot | null>(null)
  
  const [activeTab, setActiveTab] = useState<TabType>("gironi")
  
  const [screenshotUrls, setScreenshotUrls] = useState<{
    gironi: string | null
    marcatori: string | null
    faseFinale: string | null
  }>({
    gironi: null,
    marcatori: null,
    faseFinale: null,
  })

  const handleScreenshotError = (key: ScreenshotKey) => {
  setScreenshotUrls((prev) => ({
    ...prev,
    [key]: null,
  }))
}

  useEffect(() => {
  const load = async () => {
    const { data, error } = await supabase
      .from("albo_doro")
      .select("id, year, winner, runner_up, media_zip_url")
      .eq("year", Number(year))
      .single()

    if (!error && data) {
      setSnapshot(data)

      const storage = supabase.storage.from("tournament-files")

      const gironiUrl = storage.getPublicUrl(
        `albo-doro/${year}/gironi.png`
      ).data.publicUrl

      const marcatoriUrl = storage.getPublicUrl(
        `albo-doro/${year}/marcatori.png`
      ).data.publicUrl

      const faseFinaleUrl = storage.getPublicUrl(
        `albo-doro/${year}/fase-finale.png`
      ).data.publicUrl

      setScreenshotUrls({
        gironi: gironiUrl,
        marcatori: marcatoriUrl,
        faseFinale: faseFinaleUrl,
      })
    }

    setLoading(false)
  }

  load()
}, [year])

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
        <img
          src={`/header-standing.jpg?v=1`}
          alt="Classifiche"
          className="absolute inset-0 w-full h-full object-cover"
        />
      
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
      
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">
            TROFEO SARNONICO {year}
          </h1>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="relative z-20 -mt-8 px-3 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex justify-center gap-2 max-w-md mx-auto">
          {(['gironi', 'marcatori', 'fase-finale', 'media'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${
                activeTab === tab
                  ? 'bg-[#581C24] text-white shadow-md'
                  : 'text-[#581C24]'
              }`}
            >
              {tab === 'gironi'
                ? 'GIRONI'
                : tab === 'marcatori'
                ? 'MARCATORI'
                : tab === 'fase-finale'
                ? 'FASE FINALE'
                : 'MEDIA'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENUTO TAB */}
      <div className="px-3 sm:px-4">
        {/* === GIRONI === */}
        {activeTab === "gironi" && (
          <div className="flex justify-center">
            {screenshotUrls.gironi ? (
              <img
                src={screenshotUrls.gironi}
                alt={`Classifiche Trofeo Sarnonico ${year}`}
                onError={() => handleScreenshotError("gironi")}
                className="w-full max-w-[448px] h-auto rounded-xl shadow-sm"
              />
            ) : (
              <div className="w-full max-w-[448px] bg-white rounded-xl border p-8 text-center">
                <p className="text-sm italic text-gray-400">
                  Classifica non disponibile
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "marcatori" && (
          <div className="flex justify-center">
            {screenshotUrls.marcatori ? (
              <img
                src={screenshotUrls.marcatori}
                alt={`Marcatori Trofeo Sarnonico ${year}`}
                onError={() => handleScreenshotError("marcatori")}
                className="w-full max-w-[448px] h-auto rounded-xl shadow-sm"
              />
            ) : (
              <div className="w-full max-w-[448px] bg-white rounded-xl border p-8 text-center">
                <p className="text-sm italic text-gray-400">
                  Marcatori non disponibili
                </p>
              </div>
            )}
          </div>
        )}

        {/* === FASE FINALE === */}
        {activeTab === "fase-finale" && (
          <div className="flex justify-center">
            {screenshotUrls.faseFinale ? (
              <img
                src={screenshotUrls.faseFinale}
                alt={`Fase finale Trofeo Sarnonico ${year}`}
                onError={() => handleScreenshotError("faseFinale")}
                className="w-full max-w-[448px] h-auto rounded-xl shadow-sm"
              />
            ) : (
              <div className="w-full max-w-[448px] bg-white rounded-xl border p-8 text-center">
                <p className="text-sm italic text-gray-400">
                  Fase finale non disponibile
                </p>
              </div>
            )}
          </div>
        )}

        {/* === MEDIA === */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#581C24]/10 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 4 9-4M3 17l9 4 9-4M3 12l9 4 9-4" />
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
                className="inline-flex items-center gap-2 bg-[#581C24] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#581C24]/90 transition-colors"
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
