'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Lock } from 'lucide-react';

interface AccessLoginProps {
  onSuccess: (role: string, teamId?: string) => void;
  onClose: () => void;
}

export default function AccessLogin({ onSuccess, onClose }: AccessLoginProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!code.trim()) {
      setError('Inserisci un codice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Verifica il codice
      const { data, error } = await supabase
        .from('access_codes')
        .select('role, team_id')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Codice non valido o disattivato');
        setLoading(false);
        return;
      }

      // Salva il codice e il ruolo
      localStorage.setItem('access_code', code.trim().toUpperCase());
      localStorage.setItem('access_role', data.role);
      if (data.team_id) {
        localStorage.setItem('access_team_id', data.team_id);
      }

      onSuccess(data.role, data.team_id);
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#581C24] p-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Lock size={20} />
            Accesso Riservato
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
              Codice di Accesso
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Inserisci il codice"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24] focus:border-transparent text-lg font-bold uppercase tracking-wider"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? 'Verifica...' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}