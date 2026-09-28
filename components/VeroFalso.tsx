'use client'
import { ReactNode } from 'react'

/**
 * I due pulsanti di ogni domanda, VERO e FALSO, come sulla scheda d'esame.
 *
 * `correzione` (Studio): la risposta data si colora di verde se giusta, di
 * rosso se sbagliata, e quella giusta si vede comunque, bordata di verde.
 * Sotto, la riga della correzione ha sempre il suo posto, anche vuota:
 * comparendo non sposta niente. Senza correzione (esame) la scelta è solo
 * evidenziata: viola il VERO, ardesia il FALSO, così il rosso resta solo
 * per "sbagliato".
 */
export function VeroFalso({ risposta, giusta, correzione, bloccato, onRispondi, sotto }: {
  risposta: boolean | null | undefined
  giusta: boolean
  correzione: boolean
  bloccato: boolean
  onRispondi: (val: boolean) => void
  sotto?: ReactNode
}) {
  const data = risposta === true || risposta === false
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([true, false] as const).map(val => {
          const scelta = risposta === val
          const eGiusta = val === giusta
          // Colore pieno per la risposta data; bordo verde per la giusta non scelta
          const pieno = correzione && data
            ? (scelta ? (eGiusta ? 'var(--green)' : 'var(--red)') : null)
            : scelta ? (val ? 'var(--accent)' : 'var(--falso)') : null
          const suggerita = correzione && data && !scelta && eGiusta
          const spenta = correzione && data && !scelta && !eGiusta
          return (
            <button key={String(val)} onClick={() => onRispondi(val)} disabled={bloccato} className="tocco"
              aria-pressed={scelta}
              style={{
                height: 62, borderRadius: 18, fontFamily: 'inherit', fontSize: 18, fontWeight: 900, letterSpacing: 0.6,
                cursor: bloccato ? 'default' : 'pointer',
                border: `2px solid ${pieno ?? (suggerita ? 'var(--green)' : 'var(--border)')}`,
                background: pieno ?? (suggerita ? 'rgba(var(--green-rgb),0.09)' : 'var(--card)'),
                color: pieno ? '#fff' : suggerita ? 'var(--green)' : 'var(--text)',
                opacity: spenta ? 0.45 : 1,
              }}>
              {val ? 'VERO' : 'FALSO'}
            </button>
          )
        })}
      </div>
      {correzione && (
        <div aria-live="polite" style={{ height: 22, marginTop: 10, fontSize: 15, fontWeight: 800, color: risposta === giusta ? 'var(--green)' : 'var(--red)' }}>
          {data && (risposta === giusta ? 'Giusto' : `Sbagliato: è ${giusta ? 'VERA' : 'FALSA'}`)}
        </div>
      )}
      {sotto}
    </div>
  )
}
