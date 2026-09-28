'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trophy, BookOpen, RotateCcw, Flag } from 'lucide-react'
import { nomeBreve } from '@/lib/argomenti'
import { BottomNav } from '@/components/BottomNav'
import { IconaArgomento } from '@/components/IconaArgomento'

type Esito = 'giusto' | 'sbagliato' | 'vuoto'
interface DomandaReport {
  code: string; argomentoCode: string; testo: string; figura: string | null
  risposta: boolean; data: boolean | null; esito: Esito
}
interface ArgomentoReport { argomento: string; nome: string; giuste: number; totali: number }
interface Report {
  simulationId: string; simulationNumber: number; titolo: string | null; tipo: string
  passed: boolean; score: number; errors: number; total: number; erroriAmmessi: number
  timeElapsed: number; argomenti: ArgomentoReport[]; domande: DomandaReport[]
}

const vf = (v: boolean) => v ? 'VERO' : 'FALSO'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<Report | null>(null)
  const [vista, setVista] = useState<Esito | null>(null)

  useEffect(() => {
    fetch(`/api/user-simulations/${userSimId}/report`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setReport(d))
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (!report) return (
    <div style={{height:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
    </div>
  )

  const domande = report.domande || []
  const conta = { giusto: 0, sbagliato: 0, vuoto: 0 }
  for (const d of domande) conta[d.esito]++
  // Si apre sulle sbagliate; se non ce ne sono, su quelle senza risposta
  const vistaAttiva = vista ?? (conta.sbagliato ? 'sbagliato' : conta.vuoto ? 'vuoto' : 'giusto')
  const elenco = domande.filter(d => d.esito === vistaAttiva)
  // "12 min", "1 h 5 min": i secondi non servono
  const fmtTime = (sec: number) => {
    const m = Math.round(Math.max(0, sec) / 60)
    if (m < 1) return 'meno di un minuto'
    return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
  }
  // Superato o no ha senso solo nell'Esame reale (40 domande, al massimo 4
  // errori). Le simulazioni servono a passare tutto il listato: lì contano
  // solo gli errori, argomento per argomento
  const reale = report.tipo === 'reale'
  const passed = report.passed
  const sfumato = !reale
    ? 'linear-gradient(150deg, var(--accent-scuro) 0%, var(--accent) 100%)'
    : passed
      ? 'linear-gradient(150deg, #0E7C5C 0%, #19A77C 100%)'
      : 'linear-gradient(150deg, #B42B2B 0%, #E0544D 100%)'

  return (
    <div style={{height:'100dvh',background:'var(--bg)',color:'var(--text)',fontFamily:'system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto'}}>

        {/* L'esito, in grande, su una fascia del suo colore */}
        <div style={{background:sfumato,padding:'calc(env(safe-area-inset-top) + 14px) 20px 0',color:'#fff',position:'relative'}}>
          <Link href="/dashboard" aria-label="Torna alla Home" className="tocco"
            style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ChevronLeft size={20} color="#fff"/>
          </Link>
          <div style={{textAlign:'center',padding:'4px 0 50px'}}>
            <div style={{width:76,height:76,borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              {!reale ? <Flag size={34} color="#fff" strokeWidth={2.2}/> : passed ? <Trophy size={36} color="#fff" strokeWidth={2}/> : <RotateCcw size={34} color="#fff" strokeWidth={2.2}/>}
            </div>
            <h1 style={{fontSize:30,fontWeight:900,margin:'0 0 4px',letterSpacing:-0.6}}>{!reale ? 'Completata' : passed ? 'Superato' : 'Non superato'}</h1>
            <p style={{fontSize:15.5,fontWeight:600,margin:0,opacity:0.85}}>
              {reale
                ? `${report.errors} ${report.errors === 1 ? 'errore' : 'errori'} su ${report.total}: ne erano ammessi ${report.erroriAmmessi}`
                : `${report.titolo || `Simulazione ${report.simulationNumber}`} · ${fmtTime(report.timeElapsed || 0)}`}
            </p>
          </div>
        </div>

        {/* Tre numeri: domande giuste, sbagliate, senza risposta */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,padding:'0 16px',marginTop:-34,position:'relative'}}>
          {[
            { n: conta.giusto, label: 'Giuste', color: 'var(--green)' },
            { n: conta.sbagliato, label: 'Sbagliate', color: conta.sbagliato ? 'var(--red)' : 'var(--text3)' },
            { n: conta.vuoto, label: 'In bianco', color: 'var(--text3)' },
          ].map(c => (
            <div key={c.label} style={{background:'var(--card)',borderRadius:18,padding:'14px 6px',textAlign:'center',boxShadow:'0 6px 20px rgba(20,22,40,0.10)'}}>
              <div style={{fontSize:24,fontWeight:900,color:c.color,lineHeight:1.1,fontVariantNumeric:'tabular-nums'}}>{c.n}</div>
              <div style={{fontSize:13.5,fontWeight:600,color:'var(--text3)',marginTop:4}}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{padding:'20px 16px 20px'}}>
          {/* Argomento per argomento: quante giuste su quante ne sono uscite */}
          {report.argomenti.length > 0 && (
            <>
              <div style={{fontSize:17,fontWeight:800,color:'var(--text)',padding:'0 4px 10px'}}>Per argomento</div>
              <div className="scheda" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:20,padding:'4px 14px',marginBottom:20}}>
                {report.argomenti.map((a, i) => (
                  <div key={a.argomento} style={{display:'flex',alignItems:'center',gap:12,height:58,borderTop:i?'1px solid var(--border)':'none'}}>
                    <IconaArgomento code={a.argomento} size={34}/>
                    <div style={{flex:1,minWidth:0,fontSize:16,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {nomeBreve(a.argomento, a.nome)}
                    </div>
                    {/* Giuste su uscite: verde se tutte, rosso se ne manca anche una */}
                    <span style={{color:a.giuste === a.totali ? 'var(--green)' : 'var(--red)',fontSize:17,fontWeight:900,fontVariantNumeric:'tabular-nums',flexShrink:0}}>{a.giuste}/{a.totali}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Le domande, una per una: la risposta data e quella giusta */}
          {domande.length > 0 && (
            <div style={{marginBottom:18}}>
              <div style={{display:'flex',background:'var(--surface)',borderRadius:14,padding:4,gap:4,marginBottom:12}}>
                {([['sbagliato','Sbagliate'],['vuoto','In bianco'],['giusto','Giuste']] as const).map(([k, t]) => (
                  <button key={k} onClick={() => setVista(k)}
                    style={{flex:1,height:40,borderRadius:11,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:14,fontWeight:800,
                      background: vistaAttiva === k ? 'var(--card)' : 'transparent',
                      color: vistaAttiva === k ? 'var(--text)' : 'var(--text3)',
                      boxShadow: vistaAttiva === k ? '0 1px 4px rgba(20,22,40,0.10)' : 'none'}}>
                    {t} {conta[k]}
                  </button>
                ))}
              </div>
              {elenco.length === 0 ? (
                <div style={{textAlign:'center',color:'var(--text3)',fontSize:15,fontWeight:600,padding:'18px 0'}}>Nessuna</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {elenco.map((d, i) => (
                    <div key={d.code} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:18,padding:'14px 14px 12px',animation:`sale .3s cubic-bezier(.2,.8,.2,1) ${Math.min(i, 8) * 25}ms backwards`}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <IconaArgomento code={d.argomentoCode} size={24}/>
                        <span style={{fontSize:13,fontWeight:800,color:'var(--accent)',letterSpacing:0.4}}>{d.code}</span>
                      </div>
                      {d.figura && (
                        // eslint-disable-next-line @next/next/no-img-element -- figure del listato, dimensioni variabili
                        <img src={`/figure/${d.figura}`} alt="Figura della domanda" style={{display:'block',maxWidth:'100%',maxHeight:140,margin:'4px auto 10px',objectFit:'contain'}}/>
                      )}
                      <p style={{fontSize:15.5,fontWeight:700,color:'var(--text)',margin:'0 0 10px',lineHeight:1.45}}>{d.testo}</p>
                      {/* La risposta data e quella giusta, in parole */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,paddingTop:9,borderTop:'1px solid var(--border)',fontSize:14.5,fontWeight:700}}>
                        <span style={{color: d.esito === 'giusto' ? 'var(--green)' : d.esito === 'sbagliato' ? 'var(--red)' : 'var(--text3)'}}>
                          {d.data === null ? 'Senza risposta' : `La tua: ${vf(d.data)}`}
                        </span>
                        {d.esito !== 'giusto' && <span style={{color:'var(--green)'}}>Giusta: {vf(d.risposta)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rifarla subito, o ripassare le risposte sbagliate */}
          <div style={{display:'flex',gap:10}}>
            {report.simulationId && (
              <Link href={`/simulation/${report.simulationId}`} className="tocco" style={{flex:1,height:56,borderRadius:18,background:'var(--accent)',color:'#fff',fontSize:16.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:8,textDecoration:'none',boxShadow:'0 8px 20px rgba(var(--accent-rgb),0.25)'}}>
                <RotateCcw size={18}/>Riprova
              </Link>
            )}
            <Link href="/weak-points" className="tocco" style={{flex:1,height:56,borderRadius:18,background:'var(--surface)',color:'var(--text)',fontSize:16.5,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,textDecoration:'none'}}>
              <BookOpen size={18}/>Ripassa errori
            </Link>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
