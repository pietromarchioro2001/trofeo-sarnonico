import './globals.css';
import type { Metadata } from 'next';
import BottomNav from '@/components/BottomNav';
import { Oswald, Montserrat } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';
import ForceHomeOnLoad from '@/components/ForceHomeOnLoad';

// 1. Configurazione Font
const oswald = Oswald({ 
  subsets: ['latin'],
  variable: '--font-oswald',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-montserrat',
});

// 2. Configurazione Viewport (essenziale per PWA mobile)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#581C24', // Colore della barra di stato del telefono
};

// 3. Configurazione Metadata (incluso supporto PWA)
export const metadata: Metadata = {
  title: 'Trofeo Sarnonico',
  description: 'Gestione ufficiale del Torneo dei Paesi di calcio a 7',
  
  // ⚠️ IMPORTANTE: Sostituisci con il tuo URL di produzione Vercel reale 
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trofeo-sarnonico.vercel.app'),
  
  // Supporto PWA Apple (iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trofeo Sarnonico',
  },
  
  // Icone per PWA e Desktop
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  
  // Link al file manifest
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${oswald.variable} ${montserrat.variable}`}>
      <body className={`${oswald.className} bg-[#F5F5F7] text-[#111] pb-[60px] overflow-x-hidden antialiased`}>
        <AuthProvider>
          <ForceHomeOnLoad />
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}