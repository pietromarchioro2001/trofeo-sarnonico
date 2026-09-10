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
    
    // Formatta data come DD.MM.YYYY
    const dateObj = match.match_date ? new Date(match.match_date) : null;
    const formattedDate = dateObj ? `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}` : '';
    const matchTime = match.match_time || '--:--';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    const dynamicContent = type === 'PRE_MATCH' ? (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* Logo squadra CASA - Effetto adesivo con ombra marcata */}
        <div style={{ position: 'absolute', top: 480, left: 60, display: 'flex', transform: 'rotate(-3deg)' }}>
          {homeLogo ? (
            <img src={homeLogo} width="260" height="260" style={{ objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.8)) brightness(1.05) contrast(1.1)' }} />
          ) : (
            <div style={{ display: 'flex', width: 260, height: 260 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE */}
        <div style={{ position: 'absolute', top: 480, right: 60, display: 'flex', transform: 'rotate(3deg)' }}>
          {awayLogo ? (
            <img src={awayLogo} width="260" height="260" style={{ objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.8)) brightness(1.05) contrast(1.1)' }} />
          ) : (
            <div style={{ display: 'flex', width: 260, height: 260 }}></div>
          )}
        </div>

        {/* Sfondo scuro per nomi squadre - PIÙ IN BASSO */}
        <div style={{ position: 'absolute', top: 1100, left: 60, right: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '32px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: '700', color: '#e94560', letterSpacing: 2 }}>{homeName}</div>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: '700', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>VS</div>
            <div style={{ display: 'flex', fontSize: 64, fontWeight: '700', color: '#3b82f6', letterSpacing: 2 }}>{awayName}</div>
          </div>
        </div>

        {/* Data e ora - Formato semplice su una riga */}
        <div style={{ position: 'absolute', bottom: 140, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.8)' }}>📅</div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: '700', color: 'white', letterSpacing: 2 }}>{formattedDate} - {matchTime}</div>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* Logo squadra CASA */}
        <div style={{ position: 'absolute', top: 480, left: 80, display: 'flex', transform: 'rotate(-3deg)' }}>
          {homeLogo ? (
            <img src={homeLogo} width="240" height="240" style={{ objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 240, height: 240 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE */}
        <div style={{ position: 'absolute', top: 480, right: 80, display: 'flex', transform: 'rotate(3deg)' }}>
          {awayLogo ? (
            <img src={awayLogo} width="240" height="240" style={{ objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 240, height: 240 }}></div>
          )}
        </div>

        {/* Score con sfondo */}
        <div style={{ position: 'absolute', top: 1100, left: 60, right: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '32px 48px' }}>
          <div style={{ display: 'flex', fontSize: 120, fontWeight: '900', color: '#ffd700', letterSpacing: 12 }}>
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </div>
        </div>

        {/* Nomi squadre */}
        <div style={{ position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 100 }}>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '700', color: 'white', letterSpacing: 2 }}>{homeName}</div>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '700', color: 'white', letterSpacing: 2 }}>{awayName}</div>
        </div>

        {/* DCR */}
        {match.home_penalties != null ? (
          <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '12px 40px' }}>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: '900', color: '#1a0a0e', letterSpacing: 2 }}>DCR {match.home_penalties} - {match.away_penalties}</div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 1340, left: 0, right: 0, height: 76 }}></div>
        )}

        {/* Data e ora */}
        <div style={{ position: 'absolute', bottom: 140, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.8)' }}>📅</div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: '700', color: 'white', letterSpacing: 2 }}>{formattedDate} - {matchTime}</div>
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
          
          {/* Logo torneo */}
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://trofeo-sarnonico.vercel.app/logo.png" 
              width="240" 
              height="240" 
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(255,255,255,0.5))' }} 
            />
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