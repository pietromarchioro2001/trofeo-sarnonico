import './globals.css';
import type { Metadata } from 'next';
import BottomNav from '@/components/BottomNav';
import { Oswald, Montserrat } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';

const oswald = Oswald({ subsets: ['latin'] });
const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-montserrat'
});

export const metadata: Metadata = {
  title: 'Trofeo Sarnonico',
  description: 'Gestione ufficiale del Torneo dei Paesi di calcio a 7',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-[#F5F5F7] text-[#111] pb-[60px] overflow-x-hidden">
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}