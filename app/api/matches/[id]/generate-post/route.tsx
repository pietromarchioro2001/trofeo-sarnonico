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

    // ✅ USA IMMAGINE DI BASE + SOVRAPPONE ELEMENTI
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Immagine di base (tunnel/stadio) */}
          <img 
            src="https://trofeo-sarnonico.vercel.app/tunnel-bg.png" 
            width="1080" 
            height="1920" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          {/* Logo torneo in alto */}
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="160" 
              height="160" 
              style={{ objectFit: 'contain' }} 
            />
          </div>

          {/* Badge fase */}
          <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', background: 'rgba(233, 69, 96, 0.9)', borderRadius: '50px', padding: '12px 48px' }}>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: '900', color: 'white', letterSpacing: 6 }}>{phase}</div>
            </div>
          </div>

          {type === 'PRE_MATCH' ? (
            <>
              {/* Logo squadra CASA (sinistra) */}
              {homeLogo && (
                <div style={{ position: 'absolute', top: 420, left: 60, zIndex: 10 }}>
                  <img src={homeLogo} width="220" height="220" style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }} />
                </div>
              )}

              {/* Logo squadra OSPITE (destra) */}
              {awayLogo && (
                <div style={{ position: 'absolute', top: 420, right: 60, zIndex: 10 }}>
                  <img src={awayLogo} width="220" height="220" style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }} />
                </div>
              )}

              {/* Nomi squadre */}
              <div style={{ position: 'absolute', top: 680, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, zIndex: 10 }}>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: '#e94560', letterSpacing: 3, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{homeName}</div>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: 'white' }}>VS</div>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{awayName}</div>
              </div>
            </>
          ) : (
            <>
              {/* Logo squadra CASA (sinistra) */}
              {homeLogo && (
                <div style={{ position: 'absolute', top: 420, left: 80, zIndex: 10 }}>
                  <img src={homeLogo} width="200" height="200" style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }} />
                </div>
              )}

              {/* Logo squadra OSPITE (destra) */}
              {awayLogo && (
                <div style={{ position: 'absolute', top: 420, right: 80, zIndex: 10 }}>
                  <img src={awayLogo} width="200" height="200" style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }} />
                </div>
              )}

              {/* Score ENORME al centro */}
              <div style={{ position: 'absolute', top: 680, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', fontSize: 140, fontWeight: '900', color: '#ffd700', letterSpacing: 12, textShadow: '0 4px 30px rgba(0,0,0,0.9)' }}>
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </div>
              </div>

              {/* Nomi squadre sotto score */}
              <div style={{ position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 120, zIndex: 10 }}>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: 3, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{homeName}</div>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: 3, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{awayName}</div>
              </div>

              {/* DCR se ci sono rigori */}
              {match.home_penalties != null && (
                <div style={{ position: 'absolute', top: 960, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                  <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '16px 48px' }}>
                    <div style={{ display: 'flex', fontSize: 36, fontWeight: '900', color: '#1a0a0e', letterSpacing: 4 }}>DCR {match.home_penalties} - {match.away_penalties}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Data e ora in basso */}
          <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 10 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: '700', color: 'white', letterSpacing: 4, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{matchDate}</div>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#ffd700', letterSpacing: 4, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{matchTime}</div>
          </div>
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