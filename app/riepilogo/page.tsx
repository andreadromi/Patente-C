'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, RotateCcw, ClipboardList, Layers, ChartNoAxesColumn } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { Foglio } from '@/components/Foglio'
import { IconaArgomento } from '@/components/IconaArgomento'
import { Stato } from '@/components/Stato'
import { DURATA_ESAME, ERRORI_AMMESSI } from '@/lib/esame'
import { nomeBreve } from '@/lib/argomenti'

interface Simulation { id: string; number: number; titolo: string | null; tipo: string }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null; startedAt: string | null; completedAt: string | null }
interface Esame { id: string; number: number; titolo: string | null; tipo: string }
interface CoperturaArgomento { code: string; name: string; affrontate: number; totale: number }
interface Copertura { affrontate: number; totale: number; argomenti: CoperturaArgomento[] }
interface ArgomentoStat { code: string; name: string; corrette: number; totali: number; accuratezza: number | null; deboli: number }
interface Statistiche { argomenti: ArgomentoStat[] }

/**
 * All'esame si passa con al massimo 4 errori su 40: il 90% di risposte
 * giuste. Sotto è rosso, appena sopra è giallo.
 */
function coloreAccuratezza(pct: number) {
  if (pct >= 95) return 'var(--green)'
  if (pct >= 90) return 'var(--amber)'
  return 'var(--red)'
}

/** Quante prove finite servono per dire se si è pronti, e su quante si giudica. */
const PROVE_PER_VERDETTO = 3
const PROVE_GIUDICATE = 5
/** Le prove nelle barre dell'andamento. */
const PROVE_IN_GRAFICO = 10
/** Le simulazioni da rifare che stanno nella scheda; le altre in un pannello. */
const DA_RIFARE_IN_VISTA = 8

const VERDETTI = {
  pronto: { label: 'Pronto', colore: 'var(--green)', sfondo: 'var(--green-dim)' },
  quasi: { label: 'Quasi', colore: 'var(--amber)', sfondo: 'var(--amber-dim)' },
  no: { label: 'Non ancora', colore: 'var(--red)', sfondo: 'var(--red-dim)' },
}

const scheda = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 22, padding: '14px 16px', marginBottom: 10 } as const
const titoloScheda = { fontSize: 17, fontWeight: 900, letterSpacing: -0.3, color: 'var(--text)' } as const

/**
 * Il Riepilogo dice come si va, la Home è dove si comincia: qui niente che
 * la Home mostra già (i numeri, l'Esame reale, la simulazione da riprendere).
 * Una pagina corta, di schede che compaiono solo quando hanno qualcosa da dire:
 *  - Sei pronto? il verdetto sulle ultime prove finite e gli errori delle
 *    ultime dieci, con la linea dei 4 errori che all'esame non si superano;
 *  - Da rifare: le simulazioni finite con più di 4 errori, un tocco e si rifanno;
 *  - Argomenti: i più deboli, e tutti in un pannello;
 *  - I tuoi esami: lo storico degli Esami reali.
 */
export default function RiepilogoPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [stat, setStat] = useState<Statistiche | null>(null)
  const [loading, setLoading] = useState(true)
  const [esami, setEsami] = useState<Esame[]>([])
  const [copertura, setCopertura] = useState<Copertura | null>(null)
  // Il pannello aperto dal basso
  const [foglio, setFoglio] = useState<'argomenti' | 'rifare' | 'esami' | null>(null)

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

  if (loading) return (
    <div style={{ height:'100dvh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  )

  // Le prove finite, simulazioni ed esami, dalla più vecchia alla più recente.
  // Superata come all'esame: al massimo 4 errori (sbagliate o in bianco).
  const quando = (u: UserSim) => new Date(u.completedAt ?? u.startedAt ?? 0).getTime()
  const prove = userSims.filter(u => u.status === 'COMPLETED' && u.errors !== null).sort((a, b) => quando(a) - quando(b))
  const superata = (u: UserSim) => (u.errors ?? 0) <= ERRORI_AMMESSI
  const giudicate = prove.slice(-PROVE_GIUDICATE)
  const superate = giudicate.filter(superata).length
  // Pronto: le ultime 5 tutte superate. Quasi: almeno 3 delle ultime 5
  const verdetto = prove.length < PROVE_PER_VERDETTO ? null
    : prove.length >= PROVE_GIUDICATE && superate === PROVE_GIUDICATE ? VERDETTI.pronto
    : superate >= 3 ? VERDETTI.quasi
    : VERDETTI.no
  const inGrafico = prove.slice(-PROVE_IN_GRAFICO)
  const mediaErrori = inGrafico.reduce((n, u) => n + (u.errors ?? 0), 0) / Math.max(1, inGrafico.length)
  // La scala delle barre: almeno il doppio della soglia, così la linea dei 4 sta a metà
  const scala = Math.max(ERRORI_AMMESSI * 2, ...inGrafico.map(u => u.errors ?? 0))

  // Le simulazioni da rifare: l'ultimo tentativo è finito con più di 4 errori.
  // Una già ricominciata non c'è: la si sta rifacendo.
  const daRifare = simulations
    .map(s => ({ s, ultimo: getLast(s.id) }))
    .filter((x): x is { s: Simulation; ultimo: UserSim } => x.ultimo?.status === 'COMPLETED' && (x.ultimo.errors ?? 0) > ERRORI_AMMESSI)
    .sort((a, b) => (b.ultimo.errors ?? 0) - (a.ultimo.errors ?? 0) || a.s.number - b.s.number)

  // Gli argomenti più deboli: sotto il 95% si è vicini o sotto il 90% che serve all'esame
  const deboli = (stat?.argomenti ?? [])
    .filter(a => a.accuratezza !== null && a.accuratezza < 95)
    .sort((a, b) => (a.accuratezza ?? 0) - (b.accuratezza ?? 0))
    .slice(0, 3)
  const conRisposte = (stat?.argomenti ?? []).some(a => a.accuratezza !== null)
  const perCodice = new Map((stat?.argomenti ?? []).map(a => [a.code, a]))
  const tuttiArgomenti = copertura?.argomenti ?? (stat?.argomenti ?? []).map(a => ({ code: a.code, name: a.name, affrontate: 0, totale: 0 }))

  const unDecimale = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 })
  const tessera = (s: Simulation, errori: number) => (
    <Link key={s.id} href={`/simulation/${s.id}`} className="tocco" aria-label={`Rifai la simulazione ${s.number}: ${errori} errori`}
      style={{ textDecoration:'none', height:60, borderRadius:14, border:'1.5px solid rgba(var(--red-rgb),0.35)', background:'var(--red-dim)', color:'var(--red)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1 }}>
      <span style={{ fontSize:20, fontWeight:900, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{s.number}</span>
      <span style={{ fontSize:12, fontWeight:700, opacity:0.85 }}>{errori} errori</span>
    </Link>
  )

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      <div style={{ padding:'18px 18px 10px', flexShrink:0 }}>
        <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>RIEPILOGO</h1>
      </div>

      {prove.length === 0 ? (
        // Ancora niente di finito: un invito solo, al posto di schede vuote
        <Stato
          icona={<IconaAvviso><ChartNoAxesColumn size={32} color="var(--accent)" strokeWidth={2.4}/></IconaAvviso>}
          titolo="Qui vedrai come vai"
          testo="Finisci una simulazione o un Esame reale: il riepilogo si riempie da solo."
          principale={{ label: 'Vai alle simulazioni', onClick: () => router.push('/dashboard') }}
        />
      ) : (
        <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>

          {/* Sei pronto? Il verdetto e, sotto, gli errori prova per prova */}
          <div className="scheda" style={scheda}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
              <span style={titoloScheda}>Sei pronto?</span>
              {verdetto && (
                <span style={{ padding:'5px 12px', borderRadius:999, background:verdetto.sfondo, color:verdetto.colore, fontSize:14, fontWeight:900 }}>{verdetto.label}</span>
              )}
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text2)', marginTop:4 }}>
              {verdetto
                ? <>Superate <strong style={{ color:'var(--text)' }}>{superate} delle ultime {giudicate.length}</strong> prove</>
                : <>Ancora {PROVE_PER_VERDETTO - prove.length} {PROVE_PER_VERDETTO - prove.length === 1 ? 'prova' : 'prove'} e ti dico se sei pronto</>}
            </div>

            {/* Una barra per prova, la più recente a destra: alta quanto gli
                errori, verde fino a 4, rossa oltre. Un tocco apre la correzione */}
            <div style={{ position:'relative', height:72, marginTop:14, paddingRight:22, display:'grid', gridTemplateColumns:`repeat(${PROVE_IN_GRAFICO}, 1fr)`, alignItems:'end' }}>
              <div aria-hidden style={{ position:'absolute', left:0, right:22, bottom:`${(ERRORI_AMMESSI / scala) * 100}%`, borderTop:'1.5px dashed var(--text4)' }} />
              <span aria-hidden style={{ position:'absolute', right:0, bottom:`calc(${(ERRORI_AMMESSI / scala) * 100}% - 8px)`, fontSize:12, fontWeight:800, color:'var(--text3)' }}>{ERRORI_AMMESSI}</span>
              {Array.from({ length: PROVE_IN_GRAFICO - inGrafico.length }, (_, i) => <span key={`vuota-${i}`} />)}
              {inGrafico.map((u, i) => {
                const errori = u.errors ?? 0
                return (
                  <Link key={u.id} href={`/user-simulations/${u.id}/report`} className="tocco"
                    aria-label={`${i === inGrafico.length - 1 ? 'Ultima prova' : 'Prova'}: ${errori} errori`}
                    style={{ height:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                    <span style={{ width:'56%', height:`${Math.max(6, (errori / scala) * 100)}%`, borderRadius:'6px 6px 3px 3px', background: errori <= ERRORI_AMMESSI ? 'var(--green)' : 'var(--red)' }} />
                  </Link>
                )
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'var(--text3)', marginTop:6 }}>
              <span>Errori per prova · media {unDecimale(mediaErrori)}</span>
              <span>ultima →</span>
            </div>
          </div>

          {/* Da rifare: solo le simulazioni andate male, le peggiori prima */}
          {daRifare.length > 0 && (
            <div className="scheda" style={scheda}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10, marginBottom:10 }}>
                <span style={titoloScheda}>Da rifare</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text3)' }}>più di {ERRORI_AMMESSI} errori</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                {(daRifare.length > DA_RIFARE_IN_VISTA ? daRifare.slice(0, DA_RIFARE_IN_VISTA - 1) : daRifare)
                  .map(({ s, ultimo }) => tessera(s, ultimo.errors ?? 0))}
                {daRifare.length > DA_RIFARE_IN_VISTA && (
                  <button onClick={() => setFoglio('rifare')} className="tocco"
                    style={{ height:60, borderRadius:14, border:'none', background:'var(--surface)', color:'var(--text2)', fontSize:17, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}>
                    +{daRifare.length - (DA_RIFARE_IN_VISTA - 1)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Argomenti: i più deboli in vista, tutti nel pannello */}
          {tuttiArgomenti.length > 0 && (
            <div className="scheda" style={{ ...scheda, padding:'14px 16px 2px' }}>
              <span style={titoloScheda}>Argomenti</span>
              {deboli.length === 0 ? (conRisposte && (
                <div style={{ fontSize:14.5, fontWeight:700, color:'var(--green)', margin:'6px 0 12px' }}>Tutti sopra il 95% di risposte giuste</div>
              )) : deboli.map(a => (
                <Link key={a.code} href={`/focus/${a.code}`} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'10px 0' }}>
                  <IconaArgomento code={a.code} size={34}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15.5, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nomeBreve(a.code, a.name)}</div>
                    <div style={{ height:5, borderRadius:3, background:'var(--surface)', marginTop:6, overflow:'hidden' }}>
                      <div style={{ width:`${a.accuratezza}%`, height:'100%', borderRadius:3, background:coloreAccuratezza(a.accuratezza ?? 0) }} />
                    </div>
                  </div>
                  <span style={{ fontSize:16, fontWeight:900, color:coloreAccuratezza(a.accuratezza ?? 0), fontVariantNumeric:'tabular-nums', minWidth:44, textAlign:'right' }}>{a.accuratezza}%</span>
                </Link>
              ))}
              <button onClick={() => setFoglio('argomenti')} className="tocco"
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:52, background:'none', border:'none', borderTop:'1px solid var(--border)', cursor:'pointer', fontFamily:'inherit', padding:0, textAlign:'left' }}>
                <Layers size={18} color="var(--accent)"/>
                <span style={{ flex:1, fontSize:15.5, fontWeight:700, color:'var(--text)' }}>Tutti gli argomenti</span>
                <ChevronRight size={18} color="var(--text3)"/>
              </button>
            </div>
          )}

          {/* Lo storico degli Esami reali */}
          {esami.length > 0 && (
            <button onClick={() => setFoglio('esami')} className="scheda tocco"
              style={{ ...scheda, width:'100%', display:'flex', alignItems:'center', gap:12, height:58, padding:'0 16px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <ClipboardList size={18} color="var(--accent)"/>
              <span style={{ flex:1, fontSize:15.5, fontWeight:700, color:'var(--text)' }}>I tuoi esami</span>
              <ChevronRight size={18} color="var(--text3)"/>
            </button>
          )}
        </div>
      )}

      <BottomNav active="riepilogo" />

      {foglio === 'argomenti' && (
        <Foglio titolo="Tutti gli argomenti" sottotitolo="Risposte giuste e domande viste" onChiudi={() => setFoglio(null)}>
          {tuttiArgomenti.map((a, i) => {
            const s = perCodice.get(a.code)
            const acc = s?.accuratezza ?? null
            return (
              <Link key={a.code} href={`/focus/${a.code}`} className="tocco" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <IconaArgomento code={a.code} size={40}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.25 }}>{nomeBreve(a.code, a.name)}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text3)', fontVariantNumeric:'tabular-nums' }}>
                    {a.totale > 0 ? `viste ${a.affrontate.toLocaleString('it-IT')} di ${a.totale.toLocaleString('it-IT')}` : ''}
                    {s && s.deboli > 0 ? `${a.totale > 0 ? ' · ' : ''}${s.deboli} da ripassare` : ''}
                  </div>
                </div>
                <span style={{ fontSize:18, fontWeight:900, color: acc === null ? 'var(--text4)' : coloreAccuratezza(acc), fontVariantNumeric:'tabular-nums' }}>{acc === null ? '—' : `${acc}%`}</span>
              </Link>
            )
          })}
        </Foglio>
      )}

      {foglio === 'rifare' && (
        <Foglio titolo="Da rifare" sottotitolo={`Simulazioni con più di ${ERRORI_AMMESSI} errori`} onChiudi={() => setFoglio(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, padding:'4px 0 8px' }}>
            {daRifare.map(({ s, ultimo }) => tessera(s, ultimo.errors ?? 0))}
          </div>
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
