'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ForceHomeOnLoad() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Controlla se la pagina è stata effettivamente ricaricata (F5)
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

    // Reindirizza alla home SOLO se è un refresh e non siamo già in home
    if (isReload && pathname !== '/') {
      router.replace('/');
    }
  }, []);

  return null;
}