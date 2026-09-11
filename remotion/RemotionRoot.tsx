import React from 'react';
import { Composition } from 'remotion';
import { MatchdayVideo } from '../components/MatchdayVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MatchdayVideo"
        component={MatchdayVideo}
        durationInFrames={150} // 5 secondi a 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          tournamentLogo: 'https://trofeo-sarnonico.vercel.app/logo.png',
          background: 'https://trofeo-sarnonico.vercel.app/template.png',
          matches: [
            {
              homeTeam: 'SQUADRA 1',
              awayTeam: 'SQUADRA 2',
              homeLogo: '',
              awayLogo: '',
              time: '20:00',
              stadium: 'Stadio'
            },
            {
              homeTeam: 'SQUADRA 3',
              awayTeam: 'SQUADRA 4',
              homeLogo: '',
              awayLogo: '',
              time: '20:00',
              stadium: 'Stadio'
            },
            {
              homeTeam: 'SQUADRA 5',
              awayTeam: 'SQUADRA 6',
              homeLogo: '',
              awayLogo: '',
              time: '20:00',
              stadium: 'Stadio'
            }
          ]
        }}
      />
    </>
  );
};