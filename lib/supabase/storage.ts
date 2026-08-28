import imageCompression from 'browser-image-compression';
import { createClient } from './client';

const BUCKET = 'tournament-files';

// Comprime immagini prima dell'upload
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };
  return await imageCompression(file, options);
}

// Upload generico
export async function uploadFile(
  folder: string,
  file: File,
  fileName?: string
): Promise<string> {
  const supabase = createClient();
  
  // Comprimi se è un'immagine
  const fileToUpload = file.type.startsWith('image/') 
    ? await compressImage(file) 
    : file;
  
  const finalName = fileName || `${Date.now()}_${fileToUpload.name}`;
  const path = `${folder}/${finalName}`;
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileToUpload, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) throw error;
  
  // Ottieni URL pubblico
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Elimina file
export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
  if (error) throw error;
}