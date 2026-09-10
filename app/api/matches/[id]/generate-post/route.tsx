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

    // ✅ NUOVO DESIGN - MODERNO E CENTRATO
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #1a0a0e 0%, #2d1118 40%, #1a0a0e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Sfondo con pattern geometrico */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)', display: 'flex' }}></div>
          
          {/* Cerchi decorativi sfondo */}
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(233, 69, 96, 0.15) 0%, transparent 70%)', borderRadius: '50%', display: 'flex' }}></div>
          <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', display: 'flex' }}></div>

          {/* Logo torneo in alto */}
          <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="180" 
              height="180" 
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(255,255,255,0.3))' }} 
            />
          </div>

          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 280, paddingBottom: 100 }}>
              
              {/* Squadre con loghi affiancati */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 60, width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 240, height: 240, background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.3) 0%, rgba(233, 69, 96, 0.1) 100%)', borderRadius: '50%', border: '6px solid rgba(233, 69, 96, 0.9)', boxShadow: '0 0 80px rgba(233, 69, 96, 0.6), inset 0 0 60px rgba(233, 69, 96, 0.2)', padding: 16, marginBottom: 24 }}>
                      <img src={homeLogo} width="208" height="208" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2, marginTop: 16 }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
                  <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#e94560', textShadow: '0 0 50px rgba(233, 69, 96, 0.9)', letterSpacing: 4 }}>VS</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 240, height: 240, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%)', borderRadius: '50%', border: '6px solid rgba(59, 130, 246, 0.9)', boxShadow: '0 0 80px rgba(59, 130, 246, 0.6), inset 0 0 60px rgba(59, 130, 246, 0.2)', padding: 16, marginBottom: 24 }}>
                      <img src={awayLogo} width="208" height="208" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2, marginTop: 16 }}>{awayName}</div>
                </div>
              </div>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.5) 0%, rgba(233, 69, 96, 0.3) 100%)', border: '3px solid rgba(233, 69, 96, 0.9)', borderRadius: '50px', padding: '18px 56px', marginBottom: 48, boxShadow: '0 10px 50px rgba(233, 69, 96, 0.5)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: 'white', letterSpacing: 6, textShadow: '0 0 20px rgba(233, 69, 96, 0.8)' }}>{phase}</div>
              </div>
              
              {/* Data e ora */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', fontSize: 56, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 3 }}>{matchDate}</div>
                <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#ffd700', textShadow: '0 0 40px rgba(255, 215, 0, 0.9)', letterSpacing: 4 }}>{matchTime}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 280, paddingBottom: 100 }}>
              
              {/* Squadre con score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 60, width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {homeLogo && (
                    <div style={{ display: 'flex', width: 220, height: 220, background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)', borderRadius: '50%', border: '6px solid rgba(255, 215, 0, 0.9)', boxShadow: '0 0 80px rgba(255, 215, 0, 0.6)', padding: 16, marginBottom: 24 }}>
                      <img src={homeLogo} width="188" height="188" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 44, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2, marginTop: 16 }}>{homeName}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
                  <div style={{ display: 'flex', fontSize: 140, fontWeight: '900', color: '#ffd700', textShadow: '0 0 80px rgba(255, 215, 0, 0.9)', letterSpacing: 12 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {awayLogo && (
                    <div style={{ display: 'flex', width: 220, height: 220, background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)', borderRadius: '50%', border: '6px solid rgba(255, 215, 0, 0.9)', boxShadow: '0 0 80px rgba(255, 215, 0, 0.6)', padding: 16, marginBottom: 24 }}>
                      <img src={awayLogo} width="188" height="188" style={{ borderRadius: '50%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', fontSize: 44, fontWeight: '900', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.9)', textAlign: 'center', letterSpacing: 2, marginTop: 16 }}>{awayName}</div>
                </div>
              </div>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.5) 0%, rgba(255, 215, 0, 0.3) 100%)', border: '3px solid rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '18px 56px', marginBottom: 48, boxShadow: '0 10px 50px rgba(255, 215, 0, 0.5)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: 'white', letterSpacing: 6, textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}>{phase}</div>
              </div>
              
              {/* DCR se ci sono rigori */}
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.5) 0%, rgba(255, 215, 0, 0.3) 100%)', border: '3px solid rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '24px 60px', boxShadow: '0 10px 50px rgba(255, 215, 0, 0.5)' }}>
                  <div style={{ display: 'flex', fontSize: 44, fontWeight: '900', color: 'white', letterSpacing: 4, textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}> DCR {match.home_penalties} - {match.away_penalties}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: 90 }}></div>
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