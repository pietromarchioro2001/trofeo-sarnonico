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
    const matchTime = match.match_time || '--:--';
    const fieldName = 'Campo di gioco';

    const dateObj = match.match_date ? new Date(match.match_date) : null;
    const formattedDate = dateObj 
      ? `${String(dateObj.getUTCDate()).padStart(2, '0')}.${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}.${dateObj.getUTCFullYear()}` 
      : '';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Template: ${template}`);

    // ✅ SELEZIONE TEMPLATE
    const templateBg = template === 'matchday' 
      ? 'https://trofeo-sarnonico.vercel.app/template-matchday.png'
      : 'https://trofeo-sarnonico.vercel.app/template-matchday.png'; // default

    // ✅ CONTENUTO DINAMICO PER TEMPLATE MATCHDAY
    const dynamicContent = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        
        {/* LOGO TORNEO nello scudo bianco in alto */}
        <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <img 
            src="https://trofeo-sarnonico.vercel.app/logo.png" 
            width="200" 
            height="200" 
            style={{ objectFit: 'contain' }} 
          />
        </div>

        {/* LOGO SQUADRA CASA nello scudo sinistro */}
        <div style={{ position: 'absolute', top: 720, left: 150, display: 'flex' }}>
          {homeLogo ? (
            <img src={homeLogo} width="270" height="270" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220 }}></div>
          )}
        </div>

        {/* LOGO SQUADRA OSPITE nello scudo destro */}
        <div style={{ position: 'absolute', top: 720, right: 150, display: 'flex' }}>
          {awayLogo ? (
            <img src={awayLogo} width="270" height="270" style={{ objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', width: 220, height: 220 }}></div>
          )}
        </div>

        {/* NOME SQUADRA CASA */}
        <div style={{ position: 'absolute', top: 1100, left: 0, right: 0, display: 'flex', justifyContent: 'flex-start', paddingLeft: 130 }}>
          <div style={{ display: 'flex', width: 240, justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 38, fontWeight: '900', color: '#800020', textAlign: 'center', letterSpacing: 1 }}>{homeName}</div>
          </div>
        </div>

        {/* NOME SQUADRA OSPITE */}
        <div style={{ position: 'absolute', top: 1100, left: 0, right: 0, display: 'flex', justifyContent: 'flex-end', paddingRight: 130 }}>
          <div style={{ display: 'flex', width: 240, justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 38, fontWeight: '900', color: '#800020', textAlign: 'center', letterSpacing: 1 }}>{awayName}</div>
          </div>
        </div>

        {/* DATA (a sinistra) */}
        <div style={{ position: 'absolute', top: 1080, left: 180, display: 'flex' }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: '700', color: '#800020' }}>{formattedDate}</div>
        </div>
        
        {/* ORA (a destra) */}
        <div style={{ position: 'absolute', top: 1080, right: 180, display: 'flex' }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: '700', color: '#800020' }}>{matchTime}</div>
        </div>
      </div>
    );

    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src={templateBg} 
            width="1080" 
            height="1920" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          {dynamicContent}
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
