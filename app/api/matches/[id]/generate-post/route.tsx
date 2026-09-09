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

    // Fetch partita
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, home_score, away_score, home_penalties, away_penalties, match_date, match_time, home_team_id, away_team_id, status')
      .eq('id', params.id)
      .single();

    if (matchError || !match) {
      console.error('Errore fetch match:', matchError);
      return new Response('Partita non trovata', { status: 404 });
    }

    // Fetch squadre
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .in('id', [match.home_team_id, match.away_team_id]);

    if (teamsError) {
      console.error('Errore fetch teams:', teamsError);
      return new Response('Errore recupero squadre', { status: 500 });
    }

    const homeTeam = teams?.find((t: any) => t.id === match.home_team_id);
    const awayTeam = teams?.find((t: any) => t.id === match.away_team_id);

    const homeLogo = homeTeam?.logo_url || '';
    const awayLogo = awayTeam?.logo_url || '';
    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const homeShort = homeName.split(' ').pop() || 'CASA';
    const awayShort = awayName.split(' ').pop() || 'OSPITE';
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
    const matchTime = match.match_time || '--:--';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    // Genera immagine
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
          <div style={{ fontSize: 32, color: 'white', fontWeight: '700', zIndex: 1 }}> {matchDate} • ⏰ {matchTime}</div>
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
              <div style={{ fontSize: 100, fontWeight: '900', color: 'white', textShadow: '0 0 50px rgba(255,255,255,0.3)' }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
              {match.home_penalties != null && <div style={{ fontSize: 28, color: '#ffd700', fontWeight: '700', background: 'rgba(255,215,0,0.2)', padding: '8px 20px', borderRadius: 20 }}> DCR {match.home_penalties}-{match.away_penalties}</div>}
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

    // Converti e upload
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
      console.error('Errore upload:', uploadError);
      return new Response('Errore upload: ' + uploadError.message, { status: 500 });
    }

    console.log('✅ Post generato e salvato:', fileName);
    return imageResponse;
    
  } catch (err) {
    console.error('❌ Errore generazione post:', err);
    return new Response('Errore interno: ' + (err as Error).message, { status: 500 });
  }
}