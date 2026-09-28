import type { Metadata, Viewport } from 'next'
import './globals.css'
import { NOME_APP, NOME_ESTESO, NOME_ICONA } from '@/lib/app'

export const metadata: Metadata = {
  title: NOME_APP,
  description: `${NOME_ESTESO}: preparazione all'esame di teoria, su tutte le domande del listato ministeriale`,
  // Il manifest è nel <head> qui sotto, con crossOrigin: da qui uscirebbe un
  // secondo <link> senza credenziali, e vincerebbe quello
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: NOME_ICONA },
}

export const viewport: Viewport = {
  themeColor: "#C94A0B",
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
        {/* use-credentials: il browser scarica il manifest con i cookie. Senza,
            sulle anteprime protette da Vercel Authentication riceve 401 e
            Chrome dice che l'app "non può essere installata". */}
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
