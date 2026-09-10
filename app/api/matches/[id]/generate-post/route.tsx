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

    // ✅ STILE CHAMPIONS LEAGUE - TUNNEL EFFECT
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0e 40%, #0d1b2a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', overflow: 'hidden' }}>
          
          {/* Luci stadio in alto */}
          <div style={{ position: 'absolute', top: 280, left: '10%', width: '80%', height: '120px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(255,255,255,0.8)' }}></div>
            <div style={{ display: 'flex', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(255,255,255,0.8)' }}></div>
            <div style={{ display: 'flex', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(255,255,255,0.8)' }}></div>
            <div style={{ display: 'flex', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(255,255,255,0.8)' }}></div>
            <div style={{ display: 'flex', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', borderRadius: '50%', boxShadow: '0 0 60px rgba(255,255,255,0.8)' }}></div>
          </div>

          {/* Effetto luce campo */}
          <div style={{ position: 'absolute', top: '35%', left: '20%', width: '60%', height: '40%', background: 'radial-gradient(ellipse, rgba(100, 200, 255, 0.3) 0%, transparent 70%)', display: 'flex' }}></div>

          {/* Parete sinistra (squadra casa) */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', background: 'linear-gradient(90deg, rgba(233, 69, 96, 0.4) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 40 }}>
            {homeLogo && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <img src={homeLogo} width="180" height="180" style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(233, 69, 96, 0.8))', opacity: 0.9 }} />
                <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: '#e94560', letterSpacing: 3, textShadow: '0 0 20px rgba(233, 69, 96, 0.8)' }}>{homeName}</div>
              </div>
            )}
          </div>

          {/* Parete destra (squadra ospite) */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', background: 'linear-gradient(-90deg, rgba(59, 130, 246, 0.4) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 40 }}>
            {awayLogo && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <img src={awayLogo} width="180" height="180" style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))', opacity: 0.9 }} />
                <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }}>{awayName}</div>
              </div>
            )}
          </div>

          {/* Logo torneo in alto */}
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="160" 
              height="160" 
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(255,255,255,0.5))' }} 
            />
          </div>

          {/* Badge fase */}
          <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50px', padding: '12px 40px', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 8 }}>{phase}</div>
            </div>
          </div>

          {/* Contenuto centrale */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 480, zIndex: 10 }}>
            
            {type === 'PRE_MATCH' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 60 }}>
                <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#e94560', letterSpacing: 4, textShadow: '0 0 40px rgba(233, 69, 96, 0.8)' }}>{homeName}</div>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white' }}>VS</div>
                <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#3b82f6', letterSpacing: 4, textShadow: '0 0 40px rgba(59, 130, 246, 0.8)' }}>{awayName}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 60 }}>
                <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#e94560', letterSpacing: 4 }}>{homeName}</div>
                <div style={{ display: 'flex', fontSize: 100, fontWeight: '900', color: '#ffd700', letterSpacing: 8 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#3b82f6', letterSpacing: 4 }}>{awayName}</div>
              </div>
            )}

            {/* Data e ora */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 40 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 4 }}>{matchDate}</div>
              <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: '#ffd700', letterSpacing: 4 }}>{matchTime}</div>
            </div>
          </div>

          {/* Effetto pioggia (opzionale) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'repeating-linear-gradient(180deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)', pointerEvents: 'none', display: 'flex' }}></div>
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