import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'PRE_MATCH';
    const supabase = createClient();

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, home_score, away_score, home_penalties, away_penalties, match_date, match_time, home_team_id, away_team_id, status, phase')
      .eq('id', params.id)
      .single();

    if (matchError || !match) {
      return new Response('Partita non trovata', { status: 404 });
    }

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .in('id', [match.home_team_id, match.away_team_id]);

    const homeTeam = teams?.find((t: any) => t.id === match.home_team_id);
    const awayTeam = teams?.find((t: any) => t.id === match.away_team_id);

    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const homeLogo = homeTeam?.logo_url || '';
    const awayLogo = awayTeam?.logo_url || '';
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
    const matchTime = match.match_time || '--:--';
    const phase = match.phase || 'GIRONI';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    // ✅ DESIGN SEMPLIFICATO E VELOCE
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #1a0a0e 0%, #2d1118 50%, #1a0a0e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          {/* Logo torneo in alto */}
          <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="200" 
              height="200" 
              style={{ objectFit: 'contain' }} 
            />
          </div>

          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 300, paddingBottom: 100 }}>
              
              {/* Squadre con loghi */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 260, height: 260, background: 'rgba(233, 69, 96, 0.2)', borderRadius: '50%', border: '6px solid rgba(233, 69, 96, 0.8)', padding: 16, marginBottom: 24 }}>
                      <img src={homeLogo} width="228" height="228" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', textAlign: 'center' }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', fontSize: 80, fontWeight: '900', color: '#e94560' }}>VS</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 260, height: 260, background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', border: '6px solid rgba(59, 130, 246, 0.8)', padding: 16, marginBottom: 24 }}>
                      <img src={awayLogo} width="228" height="228" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', textAlign: 'center' }}>{awayName}</div>
                </div>
              </div>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(233, 69, 96, 0.3)', border: '3px solid rgba(233, 69, 96, 0.8)', borderRadius: '50px', padding: '16px 48px', marginBottom: 48 }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: '#e94560', letterSpacing: 6 }}>{phase}</div>
              </div>
              
              {/* Data e ora */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: '700', color: 'white' }}>{matchDate}</div>
                <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#ffd700' }}>{matchTime}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 300, paddingBottom: 100 }}>
              
              {/* Squadre con score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 240, height: 240, background: 'rgba(255, 215, 0, 0.2)', borderRadius: '50%', border: '6px solid rgba(255, 215, 0, 0.8)', padding: 16, marginBottom: 24 }}>
                      <img src={homeLogo} width="208" height="208" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textAlign: 'center' }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', fontSize: 140, fontWeight: '900', color: '#ffd700' }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 240, height: 240, background: 'rgba(255, 215, 0, 0.2)', borderRadius: '50%', border: '6px solid rgba(255, 215, 0, 0.8)', padding: 16, marginBottom: 24 }}>
                      <img src={awayLogo} width="208" height="208" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textAlign: 'center' }}>{awayName}</div>
                </div>
              </div>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.3)', border: '3px solid rgba(255, 215, 0, 0.8)', borderRadius: '50px', padding: '16px 48px', marginBottom: 48 }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: '#ffd700', letterSpacing: 6 }}>{phase}</div>
              </div>
              
              {/* DCR se ci sono rigori */}
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.3)', border: '3px solid rgba(255, 215, 0, 0.8)', borderRadius: '50px', padding: '20px 48px' }}>
                  <div style={{ display: 'flex', fontSize: 42, fontWeight: '900', color: '#ffd700' }}> DCR {match.home_penalties} - {match.away_penalties}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: 76 }}></div>
              )}
            </div>
          )}
        </div>
      ),
      { width: 1080, height: 1920 }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${params.id}_${type}.png`;

    const { error: uploadError } = await supabase.storage
      .from('tournament-files')
      .upload(`match-posts/${fileName}`, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Errore upload:', uploadError);
      return new Response('Errore upload: ' + uploadError.message, { status: 500 });
    }

    console.log('✅ Post generato e salvato:', fileName);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (err) {
    console.error('❌ Errore generazione post:', err);
    return new Response('Errore interno: ' + (err as Error).message, { status: 500 });
  }
}