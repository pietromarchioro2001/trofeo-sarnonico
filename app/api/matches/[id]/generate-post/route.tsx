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
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT') : 'TBD';
    const matchTime = match.match_time || '--:--';

    if (type === 'PRE_MATCH') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #581C24 0%, #8B2E3A 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'sans-serif',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 60 }}>PROSSIMA PARTITA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 40 }}>
              {homeLogo && <img src={homeLogo} width="150" height="150" style={{ borderRadius: '50%' }} />}
              <div style={{ fontSize: 80, fontWeight: 'bold' }}>VS</div>
              {awayLogo && <img src={awayLogo} width="150" height="150" style={{ borderRadius: '50%' }} />}
            </div>
            <div style={{ fontSize: 40, marginBottom: 40 }}>{homeName} vs {awayName}</div>
            <div style={{ fontSize: 28 }}>📅 {matchDate} • ⏰ {matchTime}</div>
          </div>
        ),
        { width: 1200, height: 1200 }
      );
    } else {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #581C24 0%, #8B2E3A 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'sans-serif',
              color: 'white',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 60 }}>RISULTATO FINALE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 40 }}>
              {homeLogo && <img src={homeLogo} width="150" height="150" style={{ borderRadius: '50%' }} />}
              <div style={{ fontSize: 100, fontWeight: 'bold' }}>
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </div>
              {awayLogo && <img src={awayLogo} width="150" height="150" style={{ borderRadius: '50%' }} />}
            </div>
            <div style={{ fontSize: 40 }}>{homeName} vs {awayName}</div>
            {match.home_penalties != null && (
              <div style={{ fontSize: 32, marginTop: 30, color: '#C79EFF' }}>
                ⚽ DCR: {match.home_penalties} - {match.away_penalties}
              </div>
            )}
          </div>
        ),
        { width: 1200, height: 1200 }
      );
    }
  } catch (err) {
    console.error('Errore generazione post:', err);
    return new Response('Errore interno del server', { status: 500 });
  }
}