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

    // ✅ NUCLEAR OPTION: display: 'flex' su OGNI singolo div per soddisfare Satori
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#e94560' }}>PROSSIMA PARTITA</div>
              <div style={{ display: 'flex', fontSize: 48, color: 'white', marginTop: 40 }}>{homeName}</div>
              <div style={{ display: 'flex', fontSize: 36, color: '#e94560', marginTop: 20 }}>VS</div>
              <div style={{ display: 'flex', fontSize: 48, color: 'white', marginTop: 20 }}>{awayName}</div>
              <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.8)', marginTop: 40 }}>{matchDate} • {matchTime}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', fontSize: 64, fontWeight: '900', color: '#e94560' }}>RISULTATO FINALE</div>
              <div style={{ display: 'flex', fontSize: 48, color: 'white', marginTop: 40 }}>{homeName}</div>
              <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#ffd700', marginTop: 20 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
              <div style={{ display: 'flex', fontSize: 48, color: 'white', marginTop: 20 }}>{awayName}</div>
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', fontSize: 32, color: '#ffd700', marginTop: 40 }}>DCR {match.home_penalties} - {match.away_penalties}</div>
              ) : (
                <div style={{ display: 'flex', height: 72 }}></div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', position: 'absolute', bottom: 60, fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>TROFEO SARNONICO</div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );

        // 1. Convertiamo l'immagine in buffer per Supabase
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${params.id}_${type}.png`;

    // 2. Carichiamo su Supabase
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

    // 3. ✅ RESTITUIAMO UNA NUOVA RESPONSE CON IL BUFFER (risolve l'errore ReadableStream)
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