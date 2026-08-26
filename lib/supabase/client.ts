import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    'https://sqyxonizsynrltnpkyw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXhvbml6bnN5bnJsdG5wa3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTYwMTUsImV4cCI6MjEwMDM3MjAxNX0.zEY8dJHeUQRGpMPmHv12PDk3gNV-EmEMZyHr9CJjv9E'
  );
}