'use client';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: 'admin' | 'captain' | 'bar';
}

export default function LoginModal({ isOpen, onClose, targetRole }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full"
        >
          <X size={18} className="text-gray-600" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#581C24] mb-4">
            Accesso {targetRole === 'admin' ? 'Staff' : targetRole === 'captain' ? 'Capitani' : 'Bar'}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Inserisci le tue credenziali
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome utente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24]"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#581C24]"
            />
            <button className="w-full bg-[#581C24] text-white font-bold py-2 rounded-lg hover:bg-[#581C24]/90">
              ACCEDI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}