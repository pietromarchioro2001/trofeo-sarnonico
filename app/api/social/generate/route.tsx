import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'coming-soon';
    const supabase = createClient();

    // ✅ COMING SOON - Controlla se esiste già, altrimenti genera e salva
    if (type === 'coming-soon') {
      console.log('📋 [1/2] Verifico se esiste già Coming Soon...');
      
      // Cerca file esistenti che iniziano con COMING_SOON_
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('tournament-files')
        .list('social', { 
          limit: 1,
          prefix: 'COMING_SOON_'
        });

      if (listError) {
        console.error('Errore listing:', listError);
      }

      // Se esiste già, lo restituisco
      if (existingFiles && existingFiles.length > 0) {
        const fileName = existingFiles[0].name;
        console.log('✅ Coming Soon già esiste:', fileName);
        
        const { data: fileData } = supabase.storage
          .from('tournament-files')
          .getPublicUrl(`social/${fileName}`);
        
        // Scarica il file esistente
        const response = await fetch(fileData.publicUrl);
        const buffer = await response.arrayBuffer();
        
        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400', // Cache 1 giorno
          },
        });
      }

      console.log('⚡ Genero nuovo Coming Soon...');
      
      // Genera nuova immagine
      const imageResponse = new ImageResponse(
        (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/template-comingsoon.png" 
              width="1080" 
              height="1920" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', top: 65, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <img 
                src="https://trofeo-sarnonico.vercel.app/logo.png" 
                width="200" 
                height="200" 
                style={{ objectFit: 'contain' }} 
              />
            </div>
          </div>
        ),
        { width: 1080, height: 1920 }
      );

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Trova il prossimo numero disponibile
      const nextNumber = (existingFiles?.length || 0) + 1;
      const fileName = `COMING_SOON_${nextNumber}.png`;
      
      // Salva su Supabase
      const { error: uploadError } = await supabase.storage
        .from('tournament-files')
        .upload(`social/${fileName}`, buffer, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      
      console.log('✅ Coming Soon salvato:', fileName);

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // ✅ CLASSIFICA - Genera sempre nuovo e salva con numero progressivo
    if (type === 'classifica') {
      console.log('📊 [1/5] Inizio generazione classifica...');

      const { data: allTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, logo_url, girone');

      if (teamsError) throw new Error('Errore database teams: ' + JSON.stringify(teamsError));
      console.log('✅ [2/5] Teams recuperati:', allTeams?.length);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_score, away_score, status, phase')
        .eq('phase', 'GIRONI');

      if (matchesError) throw new Error('Errore database matches: ' + JSON.stringify(matchesError));
      
      const validMatches = matchesData?.filter(m => 
        ['FINITA', 'LIVE', 'SUPP', 'RIGORI'].includes(m.status)
      ) || [];
      
      console.log('✅ [3/5] Partite recuperate e filtrate:', validMatches.length);

      const statsMap = new Map();
      
      if (allTeams) {
        allTeams.forEach((t) => {
          statsMap.set(t.id, { 
            id: t.id, 
            name: t.name || 'Squadra', 
            logo_url: t.logo_url || '', 
            girone: t.girone,
            pt: 0, pg: 0, v: 0, p: 0, s: 0, gf: 0, gs: 0, dr: 0 
          });
        });
      }

      if (validMatches.length > 0) {
        validMatches.forEach((m) => {
          const homeStats = statsMap.get(m.home_team_id);
          const awayStats = statsMap.get(m.away_team_id);
          if (!homeStats || !awayStats) return;

          const hScore = m.home_score || 0;
          const aScore = m.away_score || 0;

          homeStats.pg += 1;
          awayStats.pg += 1;
          homeStats.gf += hScore;
          homeStats.gs += aScore;
          homeStats.dr = homeStats.gf - homeStats.gs;
          
          awayStats.gf += aScore;
          awayStats.gs += hScore;
          awayStats.dr = awayStats.gf - awayStats.gs;

          if (hScore > aScore) {
            homeStats.v += 1; homeStats.pt += 3; awayStats.s += 1;
          } else if (aScore > hScore) {
            awayStats.v += 1; awayStats.pt += 3; homeStats.s += 1;
          } else {
            homeStats.p += 1; homeStats.pt += 1;
            awayStats.p += 1; awayStats.pt += 1;
          }
        });
      }

      const allStats = Array.from(statsMap.values());
      const sortFn = (a: any, b: any) => b.pt - a.pt || b.dr - a.dr || b.gf - a.gf;

      const gironeA = allStats.filter((t: any) => t.girone === 'A').sort(sortFn);
      const gironeB = allStats.filter((t: any) => t.girone === 'B').sort(sortFn);

      console.log('✅ [4/5] Classifiche calcolate - Girone A:', gironeA.length, 'Girone B:', gironeB.length);

      // Genera le righe della classifica
      const gironeARows = gironeA.slice(0, 6).map((team: any, index: number) => {
        const rowY = 580 + (index * 55);
        
        return (
          <div key={team.id} style={{ position: 'absolute', top: rowY, left: 65, right: 65, display: 'flex', alignItems: 'center', height: 50 }}>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', alignItems: 'center' }}>
              {team.logo_url ? (
                <img src={team.logo_url} width="28" height="28" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', width: 28, height: 28, background: '#ddd', borderRadius: '50%' }} />
              )}
            </div>
            <div style={{ display: 'flex', flex: 1, paddingLeft: 10, fontWeight: '700', color: '#000', fontSize: 14, textTransform: 'uppercase' }}>
              {team.name}
            </div>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', fontWeight: '900', color: '#800020', fontSize: 14 }}>{team.pt}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.pg}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.v}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.p}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.s}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.gf}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.gs}</div>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', fontSize: 12, fontWeight: '700', color: team.dr > 0 ? '#16a34a' : team.dr < 0 ? '#dc2626' : '#333' }}>
              {team.dr > 0 ? `+${team.dr}` : team.dr}
            </div>
          </div>
        );
      });

      const gironeBRows = gironeB.slice(0, 6).map((team: any, index: number) => {
        const rowY = 1180 + (index * 55);
        
        return (
          <div key={team.id} style={{ position: 'absolute', top: rowY, left: 65, right: 65, display: 'flex', alignItems: 'center', height: 50 }}>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', alignItems: 'center' }}>
              {team.logo_url ? (
                <img src={team.logo_url} width="28" height="28" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', width: 28, height: 28, background: '#ddd', borderRadius: '50%' }} />
              )}
            </div>
            <div style={{ display: 'flex', flex: 1, paddingLeft: 10, fontWeight: '700', color: '#000', fontSize: 14, textTransform: 'uppercase' }}>
              {team.name}
            </div>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', fontWeight: '900', color: '#800020', fontSize: 14 }}>{team.pt}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.pg}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.v}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.p}</div>
            <div style={{ display: 'flex', width: 20, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.s}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.gf}</div>
            <div style={{ display: 'flex', width: 25, justifyContent: 'center', fontSize: 12, color: '#333' }}>{team.gs}</div>
            <div style={{ display: 'flex', width: 30, justifyContent: 'center', fontSize: 12, fontWeight: '700', color: team.dr > 0 ? '#16a34a' : team.dr < 0 ? '#dc2626' : '#333' }}>
              {team.dr > 0 ? `+${team.dr}` : team.dr}
            </div>
          </div>
        );
      });

      console.log('✅ [5/5] Generazione immagine Satori...');

      const imageResponse = new ImageResponse(
        (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/template-classifica.png" 
              width="1080" 
              height="1920" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            
            <div style={{ position: 'absolute', top: 65, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
              <img 
                src="https://trofeo-sarnonico.vercel.app/logo.png" 
                width="180" 
                height="180" 
                style={{ objectFit: 'contain' }} 
              />
            </div>

            {/* BOX BIANCHI per coprire i numeri del template - GIRONE A */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={`cover-a-${i}`} style={{ position: 'absolute', top: 580 + (i * 55), left: 65, width: 40, height: 50, background: '#fff', zIndex: 5 }} />
            ))}
            <div style={{ position: 'absolute', top: 530, left: 65, right: 65, height: 40, background: '#fff', zIndex: 5 }} />

            {/* BOX BIANCHI per coprire i numeri del template - GIRONE B */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={`cover-b-${i}`} style={{ position: 'absolute', top: 1180 + (i * 55), left: 65, width: 40, height: 50, background: '#fff', zIndex: 5 }} />
            ))}
            <div style={{ position: 'absolute', top: 1130, left: 65, right: 65, height: 40, background: '#fff', zIndex: 5 }} />

            {gironeARows}
            {gironeBRows}
          </div>
        ),
        { width: 1080, height: 1920 }
      );

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Conta quante classifiche esistono già
      const { data: existingClassifiche, error: listError } = await supabase.storage
        .from('tournament-files')
        .list('social', { 
          limit: 100,
          prefix: 'CLASSIFICA_'
        });

      const nextNumber = (existingClassifiche?.length || 0) + 1;
      const fileName = `CLASSIFICA_${nextNumber}.png`;
      
      // Salva su Supabase
      const { error: uploadError } = await supabase.storage
        .from('tournament-files')
        .upload(`social/${fileName}`, buffer, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      
      console.log('✅ Classifica salvata:', fileName);

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0', // NO CACHE - sempre fresca
        },
      });
    }

    return new Response('Tipo non valido', { status: 400 });
  } catch (err) {
    console.error('❌ Errore generazione social:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response('Errore interno: ' + errorMessage, { status: 500 });
  }
}
