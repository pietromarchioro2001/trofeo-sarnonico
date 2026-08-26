// app/page.tsx
import { redirect } from 'next/navigation';
// In _app.tsx o globals.css
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({ subsets: ['latin'], weight: '700' });

export default function RootPage() {
  redirect('/home');
}
