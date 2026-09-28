'use client'
import { ReactNode } from 'react'

interface Pulsante { label: string; onClick: () => void; icona?: ReactNode }

/**
 * Una schermata di stato a pagina intera — errore, lista vuota, allenamento
 * finito — con lo stesso stile degli avvisi: icona grande, titolo, una riga
 * sola di testo, e sotto pulsanti larghi. Al centro si può aggiungere
 * qualcosa (per esempio i numeri di un risultato).
 */
export function Stato({ icona, titolo, testo, children, principale, secondario }: {
  icona: ReactNode
  titolo: string
  testo?: ReactNode
  children?: ReactNode
  principale?: Pulsante
  secondario?: Pulsante
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
      <div className="scheda" style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'none' }}>
        <div style={{ marginBottom: 18 }}>{icona}</div>
        <h2 style={{ fontSize: 25, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: -0.5 }}>{titolo}</h2>
        {testo && <p style={{ fontSize: 16, color: 'var(--text2)', margin: 0, lineHeight: 1.45 }}>{testo}</p>}
        {children && <div style={{ width: '100%', marginTop: 22 }}>{children}</div>}
        {(principale || secondario) && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 26 }}>
            {principale && (
              <button onClick={principale.onClick}
                style={{ height: 56, borderRadius: 18, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(var(--accent-rgb),0.25)' }}>
                {principale.icona}{principale.label}
              </button>
            )}
            {secondario && (
              <button onClick={secondario.onClick}
                style={{ height: 56, borderRadius: 18, border: 'none', background: 'var(--surface)', color: 'var(--text)', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {secondario.icona}{secondario.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Caselle con un numero grande e un'etichetta: il riassunto di un risultato. */
export function Numeri({ voci }: { voci: { n: ReactNode; label: string; colore?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${voci.length}, 1fr)`, gap: 8 }}>
      {voci.map(v => (
        <div key={v.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: v.colore ?? 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{v.n}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text3)', marginTop: 4 }}>{v.label}</div>
        </div>
      ))}
    </div>
  )
}
