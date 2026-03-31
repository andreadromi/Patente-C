import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Patente C · CE',
  description: 'Simulatore esame patente C e CE',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Patente C',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="icon" href="/favicon.ico" sizes="any"/>
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Patente C"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="theme-color" content="#2563EB"/>
      </head>
      <body style={{ margin:0, padding:0, background:'#030712' }}>{children}</body>
    </html>
  )
}
