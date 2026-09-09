'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { X, Camera, Download, Trash2, Check } from 'lucide-react';

interface MatchMediaGalleryProps {
  matchId: string;
  folderPath?: string; // ✅ NUOVO: percorso custom (es. "match-media/SARNONICO-CAVARENO")
  isStaffMode?: boolean;
}

export default function MatchMediaGallery({ matchId, folderPath, isStaffMode = false }: MatchMediaGalleryProps) {
  const [photos, setPhotos] = useState<Array<{ url: string; name: string }>>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  // ✅ Usa folderPath se fornito, altrimenti matchId
  const storagePath = folderPath || matchId;

  useEffect(() => {
    fetchPhotos();
  }, [storagePath]);

  const fetchPhotos = async () => {
    setLoading(true);
    
    const { data } = await supabase.storage
      .from('tournament-files')
      .list(storagePath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (data) {
      const photosWithData = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('tournament-files')
            .getPublicUrl(`${storagePath}/${file.name}`);
          return {
            url: urlData.publicUrl,
            name: file.name
          };
        })
      );
      setPhotos(photosWithData);
    }
    
    setLoading(false);
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0) return;
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder(`foto-partita-${matchId}`);
    
    for (const photo of photos) {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      folder?.file(photo.name, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foto-partita-${matchId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (photoName: string) => {
    const newSelection = new Set(selectedForDeletion);
    if (newSelection.has(photoName)) {
      newSelection.delete(photoName);
    } else {
      newSelection.add(photoName);
    }
    setSelectedForDeletion(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) return;
    if (!confirm(`Eliminare ${selectedForDeletion.size} foto selezionate?`)) return;
    
    setDeleting(true);
    try {
      const pathsToDelete = Array.from(selectedForDeletion).map(name => `${storagePath}/${name}`);
      const { error } = await supabase.storage.from('tournament-files').remove(pathsToDelete);
      if (error) throw error;
      alert(`✅ ${selectedForDeletion.size} foto eliminate con successo!`);
      setSelectedForDeletion(new Set());
      await fetchPhotos();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      alert('Errore nell\'eliminazione delle foto');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-[#581C24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-bold">Caricamento foto...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-bold uppercase">Nessuna foto</p>
        <p className="text-xs text-gray-400 mt-1">Le foto della partita appariranno qui</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 font-bold">{photos.length} {photos.length === 1 ? 'foto' : 'foto'}</p>
        <div className="flex gap-2">
          <button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#581C24] text-white rounded-lg text-xs font-bold hover:bg-[#581C24]/90 transition-colors">
            <Download size={14} /> Scarica tutte
          </button>
          {isStaffMode && (
            <>
              {selectedForDeletion.size > 0 ? (
                <button onClick={handleDeleteSelected} disabled={deleting} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                  <Trash2 size={14} /> Elimina ({selectedForDeletion.size})
                </button>
              ) : (
                <button onClick={() => setSelectedForDeletion(new Set(photos.map(p => p.name)))} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors">
                  <Check size={14} /> Seleziona
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => {
          const isSelected = selectedForDeletion.has(photo.name);
          return (
            <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${isSelected ? 'ring-4 ring-red-500 ring-offset-2' : ''}`} onClick={() => isStaffMode ? toggleSelection(photo.name) : setSelectedPhoto(photo.url)}>
              <Image src={photo.url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
              {isStaffMode && (
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {isSelected ? <Check size={20} className="text-green-600" /> : <div className="w-5 h-5 border-2 border-white rounded" />}
                  </div>
                </div>
              )}
              {!isStaffMode && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />}
            </div>
          );
        })}
      </div>

      {selectedPhoto && !isStaffMode && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-10" onClick={() => setSelectedPhoto(null)}>
            <X size={24} />
          </button>
          <Image src={selectedPhoto} alt="" fill className="object-contain" />
        </div>
      )}
    </>
  );
}