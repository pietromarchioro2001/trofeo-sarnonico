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

    // ✅ FORMATO VERTICALE 1080x1920 per Instagram Stories
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0e 30%, #2d1118 60%, #0a0a0a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          
          {/* Effetto tunnel con luci */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(ellipse at center top, rgba(233, 69, 96, 0.4) 0%, transparent 50%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: '20%', left: 0, width: '100%', height: '60%', background: 'linear-gradient(90deg, rgba(233, 69, 96, 0.3) 0%, transparent 20%, transparent 80%, rgba(59, 130, 246, 0.3) 100%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'radial-gradient(ellipse at center bottom, rgba(255, 215, 0, 0.2) 0%, transparent 60%)', display: 'flex' }}></div>
          
          {/* Linee verticali effetto tunnel */}
          <div style={{ position: 'absolute', top: 0, left: '10%', width: '2px', height: '100%', background: 'linear-gradient(180deg, transparent 0%, rgba(233, 69, 96, 0.5) 50%, transparent 100%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: 0, right: '10%', width: '2px', height: '100%', background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.5) 50%, transparent 100%)', display: 'flex' }}></div>

          {/* Header con logo torneo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60, zIndex: 1 }}>
            <div style={{ display: 'flex', fontSize: 48, marginBottom: 20 }}>⚽</div>
            <div style={{ display: 'flex', fontSize: 42, fontWeight: '900', color: 'white', letterSpacing: 6, textShadow: '0 0 30px rgba(255,255,255,0.5)' }}>TROFEO SARNONICO</div>
            <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.7)', marginTop: 10, letterSpacing: 4 }}>2026</div>
          </div>

          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 1 }}>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(233, 69, 96, 0.3)', border: '2px solid rgba(233, 69, 96, 0.8)', borderRadius: '50px', padding: '16px 48px', marginBottom: 60 }}>
                <div style={{ display: 'flex', fontSize: 36, fontWeight: '900', color: '#e94560', letterSpacing: 6 }}>{phase}</div>
              </div>
              
              {/* Loghi squadre */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 180, height: 180, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: '4px solid rgba(233, 69, 96, 0.8)', boxShadow: '0 0 40px rgba(233, 69, 96, 0.6)', padding: 10 }}>
                      <img src={homeLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center' }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#e94560', textShadow: '0 0 40px rgba(233, 69, 96, 0.8)' }}>VS</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 180, height: 180, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.8)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)', padding: 10 }}>
                      <img src={awayLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center' }}>{awayName}</div>
                </div>
              </div>
              
              {/* Data e ora */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: '700', color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>{matchDate}</div>
                <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#ffd700', textShadow: '0 0 30px rgba(255, 215, 0, 0.8)' }}>{matchTime}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 1 }}>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.3)', border: '2px solid rgba(255, 215, 0, 0.8)', borderRadius: '50px', padding: '16px 48px', marginBottom: 60 }}>
                <div style={{ display: 'flex', fontSize: 36, fontWeight: '900', color: '#ffd700', letterSpacing: 6 }}>{phase}</div>
              </div>
              
              {/* Loghi squadre con score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 160, height: 160, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: '4px solid rgba(255, 215, 0, 0.8)', boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)', padding: 10 }}>
                      <img src={homeLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 44, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center' }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', fontSize: 140, fontWeight: '900', color: '#ffd700', textShadow: '0 0 60px rgba(255, 215, 0, 0.8)', letterSpacing: 8 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 160, height: 160, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: '4px solid rgba(255, 215, 0, 0.8)', boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)', padding: 10 }}>
                      <img src={awayLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 44, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center' }}>{awayName}</div>
                </div>
              </div>
              
              {/* DCR se ci sono rigori */}
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.3)', border: '2px solid rgba(255, 215, 0, 0.8)', borderRadius: '50px', padding: '20px 48px' }}>
                  <div style={{ display: 'flex', fontSize: 42, fontWeight: '900', color: '#ffd700', letterSpacing: 4 }}>⚽ DCR {match.home_penalties} - {match.away_penalties}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: 82 }}></div>
              )}
            </div>
          )}
          
          {/* Footer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 60, zIndex: 1 }}>
            <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.6)', letterSpacing: 4 }}>#TrofeoSarnonico</div>
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