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
      .select('id, home_score, away_score, home_penalties, away_penalties, match_date, match_time, home_team_id, away_team_id, status')
      .eq('id', params.id)
      .single();

    if (matchError || !match) {
      return new Response('Partita non trovata', { status: 404 });
    }

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', [match.home_team_id, match.away_team_id]);

    const homeTeam = teams?.find((t: any) => t.id === match.home_team_id);
    const awayTeam = teams?.find((t: any) => t.id === match.away_team_id);

    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
    const matchTime = match.match_time || '--:--';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    // ✅ STRUTTURA JSX 100% COMPATIBILE CON SATORI (VERCEL/OG)
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: 64, fontWeight: '900', color: '#e94560', marginBottom: 60, textAlign: 'center' }}>PROSSIMA PARTITA</div>
              <div style={{ fontSize: 48, fontWeight: '700', color: 'white', marginBottom: 20, textAlign: 'center' }}>{homeName}</div>
              <div style={{ fontSize: 36, color: '#e94560', marginBottom: 20, textAlign: 'center' }}>VS</div>
              <div style={{ fontSize: 48, fontWeight: '700', color: 'white', marginBottom: 60, textAlign: 'center' }}>{awayName}</div>
              <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>{matchDate} • ⏰ {matchTime}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ fontSize: 64, fontWeight: '900', color: '#e94560', marginBottom: 60, textAlign: 'center' }}>RISULTATO FINALE</div>
              <div style={{ fontSize: 48, fontWeight: '700', color: 'white', marginBottom: 20, textAlign: 'center' }}>{homeName}</div>
              <div style={{ fontSize: 72, fontWeight: '900', color: '#ffd700', marginBottom: 20, textAlign: 'center' }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
              <div style={{ fontSize: 48, fontWeight: '700', color: 'white', marginBottom: 20, textAlign: 'center' }}>{awayName}</div>
              
              {/* ✅ Usiamo ? : invece di && per garantire un solo nodo figlio */}
              {match.home_penalties != null ? (
                <div style={{ fontSize: 32, color: '#ffd700', marginBottom: 40, textAlign: 'center' }}>⚽ DCR {match.home_penalties} - {match.away_penalties}</div>
              ) : (
                <div style={{ height: 40 }}></div>
              )}
            </div>
          )}
          
          <div style={{ position: 'absolute', bottom: 60, fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textAlign: 'center' }}>TROFEO SARNONICO</div>
        </div>
      ),
      { width: 1080, height: 1080 }
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