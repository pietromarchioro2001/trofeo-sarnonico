'use client'; // <-- DEVE ESSERE LA PRIMISSIMA RIGA ASSOLUTA

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Usiamo il client standard per il test

export default function TestDB() {
  const [status, setStatus] = useState('Inizializzazione...');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // 1. Prendiamo le variabili direttamente da Vercel/GitHub
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // 2. Controllo di sicurezza
        if (!url || !key) {
          setStatus('❌ Errore: Variabili d\'ambiente mancanti! Controlla Vercel.');
          return;
        }

        // 3. Creiamo il client e facciamo la richiesta
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('teams').select('name').limit(3);

        if (error) {
          setStatus(`❌ Errore DB: ${error.message}`);
        } else {
          const nomi = data?.map((t: any) => t.name).join(', ');
          setStatus(`✅ CONNESSO! Squadre trovate: ${nomi}`);
        }
      } catch (err: any) {
        setStatus(`❌ Errore imprevisto: ${err.message || err}`);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border-2 border-[#581C24]">
        <h1 className="text-2xl font-bold mb-4 text-[#581C24]">Test Connessione Supabase</h1>
        <p className="text-lg font-medium">{status}</p>
        <div className="mt-4 text-sm text-gray-500">
          Se vedi il messaggio verde, il backend è collegato!
        </div>
      </div>
    </div>
  );
}