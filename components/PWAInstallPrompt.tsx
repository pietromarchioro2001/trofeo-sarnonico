'use client';
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostra il popup solo se non è già stato installato
      const hasInstalled = localStorage.getItem('pwa_installed');
      if (!hasInstalled) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-[#581C24] text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Installa l'app</p>
          <p className="text-xs text-white/80">Aggiungi alla home per un accesso rapido</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleInstall} className="px-4 py-2 bg-white text-[#581C24] rounded-lg text-xs font-bold">
          INSTALLA
        </button>
        <button onClick={() => setShowPrompt(false)} className="p-2 hover:bg-white/20 rounded-full">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}