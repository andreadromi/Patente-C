/**
 * La linea di avanzamento, attaccata al bordo basso dell'intestazione: va da
 * un lato all'altro dello schermo, senza margini, e fa anche da confine con
 * la pagina. Si riempie da sinistra di cobalto pieno, senza aloni; a ogni
 * risposta cresce da sola con un piccolo rimbalzo. Chi sul telefono ha
 * chiesto meno animazioni la vede ferma (vedi .avanzamento in globals.css).
 */
export function Avanzamento({ fatte, totale }: { fatte: number; totale: number }) {
  const pct = totale ? Math.min(100, (fatte / totale) * 100) : 0
  return (
    <div role="progressbar" aria-label="Risposte date" aria-valuemin={0} aria-valuemax={totale} aria-valuenow={fatte}
      className="avanzamento-binario">
      {/* Piena, arriva al bordo destro dello schermo: lì niente punta arrotondata */}
      <div className="avanzamento" style={{ width: `${pct}%`, borderRadius: pct >= 100 ? 0 : undefined }} />
    </div>
  )
}
