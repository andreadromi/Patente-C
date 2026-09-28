/**
 * La forma dell'esame di teoria per la patente C (e CE), come la svolge la
 * Motorizzazione dal 2 marzo 2015 con il sistema informatizzato:
 *
 * - **40 domande** estratte dal listato ministeriale, ciascuna da segnare
 *   **vero o falso**;
 * - ogni argomento dà alla scheda un numero fisso di domande (`nEsame` in
 *   data/argomenti.json): quelli principali ne danno di più;
 * - **40 minuti**;
 * - si supera con **al massimo 4 errori**; una domanda lasciata in bianco
 *   conta come sbagliata;
 * - fino alla consegna le risposte si possono cambiare.
 *
 * Questo file è l'unico posto dove stanno questi numeri: pagina d'esame,
 * completamento, report e generatore li leggono da qui. Quante domande dà
 * ciascun argomento sta invece nell'archivio, accanto al nome dell'argomento,
 * e `npm run verifica` controlla che la somma faccia 40.
 */

export const DOMANDE_PER_ESAME = 40
/** Durata della prova, in secondi. */
export const DURATA_ESAME = 2400
/** Errori ammessi: con uno in più l'esame non è superato. */
export const ERRORI_AMMESSI = 4

export interface EsitoArgomento { argomento: string; giuste: number; totali: number }
export interface Esito {
  giuste: number
  totali: number
  /** Sbagliate più lasciate in bianco */
  errori: number
  argomenti: EsitoArgomento[]
  superato: boolean
}

/**
 * Corregge un esame. `domande` sono tutte quelle della scheda, nell'ordine in
 * cui sono uscite; `giusta` dice se l'utente ha risposto bene a una di esse
 * (in bianco = no). Gli argomenti vengono nell'ordine della scheda.
 */
export function valuta(
  domande: { id: string; argomentoCode: string }[],
  giusta: (id: string) => boolean,
): Esito {
  const perArgomento = new Map<string, { giuste: number; totali: number }>()
  let giuste = 0
  for (const d of domande) {
    const a = perArgomento.get(d.argomentoCode) ?? { giuste: 0, totali: 0 }
    a.totali++
    if (giusta(d.id)) { a.giuste++; giuste++ }
    perArgomento.set(d.argomentoCode, a)
  }
  const errori = domande.length - giuste
  return {
    giuste,
    totali: domande.length,
    errori,
    argomenti: [...perArgomento.entries()].map(([argomento, a]) => ({ argomento, ...a })),
    superato: domande.length > 0 && errori <= ERRORI_AMMESSI,
  }
}
