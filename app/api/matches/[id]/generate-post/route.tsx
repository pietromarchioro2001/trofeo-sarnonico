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
        id, home_score, away_score, home_penalties, away_penalties, match_date, match_time, phase,
        home_team:teams!home_team_id(id, name, logo_url),
        away_team:teams!away_team_id(id, name, logo_url),
        mvp_player:players!mvp_player_id(id, first_name, last_name, photo_url, team_id)
      `)
      .eq('id', params.id)
      .single();

    if (error || !match) {
      return new Response('Partita non trovata', { status: 404 });
    }

    const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
    const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
    const mvpPlayer = Array.isArray(match.mvp_player) ? match.mvp_player[0] : match.mvp_player;

    const homeLogo = homeTeam?.logo_url || '';
    const awayLogo = awayTeam?.logo_url || '';
    const homeName = homeTeam?.name || 'Casa';
    const awayName = awayTeam?.name || 'Ospite';
    const homeShort = homeName.split(' ').pop() || 'CASA';
    const awayShort = awayName.split(' ').pop() || 'OSPITE';

    // Formato Instagram: 1080x1080 o 1080x1350
    const width = 1080;
    const height = 1080;

    if (type === 'PRE_MATCH') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Effetto sfondo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(233, 69, 96, 0.1) 0%, transparent 50%)',
            }} />
            
            {/* Titolo */}
            <div style={{ 
              fontSize: 48, 
              fontWeight: '900', 
              color: '#e94560',
              textTransform: 'uppercase',
              letterSpacing: 8,
              marginBottom: 60,
              zIndex: 1,
            }}>
              PROSSIMA PARTITA
            </div>

            {/* Squadre */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 30,
              marginBottom: 60,
              zIndex: 1,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                {homeLogo && (
                  <div style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'white',
                    padding: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}>
                    <img src={homeLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" />
                  </div>
                )}
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: '900', 
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>{homeShort}</div>
              </div>

              <div style={{ 
                fontSize: 64, 
                fontWeight: '900', 
                color: '#e94560',
                textShadow: '0 0 30px rgba(233, 69, 96, 0.5)',
              }}>VS</div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                {awayLogo && (
                  <div style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'white',
                    padding: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}>
                    <img src={awayLogo} width="160" height="160" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" />
                  </div>
                )}
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: '900', 
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>{awayShort}</div>
              </div>
            </div>

            {/* Data e ora */}
            <div style={{ 
              fontSize: 32, 
              color: 'white',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              zIndex: 1,
            }}>
              <span>📅 {match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : ''}</span>
              <span style={{ color: '#e94560' }}>•</span>
              <span> {match.match_time || '--:--'}</span>
            </div>

            {/* Footer */}
            <div style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '700',
              letterSpacing: 4,
              zIndex: 1,
            }}>
              TROFEO SARNONICO
            </div>
          </div>
        ),
        { width, height }
      );
    } else if (type === 'POST_MATCH') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Effetto sfondo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(233, 69, 96, 0.15) 0%, transparent 50%)',
            }} />
            
            {/* Titolo */}
            <div style={{ 
              fontSize: 56, 
              fontWeight: '900', 
              color: '#e94560',
              textTransform: 'uppercase',
              letterSpacing: 8,
              marginBottom: 40,
              textShadow: '0 0 40px rgba(233, 69, 96, 0.5)',
              zIndex: 1,
            }}>
              RISULTATO FINALE
            </div>

            {/* Risultato */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 30,
              marginBottom: 50,
              zIndex: 1,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                {homeLogo && (
                  <div style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'white',
                    padding: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}>
                    <img src={homeLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" />
                  </div>
                )}
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: '900', 
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>{homeShort}</div>
              </div>

              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{ 
                  fontSize: 100, 
                  fontWeight: '900', 
                  color: 'white',
                  textShadow: '0 0 50px rgba(255,255,255,0.3)',
                }}>
                  {match.home_score} - {match.away_score}
                </div>
                {(match.home_penalties != null) && (
                  <div style={{ 
                    fontSize: 28, 
                    color: '#ffd700',
                    fontWeight: '700',
                    background: 'rgba(255,215,0,0.2)',
                    padding: '8px 20px',
                    borderRadius: 20,
                  }}>
                    ⚽ DCR {match.home_penalties}-{match.away_penalties}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                {awayLogo && (
                  <div style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'white',
                    padding: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}>
                    <img src={awayLogo} width="140" height="140" style={{ borderRadius: '50%', objectFit: 'contain' }} alt="" />
                  </div>
                )}
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: '900', 
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>{awayShort}</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '700',
              letterSpacing: 4,
              zIndex: 1,
            }}>
              TROFEO SARNONICO
            </div>
          </div>
        ),
        { width, height }
      );
    } else if (type === 'MVP' && mvpPlayer) {
      const isHomeMvp = mvpPlayer.team_id === homeTeam?.id;
      
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Effetto oro sfondo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.2) 0%, transparent 60%)',
            }} />
            
            {/* Corona/Trofeo */}
            <div style={{ 
              fontSize: 80, 
              marginBottom: 20,
              zIndex: 1,
            }}>🏆</div>

            {/* Titolo */}
            <div style={{ 
              fontSize: 56, 
              fontWeight: '900', 
              color: '#ffd700',
              textTransform: 'uppercase',
              letterSpacing: 8,
              marginBottom: 40,
              textShadow: '0 0 40px rgba(255,215,0,0.5)',
              zIndex: 1,
            }}>
              MVP PARTITA
            </div>

            {/* Foto giocatore */}
            <div style={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
              padding: 10,
              marginBottom: 30,
              boxShadow: '0 10px 60px rgba(255,215,0,0.4)',
              zIndex: 1,
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {mvpPlayer.photo_url ? (
                  <img src={mvpPlayer.photo_url} width="260" height="260" style={{ objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ fontSize: 100, color: '#ccc' }}></div>
                )}
              </div>
            </div>

            {/* Nome giocatore */}
            <div style={{ 
              fontSize: 48, 
              fontWeight: '900', 
              color: 'white',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginBottom: 10,
              zIndex: 1,
            }}>
              {mvpPlayer.first_name}
            </div>
            <div style={{ 
              fontSize: 42, 
              fontWeight: '900', 
              color: '#ffd700',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginBottom: 30,
              zIndex: 1,
            }}>
              {mvpPlayer.last_name}
            </div>

            {/* Squadra */}
            <div style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: '700',
              background: 'rgba(255,255,255,0.1)',
              padding: '12px 30px',
              borderRadius: 30,
              zIndex: 1,
            }}>
              {isHomeMvp ? homeTeam?.name : awayTeam?.name}
            </div>

            {/* Footer */}
            <div style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '700',
              letterSpacing: 4,
              zIndex: 1,
            }}>
              TROFEO SARNONICO
            </div>
          </div>
        ),
        { width, height }
      );
    }

    return new Response('Tipo di post non valido', { status: 400 });
    
  } catch (err) {
    console.error('Errore generazione post:', err);
    return new Response('Errore interno del server', { status: 500 });
  }
}