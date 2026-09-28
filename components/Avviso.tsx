'use client'
import { ReactNode, useEffect } from 'react'

interface Azione { label: string; onClick: () => void; tono?: 'accent' | 'red'; disabled?: boolean }

/**
 * Le conferme dell'app: un pannello che sale dal basso, con un'icona grande,
 * un titolo, una riga sola di testo e due pulsanti larghi. Prende il posto
 * delle finestre del browser (confirm) e dei riquadri pieni di scritte.
 * Toccando fuori, o col tasto Esc, si chiude come "Annulla".
 */
export function Avviso({ icona, titolo, testo, conferma, secondaria, annulla, errore, onChiudi }: {
  icona: ReactNode
  titolo: string
  testo?: ReactNode
  conferma: Azione
  /** Una seconda strada, meno importante: un pulsante di solo testo */
  secondaria?: Azione
  annulla: string
  errore?: string
  onChiudi: () => void
}) {
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => { if (e.key === 'Escape') onChiudi() }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [onChiudi])

  const colore = conferma.tono === 'red' ? 'var(--red)' : 'var(--accent)'
  return (
    <div onClick={onChiudi} role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,26,48,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'velo .2s ease-out' }}>
      <style>{`
        @keyframes velo { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pannello { from { transform: translateY(100%) } to { transform: none } }
      `}</style>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titolo}
        style={{ width: '100%', maxWidth: 480, background: 'var(--card)', borderRadius: '28px 28px 0 0', padding: '12px 24px calc(env(safe-area-inset-bottom, 0px) + 22px)', textAlign: 'center', boxShadow: '0 -10px 40px rgba(20,26,48,0.18)', animation: 'pannello .32s cubic-bezier(.2,.8,.2,1)' }}>
        {/* la maniglia del pannello */}
        <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--border)', margin: '0 auto 22px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{icona}</div>
        <h2 style={{ fontSize: 23, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: -0.4 }}>{titolo}</h2>
        {testo && <p style={{ fontSize: 16, color: 'var(--text2)', margin: 0, lineHeight: 1.45 }}>{testo}</p>}
        {errore && <p style={{ fontSize: 15, color: 'var(--red)', fontWeight: 700, margin: '12px 0 0' }}>{errore}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <button onClick={conferma.onClick} disabled={conferma.disabled}
            style={{ height: 56, borderRadius: 18, border: 'none', background: colore, color: '#fff', fontSize: 17, fontWeight: 800, cursor: conferma.disabled ? 'default' : 'pointer', opacity: conferma.disabled ? 0.6 : 1, fontFamily: 'inherit' }}>
            {conferma.label}
          </button>
          {secondaria && (
            <button onClick={secondaria.onClick} disabled={secondaria.disabled}
              style={{ height: 50, borderRadius: 18, border: 'none', background: 'transparent', color: secondaria.tono === 'red' ? 'var(--red)' : 'var(--accent)', fontSize: 16.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {secondaria.label}
            </button>
          )}
          <button onClick={onChiudi}
            style={{ height: 56, borderRadius: 18, border: 'none', background: 'var(--surface)', color: 'var(--text)', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {annulla}
          </button>
        </div>
      </div>
    </div>
  )
}

/** L'icona tonda dell'avviso: un cerchio chiaro col simbolo nel colore del tono. */
export function IconaAvviso({ children, tono = 'accent' }: { children: ReactNode; tono?: 'accent' | 'red' | 'amber' | 'green' }) {
  const rgb = tono === 'red' ? 'var(--red-rgb)' : tono === 'amber' ? '224, 112, 58' : tono === 'green' ? 'var(--green-rgb)' : 'var(--accent-rgb)'
  return (
    <div style={{ width: 76, height: 76, borderRadius: '50%', background: `rgba(${rgb},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}
