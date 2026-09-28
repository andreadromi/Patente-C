/**
 * La linea di avanzamento, attaccata al bordo basso dell'intestazione: va da
 * un lato all'altro dello schermo, senza margini, e fa anche da confine con
 * la pagina. Si riempie da sinistra di cobalto sfumato; a ogni risposta
 * cresce con un piccolo rimbalzo e la punta si accende per un attimo (il
 * lampo rinasce a ogni risposta: la chiave è il numero di risposte), e ogni
 * tanto un riflesso le passa sopra. Chi sul telefono ha chiesto meno
 * animazioni la vede ferma (vedi .avanzamento in globals.css).
 */
export function Avanzamento({ fatte, totale }: { fatte: number; totale: number }) {
  const pct = totale ? Math.min(100, (fatte / totale) * 100) : 0
  return (
    <div role="progressbar" aria-label="Risposte date" aria-valuemin={0} aria-valuemax={totale} aria-valuenow={fatte}
      className="avanzamento-binario">
      {/* Piena, arriva al bordo destro dello schermo: lì niente punta arrotondata */}
      <div className="avanzamento" style={{ width: `${pct}%`, borderRadius: pct >= 100 ? 0 : undefined }}>
        {fatte > 0 && <span key={fatte} className="avanzamento-lampo" />}
      </div>
    </div>
  )
}
