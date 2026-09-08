import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const accessCode = typeof window !== 'undefined' 
    ? localStorage.getItem('access_code') 
    : null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessCode ? {
          'x-access-code': accessCode
        } : {}
      }
    }
  )
}