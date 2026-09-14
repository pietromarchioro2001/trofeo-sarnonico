import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'coming-soon';
    const supabase = createClient();

    if (type === 'coming-soon') {
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

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // ✅ GENERA CLASSIFICA
    if (type === 'classifica') {
      console.log('📊 Generazione classifica...');

      // Recupera tutte le squadre
      const { data: allTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, logo_url, girone');

      if (teamsError) {
        console.error('Errore fetch teams:', teamsError);
        throw teamsError;
      }

      // Recupera solo partite dei gironi finite
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, home_score, away_score, status, phase')
        .eq('phase', 'GIRONI')
        .in('status', ['FINITA']);

      if (matchesError) {
        console.error('Errore fetch matches:', matchesError);
        throw matchesError;
      }

      console.log('Teams:', allTeams?.length);
      console.log('Matches:', matchesData?.length);

      // Calcola statistiche
      const statsMap = new Map();
      
      if (allTeams) {
        allTeams.forEach((t) => {
          statsMap.set(t.id, { 
            id: t.id, 
            name: t.name, 
            logo_url: t.logo_url || '', 
            girone: t.girone,
            pt: 0, pg: 0, v: 0, p: 0, s: 0, gf: 0, gs: 0, dr: 0 
          });
        });
      }

      if (matchesData) {
        matchesData.forEach((m) => {
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
            homeStats.v += 1; 
            homeStats.pt += 3; 
            awayStats.s += 1;
          } else if (aScore > hScore) {
            awayStats.v += 1; 
            awayStats.pt += 3; 
            homeStats.s += 1;
          } else {
            homeStats.p += 1; 
            homeStats.pt += 1;
            awayStats.p += 1; 
            awayStats.pt += 1;
          }
        });
      }

      const allStats = Array.from(statsMap.values());
      
      const sortFn = (a: any, b: any) => 
        b.pt - a.pt || b.dr - a.dr || b.gf - a.gf;

      const gironeA = allStats.filter(t => t.girone === 'A').sort(sortFn);
      const gironeB = allStats.filter(t => t.girone === 'B').sort(sortFn);

      console.log('Girone A:', gironeA.length);
      console.log('Girone B:', gironeB.length);

      // Crea elementi per Girone A
      const gironeAElements = gironeA.slice(0, 6).map((team, index) => {
        return (
          <div key={team.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '8px 12px', fontSize: 14 }}>
            <div style={{ width: 30, fontWeight: '900', color: '#800020', textAlign: 'center' }}>{index + 1}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              {team.logo_url ? (
                <img src={team.logo_url} width="24" height="24" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 24, height: 24, background: '#ddd', borderRadius: '50%' }} />
              )}
              <div style={{ fontWeight: '700', color: '#000', fontSize: 13, textTransform: 'uppercase' }}>{team.name}</div>
            </div>
            <div style={{ width: 30, textAlign: 'center', fontWeight: '900', color: '#800020' }}>{team.pt}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.pg}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.v}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.p}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.s}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.gf}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.gs}</div>
            <div style={{ width: 30, textAlign: 'center', fontSize: 11, fontWeight: '700', color: team.dr > 0 ? '#16a34a' : team.dr < 0 ? '#dc2626' : '#666' }}>
              {team.dr > 0 ? `+${team.dr}` : team.dr}
            </div>
          </div>
        );
      });

      // Crea elementi per Girone B
      const gironeBElements = gironeB.slice(0, 6).map((team, index) => {
        return (
          <div key={team.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '8px 12px', fontSize: 14 }}>
            <div style={{ width: 30, fontWeight: '900', color: '#800020', textAlign: 'center' }}>{index + 1}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              {team.logo_url ? (
                <img src={team.logo_url} width="24" height="24" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 24, height: 24, background: '#ddd', borderRadius: '50%' }} />
              )}
              <div style={{ fontWeight: '700', color: '#000', fontSize: 13, textTransform: 'uppercase' }}>{team.name}</div>
            </div>
            <div style={{ width: 30, textAlign: 'center', fontWeight: '900', color: '#800020' }}>{team.pt}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.pg}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.v}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.p}</div>
            <div style={{ width: 20, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.s}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.gf}</div>
            <div style={{ width: 25, textAlign: 'center', fontSize: 11, color: '#666' }}>{team.gs}</div>
            <div style={{ width: 30, textAlign: 'center', fontSize: 11, fontWeight: '700', color: team.dr > 0 ? '#16a34a' : team.dr < 0 ? '#dc2626' : '#666' }}>
              {team.dr > 0 ? `+${team.dr}` : team.dr}
            </div>
          </div>
        );
      });

      const imageResponse = new ImageResponse(
        (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' }}>
            {/* Sfondo template */}
            <img 
              src="https://trofeo-sarnonico.vercel.app/template-classifica.png" 
              width="1080" 
              height="1920" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            
            {/* LOGO TORNEO */}
            <div style={{ position: 'absolute', top: 65, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
              <img 
                src="https://trofeo-sarnonico.vercel.app/logo.png" 
                width="180" 
                height="180" 
                style={{ objectFit: 'contain' }} 
              />
            </div>

            {/* GIRONE A - Tabella */}
            <div style={{ position: 'absolute', top: 580, left: 65, right: 65, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gironeAElements}
            </div>

            {/* GIRONE B - Tabella */}
            <div style={{ position: 'absolute', top: 1180, left: 65, right: 65, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gironeBElements}
            </div>
          </div>
        ),
        { width: 1080, height: 1920 }
      );

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return new Response('Tipo non valido', { status: 400 });
  } catch (err) {
    console.error('❌ Errore generazione social:', err);
    return new Response('Errore interno: ' + err.message, { status: 500 });
  }
}
