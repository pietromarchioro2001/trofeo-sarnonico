import React from 'react';
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  time: string;
  stadium: string;
}

interface MatchdayVideoProps {
  tournamentLogo: string;
  background: string;
  matches: Match[];
}

export const MatchdayVideo: React.FC<MatchdayVideoProps> = ({
  tournamentLogo,
  background,
  matches,
}) => {
  const frame = useCurrentFrame();

  // === ANIMAZIONE LOGO TORNEO (fade in + scale) ===
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const logoScale = interpolate(frame, [0, 25], [0.5, 1], {
    extrapolateRight: 'clamp',
  });

  // === ANIMAZIONE TITOLO "MATCH DAY" (slide dall'alto) ===
  const titleY = interpolate(frame, [10, 40], [-100, 0], {
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // === ANIMAZIONI WIPE REVEAL PER LE 3 PARTITE ===
  // Ogni partita ha un timing diverso
  const getRevealProgress = (index: number) => {
    const startFrame = 40 + index * 30; // 40, 70, 100
    const endFrame = startFrame + 25;   // 65, 95, 125
    return interpolate(frame, [startFrame, endFrame], [100, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  // === ANIMAZIONE FOOTER ===
  const footerOpacity = interpolate(frame, [130, 150], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* SFONDO TEMPLATE */}
      <Img
        src={background}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
        }}
      />

      {/* LOGO TORNEO IN ALTO */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 60,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <Img
          src={tournamentLogo}
          style={{
            width: 180,
            height: 180,
            objectFit: 'contain',
          }}
        />
      </AbsoluteFill>

      {/* TITOLO MATCH DAY */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 260,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            color: 'white',
            letterSpacing: 4,
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
            fontFamily: 'Impact, sans-serif',
          }}
        >
          MATCH DAY
        </div>
      </AbsoluteFill>

      {/* RIGHE PARTITE CON WIPE REVEAL */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          paddingTop: 420,
        }}
      >
        {matches.map((match, index) => {
          const reveal = getRevealProgress(index);
          return (
            <div
              key={index}
              style={{
                width: '90%',
                height: 140,
                background: 'rgba(10, 30, 100, 0.85)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                clipPath: `inset(0 ${reveal}% 0 0)`,
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Squadra Casa */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'Impact, sans-serif',
                    letterSpacing: 1,
                  }}
                >
                  {match.homeTeam}
                </div>
                {match.homeLogo && (
                  <Img
                    src={match.homeLogo}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>

              {/* Ora e Stadio */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 0.8,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#FFD700',
                  }}
                >
                  {match.time}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.7)',
                    marginTop: 4,
                  }}
                >
                  {match.stadium}
                </div>
              </div>

              {/* Squadra Ospite */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flex: 1,
                  justifyContent: 'flex-end',
                }}
              >
                {match.awayLogo && (
                  <Img
                    src={match.awayLogo}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'contain',
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'Impact, sans-serif',
                    letterSpacing: 1,
                  }}
                >
                  {match.awayTeam}
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* FOOTER */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 60,
          opacity: footerOpacity,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: 4,
          }}
        >
          TROFEO SARNONICO 2026
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};