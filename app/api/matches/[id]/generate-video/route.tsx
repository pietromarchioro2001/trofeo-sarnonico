import { renderMedia } from '@remotion/renderer';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // 1. Prendi la partita richiesta
    const { data: match, error } = await supabase
      .from('matches')
      .select('id, match_date, match_time, home_team_id, away_team_id, home_team:teams!home_team_id(name, logo_url), away_team:teams!away_team_id(name, logo_url)')
      .eq('id', params.id)
      .single();

    if (error || !match) {
      return NextResponse.json({ error: 'Partita non trovata' }, { status: 404 });
    }

    // 2. Prendi le altre partite dello stesso giorno per fare un "Matchday" di 3 partite
    const { data: dailyMatches } = await supabase
      .from('matches')
      .select('match_time, home_team:teams!home_team_id(name, logo_url), away_team:teams!away_team_id(name, logo_url)')
      .eq('match_date', match.match_date)
      .order('match_time', { ascending: true })
      .limit(3);

    const matchesData = (dailyMatches || []).map((m: any) => ({
      homeTeam: m.home_team?.name || 'Casa',
      awayTeam: m.away_team?.name || 'Ospite',
      homeLogo: m.home_team?.logo_url || '',
      awayLogo: m.away_team?.logo_url || '',
      time: m.match_time || '--:--',
      stadium: 'Trofeo Sarnonico'
    }));

    // Riempi con slot vuoti se ci sono meno di 3 partite
    while (matchesData.length < 3) {
      matchesData.push({ homeTeam: '', awayTeam: '', homeLogo: '', awayLogo: '', time: '', stadium: '' });
    }

    // 3. Genera il video
    const videoBuffer = await renderMedia({
      composition: {
        id: 'MatchdayVideo',
        durationInFrames: 150, // 5 secondi a 30fps
        fps: 30,
        width: 1080,
        height: 1920,
      },
      // Usa l'URL del tuo sito per servire i bundle Remotion
      serveUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      codec: 'h264',
      inputProps: {
        tournamentLogo: 'https://trofeo-sarnonico.vercel.app/logo.png',
        background: 'https://trofeo-sarnonico.vercel.app/template.png',
        matches: matchesData,
      },
    });

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="matchday-${params.id}.mp4"`,
      },
    });

  } catch (err) {
    console.error('❌ Errore generazione video:', err);
    return NextResponse.json({ error: 'Errore interno: ' + (err as Error).message }, { status: 500 });
  }
}