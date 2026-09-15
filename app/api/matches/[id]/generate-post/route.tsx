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
    const template = req.nextUrl.searchParams.get('template') || 'matchday';
    const supabase = createClient();

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, home_score, away_score, home_penalties, away_penalties, match_date, match_time, home_team_id, away_team_id, status, phase, match_key')
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

    // ✅ RECUPERA MARCATORI (solo gol)
    const { data: eventsData } = await supabase
      .from('match_events')
      .select('minute, player_id, team_id, player:players(first_name, last_name)')
      .eq('match_id', params.id)
      .eq('event_type', 'GOAL')
      .order('minute', { ascending: true });

    const homeScorers = (eventsData || []).filter((e: any) => e.team_id === match.home_team_id);
    const awayScorers = (eventsData || []).filter((e: any) => e.team_id === match.away_team_id);

    console.log(`Generazione post ${type} per ${homeName} vs ${awayName}`);

    const templateBg = type === 'POST_MATCH'
      ? 'https://trofeo-sarnonico.vercel.app/template-fulltime.png'
      : 'https://trofeo-sarnonico.vercel.app/template-matchday.png';

    // ✅ CONTENUTO DINAMICO PER POST_MATCH (FULL TIME) - CORRETTO PER SATORI
    const dynamicContentPostMatch = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        
        {/* LOGO TORNEO */}
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <img src="https://trofeo-sarnonico.vercel.app/logo.png" width="180" height="180" style={{ objectFit: 'contain' }} />
        </div>

        {/* LOGO CASA */}
        <div style={{ position: 'absolute', top: 520, left: 80, display: 'flex' }}>
          {homeLogo ? (
            <img src={homeLogo} width="220" height="220" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220, background: 'rgba(128,0,36,0.1)', borderRadius: '50%' }} />
          )}
        </div>

        {/* LOGO OSPITE */}
        <div style={{ position: 'absolute', top: 520, right: 80, display: 'flex' }}>
          {awayLogo ? (
            <img src={awayLogo} width="220" height="220" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220, background: 'rgba(128,0,36,0.1)', borderRadius: '50%' }} />
          )}
        </div>

        {/* RISULTATO */}
        <div style={{ position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34 }}>
          <span style={{ fontSize: 84, fontWeight: '900', color: '#800020' }}>{match.home_score || 0}</span>
          <span style={{ fontSize: 84, fontWeight: '900', color: '#800020' }}>{match.away_score || 0}</span>
        </div>

        {/* DCR */}
        {(match.home_penalties !== null || match.away_penalties !== null) && (
          <div style={{ position: 'absolute', top: 800, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: '700', color: '#9333ea' }}>
              dcr ({match.home_penalties}-{match.away_penalties})
            </span>
          </div>
        )}

        {/* NOMI SQUADRE */}
        <div
        style={{
          position: 'absolute',
          top: 850,
          left: 55,
          right: 55,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ width: 280, display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: '800',
              color: '#800020',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {homeName}
          </span>
        </div>
      
        <div style={{ width: 280, display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: '800',
              color: '#800020',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {awayName}
          </span>
        </div>
      </div>

        {/* ✅ BOX MARCATORI - AGGIUNTO display: 'flex' e flexDirection: 'column' */}
        <div style={{ position: 'absolute', top: 980, left: 60, right: 60, bottom: 100, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.95)', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

          {/* Lista Marcatori Casa - AGGIUNTO display: 'flex', flexDirection: 'column' */}
          <div style={{ position: 'absolute', left: 60, right: '50%', top: 35, bottom: 40, paddingRight: 40, display: 'flex', flexDirection: 'column' }}>
            {homeScorers.length > 0 ? homeScorers.map((scorer: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, fontSize: 26, color: '#333' }}>
                <span style={{ color: '#800026', minWidth: 48, fontSize: 26, fontWeight: '800', }}>{scorer.minute}'</span>
                <span style={{ fontWeight: '600' }}>
                  {scorer.player ? `${scorer.player.first_name?.[0] || ''}. ${scorer.player.last_name || ''}` : 'Sconosciuto'}
                </span>
              </div>
            )) : (
              <div style={{ display: 'flex', justifyContent: 'center', color: '#999', fontSize: 16, marginTop: 60 }}>Nessun marcatore</div>
            )}
          </div>

          {/* Lista Marcatori Ospite - AGGIUNTO display: 'flex', flexDirection: 'column' */}
          <div style={{ position: 'absolute', left: '50%', right: 60, top: 80, bottom: 40, paddingLeft: 40, display: 'flex', flexDirection: 'column' }}>
            {awayScorers.length > 0 ? awayScorers.map((scorer: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, fontSize: 26, color: '#333' }}>
                <span style={{ color: '#800026', minWidth: 48, fontSize: 26, fontWeight: '800', }}>{scorer.minute}'</span>
                <span style={{ fontWeight: '600' }}>
                  {scorer.player ? `${scorer.player.first_name?.[0] || ''}. ${scorer.player.last_name || ''}` : 'Sconosciuto'}
                </span>
              </div>
            )) : (
              <div style={{ display: 'flex', justifyContent: 'center', color: '#999', fontSize: 16, marginTop: 60 }}>Nessun marcatore</div>
            )}
          </div>
        </div>
      </div>
    );

    // ✅ CONTENUTO DINAMICO PER PRE_MATCH
    const dynamicContentPreMatch = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', top: 65, left: 8, right: 0, display: 'flex', justifyContent: 'center' }}>
          <img src="https://trofeo-sarnonico.vercel.app/logo.png" width="200" height="200" style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'absolute', top: 720, left: 100, display: 'flex' }}>
          {homeLogo ? (
            <img src={homeLogo} width="280" height="280" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220 }}></div>
          )}
        </div>
        <div style={{ position: 'absolute', top: 720, right: 100, display: 'flex' }}>
          {awayLogo ? (
            <img src={awayLogo} width="280" height="280" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220 }}></div>
          )}
        </div>
        <div style={{ position: 'absolute', top: 1050, left: 0, right: 30, display: 'flex', justifyContent: 'flex-start', paddingLeft: 130 }}>
          <div style={{ display: 'flex', width: 240, justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: '#800020', textAlign: 'center', letterSpacing: 1 }}>{homeName}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 1050, left: 30, right: 0, display: 'flex', justifyContent: 'flex-end', paddingRight: 130 }}>
          <div style={{ display: 'flex', width: 240, justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: '900', color: '#800020', textAlign: 'center', letterSpacing: 1 }}>{awayName}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 1180, left: 170, display: 'flex' }}>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: '700', color: '#800020' }}>
            {match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT') : ''}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 1180, right: 260, display: 'flex' }}>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: '700', color: '#800020' }}>{match.match_time || '--:--'}</div>
        </div>
      </div>
    );

    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={templateBg} width="1080" height="1920" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {type === 'POST_MATCH' ? dynamicContentPostMatch : dynamicContentPreMatch}
        </div>
      ),
      { width: 1080, height: 1920 }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${params.id}_${type}_${template}.png`;

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

    return new Response(new Uint8Array(buffer), {
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
