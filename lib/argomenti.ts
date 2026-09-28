import {
  Hourglass, Gauge, Signpost, FileText, TriangleAlert, Wrench, Ruler, Eye, Boxes, Link2,
  Cog, Droplets, CircleDot, CircleStop, Search, ToolCase, PackageCheck, type LucideIcon,
} from 'lucide-react'

/**
 * Gli argomenti dell'esame per la patente C/CE, cioè i capitoli del listato
 * ministeriale. Il listato non li numera: il codice è la loro posizione nel
 * programma d'esame, lo stesso ordine dei numeri dei quesiti (vedi
 * scripts/archivio_scrivi.py).
 *
 * Qui stanno solo icona, colore e nome breve: il nome completo e quante
 * domande escono all'esame vengono dal DB, che li prende da
 * `data/argomenti.json`, così non esistono due nomi diversi per lo stesso
 * argomento.
 *
 * I colori sono tre, uno per famiglia: le regole (tempi di guida, documenti,
 * trasporto, consegna delle merci), la sicurezza (incidente, ruote, pesi,
 * visibilità, carico, aggancio) e la tecnica del veicolo (motore, freni,
 * pneumatici, manutenzione). Diciassette tinte diverse sarebbero un
 * arcobaleno che non si legge; nessuna è il viola dell'accento.
 */
const REGOLE = '#2F6BD8'    // blu, come i segnali d'obbligo
const SICUREZZA = '#E0673A' // corallo
const TECNICA = '#1B8FA0'   // ottanio

interface Aspetto { breve: string; Icona: LucideIcon; colore: string }

const ARGOMENTI: Record<string, Aspetto> = {
  '01': { breve: 'Guida e riposo', Icona: Hourglass, colore: REGOLE },
  '02': { breve: 'Cronotachigrafo', Icona: Gauge, colore: REGOLE },
  '03': { breve: 'Trasporto', Icona: Signpost, colore: REGOLE },
  '04': { breve: 'Documenti', Icona: FileText, colore: REGOLE },
  '05': { breve: 'Incidente', Icona: TriangleAlert, colore: SICUREZZA },
  '06': { breve: 'Ruote', Icona: Wrench, colore: SICUREZZA },
  '07': { breve: 'Pesi e dimensioni', Icona: Ruler, colore: SICUREZZA },
  '08': { breve: 'Campo visivo', Icona: Eye, colore: SICUREZZA },
  '09': { breve: 'Carico', Icona: Boxes, colore: SICUREZZA },
  '10': { breve: 'Aggancio rimorchi', Icona: Link2, colore: SICUREZZA },
  '11': { breve: 'Motori', Icona: Cog, colore: TECNICA },
  '12': { breve: 'Lubrificazione', Icona: Droplets, colore: TECNICA },
  '13': { breve: 'Pneumatici', Icona: CircleDot, colore: TECNICA },
  '14': { breve: 'Freni', Icona: CircleStop, colore: TECNICA },
  '15': { breve: 'Guasti e sospensioni', Icona: Search, colore: TECNICA },
  '16': { breve: 'Manutenzione', Icona: ToolCase, colore: TECNICA },
  '17': { breve: 'Consegna merci', Icona: PackageCheck, colore: REGOLE },
}

/** Icona, colore e nome breve di un argomento; per un codice sconosciuto, quelli neutri. */
export function aspettoArgomento(code: string): Aspetto {
  return ARGOMENTI[code] ?? { breve: code, Icona: FileText, colore: 'var(--accent)' }
}

/** Nome breve, per le intestazioni strette della pagina d'esame. */
export const nomeBreve = (code: string, nome?: string) => ARGOMENTI[code]?.breve ?? nome ?? code

/** I codici che hanno un aspetto: `npm run verifica` controlla che ci siano tutti quelli dell'archivio. */
export const CODICI_ARGOMENTI = Object.keys(ARGOMENTI)
