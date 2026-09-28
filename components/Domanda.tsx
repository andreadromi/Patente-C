/**
 * Altezza della cornice delle figure: la stessa per tutte, qualunque sia la
 * forma dell'immagine (un cartello tondo, un pannello largo, un simbolo del
 * cronotachigrafo), così il testo comincia sempre allo stesso punto.
 */
export const ALTEZZA_FIGURA = 'clamp(120px, 24dvh, 200px)'

/**
 * Il riquadro di una domanda: in alto il numero del listato e l'argomento,
 * poi l'eventuale figura (un cartello, un simbolo del cronotachigrafo, una
 * spia) e l'affermazione da giudicare.
 *
 * Con `riempi` il riquadro prende tutto lo spazio libero della pagina, sempre
 * lo stesso, e i pulsanti VERO/FALSO sotto non si spostano da una domanda
 * all'altra; un testo che non ci sta scorre dentro il riquadro.
 */
export function Domanda({ codice, etichetta, testo, figura, riempi = false }: {
  codice?: string
  etichetta?: string
  testo: string
  figura?: string | null
  riempi?: boolean
}) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px',
      ...(riempi ? { flex: 1, minHeight: 0, overflowY: 'auto' } : { marginBottom: 12 }),
    }}>
      {(codice || etichetta) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          {codice && <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>{codice}</span>}
          {etichetta && <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{etichetta}</span>}
        </div>
      )}
      {figura && (
        <div style={{ height: ALTEZZA_FIGURA, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0 14px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- figure del listato, dimensioni variabili */}
          <img src={`/figure/${figura}`} alt="Figura della domanda"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.55 }}>{testo}</p>
    </div>
  )
}
