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
    const matchTime = match.match_time || '--:--';

    const dateObj = match.match_date ? new Date(match.match_date) : null;
    const formattedDate = dateObj 
      ? `${String(dateObj.getUTCDate()).padStart(2, '0')}.${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}.${dateObj.getUTCFullYear()}` 
      : '';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    // ✅ COSTRUISCO IL CONTENUTO DINAMICO FUORI DAL JSX
    const dynamicContent = type === 'PRE_MATCH' ? (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        
        {/* Etichetta FASE (sopra i nomi) */}
        <div style={{ position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', borderRadius: '50px', padding: '12px 40px', border: '2px solid rgba(255,255,255,0.3)' }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: 'white', letterSpacing: '4px' }}>{match.phase || 'GIRONI'}</div>
          </div>
        </div>

        {/* Nomi squadre (sopra i loghi) */}
        <div style={{ position: 'absolute', top: 1480, left: 110, right: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 80 }}>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: '2px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>{homeName}</div>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: '2px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>{awayName}</div>
        </div>

        {/* Logo squadra CASA (a sinistra del VS) */}
        <div style={{ position: 'absolute', top: 1120, left: 110, display: 'flex' }}>
          {homeLogo ? (
            <img src={homeLogo} width="400" height="400" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 180, height: 180 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE (a destra del VS) */}
        <div style={{ position: 'absolute', top: 1120, right: 110, display: 'flex' }}>
          {awayLogo ? (
            <img src={awayLogo} width="400" height="400" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 180, height: 180 }}></div>
          )}
        </div>

        {/* Data e ora (a fianco dell'icona calendario) */}
        <div style={{ position: 'absolute', top: 1670, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: '700', color: 'white', letterSpacing: '3px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
            {formattedDate} - {matchTime}
          </div>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        
        {/* Etichetta FASE */}
        <div style={{ position: 'absolute', top: 780, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', borderRadius: '50px', padding: '12px 40px', border: '2px solid rgba(255,255,255,0.3)' }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: 'white', letterSpacing: '4px' }}>{match.phase || 'GIRONI'}</div>
          </div>
        </div>

        {/* Nomi squadre */}
        <div style={{ position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 80 }}>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: '2px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>{homeName}</div>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: '2px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>{awayName}</div>
        </div>

        {/* Logo squadra CASA */}
        <div style={{ position: 'absolute', top: 980, left: 200, display: 'flex' }}>
          {homeLogo ? (
            <img src={homeLogo} width="160" height="160" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 160, height: 160 }}></div>
          )}
        </div>
        
        {/* Logo squadra OSPITE */}
        <div style={{ position: 'absolute', top: 980, right: 200, display: 'flex' }}>
          {awayLogo ? (
            <img src={awayLogo} width="160" height="160" style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.8))' }} />
          ) : (
            <div style={{ display: 'flex', width: 160, height: 160 }}></div>
          )}
        </div>

        {/* Score al posto del VS (lo copriamo con un box scuro) */}
        <div style={{ position: 'absolute', top: 1020, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '16px 48px' }}>
            <div style={{ display: 'flex', fontSize: 80, fontWeight: '900', color: '#ffd700', letterSpacing: '8px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
              {match.home_score ?? 0} - {match.away_score ?? 0}
            </div>
          </div>
        </div>

        {/* DCR se ci sono rigori */}
        <div style={{ position: 'absolute', top: 1140, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          {match.home_penalties != null ? (
            <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.9)', borderRadius: '50px', padding: '12px 40px' }}>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: '900', color: '#1a0a0e', letterSpacing: '2px' }}>DCR {match.home_penalties} - {match.away_penalties}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', height: 60 }}></div>
          )}
        </div>

        {/* Data e ora */}
        <div style={{ position: 'absolute', top: 1320, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: '700', color: 'white', letterSpacing: '3px', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
            {formattedDate} - {matchTime}
          </div>
        </div>
      </div>
    );

    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Nuova immagine di base MATCH DAY */}
          <img 
            src="https://trofeo-sarnonico.vercel.app/matchday.png" 
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