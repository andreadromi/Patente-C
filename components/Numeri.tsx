'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Com'è andata una domanda: in Studio giusta o sbagliata, all'esame solo data o no. */
export type EsitoNumero = 'vuota' | 'data' | 'giusta' | 'sbagliata'

const COLORE: Record<EsitoNumero, string> = {
  vuota: 'var(--text3)',
  data: 'var(--text)',
  giusta: 'var(--green)',
  sbagliata: 'var(--red)',
}

/** Ogni numero ha il suo posto, sempre largo uguale: il numero idx sta sotto la capsula quando lo scorrimento vale idx * POSTO. */
const POSTO = 44
const ALTEZZA = 52
/** Altezza a cui stanno i numeri e la capsula: a metà striscia. */
const RIGA = ALTEZZA / 2
const CAPSULA = { larghezza: 50, altezza: 36 }
/** Fermo da tanto così, lo scorrimento col dito è finito: si apre la domanda sotto la capsula. */
const FERMO_MS = 140

/**
 * I numeri delle domande, come il selettore dell'ora di un telefono: una
 * capsula cobalto sta ferma al centro e i numeri le scorrono sotto. Quello
 * nella capsula è la domanda aperta, bianco e più grande; scorrendo col dito,
 * dove ci si ferma si apre quella domanda, e un tocco su un numero porta
 * dritti lì. Gli altri numeri sono tutti della stessa grandezza e sfumano
 * verso i bordi; com'è andata lo dice il loro colore: verde giusta e rosso
 * sbagliata (Studio), scuro data (esame), grigio ancora da fare.
 *
 * Senza sfondo né bordi: sta dentro la fascia dell'intestazione.
 */
export function Numeri({ totale, corrente, esito, onScegli }: {
  totale: number
  corrente: number
  esito: (idx: number) => EsitoNumero
  onScegli: (idx: number) => void
}) {
  const striscia = useRef<HTMLDivElement>(null)
  // Spazio vuoto ai due capi, mezza striscia: anche il primo e l'ultimo numero arrivano nella capsula
  const [margine, setMargine] = useState(0)
  // Il numero che in questo momento sta sotto la capsula (mentre scorre, può non essere quello aperto)
  const [centro, setCentro] = useState(corrente)
  const correnteRef = useRef(corrente)
  const scegliRef = useRef(onScegli)
  useEffect(() => { correnteRef.current = corrente; scegliRef.current = onScegli })
  // Solo uno scorrimento partito dal dito (o dalla rotella) sceglie una domanda.
  // Gli altri, quelli dell'app (Succ, un tocco, la risposta) e quelli del
  // browser che riaggancia i numeri dopo un cambio di misura, non aprono
  // nulla: se lasciano la capsula fuori posto, la striscia torna alla domanda aperta.
  const dalDito = useRef(false)
  const fermo = useRef<ReturnType<typeof setTimeout> | null>(null)
  const primaVolta = useRef(true)

  // La misura si prende prima di disegnare, e l'aggancio dei numeri si accende
  // solo dopo: col margine ancora a zero il browser aggancerebbe il numero che
  // capita al centro (il quinto) e poi lo terrebbe lì.
  useLayoutEffect(() => {
    const s = striscia.current
    if (!s) return
    const misura = () => setMargine(Math.max(0, s.clientWidth / 2 - POSTO / 2))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(s)
    return () => { ro.disconnect(); if (fermo.current) clearTimeout(fermo.current) }
  }, [])

  useEffect(() => {
    const s = striscia.current
    if (!s || !margine) return
    const x = corrente * POSTO
    if (Math.abs(s.scrollLeft - x) < 1) { setCentro(corrente); return }
    s.scrollTo({ left: x, behavior: primaVolta.current ? 'auto' : 'smooth' })
    primaVolta.current = false
  }, [corrente, margine])

  function scorre() {
    const s = striscia.current
    if (!s) return
    const i = Math.max(0, Math.min(totale - 1, Math.round(s.scrollLeft / POSTO)))
    setCentro(i)
    if (fermo.current) clearTimeout(fermo.current)
    fermo.current = setTimeout(() => {
      const aperta = correnteRef.current
      if (dalDito.current) {
        dalDito.current = false
        if (i !== aperta) scegliRef.current(i)
      } else if (i !== aperta) {
        s.scrollTo({ left: aperta * POSTO, behavior: 'smooth' })
      }
    }, FERMO_MS)
  }

  const dito = () => { dalDito.current = true }
  const bordi = 'linear-gradient(to right, transparent 0, #000 56px, #000 calc(100% - 56px), transparent 100%)'

  return (
    <div style={{ position: 'relative', height: ALTEZZA, flexShrink: 0 }}>
      <div aria-hidden style={{
        position: 'absolute', left: '50%', top: RIGA - CAPSULA.altezza / 2, width: CAPSULA.larghezza, height: CAPSULA.altezza,
        marginLeft: -CAPSULA.larghezza / 2, borderRadius: CAPSULA.altezza / 2, pointerEvents: 'none',
        background: 'linear-gradient(135deg, var(--accent-scuro), var(--accent))', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)',
      }} />
      <div ref={striscia} role="group" aria-label="Domande" onScroll={scorre}
        onPointerDown={dito} onTouchStart={dito} onWheel={dito}
        style={{
          position: 'relative', height: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none',
          scrollSnapType: margine ? 'x mandatory' : 'none', overscrollBehaviorX: 'contain', maskImage: bordi, WebkitMaskImage: bordi,
        }}>
        <div style={{ display: 'flex', height: '100%', width: 'max-content' }}>
          <div style={{ flex: '0 0 auto', width: margine }} />
          {Array.from({ length: totale }, (_, idx) => {
            const inCapsula = idx === centro
            return (
              <button key={idx} onClick={() => { dalDito.current = false; onScegli(idx) }} aria-label={`Domanda ${idx + 1}`} aria-current={idx === corrente ? 'step' : undefined}
                style={{
                  flex: '0 0 auto', width: POSTO, height: '100%', padding: 0, border: 'none', background: 'transparent',
                  position: 'relative', cursor: 'pointer', fontFamily: 'inherit', scrollSnapAlign: 'center',
                }}>
                <span style={{
                  position: 'absolute', left: '50%', top: RIGA, transform: 'translate(-50%, -50%)', lineHeight: 1,
                  fontSize: inCapsula ? 20 : 16, fontWeight: inCapsula ? 900 : 700, fontVariantNumeric: 'tabular-nums',
                  color: inCapsula ? '#fff' : COLORE[esito(idx)], transition: 'font-size .15s ease, color .15s ease',
                }}>
                  {idx + 1}
                </span>
              </button>
            )
          })}
          <div style={{ flex: '0 0 auto', width: margine }} />
        </div>
      </div>
    </div>
  )
}
