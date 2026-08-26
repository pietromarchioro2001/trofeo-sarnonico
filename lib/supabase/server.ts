import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    cookieStore = {
      getAll: () => [],
      setAll: () => {},
    };
  }
  
  return createServerClient(
    'https://sqyxonizsynrltnpkyw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXhvbml6bnN5bnJsdG5wa3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTYwMTUsImV4cCI6MjEwMDM3MjAxNX0.zEY8dJHeUQRGpMPmHv12PDk3gNV-EmEMZyHr9CJjv9E',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignora errori
          }
        },
      },
    }
  );
}