'use client'
import { useEffect, useRef, useState } from 'react'

/** Com'è andata una domanda: in Studio giusta o sbagliata, all'esame solo data o no. */
export type EsitoNumero = 'vuota' | 'data' | 'giusta' | 'sbagliata'

const COLORE: Record<EsitoNumero, string> = {
  vuota: 'var(--text3)',
  data: 'var(--accent)',
  giusta: 'var(--green)',
  sbagliata: 'var(--red)',
}

/** Ogni numero ha il suo posto, sempre largo uguale: così il corrente si centra con un conto solo. */
const POSTO = 46
const ALTEZZA = 56

/** Il numero rimpicciolisce e sfuma man mano che si allontana da quello corrente. */
function aspetto(distanza: number) {
  if (distanza === 0) return { size: 28, peso: 900, opacita: 1 }
  if (distanza === 1) return { size: 20, peso: 800, opacita: 0.9 }
  if (distanza === 2) return { size: 17, peso: 700, opacita: 0.75 }
  return { size: 15, peso: 700, opacita: 0.6 }
}

/**
 * I numeri delle domande in una striscia che scorre col dito, senza
 * riquadri: quello corrente sta al centro, grande, col suo trattino sotto; gli
 * altri rimpiccioliscono allontanandosi e sfumano verso i bordi. Il colore del
 * numero dice com'è andata: verde giusta e rosso sbagliata (Studio), cobalto
 * data (esame), grigio ancora da fare. Un tocco porta a quella domanda, e la
 * striscia si ricentra da sola.
 */
export function Numeri({ totale, corrente, esito, onScegli }: {
  totale: number
  corrente: number
  esito: (idx: number) => EsitoNumero
  onScegli: (idx: number) => void
}) {
  const striscia = useRef<HTMLDivElement>(null)
  const primaVolta = useRef(true)
  // Spazio vuoto ai due capi, mezza striscia: anche il primo e l'ultimo numero arrivano al centro
  const [margine, setMargine] = useState(0)

  useEffect(() => {
    const s = striscia.current
    if (!s) return
    const misura = () => setMargine(Math.max(0, s.clientWidth / 2 - POSTO / 2))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(s)
    return () => ro.disconnect()
  }, [])

  // Col margine di mezza striscia, il numero idx è al centro quando lo scorrimento vale idx * POSTO
  useEffect(() => {
    const s = striscia.current
    if (!s || !margine) return
    s.scrollTo({ left: corrente * POSTO, behavior: primaVolta.current ? 'auto' : 'smooth' })
    primaVolta.current = false
  }, [corrente, margine])

  const bordi = 'linear-gradient(to right, transparent 0, #000 44px, #000 calc(100% - 44px), transparent 100%)'
  return (
    <div ref={striscia} role="group" aria-label="Domande" style={{
      height: ALTEZZA, flexShrink: 0, overflowX: 'auto', overflowY: 'hidden', background: 'var(--card)',
      borderBottom: '1px solid var(--border)', scrollbarWidth: 'none', scrollSnapType: 'x proximity',
      overscrollBehaviorX: 'contain', maskImage: bordi, WebkitMaskImage: bordi,
    }}>
      <div style={{ display: 'flex', height: '100%', width: 'max-content' }}>
        <div style={{ flex: '0 0 auto', width: margine }} />
        {Array.from({ length: totale }, (_, idx) => {
          const cur = idx === corrente
          const stato = esito(idx)
          const { size, peso, opacita } = aspetto(Math.abs(idx - corrente))
          return (
            <button key={idx} onClick={() => onScegli(idx)} aria-label={`Domanda ${idx + 1}`} aria-current={cur ? 'step' : undefined}
              style={{
                flex: '0 0 auto', width: POSTO, height: '100%', padding: 0, border: 'none', background: 'transparent',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'inherit', scrollSnapAlign: 'center', opacity: opacita,
                color: cur && stato === 'vuota' ? 'var(--accent)' : COLORE[stato],
              }}>
              <span style={{ fontSize: size, fontWeight: peso, lineHeight: 1, fontVariantNumeric: 'tabular-nums', transition: 'font-size .2s ease' }}>
                {idx + 1}
              </span>
              {cur && (
                <span aria-hidden style={{ position: 'absolute', bottom: 6, left: '50%', width: 18, height: 4, marginLeft: -9, borderRadius: 2, background: 'var(--accent)' }} />
              )}
            </button>
          )
        })}
        <div style={{ flex: '0 0 auto', width: margine }} />
      </div>
    </div>
  )
}
