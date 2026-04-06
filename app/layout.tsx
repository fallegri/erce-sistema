import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ERCE — Sistema de Trazabilidad Pericial',
  description: 'Sistema de Registro y Trazabilidad de Muestras Periciales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-surface-1 text-slate-800">
        {children}
      </body>
    </html>
  )
}
