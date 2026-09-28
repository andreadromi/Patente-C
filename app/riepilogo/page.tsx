'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, ChevronRight, RotateCcw, GraduationCap, Layers, TrendingDown, ClipboardList } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { Foglio } from '@/components/Foglio'
import { IconaArgomento } from '@/components/IconaArgomento'
import { DOMANDE_PER_ESAME, DURATA_ESAME } from '@/lib/esame'

interface Simulation { id: string; number: number; titolo: string | null; tipo: string }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null; startedAt: string | null }
interface Esame { id: string; number: number; titolo: string | null; tipo: string }
interface CoperturaArgomento { code: string; name: string; affrontate: number; totale: number }
interface Copertura { affrontate: number; totale: number; argomenti: CoperturaArgomento[] }
interface ArgomentoStat { code: string; name: string; corrette: number; totali: number; accuratezza: number | null; deboli: number }
interface Statistiche { argomenti: ArgomentoStat[] }

/** Le simulazioni si mostrano a tappe di dieci. */
const PER_BLOCCO = 10

type StatoSim = 'ok' | 'ko' | 'corso' | 'da'

/**
 * All'esame si passa con al massimo 4 errori su 40: il 90% di risposte
 * giuste. Sotto è rosso, appena sopra è giallo.
 */
function coloreAccuratezza(pct: number) {
  if (pct >= 95) return 'var(--green)'
  if (pct >= 90) return 'var(--amber)'
  return 'var(--red)'
}

export default function RiepilogoPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [stat, setStat] = useState<Statistiche | null>(null)
  const [loading, setLoading] = useState(true)
  const [esami, setEsami] = useState<Esame[]>([])
  const [copertura, setCopertura] = useState<Copertura | null>(null)
  // Il pannello aperto dal basso: argomenti, dove si fa fatica, esami
  const [foglio, setFoglio] = useState<'argomenti' | 'fatica' | 'esami' | null>(null)
  const [creando, setCreando] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  // Tappa aperta nel percorso: finché non se ne tocca una, quella dove si è arrivati
  const [blocco, setBlocco] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
      fetch('/api/statistiche').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/esami-generati').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([u, s, us, st, eg]) => {
      if (!u.user) { router.push('/login'); return }
      setSimulations(s.simulations || [])
      setUserSims(Array.isArray(us) ? us : [])
      setStat(st)
      if (eg) { setEsami(eg.esami || []); setCopertura(eg.copertura || null) }
      setLoading(false)
    })
  }, [router])

  // L'elenco arriva dal più recente: il primo che troviamo è l'ultimo tentativo.
  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null

  // Solo l'Esame reale scade: aperto da più di 40 minuti, la pagina d'esame lo
  // consegna alla prima apertura. Le simulazioni si riprendono quando si vuole.
  const scaduto = (u: UserSim, tipo: string) =>
    tipo === 'reale' && u.status === 'IN_PROGRESS' && !!u.startedAt && Date.now() - new Date(u.startedAt).getTime() >= DURATA_ESAME * 1000
  // Al massimo un esame a metà: il suo pulsante lo riprende
  const realeInCorso = esami.find(e => {
    const l = getLast(e.id)
    return !!l && l.status === 'IN_PROGRESS' && !scaduto(l, e.tipo)
  }) || null

  const nuovoEsame = async () => {
    if (realeInCorso) { router.push(`/simulation/${realeInCorso.id}`); return }
    setCreando(true); setErrore(null)
    try {
      const r = await fetch('/api/esami-generati', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.id) { setErrore(d.error || 'Non sono riuscito a comporre l\'esame'); setCreando(false); return }
      router.push(`/simulation/${d.id}`)
    } catch { setErrore('Errore di connessione'); setCreando(false) }
  }

  // Annullare un esame chiede conferma con l'avviso dell'app
  const [daAnnullare, setDaAnnullare] = useState<string | null>(null)
  const chiediAnnulla = (e: React.MouseEvent, userSimId: string) => {
    e.preventDefault(); e.stopPropagation()
    setDaAnnullare(userSimId)
  }
  const annullaEsame = async (userSimId: string) => {
    setDaAnnullare(null)
    await fetch(`/api/user-simulations/${userSimId}`, { method: 'DELETE' })
    const [us, eg] = await Promise.all([
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
      fetch('/api/esami-generati').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    setUserSims(Array.isArray(us) ? us : [])
    if (eg) { setEsami(eg.esami || []); setCopertura(eg.copertura || null) }
  }

  // La tappa aperta sta al centro della striscia: all'arrivo e a ogni tocco.
  // Si sposta solo la striscia, non la pagina.
  useEffect(() => {
    const striscia = stripRef.current
    const scheda = striscia?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!striscia || !scheda) return
    striscia.scrollTo({ left: scheda.offsetLeft - (striscia.clientWidth - scheda.offsetWidth) / 2, behavior: blocco === null ? 'auto' : 'smooth' })
  }, [loading, blocco])

  if (loading) return (
    <div style={{ height:'100dvh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Conta le simulazioni, non i tentativi: rifacendo la stessa simulazione i
  // numeri salirebbero oltre il totale.
  const ultimi = simulations.map(sim => getLast(sim.id)).filter(Boolean) as UserSim[]
  const completate = ultimi.filter(u => u.status === 'COMPLETED')
  // Senza soglia: "perfette" sono le simulazioni finite senza errori
  const perfette = completate.filter(u => (u.errors ?? 0) === 0).length
  const inCorso = ultimi.filter(u => u.status === 'IN_PROGRESS')

  // Un solo invito in testa: riprendere quella lasciata a metà, oppure
  // iniziare la prima mai svolta. Serve soprattutto a chi apre la pagina
  // la prima volta e si troverebbe davanti solo un elenco.
  const daRiprendere = inCorso.length
    ? simulations.find(s => s.id === inCorso[0].simulationId) || null
    : null
  const daIniziare = daRiprendere ? null : simulations.find(s => !getLast(s.id)) || null
  const invito = daRiprendere || daIniziare

  const statoSim = (id: string): StatoSim => {
    const l = getLast(id)
    if (!l) return 'da'
    if (l.status === 'COMPLETED') return (l.errors ?? 0) === 0 ? 'ok' : 'ko'
    return 'corso'
  }
  const blocchi: Simulation[][] = []
  for (let i = 0; i < simulations.length; i += PER_BLOCCO) blocchi.push(simulations.slice(i, i + PER_BLOCCO))
  const bloccoDiInvito = invito ? Math.floor(simulations.findIndex(s => s.id === invito.id) / PER_BLOCCO) : 0
  const bloccoAttivo = blocco ?? Math.max(0, bloccoDiInvito)

  // Solo gli argomenti dove serve davvero tornarci: sotto il 95% si è vicini
  // o sotto il 90% che serve all'esame. Elencare anche quelli al 100%
  // sotto il titolo "dove fai più fatica" non avrebbe senso.
  const puntiDeboli = (stat?.argomenti ?? [])
    .filter(a => a.totali > 0 && a.accuratezza !== null && a.accuratezza < 95)
    .sort((a, b) => (a.accuratezza ?? 0) - (b.accuratezza ?? 0))
    .slice(0, 5)
  // Tutto l'archivio: "affrontata" vuol dire risposta in un esame o in una
  // simulazione, almeno una volta.
  const pctArchivio = copertura?.totale ? Math.round((copertura.affrontate / copertura.totale) * 100) : 0
  const archivioCompleto = !!copertura && copertura.totale > 0 && copertura.affrontate === copertura.totale

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`
        .riga { transition: background 0.12s; }
        .riga:active { background: var(--surface); }
        .striscia { scrollbar-width: none; }
      `}</style>

      <div style={{ padding:'18px 18px 10px', flexShrink:0 }}>
        <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>RIEPILOGO</h1>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>

        {/* Colpo d'occhio: tre numeri soli, che non escono mai dal riquadro */}
        <div className="scheda" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:22, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', marginBottom:10 }}>
          {[
            { label:'Archivio', n:`${pctArchivio}%`, colore: archivioCompleto ? 'var(--green)' : 'var(--accent)' },
            { label:'Fatte', n:completate.length, colore:'var(--text)' },
            { label:'Perfette', n:perfette, colore:'var(--green)' },
          ].map((c, i) => (
            <div key={c.label} style={{ padding:'14px 8px 13px', textAlign:'center', borderLeft: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:-0.8, color:c.colore, lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{c.n}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text3)', marginTop:2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* L'Esame reale: 40 domande come il giorno dell'esame. Se ce n'è uno
            a metà, il riquadro lo riprende */}
        {copertura && (
          <button onClick={nuovoEsame} disabled={creando} className="tocco"
            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, textAlign:'left', border:'none', borderRadius:22, padding:'14px 16px', marginBottom:10, background:'var(--accent)', color:'#fff', cursor: creando ? 'default' : 'pointer', fontFamily:'inherit', opacity: creando ? 0.7 : 1, boxShadow:'0 8px 20px rgba(var(--accent-rgb),0.25)' }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <GraduationCap size={21} color="#fff"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:17, fontWeight:800 }}>{realeInCorso ? "Riprendi l'esame" : 'Esame reale'}</div>
              <div style={{ fontSize:13.5, fontWeight:600, opacity:0.85 }}>{realeInCorso ? (realeInCorso.titolo || 'lasciato a metà') : `${DOMANDE_PER_ESAME} domande · ${DURATA_ESAME / 60} minuti`}</div>
            </div>
            <ChevronRight size={19} color="rgba(255,255,255,0.9)"/>
          </button>
        )}
        {errore && <div style={{ fontSize:14.5, color:'var(--red)', margin:'0 4px 10px', fontWeight:700 }}>{errore}</div>}

        {/* Da dove ripartire */}
        {invito && (
          <Link href={`/simulation/${invito.id}`} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'12px 14px', marginBottom:10, boxShadow:'var(--ombra)' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(var(--accent-rgb),0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Play size={16} color="var(--accent)" fill="var(--accent)"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{daRiprendere ? 'Riprendi' : 'Inizia'} la simulazione {invito.number}</div>
              <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text3)' }}>{daRiprendere ? 'lasciata a metà' : 'la prima da fare'}</div>
            </div>
            <ChevronRight size={18} color="var(--text3)"/>
          </Link>
        )}

        {/* I dettagli non allungano la pagina: ogni riga apre il suo pannello */}
        {(() => {
          const righe = [
            copertura && copertura.argomenti.length > 0 && { id:'argomenti' as const, Icona:Layers, titolo:'Per argomento' },
            puntiDeboli.length > 0 && { id:'fatica' as const, Icona:TrendingDown, titolo:'Dove fai più fatica' },
            esami.length > 0 && { id:'esami' as const, Icona:ClipboardList, titolo:'I tuoi esami' },
          ].filter(Boolean) as { id: 'argomenti' | 'fatica' | 'esami'; Icona: typeof Layers; titolo: string }[]
          if (!righe.length) return null
          return (
            <div className="scheda" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 14px', marginBottom:18 }}>
              {righe.map((r, i) => (
                <button key={r.id} onClick={() => setFoglio(r.id)} className="tocco"
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:60, background:'none', border:'none', borderTop: i ? '1px solid var(--border)' : 'none', cursor:'pointer', fontFamily:'inherit', padding:0, textAlign:'left' }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:'rgba(var(--accent-rgb),0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <r.Icona size={18} color="var(--accent)"/>
                  </div>
                  <span style={{ flex:1, fontSize:16, fontWeight:700, color:'var(--text)' }}>{r.titolo}</span>
                  <ChevronRight size={18} color="var(--text3)"/>
                </button>
              ))}
            </div>
          )
        })()}

        {/* Le simulazioni come un percorso a tappe, da dieci. La striscia dice a
            che punto è ogni tappa; toccandone una, sotto compaiono le sue
            simulazioni. Tutti i quadratini insieme non si leggerebbero. */}
        {simulations.length > 0 && (
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'0 4px 8px' }}>
            <span style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:-0.2 }}>
              Il percorso
            </span>
          </div>
        )}
        {simulations.length === 0 ? (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 20px', textAlign:'center', color:'var(--text3)', fontSize:14.5 }}>
            Nessuna simulazione disponibile.
          </div>
        ) : (
          <>
            <div ref={stripRef} className="striscia" style={{ position:'relative', display:'flex', gap:10, overflowX:'auto', scrollSnapType:'x mandatory', margin:'-8px -16px 0', padding:'8px 16px 20px' }}>
              {blocchi.map((b, i) => {
                const stati = b.map(sim => statoSim(sim.id))
                const fatte = stati.filter(x => x === 'ok' || x === 'ko').length
                const attivo = i === bloccoAttivo
                const finito = fatte === b.length
                return (
                  <button key={i} data-blocco={i} onClick={() => setBlocco(i)} aria-pressed={attivo} aria-label={`Simulazioni ${b[0].number}–${b[b.length - 1].number}: ${fatte} di ${b.length} fatte`}
                    style={{
                      flex:'0 0 auto', width:124, scrollSnapAlign:'center', textAlign:'left', cursor:'pointer', fontFamily:'inherit',
                      background: attivo ? 'var(--accent)' : 'var(--card)',
                      border: attivo ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius:20, padding:'14px 14px 14px',
                      boxShadow: attivo ? '0 8px 20px rgba(var(--accent-rgb),0.28)' : 'var(--ombra)',
                    }}>
                    {/* Il nome è l'intervallo stesso: le simulazioni che contiene */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:12 }}>
                      <span style={{ fontSize:20, fontWeight:900, letterSpacing:-0.4, color: attivo ? '#fff' : 'var(--text)', fontVariantNumeric:'tabular-nums' }}>{b[0].number}–{b[b.length - 1].number}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, borderRadius:3, background: attivo ? 'rgba(255,255,255,0.28)' : 'var(--surface)', overflow:'hidden' }}>
                        <div style={{ width:`${(fatte / b.length) * 100}%`, height:'100%', borderRadius:3, background: attivo ? '#fff' : finito ? 'var(--green)' : 'var(--accent)' }}/>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Le simulazioni della tappa scelta */}
            <div key={bloccoAttivo} className="scheda" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
                {(blocchi[bloccoAttivo] ?? []).map((sim, j) => {
                  const last = getLast(sim.id)
                  const st = statoSim(sim.id)
                  const href = (st === 'ok' || st === 'ko') && last ? `/user-simulations/${last.id}/report` : `/simulation/${sim.id}`
                  const colore = st === 'ok' ? 'var(--green)' : st === 'ko' ? 'var(--red)' : st === 'corso' ? 'var(--accent)' : 'var(--text2)'
                  const errori = last?.errors ?? 0
                  const descr = st === 'ok' || st === 'ko' ? `${errori} ${errori === 1 ? 'errore' : 'errori'}` : st === 'corso' ? 'in corso' : 'da fare'
                  return (
                    <Link key={sim.id} href={href} aria-label={`Simulazione ${sim.number}: ${descr}`} className="tocco"
                      style={{ textDecoration:'none', display:'block', animation:`sale .3s cubic-bezier(.2,.8,.2,1) ${j * 25}ms backwards` }}>
                      {/* Riquadro neutro: l'esito lo dicono il colore del numero e il pallino */}
                      <div style={{ borderRadius:14, height:60, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, background:'var(--surface)' }}>
                        <div style={{ fontSize:20, fontWeight:900, color:colore, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{sim.number}</div>
                        <span style={{ width:6, height:6, borderRadius:3, background: st === 'da' ? 'transparent' : colore }}/>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="riepilogo" />

      {foglio === 'argomenti' && copertura && (
        <Foglio titolo="Per argomento" sottotitolo="Domande viste almeno una volta" onChiudi={() => setFoglio(null)}>
          {copertura.argomenti.map((a, i) => {
            const pctArgomento = a.totale ? Math.round((a.affrontate / a.totale) * 100) : 0
            const fatto = a.affrontate === a.totale
            return (
              <Link key={a.code} href={`/focus/${a.code}`} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <IconaArgomento code={a.code} size={40}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.25 }}>{a.name}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text3)', fontVariantNumeric:'tabular-nums' }}>{a.affrontate.toLocaleString('it-IT')} di {a.totale.toLocaleString('it-IT')} domande</div>
                </div>
                <span style={{ fontSize:18, fontWeight:900, color: fatto ? 'var(--green)' : 'var(--accent)', fontVariantNumeric:'tabular-nums' }}>{pctArgomento}%</span>
              </Link>
            )
          })}
        </Foglio>
      )}

      {foglio === 'fatica' && (
        <Foglio titolo="Dove fai più fatica" sottotitolo="Risposte giuste, argomento per argomento" onChiudi={() => setFoglio(null)}>
          {puntiDeboli.map((a, i) => (
            <Link key={a.code} href={`/focus/${a.code}`} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <IconaArgomento code={a.code} size={40}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.25 }}>{a.name}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text3)', fontVariantNumeric:'tabular-nums' }}>{a.deboli > 0 ? `${a.deboli} da ripassare` : `${a.corrette} di ${a.totali} giuste`}</div>
              </div>
              <span style={{ fontSize:18, fontWeight:900, color: coloreAccuratezza(a.accuratezza ?? 0), fontVariantNumeric:'tabular-nums' }}>{a.accuratezza}%</span>
            </Link>
          ))}
        </Foglio>
      )}

      {foglio === 'esami' && (
        <Foglio titolo="I tuoi esami" sottotitolo="Dal più recente" onChiudi={() => setFoglio(null)}>
          {esami.map((es, i) => {
            const last = getLast(es.id)
            const done = last?.status === 'COMPLETED'
            const inProg = !!last && last.status === 'IN_PROGRESS' && !scaduto(last, es.tipo)
            const exp = !!last && scaduto(last, es.tipo)
            const ok = last?.passed === true
            const errori = last?.errors ?? 0
            const colore = done ? (ok ? 'var(--green)' : 'var(--red)') : inProg ? 'var(--accent)' : exp ? 'var(--red)' : 'var(--text3)'
            const stato = done ? (ok ? 'Superato' : 'Non superato') : inProg ? 'In corso' : exp ? 'Scaduto' : 'Da fare'
            // Finito si rilegge il report; uno scaduto si apre e si consegna da solo
            const href = done && last ? `/user-simulations/${last.id}/report` : `/simulation/${es.id}`
            return (
              <Link key={es.id} href={href} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{es.titolo || `Esame ${es.number}`}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:colore }}>{stato}</div>
                </div>
                {done && <span style={{ fontSize:16, fontWeight:900, color:colore, fontVariantNumeric:'tabular-nums' }}>{errori} {errori === 1 ? 'errore' : 'errori'}</span>}
                {inProg && last && (
                  <span role="button" className="tocco" onClick={e => chiediAnnulla(e, last.id)} aria-label="Annulla l'esame"
                    style={{ height:34, padding:'0 14px', borderRadius:17, background:'var(--surface)', color:'var(--text2)', fontSize:14, fontWeight:700, display:'flex', alignItems:'center' }}>
                    Annulla
                  </span>
                )}
                {!done && !inProg && <ChevronRight size={18} color="var(--text3)"/>}
              </Link>
            )
          })}
        </Foglio>
      )}

      {daAnnullare && (
        <Avviso
          icona={<IconaAvviso tono="red"><RotateCcw size={32} color="var(--red)" strokeWidth={2.4}/></IconaAvviso>}
          titolo="Annullare l'esame?"
          testo="Le risposte date finora vanno perse."
          conferma={{ label: 'Annulla esame', onClick: () => annullaEsame(daAnnullare), tono: 'red' }}
          annulla="Tienilo"
          onChiudi={() => setDaAnnullare(null)}
        />
      )}
    </div>
  )
}
