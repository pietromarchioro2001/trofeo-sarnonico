'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Assicurati che il percorso sia corretto!

export default function TestDB() {
  const [status, setStatus] = useState('Caricamento...');
  
  // Crea il client qui dentro per evitare problemi di hydration
  const supabase = createClient();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Prova a leggere dalla tabella 'squadre'
        const { data, error } = await supabase.from('squadre').select('nome').limit(1);
        
        if (error) {
          console.error('Errore Supabase:', error);
          setStatus(`❌ Errore DB: ${error.message}`);
        } else {
          setStatus(`✅ Connesso! Trovate ${data?.length || 0} squadre.`);
        }
      } catch (err) {
        setStatus(`❌ Errore generico: ${err}`);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-[#581C24]">Test Supabase</h1>
        <p className="text-lg font-medium">{status}</p>
        <div className="mt-4 text-sm text-gray-500">
          Se vedi ✅, il backend è collegato!
        </div>
      </div>
    </div>
  );
}