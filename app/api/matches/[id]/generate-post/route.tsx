import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCanvas, loadImage } from '@napi-rs/canvas'; // opzionale per effetti avanzati

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const type = req.nextUrl.searchParams.get('type') || 'PRE_MATCH';
  const supabase = createClient();
  
  // Recupera dati partita + squadre
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, logo_url),
      away_team:teams!away_team_id(id, name, logo_url)
    `)
    .eq('id', params.id)
    .single();

  if (!match) return new Response('Not found', { status: 404 });

  // JSX → PNG via next/og (1200x1200, formato perfetto per Instagram/WhatsApp)
  const imageResponse = new ImageResponse(
    type === 'PRE_MATCH' ? (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #581C24 0%, #8B2E3A 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Oswald, sans-serif',
          color: 'white',
          padding: 60,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 400, opacity: 0.8, letterSpacing: 8 }}>
          PROSSIMA PARTITA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 40 }}>
          <img src={match.home_team.logo_url} width="160" height="160" />
          <div style={{ fontSize: 64, fontWeight: 900 }}>VS</div>
          <img src={match.away_team.logo_url} width="160" height="160" />
        </div>
        <div style={{ display: 'flex', gap: 80, marginTop: 40, fontSize: 40, fontWeight: 700 }}>
          <div style={{ textAlign: 'center' }}>{match.home_team.name}</div>
          <div style={{ textAlign: 'center' }}>{match.away_team.name}</div>
        </div>
        <div style={{ marginTop: 60, fontSize: 28, opacity: 0.9 }}>
          📅 {new Date(match.match_date).toLocaleDateString('it-IT')} • ⏰ {match.match_time}
        </div>
      </div>
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #581C24 0%, #8B2E3A 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Oswald, sans-serif',
          color: 'white',
          padding: 60,
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 8, opacity: 0.8 }}>FINALE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 60, marginTop: 60 }}>
          <img src={match.home_team.logo_url} width="140" height="140" />
          <div style={{ fontSize: 120, fontWeight: 900 }}>
            {match.home_score} - {match.away_score}
          </div>
          <img src={match.away_team.logo_url} width="140" height="140" />
        </div>
        <div style={{ display: 'flex', gap: 120, marginTop: 40, fontSize: 36, fontWeight: 700 }}>
          <div>{match.home_team.name}</div>
          <div>{match.away_team.name}</div>
        </div>
        {match.home_penalties != null && (
          <div style={{ marginTop: 30, fontSize: 28, color: '#C79EFF' }}>
            ⚽ DCR: {match.home_penalties}-{match.away_penalties}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 1200 }
  );

  // Converti in ArrayBuffer per caricarlo su Supabase Storage
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${params.id}_${type}_${Date.now()}.png`;
  
  // Upload su Storage
  const { error: uploadError } = await supabase.storage
    .from('tournament-files')
    .upload(`match-posts/${fileName}`, buffer, {
      contentType: 'image/png',
      cacheControl: '3600',
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('tournament-files')
    .getPublicUrl(`match-posts/${fileName}`);

  // Salva riferimento nel DB
  await supabase.from('match_posts').upsert({
    match_id: params.id,
    type,
    image_url: publicUrl,
    caption: `${match.home_team.name} vs ${match.away_team.name}`,
  }, { onConflict: 'match_id,type' });

  return imageResponse;
}