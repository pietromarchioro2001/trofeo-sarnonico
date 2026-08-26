import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usa le tue chiavi reali o carica da .env
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://sqyxonizsynrltnpkyw.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'LA_TUA_SERVICE_ROLE_KEY_QUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateTournament() {
  console.log('🚀 Inizio migrazione Torneo dei Paesi 2026...');

  // 1. Crea torneo attivo
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .insert({ name: 'Torneo dei Paesi 2026', year: 2026, is_active: true })
    .select()
    .single();

  if (tErr || !tournament) {
    console.error('❌ Errore creazione torneo:', tErr);
    return;
  }
  console.log(`✅ Torneo creato: ${tournament.id}`);

  // 2. Migra Squadre
  const teamsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/teams.json'), 'utf8')
  );
  const teamsToInsert = teamsData.map((t) => ({
    id: t.TEAM_ID, // Mantieni ID originale
    tournament_id: tournament.id,
    name: t.NOME_SQUADRA,
    group_name: t.GIRONE || 'A',
    logo_url: t.LOGO_ID
      ? `https://drive.google.com/uc?export=view&id=${t.LOGO_ID}`
      : null,
    photo_url: t.FOTO_SQUADRA_FILE_ID
      ? `https://drive.google.com/uc?export=view&id=${t.FOTO_SQUADRA_FILE_ID}`
      : null,
  }));
  const { error: sErr } = await supabase.from('teams').insert(teamsToInsert);
  if (sErr) console.error('❌ Errore squadre:', sErr);
  else console.log(`✅ Migrate ${teamsToInsert.length} squadre`);

  // 3. Migra Giocatori
  const playersData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/players.json'), 'utf8')
  );
  const playersToInsert = playersData.map((p) => ({
    id: p.PLAYER_ID,
    team_id: p.TEAM_ID,
    first_name: p.NOME?.split(' ')[0] || '',
    last_name: p.NOME?.split(' ').slice(1).join(' ') || p.NOME || '',
    jersey_number: p.N_MAGLIA || 0,
    birth_date: p.DATA_NASCITA || null,
    photo_url: p.FOTO_ID
      ? `https://drive.google.com/uc?export=view&id=${p.FOTO_ID}`
      : null,
  }));
  const { error: pErr } = await supabase
    .from('players')
    .insert(playersToInsert);
  if (pErr) console.error('❌ Errore giocatori:', pErr);
  else console.log(`✅ Migrati ${playersToInsert.length} giocatori`);

  // 4. Migra Partite
  const matchesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/matches.json'), 'utf8')
  );
  const matchesToInsert = matchesData.map((m) => ({
    id: m.MATCH_ID,
    tournament_id: tournament.id,
    home_team_id: m.CASA_ID,
    away_team_id: m.TRASFERTA_ID,
    scheduled_at: `${m.DATA}T${m.ORA}:00`,
    status: m.STATO_PARTITA || 'PROGRAMMATA',
    field_name: m.CAMPO || '',
    post_pro_url: m.POST_PRO || null,
    post_ter_url: m.POST_TER || null,
  }));
  const { error: mErr } = await supabase
    .from('matches')
    .insert(matchesToInsert);
  if (mErr) console.error('❌ Errore partite:', mErr);
  else console.log(`✅ Migrate ${matchesToInsert.length} partite`);

  // 5. Migra Eventi
  const eventsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/events.json'), 'utf8')
  );
  const eventsToInsert = eventsData.map((e) => ({
    id: e.EVENT_ID,
    match_id: e.MATCH_ID,
    type:
      e.TIPO_EVENTO === 'GOAL'
        ? 'GOAL'
        : e.TIPO_EVENTO === 'AMMONIZIONE'
        ? 'AMMONIZIONE'
        : 'ESPULSIONE',
    player_id: e.PLAYER_ID,
    minute: e.MINUTO || 0,
    description: e.ASSIST_PLAYER_ID ? `Assist: ${e.ASSIST_PLAYER_ID}` : null,
  }));
  const { error: eErr } = await supabase
    .from('match_events')
    .insert(eventsToInsert);
  if (eErr) console.error('❌ Errore eventi:', eErr);
  else console.log(`✅ Migrati ${eventsToInsert.length} eventi`);

  console.log('✨ Migrazione completata!');
}

migrateTournament().catch(console.error);
