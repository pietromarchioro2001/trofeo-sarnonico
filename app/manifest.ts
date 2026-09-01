import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trofeo Sarnonico',
    short_name: 'Trofeo Sarnonico',
    description: 'Gestione ufficiale del Torneo dei Paesi di calcio a 7',
    start_url: '/',
    display: 'standalone', // Nasconde la barra del browser, sembra un'app nativa
    background_color: '#F5F5F7', // Colore di sfondo mentre l'app si avvia
    theme_color: '#581C24', // Colore della barra di stato del telefono
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}