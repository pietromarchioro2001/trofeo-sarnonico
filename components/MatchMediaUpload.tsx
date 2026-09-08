'use client';
import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface MatchMediaUploadProps {
  matchId: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function MatchMediaUpload({ matchId, onClose, onUploadComplete }: MatchMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Mostra anteprima
    const urls = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(files);
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    const supabase = createClient();
    let uploadedCount = 0;

    try {
      for (const file of selectedFiles) {
        // Comprimi immagine
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);
        
        // Genera nome file unico
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${matchId}/${fileName}`;

        // Upload a Supabase
        const { error } = await supabase.storage
          .from('tournament-files')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Errore upload:', error);
          alert(`Errore nel caricamento di ${file.name}`);
          continue;
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / selectedFiles.length) * 100));
      }

      alert(`✅ ${uploadedCount} foto caricate con successo!`);
      onUploadComplete();
      onClose();
    } catch (err) {
      console.error('Errore upload:', err);
      alert('Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#581C24] p-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={20} />
            Carica Foto
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Area upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#581C24] hover:bg-[#581C24]/5 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600 uppercase">Clicca per selezionare foto</p>
            <p className="text-xs text-gray-400 mt-1">Puoi selezionare più foto contemporaneamente</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Anteprima */}
          {previewUrls.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase">
                {previewUrls.length} foto selezionate
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barra progresso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Caricamento...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#581C24] h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm uppercase disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex-1 px-4 py-2.5 bg-[#581C24] text-white font-bold rounded-lg hover:bg-[#581C24]/90 transition-colors text-sm shadow-md uppercase disabled:opacity-50"
          >
            {uploading ? 'Caricamento...' : `Carica ${selectedFiles.length} foto`}
          </button>
        </div>
      </div>
    </div>
  );
}