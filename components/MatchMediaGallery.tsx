'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { X, Camera } from 'lucide-react';

interface MatchMediaGalleryProps {
  matchId: string;
}

export default function MatchMediaGallery({ matchId }: MatchMediaGalleryProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      
      const { data } = await supabase.storage
        .from('tournament-files')
        .list(matchId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (data) {
        const urls = data.map(file => {
          const { data: urlData } = supabase.storage
            .from('tournament-files')
            .getPublicUrl(`${matchId}/${file.name}`);
          return urlData.publicUrl;
        });
        setPhotos(urls);
      }
      
      setLoading(false);
    };

    fetchPhotos();
  }, [matchId]);

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
      {/* Griglia foto */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity relative group"
          >
            <Image
              src={photo}
              alt={`Foto ${idx + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Modal fullscreen */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-10"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>
          <Image
            src={selectedPhoto}
            alt=""
            fill
            className="object-contain"
          />
        </div>
      )}
    </>
  );
}