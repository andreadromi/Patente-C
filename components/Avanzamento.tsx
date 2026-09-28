/**
 * La linea di avanzamento in fondo all'intestazione: una barra arrotondata,
 * staccata dai bordi, che si riempie di cobalto sfumato. A ogni risposta
 * cresce con un piccolo rimbalzo, e ogni tanto un riflesso le passa sopra:
 * si vede che è viva, senza distrarre. Chi sul telefono ha chiesto meno
 * animazioni la vede ferma (vedi .avanzamento in globals.css).
 */
export function Avanzamento({ fatte, totale }: { fatte: number; totale: number }) {
  const pct = totale ? Math.min(100, (fatte / totale) * 100) : 0
  return (
    <div role="progressbar" aria-label="Risposte date" aria-valuemin={0} aria-valuemax={totale} aria-valuenow={fatte}
      style={{ padding: '2px 16px 12px' }}>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
        <div className="avanzamento" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
