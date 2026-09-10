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
      .select('id, name')
      .in('id', [match.home_team_id, match.away_team_id]);

    const homeTeam = teams?.find((t: any) => t.id === match.home_team_id);
    const awayTeam = teams?.find((t: any) => t.id === match.away_team_id);

    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
    const matchTime = match.match_time || '--:--';
    const phase = match.phase || 'GIRONI';

    console.log(`Generazione post per ${homeName} vs ${awayName} - Tipo: ${type}`);

    // ✅ DESIGN MODERNO E FIGO - SENZA IMMAGINI
    const imageResponse = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0a0e 0%, #2d1118 30%, #581C24 70%, #1a0a0e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Elementi decorativi di sfondo */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(233, 69, 96, 0.3) 0%, transparent 70%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', border: '2px solid rgba(255, 255, 255, 0.05)', borderRadius: '50%', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', border: '2px solid rgba(255, 255, 255, 0.03)', borderRadius: '50%', display: 'flex' }}></div>
          
          {/* Linee diagonali decorative */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent 48%, rgba(255, 255, 255, 0.02) 49%, rgba(255, 255, 255, 0.02) 51%, transparent 52%)', display: 'flex' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(-45deg, transparent 48%, rgba(255, 255, 255, 0.02) 49%, rgba(255, 255, 255, 0.02) 51%, transparent 52%)', display: 'flex' }}></div>

          {type === 'PRE_MATCH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', zIndex: 1 }}>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '50px', padding: '12px 32px', marginBottom: 40 }}>
                <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: 'white', letterSpacing: 4 }}>{phase}</div>
              </div>
              
              {/* Titolo */}
              <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#e94560', marginBottom: 60, textShadow: '0 0 40px rgba(233, 69, 96, 0.5)', letterSpacing: 4 }}>PROSSIMA PARTITA</div>
              
              {/* Squadre con VS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{homeName}</div>
                  <div style={{ display: 'flex', width: 80, height: 4, background: '#e94560', borderRadius: 2 }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: '900', color: '#e94560', textShadow: '0 0 30px rgba(233, 69, 96, 0.8)' }}>VS</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{awayName}</div>
                  <div style={{ display: 'flex', width: 80, height: 4, background: '#e94560', borderRadius: 2 }}></div>
                </div>
              </div>
              
              {/* Data e ora in box */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: 20, padding: '20px 40px', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255, 255, 255, 0.7)' }}>📅</div>
                    <div style={{ display: 'flex', fontSize: 32, fontWeight: '700', color: 'white' }}>{matchDate}</div>
                  </div>
                  <div style={{ display: 'flex', width: 2, height: 40, background: 'rgba(255, 255, 255, 0.3)' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255, 255, 255, 0.7)' }}>⏰</div>
                    <div style={{ display: 'flex', fontSize: 32, fontWeight: '700', color: 'white' }}>{matchTime}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', zIndex: 1 }}>
              
              {/* Badge fase */}
              <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.2)', border: '2px solid rgba(255, 215, 0, 0.5)', borderRadius: '50px', padding: '12px 32px', marginBottom: 40 }}>
                <div style={{ display: 'flex', fontSize: 28, fontWeight: '700', color: '#ffd700', letterSpacing: 4 }}>{phase}</div>
              </div>
              
              {/* Titolo */}
              <div style={{ display: 'flex', fontSize: 72, fontWeight: '900', color: '#ffd700', marginBottom: 60, textShadow: '0 0 40px rgba(255, 215, 0, 0.5)', letterSpacing: 4 }}>RISULTATO FINALE</div>
              
              {/* Squadre con score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60, marginBottom: 60 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{homeName}</div>
                  <div style={{ display: 'flex', width: 80, height: 4, background: '#ffd700', borderRadius: 2 }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', fontSize: 120, fontWeight: '900', color: '#ffd700', textShadow: '0 0 60px rgba(255, 215, 0, 0.8)', letterSpacing: 8 }}>{match.home_score ?? 0} - {match.away_score ?? 0}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', fontSize: 56, fontWeight: '900', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{awayName}</div>
                  <div style={{ display: 'flex', width: 80, height: 4, background: '#ffd700', borderRadius: 2 }}></div>
                </div>
              </div>
              
              {/* DCR se ci sono rigori */}
              {match.home_penalties != null ? (
                <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.2)', border: '2px solid rgba(255, 215, 0, 0.5)', borderRadius: 20, padding: '16px 32px', marginBottom: 40 }}>
                  <div style={{ display: 'flex', fontSize: 36, fontWeight: '700', color: '#ffd700', letterSpacing: 2 }}>⚽ DCR {match.home_penalties} - {match.away_penalties}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: 72 }}></div>
              )}
            </div>
          )}
          
          {/* Footer con logo torneo */}
          <div style={{ position: 'absolute', bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: '900', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 6 }}>TROFEO SARNONICO</div>
            <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 2 }}>2026</div>
          </div>
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