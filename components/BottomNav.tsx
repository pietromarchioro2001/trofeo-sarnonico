'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Users, Trophy, MoreHorizontal } from 'lucide-react';

const navItems = [
  { href: '/home', label: 'HOME', icon: Home },
  { href: '/partite', label: 'PARTITE', icon: CalendarDays },
  { href: '/squadre', label: 'SQUADRE', icon: Users },
  { href: '/classifiche', label: 'CLASSIFICHE', icon: Trophy },
  { href: '/altro', label: 'ALTRO', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();

  // ✅ Nasconde la toolbar in tutta l'area BAR (e sottopagine)
  if (pathname.startsWith('/bar')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#7a1e2c] shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-[60px] max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                isActive ? 'text-white scale-110' : 'text-white/60 hover:text-white/90'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-wider mt-1 uppercase font-oswald">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}