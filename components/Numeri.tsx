'use client'
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Com'è andata una domanda: in Studio giusta o sbagliata, all'esame solo data o no. */
export type EsitoNumero = 'vuota' | 'data' | 'giusta' | 'sbagliata'

/**
 * Il rettangolo di ogni numero, come i pulsanti di VERO e FALSO: bianco
 * quando è da fare, tinto di verde o di rosso com'è andata (Studio), di
 * cobalto chiaro quando è data all'esame.
 */
const RETTANGOLO: Record<EsitoNumero, CSSProperties> = {
  vuota: { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text3)' },
  data: { background: 'rgba(var(--accent-rgb),0.08)', borderColor: 'rgba(var(--accent-rgb),0.3)', color: 'var(--accent-scuro)' },
  giusta: { background: 'var(--green-dim)', borderColor: 'rgba(var(--green-rgb),0.35)', color: 'var(--green)' },
  sbagliata: { background: 'var(--red-dim)', borderColor: 'rgba(var(--red-rgb),0.35)', color: 'var(--red)' },
}
/** Quello al centro: pieno di cobalto, più grande, col numero bianco. */
const AL_CENTRO: CSSProperties = {
  background: 'linear-gradient(135deg, var(--accent-scuro), var(--accent))', borderColor: 'transparent', color: '#fff',
  fontWeight: 900, transform: 'scale(1.2)', boxShadow: '0 2px 6px rgba(var(--accent-rgb),0.35)',
}

/** Ogni numero ha il suo posto, sempre largo uguale: il numero idx sta al centro quando lo scorrimento vale idx * POSTO. */
const POSTO = 48
/** Il lato del rettangolo; quello al centro, ingrandito, resta dentro il suo posto. */
const LATO = 38
/** Alta abbastanza perché il rettangolo al centro e la sua ombra non tocchino i bordi (la striscia scorre, e taglia quello che esce). */
const ALTEZZA = 60
/** Fermo da tanto così, lo scorrimento col dito è finito: si apre la domanda al centro. */
const FERMO_MS = 140
/**
 * Fin qui il dito può scivolare (in punti) ed è ancora un tocco sul numero:
 * sul telefono, ai bordi soprattutto, un tocco si sposta sempre un poco, e il
 * browser lo prende per uno scorrimento e dà alla striscia l'inerzia.
 */
const TOCCO_PX = 24
/** Un dito giù più a lungo di così non è un tocco. */
const TOCCO_MS = 700

/**
 * I numeri delle domande, ognuno nel suo rettangolo, in una striscia che
 * scorre col dito come il selettore dell'ora di un telefono: il rettangolo
 * al centro è la domanda aperta, pieno di cobalto e più grande; scorrendo,
 * il centro passa da un numero all'altro, e dove ci si ferma si apre quella
 * domanda. Un tocco su un numero porta dritti lì, anche se il dito scivola
 * un poco. Gli altri rettangoli dicono com'è andata (vedi RETTANGOLO) e
 * sfumano verso i bordi.
 *
 * Senza sfondo né bordi suoi: sta dentro la fascia dell'intestazione.
 */
export function Numeri({ totale, corrente, esito, onScegli }: {
  totale: number
  corrente: number
  esito: (idx: number) => EsitoNumero
  onScegli: (idx: number) => void
}) {
  const striscia = useRef<HTMLDivElement>(null)
  // Spazio vuoto ai due capi, mezza striscia: anche il primo e l'ultimo numero arrivano al centro
  const [margine, setMargine] = useState(0)
  // Il numero che in questo momento sta al centro (mentre scorre, può non essere quello aperto)
  const [centro, setCentro] = useState(corrente)
  const correnteRef = useRef(corrente)
  const scegliRef = useRef(onScegli)
  useEffect(() => { correnteRef.current = corrente; scegliRef.current = onScegli })
  // Solo un trascinamento vero col dito (o la rotella) sceglie la domanda che
  // si ferma al centro. Gli altri scorrimenti, quelli dell'app (Succ, un
  // tocco, la risposta) e quelli del browser, che riaggancia i numeri dopo un
  // cambio di misura o dà l'inerzia a un tocco un po' scivolato, non aprono
  // nulla: se lasciano al centro un altro numero, la striscia torna alla domanda aperta.
  const dalDito = useRef(false)
  // Il dito sulla striscia: dove e quando è sceso, su quale numero, e se ha trascinato
  const tocco = useRef<{ x: number; y: number; t: number; idx: number | null; trascina: boolean } | null>(null)
  // Quando un tocco ha già aperto il suo numero: il click che il browser manda subito dopo non serve
  const apertoDalTocco = useRef(-Infinity)
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

  const alCentro = (s: HTMLDivElement) => Math.max(0, Math.min(totale - 1, Math.round(s.scrollLeft / POSTO)))

  // A striscia ferma: dopo un trascinamento si apre la domanda al centro,
  // altrimenti la striscia torna a quella aperta. Col dito ancora giù non si
  // decide niente: ci pensa il dito quando si alza.
  function controlla() {
    const s = striscia.current
    if (!s || tocco.current) return
    const i = alCentro(s)
    const aperta = correnteRef.current
    if (dalDito.current) {
      dalDito.current = false
      if (i !== aperta) scegliRef.current(i)
    } else if (i !== aperta) {
      s.scrollTo({ left: aperta * POSTO, behavior: 'smooth' })
    }
  }

  function aspettaFermo() {
    if (fermo.current) clearTimeout(fermo.current)
    fermo.current = setTimeout(controlla, FERMO_MS)
  }

  function scorre() {
    const s = striscia.current
    if (!s) return
    setCentro(alCentro(s))
    aspettaFermo()
  }

  function giu(e: React.TouchEvent) {
    const p = e.touches[0]
    const numero = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]')
    tocco.current = {
      x: p.clientX, y: p.clientY, t: e.timeStamp, idx: numero ? Number(numero.dataset.idx) : null,
      // con due dita non è un tocco su un numero
      trascina: e.touches.length > 1,
    }
  }

  function muove(e: React.TouchEvent) {
    const tc = tocco.current
    const p = e.touches[0]
    if (!tc || tc.trascina || !p) return
    const dx = Math.abs(p.clientX - tc.x)
    if (dx > TOCCO_PX || Math.abs(p.clientY - tc.y) > TOCCO_PX) {
      tc.trascina = true
      // di lato trascina la striscia: dove si ferma, si apre
      if (dx > TOCCO_PX) dalDito.current = true
    }
  }

  function su(e: React.TouchEvent) {
    const tc = tocco.current
    tocco.current = null
    if (tc && !tc.trascina && tc.idx !== null && e.timeStamp - tc.t < TOCCO_MS) {
      // Un tocco, anche un po' scivolato: si apre il numero toccato, e
      // l'inerzia che il browser avesse dato alla striscia non sceglie niente
      dalDito.current = false
      apertoDalTocco.current = e.timeStamp
      scegliRef.current(tc.idx)
    }
    aspettaFermo()
  }

  function annullato() {
    tocco.current = null
    aspettaFermo()
  }
  const bordi = 'linear-gradient(to right, transparent 0, #000 56px, #000 calc(100% - 56px), transparent 100%)'

  return (
    <div ref={striscia} role="group" aria-label="Domande" onScroll={scorre}
      onTouchStart={giu} onTouchMove={muove} onTouchEnd={su} onTouchCancel={annullato}
      onWheel={() => { dalDito.current = true }}
      style={{
        height: ALTEZZA, flexShrink: 0, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none',
        scrollSnapType: margine ? 'x mandatory' : 'none', overscrollBehaviorX: 'contain', maskImage: bordi, WebkitMaskImage: bordi,
      }}>
      <div style={{ display: 'flex', height: '100%', width: 'max-content' }}>
        <div style={{ flex: '0 0 auto', width: margine }} />
        {Array.from({ length: totale }, (_, idx) => (
          <button key={idx} data-idx={idx} aria-label={`Domanda ${idx + 1}`} aria-current={idx === corrente ? 'step' : undefined}
            onClick={e => {
              if (e.timeStamp - apertoDalTocco.current < 800) return
              dalDito.current = false
              onScegli(idx)
            }}
            style={{
              flex: '0 0 auto', width: POSTO, height: '100%', padding: 0, border: 'none', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', scrollSnapAlign: 'center',
            }}>
            <span style={{
              width: LATO, height: LATO, borderRadius: 11, borderWidth: 1.5, borderStyle: 'solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              transition: 'transform .18s ease, background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease',
              ...RETTANGOLO[esito(idx)], ...(idx === centro ? AL_CENTRO : null),
            }}>
              {idx + 1}
            </span>
          </button>
        ))}
        <div style={{ flex: '0 0 auto', width: margine }} />
      </div>
    </div>
  )
}
