'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { uploadFile } from '@/lib/supabase/storage';
import {
  AdminLiberatorieManager,
  AdminMultiUpload,
  AdminContactsEditor,
  AdminSaveAlboDoro,
  type TeamLiberatorie,
  type UploadedDocument,
  type AlboDoroData,
  type EventoProloco,
  type Sponsor,
  type ContattiData
} from '@/components/AdminButtons';

type SectionId = 'liberatorie' | 'albo-oro' | 'regolamento' | 'eventi' | 'sponsor' | 'contatti';

const MENU_ITEMS: { id: SectionId; title: string; restricted: boolean; icon: JSX.Element }[] = [
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
  const { isStaffMode } = useAuth();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [userTeamId, setUserTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ✅ NUOVO: Stato per sapere se siamo in fase finale
  const [isTournamentLocked, setIsTournamentLocked] = useState(false);

  // Stati dati
  const [teamsLiberatorie, setTeamsLiberatorie] = useState<TeamLiberatorie[]>([]);
  const [templateDoc, setTemplateDoc] = useState<UploadedDocument | undefined>(undefined);
  const [alboDoro, setAlboDoro] = useState<AlboDoroData | null>(null);
  const [regolamentoDocs, setRegolamentoDocs] = useState<EventoProloco[]>([]);
  const [eventi, setEventi] = useState<EventoProloco[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [contatti, setContatti] = useState<ContattiData>({
    phone: '+39 012 3456789',
    email: 'info@proloco.it',
    facebook: 'https://facebook.com/proloco',
    instagram: 'https://instagram.com/proloco',
    whatsapp: '+39 333 1234567'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCaptain(localStorage.getItem('isCaptain') === 'true');
      setUserTeamId(localStorage.getItem('captainTeamId') || '');
    }
  }, []);

  useEffect(() => {
    const fetchAltroData = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. SPONSOR
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

        // 2. DOCUMENTI REGOLAMENTI/EVENTI/LIBERATORIE
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (docsData) {
          setRegolamentoDocs(docsData.filter(d => d.document_category === 'regolamento').map(d => ({
            id: d.id, url: d.file_url, type: d.file_type.includes('pdf') ? 'pdf' : 'image', uploadedAt: d.uploaded_at
          })));
          
          setEventi(docsData.filter(d => d.document_category === 'altro').map(d => ({
            id: d.id, url: d.file_url, type: d.file_type.includes('pdf') ? 'pdf' : 'image', uploadedAt: d.uploaded_at
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

        // 3. ✅ CONTROLLO BLOCCO FASE FINALE
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

  const handleRealUpload = async (files: FileList, category: 'evento' | 'sponsor' | 'regolamento' | 'liberatoria', teamId?: string) => {
    if (!files.length) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let folder = 'documents';
      if (category === 'sponsor') folder = 'sponsors';
      
      try {
        const publicUrl = await uploadFile(folder, file);
        const supabase = createClient();
        
        await supabase.from('documents').insert({
          team_id: teamId || null,
          file_url: publicUrl,
          file_type: file.type.split('/')[1] || 'unknown',
          file_name: file.name,
          document_category: category === 'liberatoria' ? 'liberatoria' : 
                           category === 'regolamento' ? 'regolamento' : 'altro'
        });

        alert(`✅ ${file.name} caricato con successo!`);
      } catch (err) {
        console.error('Errore upload:', err);
        alert('Errore nel caricamento del file');
      }
    }
    window.location.reload();
  };

  const toggleSection = (sectionId: SectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const showRestricted = isStaffMode || isCaptain;

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
      {/* HEADER */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <Image src="/header-altro.jpg" alt="Altro" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-start justify-center pt-6">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-2xl font-oswald">ALTRO</h1>
        </div>
      </div>

      {/* MENU ITEMS */}
      <div className="relative z-10 mt-4 px-3 sm:px-4 space-y-3">
        {MENU_ITEMS.map((item) => {
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
                  
                  {/* LIBERATORIE */}
                  {item.id === 'liberatorie' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Liberatorie</h2>
                      <AdminLiberatorieManager
                        teams={teamsLiberatorie}
                        templateDoc={templateDoc}
                        userRole={isStaffMode ? 'staff' : 'captain'}
                        userTeamId={userTeamId}
                        onUpdate={setTeamsLiberatorie}
                        onTemplateUpload={setTemplateDoc}
                        isTournamentLocked={isTournamentLocked} // ✅ Passiamo lo stato di blocco
                      />
                    </div>
                  )}

                  {/* ALBO D'ORO */}
                  {item.id === 'albo-oro' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Albo d'Oro</h2>
                      {alboDoro ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 rounded-xl p-6 text-center border-2 border-[#FFD700]">
                            <p className="text-sm text-gray-600 uppercase font-bold mb-2">Vincitore Edizione {alboDoro.year}</p>
                            <p className="text-3xl font-black text-[#581C24]">{alboDoro.winner}</p>
                            <p className="text-sm text-gray-500 mt-2">Finalista: {alboDoro.runnerUp}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <p className="text-gray-500 font-medium">I dati dell'Albo d'Oro verranno pubblicati a fine torneo.</p>
                        </div>
                      )}
                      {isStaffMode && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <AdminSaveAlboDoro currentYear={new Date().getFullYear()} onSave={setAlboDoro} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* REGOLAMENTO */}
                  {item.id === 'regolamento' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Regolamento</h2>
                      {regolamentoDocs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {regolamentoDocs.map(doc => (
                            <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <svg className="w-5 h-5 text-[#581C24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="font-bold text-sm text-[#581C24]">Scarica Regolamento</span>
                            </a>
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

                  {/* EVENTI */}
                  {item.id === 'eventi' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Eventi Pro Loco</h2>
                      {eventi.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {eventi.map(ev => (
                            <div key={ev.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                              {ev.type === 'image' ? <Image src={ev.url} alt="Evento" fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>}
                              <a href={ev.url} download className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
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

                  {/* SPONSOR */}
                  {item.id === 'sponsor' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Sponsor Ufficiali</h2>
                      {sponsors.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {sponsors.map(s => (
                            <div key={s.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center relative group">
                              <Image src={s.logoUrl} alt={s.name} fill className="object-contain p-2" />
                              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm">VISITA SITO</a>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-500 text-center py-8">Nessuno sponsor pubblicato.</p>}
                      {isStaffMode && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <input type="file" accept="image/*" onChange={(e) => e.target.files && handleRealUpload(e.target.files, 'sponsor')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#581C24] file:text-white hover:file:bg-[#581C24]/90" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTATTI */}
                  {item.id === 'contatti' && (
                    <div>
                      <h2 className="text-lg font-black text-[#581C24] uppercase tracking-wider mb-4">Contatti</h2>
                      {isStaffMode ? (
                        <AdminContactsEditor contacts={contatti} onSave={setContatti} />
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}