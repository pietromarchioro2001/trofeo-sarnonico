'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import {
  AdminLiberatorieManager,
  AdminMultiUpload,
  AdminContactsEditor,
  AdminSaveAlboDoro,
  type AlboDoroData,
  type TeamLiberatorie,
  type UploadedDocument,
  type EventoProloco,
  type Sponsor,
  type ContattiData,
} from "@/components/AdminButtons";

// ✅ AGGIUNTO 'social' ai tipi
type SectionId = 'liberatorie' | 'albo-oro' | 'regolamento' | 'eventi' | 'sponsor' | 'contatti' | 'social';

// ✅ AGGIUNTO l'oggetto 'social' all'inizio dell'array
const MENU_ITEMS: { id: SectionId; title: string; restricted: boolean; icon: JSX.Element }[] = [
  {
    id: 'social',
    title: 'Post Social',
    restricted: true,
    icon: (
      <svg className="w-6 h-6 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    id: 'liberatorie',
    title: 'Liberatorie',
    restricted: true,
    icon: (
      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'albo-oro',
    title: "Albo d'oro",
    restricted: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'regolamento',
    title: 'Regolamento',
    restricted: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'eventi',
    title: 'Eventi proloco',
    restricted: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'sponsor',
    title: 'Sponsor ufficiali',
    restricted: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'contatti',
    title: 'Contatti',
    restricted: false,
    icon: (
      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
];

export default function AltroPage() {
  const { isStaffMode, isCaptainMode, accessTeamId } = useAuth();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTournamentLocked, setIsTournamentLocked] = useState(false);
  const [teamsLiberatorie, setTeamsLiberatorie] = useState<TeamLiberatorie[]>([]);
  const [templateDoc, setTemplateDoc] = useState<UploadedDocument | undefined>(undefined);
  const [regolamentoDocs, setRegolamentoDocs] = useState<UploadedDocument[]>([]);
  const [eventi, setEventi] = useState<EventoProloco[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [contatti, setContatti] = useState<ContattiData>({
    phone: '+39 012 3456789',
    email: 'info@proloco.it',
    facebook: 'https://facebook.com/proloco',
    instagram: 'https://instagram.com/proloco',
    whatsapp: '+39 333 1234567'
  });
  const [alboDoro, setAlboDoro] = useState<AlboDoroData[]>([]);
  const [isGenerating, setIsGenerating] = useState<'coming-soon' | 'classifica' | 'partite-giornata' | null>(null);

  useEffect(() => {
    const fetchAltroData = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        const { data: sponsorsData } = await supabase
          .from('sponsors')
          .select('id, name, logo_url, website_url')
          .order('display_order', { ascending: true });
        
        if (sponsorsData) {
          setSponsors(sponsorsData.map(s => ({
            id: s.id,
            name: s.name,
            logoUrl: s.logo_url || '',
            website: s.website_url || undefined
          })));
        }

          const { data: alboData } = await supabase
            .from("albo_doro")
            .select(`
              id,
              year,
              winner,
              standings_snapshot,
              scorers_snapshot,
              bracket_snapshot,
              media_zip_url
            `)
            .order("year", { ascending: false });
          
          if (alboData) {
            setAlboDoro(alboData as AlboDoroData[]);
          }

        const { data: contactsData } = await supabase
          .from("contacts")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (contactsData) {
          setContatti({
            phone: contactsData.phone ?? "",
            email: contactsData.email ?? "",
            facebook: contactsData.facebook ?? "",
            instagram: contactsData.instagram ?? "",
            whatsapp: contactsData.whatsapp ?? "",
          });
        }

        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (docsData) {
          setRegolamentoDocs(
              docsData
                .filter(d => d.document_category === "regolamento")
                .map(d => ({
                  id: d.id,
                  url: d.file_url,
                  fileName: d.file_name,
                  uploadedAt: d.uploaded_at,
                  uploadedBy: d.uploaded_by ?? "",
                }))
            );
          
          setEventi(docsData.filter(d => d.document_category === 'altro').map(d => ({
            id: d.id, url: d.file_url, type: d.file_type === "application/pdf" ? "pdf" : "image", uploadedAt: d.uploaded_at
          })));

          const { data: teamsData } = await supabase.from('teams').select('id, name');
          const liberatorieMap: Record<string, UploadedDocument[]> = {};
          
          if (teamsData) {
            docsData.filter(d => d.document_category === 'liberatoria').forEach(doc => {
              if (!liberatorieMap[doc.team_id]) liberatorieMap[doc.team_id] = [];
              liberatorieMap[doc.team_id].push({
                id: doc.id, url: doc.file_url, fileName: doc.file_name,
                uploadedAt: doc.uploaded_at, uploadedBy: doc.uploaded_by || ''
              });
            });

            setTeamsLiberatorie(teamsData.map(t => ({
              teamId: t.id,
              teamName: t.name,
              documents: liberatorieMap[t.id] || []
            })));
          }
        }

        const template = docsData?.find(
          d => d.document_category === "template_liberatoria"
        );
        
        if (template) {
          setTemplateDoc({
            id: template.id,
            url: template.file_url,
            fileName: template.file_name,
            uploadedAt: template.uploaded_at,
            uploadedBy: template.uploaded_by,
          });
        }

        const { count: finalPhaseCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .in('phase', ['QUARTI', 'SEMIFINALI', 'FINALE', 'FINALE_3_4']);
        
        setIsTournamentLocked((finalPhaseCount || 0) > 0);

      } catch (err) {
        console.error('Errore fetch altro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAltroData();
  }, []);

  const handleRealUpload = async (
  files: FileList,
  category: "evento" | "sponsor" | "regolamento" | "liberatoria",
  teamId?: string
) => {
  if (!files.length) return;

  setLoading(true);
  const supabase = createClient();

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";

      let folder = "documents";
      let fileName = "";

      if (category === "regolamento") {
        fileName = `regolamento.${ext}`;

        await supabase.storage.from("tournament-files").remove([
          `${folder}/regolamento.pdf`,
          `${folder}/regolamento.doc`,
          `${folder}/regolamento.docx`,
        ]);
      }

      else if (category === "evento") {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");
        
          fileName = `evento_${cleanName}_${Date.now()}.${ext}`;
        }

      else if (category === "liberatoria") {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_");

        fileName = `liberatoria_${teamId}_${cleanName}.${ext}`;

        await supabase.storage
          .from("tournament-files")
          .remove([`${folder}/${fileName}`]);
      }

      else if (category === "sponsor") {
          folder = "sponsors";
        
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");
        
          fileName = `sponsor_${cleanName}_${Date.now()}.${ext}`;
        }

      const path = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("tournament-files")
        .upload(path, file, {
          upsert: true,
          cacheControl: "0",
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("tournament-files")
        .getPublicUrl(path);

      if (category === "sponsor") {
        await supabase.from("sponsors").insert({
          name: file.name.replace(/\.[^/.]+$/, ""),
          logo_url: `${publicUrl}?t=${Date.now()}`,
          website_url: null,
        });
      
        const { data } = await supabase
          .from("sponsors")
          .select("id,name,logo_url,website_url")
          .order("display_order", { ascending: true });
      
        setSponsors((data ?? []).map(s => ({
          id: s.id,
          name: s.name,
          logoUrl: s.logo_url,
          website: s.website_url ?? undefined,
        })));
      
        continue; // IMPORTANTISSIMO
      }

      if (category === "regolamento") {
        await supabase
          .from("documents")
          .delete()
          .eq("document_category", "regolamento");
      }
      
      await supabase.from("documents").insert({
        team_id: teamId || null,
        file_url: `${publicUrl}?t=${Date.now()}`,
        file_type: file.type,
        file_name: file.name,
        document_category:
          category === "liberatoria"
            ? "liberatoria"
            : category === "regolamento"
            ? "regolamento"
            : "altro",
      });
          // ===== Refresh REGOLAMENTO =====
    if (category === "regolamento") {
      const { data: refreshed } = await supabase
        .from("documents")
        .select("*")
        .eq("document_category", "regolamento")
        .order("uploaded_at", { ascending: false });

      setRegolamentoDocs(
        (refreshed ?? []).map(d => ({
          id: d.id,
          url: d.file_url,
          fileName: d.file_name,
          uploadedAt: d.uploaded_at,
          uploadedBy: d.uploaded_by ?? "",
        }))
      );

      alert("✅ Regolamento aggiornato!");
    }

    // ===== Refresh EVENTI =====
    if (category === "evento") {
      const { data: eventiRefresh } = await supabase
        .from("documents")
        .select("*")
        .eq("document_category", "altro")
        .order("uploaded_at", { ascending: false });

      setEventi(
        (eventiRefresh ?? []).map(d => ({
          id: d.id,
          url: d.file_url,
          type: d.file_type === "application/pdf" ? "pdf" : "image",
          uploadedAt: d.uploaded_at,
        }))
      );

      alert("✅ Evento caricato!");
    }
  }
  } catch (err) {
    console.error(err);
    alert("Errore nel caricamento dei documenti");
  } finally {
    setLoading(false);
  }
};

  const handleDeleteRegolamento = async (doc: UploadedDocument) => {
  if (!confirm(`Eliminare "${doc.fileName}"?`)) return;

  const supabase = createClient();

  try {
    // Ricava il path dello Storage dall'URL pubblico
    const storagePath = doc.url.split("/tournament-files/")[1]?.split("?")[0];

    if (storagePath) {
      await supabase.storage
        .from("tournament-files")
        .remove([storagePath]);
    }

    await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id);

    setRegolamentoDocs(prev => prev.filter(d => d.id !== doc.id));

    alert("✅ Regolamento eliminato");
  } catch (err) {
    console.error(err);
    alert("Errore durante l'eliminazione");
  }
};

  const handleDeleteEvento = async (doc: EventoProloco) => {
    if (!confirm("Eliminare questo documento?")) return;
  
    const supabase = createClient();
  
    try {
      // ricava il percorso nello Storage
      const path = decodeURIComponent(
        doc.url.split("/storage/v1/object/public/tournament-files/")[1].split("?")[0]
      );
  
      // elimina dallo Storage
      await supabase.storage
        .from("tournament-files")
        .remove([path]);
  
      // elimina dalla tabella documents
      await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);
  
      // aggiorna la UI
      setEventi(prev => prev.filter(e => e.id !== doc.id));
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione");
    }
  };

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
  if (!confirm(`Eliminare ${sponsor.name}?`)) return;

  const supabase = createClient();

  try {
    const path = decodeURIComponent(
      sponsor.logoUrl
        .split("/storage/v1/object/public/tournament-files/")[1]
        .split("?")[0]
    );

    await supabase.storage
      .from("tournament-files")
      .remove([path]);

    await supabase
      .from("sponsors")
      .delete()
      .eq("id", sponsor.id);

    setSponsors(prev => prev.filter(s => s.id !== sponsor.id));

  } catch (err) {
    console.error(err);
    alert("Errore eliminazione sponsor");
  }
};

  const handleSaveContacts = async (newContacts: ContattiData) => {
    const supabase = createClient();
  
    try {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .limit(1)
        .single();
  
      if (existing) {
        await supabase
          .from("contacts")
          .update({
            phone: newContacts.phone,
            email: newContacts.email,
            facebook: newContacts.facebook,
            instagram: newContacts.instagram,
            whatsapp: newContacts.whatsapp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("contacts").insert({
          ...newContacts,
        });
      }
  
      setContatti(newContacts);
      alert("✅ Contatti aggiornati");
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio");
    }
  };

  const toggleSection = (sectionId: SectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const showRestricted = isStaffMode || isCaptainMode;

    const handleSharePost = async (type: 'coming-soon' | 'classifica' | 'partite-giornata', fileName: string) => {
    setIsGenerating(type);
    try {
      const res = await fetch(`/api/social/generate?type=${type}&t=${Date.now()}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      // ✅ 1. Prova a usare la condivisione nativa (funziona su mobile e Safari/Chrome recenti)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Trofeo Sarnonico',
          text: 'Ecco il post del torneo!'
        });
      } else {
        // ✅ 2. Fallback: scarica il file se la condivisione non è supportata (es. desktop)
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Errore generazione post');
    } finally {
      setIsGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#581C24] font-bold uppercase">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-altro.jpg" alt="Altro" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">ALTRO</h1>
        </div>
      </div>

      <div className="relative z-10 mt-4 px-3 sm:px-4 space-y-3">
        {MENU_ITEMS.map((item) => {
          // Solo lo Staff vede "Post Social"
          if (item.id === "social" && !isStaffMode) return null;
          
          // Le altre sezioni riservate sono visibili anche ai Capitani
          if (item.restricted && !showRestricted) return null;
          const isOpen = openSection === item.id;

          return (
            <div key={item.id} className="space-y-2">
              <div onClick={() => toggleSection(item.id)} className={`bg-white rounded-xl shadow-md p-4 flex items-center gap-4 transition-all ${isOpen ? 'shadow-lg' : 'hover:shadow-lg'} cursor-pointer`}>
                <div className="flex-shrink-0">{item.icon}</div>
                <span className="flex-1 font-bold text-base text-gray-800">{item.title}</span>
                <svg className={`w-5 h-5 text-[#581C24] flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {isOpen && (
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {item.id === 'liberatorie' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Liberatorie</h2>
                      <AdminLiberatorieManager
                        teams={teamsLiberatorie}
                        templateDoc={templateDoc}
                        userRole={isStaffMode ? 'staff' : 'captain'}
                        userTeamId={accessTeamId || ''}
                        onUpdate={setTeamsLiberatorie}
                        onTemplateUpload={setTemplateDoc}
                        isTournamentLocked={isTournamentLocked}
                      />
                    </div>
                  )}

                  {item.id === "albo-oro" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider">
                          Albo d'Oro
                        </h2>
                  
                        {isStaffMode && (
                          <AdminSaveAlboDoro
                            currentYear={new Date().getFullYear()}
                            onSave={async (data) => {
                              const supabase = createClient();
                          
                              // Evita doppio salvataggio della stessa annata
                              const { data: existing } = await supabase
                                .from("albo_doro")
                                .select("id")
                                .eq("year", data.year)
                                .maybeSingle();
                          
                              if (existing) {
                                alert(`Esiste già l'albo d'oro ${data.year}`);
                                return;
                              }
                          
                              const { error } = await supabase.from("albo_doro").insert({
                                year: data.year,
                                winner: data.winner,
                                runner_up: data.runnerUp,
                                standings_snapshot: data.groupStandings,
                                scorers_snapshot: data.topScorers,
                                bracket_snapshot: data.playoffBracket,
                                media_zip_url: null
                              });
                          
                              if (error) {
                                console.error(error);
                                alert("Errore durante il salvataggio");
                                return;
                              }
                          
                              // Aggiorna subito la lista Albo d'Oro
                              const { data: anni } = await supabase
                                .from("albo_doro")
                                .select("id, year, winner")
                                .order("year", { ascending: false });
                          
                              setAlboDoro(anni ?? []);
                          
                              alert("🏆 Albo d'Oro salvato!");
                            }}
                          />
                        )}
                      </div>
                  
                      {alboDoro.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <p className="text-gray-500 font-medium">
                            Nessuna edizione archiviata.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {alboDoro.map((edizione) => (
                            <Link
                              key={edizione.id}
                              href={`/albo-doro/${edizione.year}`}
                              className="flex items-center justify-between p-4 rounded-xl bg-white border hover:border-[#581C24] hover:shadow-md transition-all"
                            >
                              <div>
                                <p className="font-black text-[#581C24]">
                                  TROFEO SARNONICO {edizione.year}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Vincitore: {edizione.winner}
                                </p>
                              </div>
                  
                              <ChevronRight className="w-5 h-5 text-[#581C24]" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {item.id === 'regolamento' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Regolamento</h2>
                      {regolamentoDocs.length > 0 ? (
                        <div className="space-y-3">
                          {regolamentoDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <a
                                href={doc.url}
                                target="_blank"
                                className="flex items-center gap-3 flex-1"
                              >
                                <svg
                                  className="w-5 h-5 text-[#6B1E1E]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3M5 20h14"
                                  />
                                </svg>
                        
                                <span className="font-medium">{doc.fileName}</span>
                              </a>
                        
                              {isStaffMode && (
                                <button
                                  onClick={() => handleDeleteRegolamento(doc)}
                                  className="ml-2 p-2 rounded-lg hover:bg-red-50 text-red-600"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7H5M10 11v6M14 11v6M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Documento non ancora disponibile.</p>
                      )}
                      {isStaffMode && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <input type="file" accept=".pdf" onChange={(e) => e.target.files && handleRealUpload(e.target.files, 'regolamento')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90" />
                        </div>
                      )}
                    </div>
                  )}

                  {item.id === 'eventi' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Eventi Pro Loco</h2>
                      {eventi.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {eventi.map(ev => (
                            <div
                              key={ev.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                              <a
                                href={ev.url}
                                target="_blank"
                                className="flex items-center gap-3 flex-1"
                              >
                                {ev.type === "image" ? (
                                  <Image
                                    src={ev.url}
                                    alt="Evento"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M7 7h10v10H7z M9 3h6v4H9z" />
                                    </svg>
                                  </div>
                                )}
                          
                                <div>
                                  <p className="font-medium text-sm">
                                    {ev.type === "image" ? "Immagine evento" : "PDF evento"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(ev.uploadedAt).toLocaleDateString("it-IT")}
                                  </p>
                                </div>
                              </a>
                          
                              {isStaffMode && (
                                <button
                                  onClick={() => handleDeleteEvento(ev)}
                                  className="ml-2 p-2 rounded-lg hover:bg-red-50 text-red-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7H5M10 11v6M14 11v6M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M9 7V4h6v3"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-500 text-center py-8">Nessun evento pubblicato.</p>}
                      {isStaffMode && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <input type="file" accept="image/*,.pdf" multiple onChange={(e) => e.target.files && handleRealUpload(e.target.files, 'evento')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90" />
                        </div>
                      )}
                    </div>
                  )}

                  {item.id === 'sponsor' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Sponsor Ufficiali</h2>
                      {sponsors.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          { sponsors.map(s => (
                            <div key={s.id} className="relative group">
                              <a
                                href={s.logoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block aspect-square rounded-xl overflow-hidden border bg-white"
                              >
                                <Image
                                  src={s.logoUrl}
                                  alt={s.name}
                                  fill
                                  className="object-contain p-3"
                                />
                              </a>
                          
                              {isStaffMode && (
                                <button
                                  onClick={() => handleDeleteSponsor(s)}
                                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7H5M10 11v6M14 11v6M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )) }
                        </div>
                      ) : <p className="text-gray-500 text-center py-8">Nessuno sponsor pubblicato.</p>}
                      {isStaffMode && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <input type="file" accept="image/*" onChange={(e) => e.target.files && handleRealUpload(e.target.files, 'sponsor')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90" />
                        </div>
                      )}
                    </div>
                  )}

                  {item.id === 'contatti' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Contatti</h2>
                      {isStaffMode ? (
                        <AdminContactsEditor
                          contacts={contatti}
                          onSave={handleSaveContacts}
                        />
                      ) : (
                        <div className="space-y-3">
                          {contatti.phone && <a href={`tel:${contatti.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"><div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div><div><p className="text-xs font-bold text-gray-500 uppercase">Telefono</p><p className="text-sm font-bold text-[#581C24]">{contatti.phone}</p></div></a>}
                          {contatti.email && <a href={`mailto:${contatti.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"><div className="w-10 h-10 bg-[#581C24]/10 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div><div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="text-sm font-bold text-[#581C24] break-all">{contatti.email}</p></div></a>}
                          {contatti.whatsapp && <a href={`https://wa.me/${contatti.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div><div><p className="text-xs font-bold text-green-700 uppercase">WhatsApp</p><p className="text-sm font-bold text-green-800">Scrivici su WhatsApp</p></div></a>}
                          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                            {contatti.facebook && <a href={contatti.facebook} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-bold text-sm">Facebook</a>}
                            {contatti.instagram && <a href={contatti.instagram} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 p-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors font-bold text-sm">Instagram</a>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ POST SOCIAL */}
                  {item.id === 'social' && isStaffMode && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-2">Genera Post Social</h2>
                      <p className="text-xs text-gray-500 mb-4">Clicca per generare e condividere l'immagine</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* COMING SOON */}
                        <button 
                          onClick={() => handleSharePost('coming-soon', `Coming_Soon_Trofeo_Sarnonico.png`)}
                          disabled={isGenerating !== null}
                          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group min-h-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating === 'coming-soon' ? (
                            <>
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Generazione...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Coming Soon</span>
                              <span className="text-[10px] text-gray-500 text-center leading-tight">Annuncio inizio torneo</span>
                            </>
                          )}
                        </button>

                        {/* CLASSIFICA */}
                        <button 
                          onClick={() => handleSharePost('classifica', `Classifica_Trofeo_Sarnonico_${Date.now()}.png`)}
                          disabled={isGenerating !== null}
                          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group min-h-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating === 'classifica' ? (
                            <>
                              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Generazione...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Classifica</span>
                              <span className="text-[10px] text-gray-500 text-center leading-tight">Classifica aggiornata gironi</span>
                            </>
                          )}
                        </button>

                        {/* PARTITE DELLA GIORNATA */}
                        <button 
                          onClick={() => handleSharePost('partite-giornata', `Partite_Giornata_${Date.now()}.png`)}
                          disabled={isGenerating !== null}
                          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all group min-h-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating === 'partite-giornata' ? (
                            <>
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Generazione...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="font-bold text-[#581C24] text-sm">Partite Giornata</span>
                              <span className="text-[10px] text-gray-500 text-center leading-tight">Prossime partite in programma</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
