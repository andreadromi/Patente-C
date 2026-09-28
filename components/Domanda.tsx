/**
 * Il riquadro di una domanda: in alto il numero del listato e l'argomento,
 * poi l'eventuale figura (un cartello, un simbolo del cronotachigrafo, una
 * spia) e l'affermazione da giudicare.
 */
export function Domanda({ codice, etichetta, testo, figura }: {
  codice?: string
  etichetta?: string
  testo: string
  figura?: string | null
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
      {(codice || etichetta) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          {codice && <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>{codice}</span>}
          {etichetta && <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{etichetta}</span>}
        </div>
      )}
      {figura && (
        // eslint-disable-next-line @next/next/no-img-element -- figure del listato, dimensioni variabili
        <img src={`/figure/${figura}`} alt="Figura della domanda"
          style={{ display: 'block', maxWidth: '100%', maxHeight: 200, margin: '4px auto 14px', objectFit: 'contain' }} />
      )}
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.55 }}>{testo}</p>
    </div>
  )
}
