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

    const dynamicContent = type === 'PRE_MATCH' ? (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* Logo squadra CASA (parete sinistra) - PIÙ GRANDE */}
        <div style={{ position: 'absolute', top: 380, left: 40, display: 'flex', transform: 'perspective(1000px) rotateY(15deg)', transformOrigin: 'left center' }}>
          {homeLogo ? (
            <img src={homeLogo} width="280" height="280" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6)) brightness(1.1)' }} />
          ) : (
            <div style={{ display: 'flex', width: 280, height: 280 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE (parete destra) - PIÙ GRANDE */}
        <div style={{ position: 'absolute', top: 380, right: 40, display: 'flex', transform: 'perspective(1000px) rotateY(-15deg)', transformOrigin: 'right center' }}>
          {awayLogo ? (
            <img src={awayLogo} width="280" height="280" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6)) brightness(1.1)' }} />
          ) : (
            <div style={{ display: 'flex', width: 280, height: 280 }}></div>
          )}
        </div>

        {/* Nomi squadre - PIÙ IN BASSO E PIÙ GRANDI */}
        <div style={{ position: 'absolute', top: 920, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#e94560', letterSpacing: 4, textShadow: '0 8px 40px rgba(233, 69, 96, 0.9)', fontFamily: 'Impact, sans-serif' }}>{homeName}</div>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: 'rgba(255,255,255,0.7)' }}>VS</div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#3b82f6', letterSpacing: 4, textShadow: '0 8px 40px rgba(59, 130, 246, 0.9)', fontFamily: 'Impact, sans-serif' }}>{awayName}</div>
        </div>

        {/* Data e ora - NUOVO STILE */}
        <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>📅</div>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: '700', color: 'white', letterSpacing: 3 }}>{matchDate}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 32, color: '#ffd700' }}>⏰</div>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: '#ffd700', letterSpacing: 4 }}>{matchTime}</div>
          </div>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* Logo squadra CASA */}
        <div style={{ position: 'absolute', top: 380, left: 60, display: 'flex', transform: 'perspective(1000px) rotateY(15deg)', transformOrigin: 'left center' }}>
          {homeLogo ? (
            <img src={homeLogo} width="260" height="260" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))' }} />
          ) : (
            <div style={{ display: 'flex', width: 260, height: 260 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE */}
        <div style={{ position: 'absolute', top: 380, right: 60, display: 'flex', transform: 'perspective(1000px) rotateY(-15deg)', transformOrigin: 'right center' }}>
          {awayLogo ? (
            <img src={awayLogo} width="260" height="260" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))' }} />
          ) : (
            <div style={{ display: 'flex', width: 260, height: 260 }}></div>
          )}
        </div>

        {/* Score */}
        <div style={{ position: 'absolute', top: 920, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: 140, fontWeight: '900', color: '#ffd700', letterSpacing: 16, textShadow: '0 8px 50px rgba(255, 215, 0, 0.9)' }}>
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </div>
        </div>

        {/* Nomi squadre */}
        <div style={{ position: 'absolute', top: 1080, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 120 }}>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', letterSpacing: 3, textShadow: '0 4px 30px rgba(0,0,0,0.9)' }}>{homeName}</div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: '900', color: 'white', letterSpacing: 3, textShadow: '0 4px 30px rgba(0,0,0,0.9)' }}>{awayName}</div>
        </div>

        {/* DCR */}
        <div style={{ position: 'absolute', top: 1160, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          {match.home_penalties != null ? (
            <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '16px 48px' }}>
              <div style={{ display: 'flex', fontSize: 36, fontWeight: '900', color: '#1a0a0e', letterSpacing: 4 }}>DCR {match.home_penalties} - {match.away_penalties}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', height: 76 }}></div>
          )}
        </div>

        {/* Data e ora */}
        <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>📅</div>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: '700', color: 'white', letterSpacing: 3 }}>{matchDate}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', fontSize: 32, color: '#ffd700' }}>⏰</div>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: '#ffd700', letterSpacing: 4 }}>{matchTime}</div>
          </div>
        </div>
      </div>
    );

    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="https://trofeo-sarnonico.vercel.app/tunnel-bg.png" 
            width="1080" 
            height="1920" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          
          {/* Logo torneo - PIÙ GRANDE */}
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="240" 
              height="240" 
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(255,255,255,0.5))' }} 
            />
          </div>
          
          {/* Badge fase - PIÙ IN BASSO E COLORE DIVERSO */}
          <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50px', padding: '12px 48px', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 6 }}>{phase}</div>
            </div>
          </div>
          
          {dynamicContent}
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