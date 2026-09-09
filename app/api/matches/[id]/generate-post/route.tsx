import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'PRE_MATCH';
    const supabase = createClient();

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        id, home_score, away_score, home_penalties, away_penalties, match_date, match_time,
        home_team:teams!home_team_id(id, name, logo_url),
        away_team:teams!away_team_id(id, name, logo_url)
      `)
      .eq('id', params.id)
      .single();

    if (error || !match) {
      return new Response('Partita non trovata', { status: 404 });
    }

    const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
    const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;

    const homeLogo = homeTeam?.logo_url || '';
    const awayLogo = awayTeam?.logo_url || '';
    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const homeShort = homeName.split(' ').pop() || 'CASA';
    const awayShort = awayName.split(' ').pop() || 'OSPITE';
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
    const matchTime = match.match_time || '--:--';

    // Nome file prevedibile in storage
    const fileName = `${params.id}_${type}.png`;

    // Genera l'immagine
    const imageResponse = new ImageResponse(
      type === 'PRE_MATCH' ? (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: 'sans-serif' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(233, 69, 96, 0.15) 0%, transparent 60%)' }} />
          <div style={{ fontSize: 48, fontWeight: '900', color: '#e94560', textTransform: 'uppercase', letterSpacing: 8, marginBottom: 60, zIndex: 1 }}>PROSSIMA PARTITA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginBottom: 60, zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
              {homeLogo && <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'white', padding: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}><img src={homeLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" /></div>}
              <div style={{ fontSize: 36, fontWeight: '900', color: 'white', textAlign: 'center', textTransform: 'uppercase' }}>{homeShort}</div>
            </div>
            <div style={{ fontSize: 64, fontWeight: '900', color: '#e94560', textShadow: '0 0 30px rgba(233, 69, 96, 0.5)' }}>VS</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
              {awayLogo && <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'white', padding: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}><img src={awayLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" /></div>}
              <div style={{ fontSize: 36, fontWeight: '900', color: 'white', textAlign: 'center', textTransform: 'uppercase' }}>{awayShort}</div>
            </div>
          </div>
          <div style={{ fontSize: 32, color: 'white', fontWeight: '700', zIndex: 1 }}>📅 {matchDate} • ⏰ {matchTime}</div>
          <div style={{ position: 'absolute', bottom: 40, fontSize: 24, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 4, zIndex: 1 }}>TROFEO SARNONICO</div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: 'sans-serif' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(233, 69, 96, 0.15) 0%, transparent 60%)' }} />
          <div style={{ fontSize: 56, fontWeight: '900', color: '#e94560', textTransform: 'uppercase', letterSpacing: 8, marginBottom: 40, textShadow: '0 0 40px rgba(233, 69, 96, 0.5)', zIndex: 1 }}>RISULTATO FINALE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginBottom: 50, zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
              {homeLogo && <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'white', padding: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}><img src={homeLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" /></div>}
              <div style={{ fontSize: 32, fontWeight: '900', color: 'white', textAlign: 'center', textTransform: 'uppercase' }}>{homeShort}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 100, fontWeight: '900', color: 'white', textShadow: '0 0 50px rgba(255,255,255,0.3)' }}>{match.home_score} - {match.away_score}</div>
              {match.home_penalties != null && <div style={{ fontSize: 28, color: '#ffd700', fontWeight: '700', background: 'rgba(255,215,0,0.2)', padding: '8px 20px', borderRadius: 20 }}>⚽ DCR {match.home_penalties}-{match.away_penalties}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
              {awayLogo && <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'white', padding: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}><img src={awayLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" /></div>}
              <div style={{ fontSize: 32, fontWeight: '900', color: 'white', textAlign: 'center', textTransform: 'uppercase' }}>{awayShort}</div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 40, fontSize: 24, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 4, zIndex: 1 }}>TROFEO SARNONICO</div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );

    // Converti in buffer e salva in storage
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('tournament-files')
      .upload(`match-posts/${fileName}`, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error('Errore upload storage:', uploadError);
    }

    // Restituisci l'immagine (così il browser la vede subito)
    return imageResponse;
  } catch (err) {
    console.error('Errore generazione post:', err);
    return new Response('Errore interno', { status: 500 });
  }
}