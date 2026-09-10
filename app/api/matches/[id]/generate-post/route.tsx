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

    // ✅ FORMATO VERTICALE 1080x1920 - DESIGN MIGLIORATO E CENTRATO
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0e 50%, #0a0a0a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', overflow: 'hidden' }}>
          
          {/* Sfondo con effetto stadio/luci */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 30%, rgba(233, 69, 96, 0.4) 0%, transparent 50%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: '40%', left: 0, width: '100%', height: '40%', background: 'linear-gradient(90deg, rgba(233, 69, 96, 0.2) 0%, transparent 15%, transparent 85%, rgba(59, 130, 246, 0.2) 100%)', display: 'flex' }}></div>
          
          {/* Linee decorative laterali */}
          <div style={{ position: 'absolute', top: 0, left: '5%', width: '3px', height: '100%', background: 'linear-gradient(180deg, transparent 0%, rgba(233, 69, 96, 0.6) 20%, rgba(233, 69, 96, 0.6) 80%, transparent 100%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: 0, right: '5%', width: '3px', height: '100%', background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.6) 20%, rgba(59, 130, 246, 0.6) 80%, transparent 100%)', display: 'flex' }}></div>

          {/* Header con logo torneo - POSIZIONATO MEGLIO */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80, marginBottom: 40, zIndex: 1 }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="240" 
              height="240" 
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))' }} 
            />
          </div>

          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 40, zIndex: 1 }}>
              
              {/* Badge fase - PIÙ GRANDE E CENTRATO */}
              <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.4) 0%, rgba(233, 69, 96, 0.2) 100%)', border: '3px solid rgba(233, 69, 96, 0.9)', borderRadius: '50px', padding: '20px 60px', marginBottom: 80, boxShadow: '0 10px 40px rgba(233, 69, 96, 0.5)' }}>
                <div style={{ display: 'flex', fontSize: 42, fontWeight: '900', color: '#e94560', letterSpacing: 8, textShadow: '0 0 20px rgba(233, 69, 96, 0.8)' }}>{phase}</div>
              </div>
              
              {/* Loghi squadre - MEGLIO ALLINEATI E SPAZIATI */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginBottom: 80 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '5px solid rgba(233, 69, 96, 0.9)', boxShadow: '0 0 60px rgba(233, 69, 96, 0.7), inset 0 0 40px rgba(233, 69, 96, 0.2)', padding: 12 }}>
                      <img src={homeLogo} width="196" height="196" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2 }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', fontSize: 80, fontWeight: '900', color: '#e94560', textShadow: '0 0 50px rgba(233, 69, 96, 0.9)', letterSpacing: 4 }}>VS</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '5px solid rgba(59, 130, 246, 0.9)', boxShadow: '0 0 60px rgba(59, 130, 246, 0.7), inset 0 0 40px rgba(59, 130, 246, 0.2)', padding: 12 }}>
                      <img src={awayLogo} width="196" height="196" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2 }}>{awayName}</div>
                </div>
              </div>
              
              {/* Data e ora - PIÙ IMPATTANTI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 40 }}>
                <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: 'white', textShadow: '0 0 30px rgba(255,255,255,0.6)', letterSpacing: 4 }}>{matchDate}</div>
                <div style={{ display: 'flex', fontSize: 80, fontWeight: '900', color: '#ffd700', textShadow: '0 0 40px rgba(255, 215, 0, 0.9)', letterSpacing: 4 }}>{matchTime}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 40, zIndex: 1 }}>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0.2) 100%)', border: '3px solid rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '20px 60px', marginBottom: 80, boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)' }}>
                <div style={{ display: 'flex', fontSize: 42, fontWeight: '900', color: '#ffd700', letterSpacing: 8, textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}>{phase}</div>
              </div>
              
              {/* Loghi squadre con score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50, marginBottom: 80 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '5px solid rgba(255, 215, 0, 0.9)', boxShadow: '0 0 60px rgba(255, 215, 0, 0.7)', padding: 12 }}>
                      <img src={homeLogo} width="176" height="176" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2 }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', fontSize: 160, fontWeight: '900', color: '#ffd700', textShadow: '0 0 80px rgba(255, 215, 0, 0.9)', letterSpacing: 12 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '5px solid rgba(255, 215, 0, 0.9)', boxShadow: '0 0 60px rgba(255, 215, 0, 0.7)', padding: 12 }}>
                      <img src={awayLogo} width="176" height="176" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2 }}>{awayName}</div>
                </div>
              </div>
              
              {/* DCR se ci sono rigori */}
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0.2) 100%)', border: '3px solid rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '24px 60px', boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)' }}>
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: '#ffd700', letterSpacing: 4, textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}>⚽ DCR {match.home_penalties} - {match.away_penalties}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: 90 }}></div>
              )}
            </div>
          )}
          
          {/* Footer vuoto */}
          <div style={{ display: 'flex', height: 80 }}></div>
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