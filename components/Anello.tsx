'use client'

/**
 * Anello con un numero dentro, la forma che l'app usa per gli avanzamenti.
 *
 * Il corpo del testo si ricava dallo spazio libero dentro l'anello, non da
 * una misura fissa: "100%" è quasi il doppio di "5%" e a dimensione fissa
 * finiva addosso al bordo.
 */
export function Anello({ pct, colore, testo, size = 50, spessore = 3.5, traccia = 'var(--surface)' }: {
  pct: number; colore: string; testo?: string; size?: number; spessore?: number
  /** Colore della parte vuota: su un fondo colorato serve più trasparente */
  traccia?: string
}) {
  const r = size / 2 - spessore / 2 - 1
  const circ = 2 * Math.PI * r
  // Diametro utile dentro la traccia, meno un margine di respiro
  const luce = (r - spessore / 2) * 2 - 6
  // 0.78 em per carattere: è la larghezza misurata delle cifre in peso 800,
  // segno di percentuale compreso. Con una stima più bassa "100%" usciva dal
  // cerchio, mentre "5%" restava minuscolo.
  const corpo = testo ? Math.min(size * 0.3, luce / (testo.length * 0.78)) : 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={traccia} strokeWidth={spessore}/>
      {pct > 0 && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round"
          strokeDasharray={`${(pct/100)*circ} ${circ}`} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      )}
      {testo && (
        <text x={size/2} y={size/2 + corpo * 0.35} textAnchor="middle" fontSize={corpo} fontWeight={800} fill={colore}>
          {testo}
        </text>
      )}
    </svg>
  )
}
