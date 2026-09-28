'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw, Trophy, History } from 'lucide-react'
import { Numeri } from '@/components/Stato'
import { nomeBreve } from '@/lib/argomenti'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { Domanda } from '@/components/Domanda'
import { VeroFalso } from '@/components/VeroFalso'

interface Question { id: string; code: string; text: string; risposta: boolean; questionGroup: string | null; image: string | null }
type Answers = Record<string, boolean|null>

const data = (v: boolean | null | undefined) => v === true || v === false

export default function FocusStudyPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const numBarRef = useRef<HTMLDivElement>(null)

  const [nomeArgomento, setNomeArgomento] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  // Il passaggio automatico alla domanda dopo, in attesa
  const avantiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (avantiRef.current) clearTimeout(avantiRef.current) }, [])
  const [loading, setLoading] = useState(true)
  const [ripreso, setRipreso] = useState(false)      // ha ripreso da dove aveva lasciato
  // L'etichetta "ripreso" compare un attimo e se ne va da sola
  useEffect(() => {
    if (!ripreso) return
    const t = setTimeout(() => setRipreso(false), 2800)
    return () => clearTimeout(t)
  }, [ripreso])
  const [chiediRiavvio, setChiediRiavvio] = useState(false)

  // Avanzamento salvato sul server: lo teniamo anche in un ref, così possiamo
  // scriverlo quando la pagina viene chiusa senza dipendere dal render.
  const statoRef = useRef<{answers: Answers; currentIdx: number}>({ answers: {}, currentIdx: 0 })
  const caricatoRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (!numBarRef.current) return
    const btn = numBarRef.current.children[currentIdx] as HTMLElement
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentIdx])

  useEffect(() => {
    Promise.all([
      fetch(`/api/argomenti/${code}`).then(r => r.json()),
      fetch(`/api/focus/${code}/progress`)
        .then(r => r.ok ? r.json() : { answers: {}, currentIdx: 0 })
        .catch(() => ({ answers: {}, currentIdx: 0 })),
    ])
      .then(([d, prog]) => {
        if (!d.questions?.length) { router.push('/focus'); return }
        const domande: Question[] = d.questions
        setNomeArgomento(d.argomento?.name || '')
        setQuestions(domande)

        // Riprende l'avanzamento salvato, scartando le risposte a domande
        // che non esistono più (l'archivio può essere cambiato).
        const validi = new Set(domande.map(q => q.id))
        const ripristinate: Answers = {}
        for (const [qid, val] of Object.entries(prog.answers || {})) {
          if (validi.has(qid) && typeof val === 'boolean') ripristinate[qid] = val
        }
        const idx = Math.min(Math.max(prog.currentIdx || 0, 0), Math.max(domande.length - 1, 0))
        setAnswers(ripristinate)
        setCurrentIdx(idx)
        statoRef.current = { answers: ripristinate, currentIdx: idx }
        setRipreso(Object.keys(ripristinate).length > 0 && idx > 0)
        setLoading(false)
        caricatoRef.current = true
      })
      .catch(() => router.push('/focus'))
  }, [code, router])

  // Salvataggio dell'avanzamento (accorpato, per non fare una richiesta a ogni tocco)
  const salva = useCallback((keepalive = false) => {
    if (!caricatoRef.current) return
    const { answers: a, currentIdx } = statoRef.current
    fetch(`/api/focus/${code}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: a, currentIdx }),
      keepalive,
    }).catch(() => {})
  }, [code])

  useEffect(() => {
    statoRef.current = { answers, currentIdx }
    if (!caricatoRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => salva(), 700)
  }, [answers, currentIdx, salva])

  // Uscita dalla pagina o app in background: salva subito
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') salva(true) }
    const onPageHide = () => salva(true)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      salva(true)
    }
  }, [salva])

  const ricomincia = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    caricatoRef.current = false
    await fetch(`/api/focus/${code}/progress`, { method: 'DELETE' }).catch(() => {})
    setAnswers({})
    setCurrentIdx(0)
    statoRef.current = { answers: {}, currentIdx: 0 }
    setRipreso(false)
    setChiediRiavvio(false)
    caricatoRef.current = true
  }

  const rispondi = (q: Question, val: boolean) => {
    if (data(answers[q.id])) return
    setAnswers(prev => ({ ...prev, [q.id]: val }))
    const isCorrect = val === q.risposta

    // Salva subito: sbagliata → entra nei punti deboli; giusta → conta per uscirne
    fetch('/api/focus/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, isCorrect }),
    }).catch(() => {})

    // Giusta: si passa da soli alla successiva; sbagliata, si resta a guardare la correzione
    if (isCorrect) {
      // Si va avanti solo se si è ancora su questa domanda: se nel frattempo
      // ci si è spostati a mano (Succ, un numero), il salto sarebbe doppio e
      // una domanda resterebbe indietro senza risposta
      const da = currentIdx
      if (avantiRef.current) clearTimeout(avantiRef.current)
      avantiRef.current = setTimeout(() => {
        avantiRef.current = null
        setCurrentIdx(i => i === da ? Math.min(questions.length - 1, da + 1) : i)
      }, 700)
    }
  }

  const isAllDone = questions.length > 0 && questions.every(q => data(answers[q.id]))

  if (loading) return (
    <div style={{height:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    </div>
  )

  const total = questions.length
  const current = questions[currentIdx]
  if (!current) return null

  const answeredCount = questions.filter(q => data(answers[q.id])).length
  const corrette = questions.filter(q => data(answers[q.id]) && answers[q.id] === q.risposta).length

  return (
    <div style={{height:'100dvh',background:'var(--bg)',color:'var(--text)',fontFamily:'system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
          <button onClick={()=>router.back()} aria-label="Indietro" style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'var(--text3)',display:'flex'}}>
            <ChevronLeft size={20}/>
          </button>
          <div style={{minWidth:0}}>
            <div style={{fontSize:16,color:'var(--text)',fontWeight:800,maxWidth:190,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {nomeBreve(code, nomeArgomento)}
            </div>
            <div style={{fontSize:13.5,color:'var(--text3)',fontWeight:600,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>
              {currentIdx+1} di {total}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {answeredCount > 0 && (
            <button onClick={()=>setChiediRiavvio(true)} title="Ricomincia l'argomento da capo"
              style={{padding:'5px 8px',borderRadius:8,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,fontSize:13.5,fontWeight:700}}>
              <RotateCcw size={13}/>Ricomincia
            </button>
          )}
          <button onClick={()=>router.back()}
            style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border)',background: isAllDone ? 'var(--accent)' : 'transparent',color: isAllDone ? '#fff' : 'var(--text3)',fontSize:13.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            {isAllDone ? 'Termina' : 'Esci'}
          </button>
        </div>
      </div>

      {/* Numeri scorrevoli: ognuno dice com'è andata */}
      <div style={{overflowX:'auto',padding:'8px 16px',background:'var(--card)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div ref={numBarRef} style={{display:'flex',gap:6,minWidth:'max-content'}}>
          {questions.map((q, idx) => {
            const done = data(answers[q.id])
            const cur = idx === currentIdx
            const giusta = done && answers[q.id] === q.risposta
            const colore = done ? (giusta ? 'var(--green)' : 'var(--red)') : 'var(--accent)'
            const rgb = done ? (giusta ? 'var(--green-rgb)' : 'var(--red-rgb)') : 'var(--accent-rgb)'
            return (
              <button key={q.id} onClick={() => setCurrentIdx(idx)} aria-label={`Domanda ${idx+1}`} style={{
                width:32, height:32, borderRadius:8, border:'1.5px solid', flexShrink:0,
                borderColor: cur || done ? colore : 'var(--border)',
                background: cur ? colore : done ? `rgba(${rgb},0.15)` : 'transparent',
                color: cur ? '#fff' : done ? colore : 'var(--text3)',
                fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>
                {idx+1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Corpo scrollabile */}
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>

        {/* Argomento completato: il risultato in grande, e le due strade */}
        {isAllDone && (() => {
          const pctGiuste = total > 0 ? Math.round((corrette / total) * 100) : 0
          return (
            <div className="scheda" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:22,padding:'22px 18px 18px',marginBottom:14,textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
                <IconaAvviso tono="green"><Trophy size={34} color="var(--green)" strokeWidth={2.2}/></IconaAvviso>
              </div>
              <div style={{fontSize:23,fontWeight:900,color:'var(--text)',letterSpacing:-0.4}}>Argomento completato</div>
              {/* All'esame passa chi sbaglia al massimo 4 domande su 40, il 90% giuste */}
              <div style={{fontSize:44,fontWeight:900,color:pctGiuste >= 90 ? 'var(--green)' : 'var(--amber)',lineHeight:1.1,margin:'6px 0 14px',fontVariantNumeric:'tabular-nums'}}>{pctGiuste}%</div>
              <Numeri voci={[
                { n: corrette, label: 'Giuste', colore: 'var(--green)' },
                { n: total - corrette, label: 'Sbagliate', colore: 'var(--red)' },
              ]}/>
              <div style={{display:'flex',gap:8,marginTop:16}}>
                <button onClick={()=>setChiediRiavvio(true)}
                  style={{flex:1,height:52,borderRadius:16,border:'none',background:'var(--accent)',color:'#fff',fontSize:16,fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <RotateCcw size={16}/>Ricomincia
                </button>
                <button onClick={()=>router.back()}
                  style={{flex:1,height:52,borderRadius:16,border:'none',background:'var(--surface)',color:'var(--text)',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  Argomenti
                </button>
              </div>
            </div>
          )
        })()}

        <Domanda codice={current.code} gruppo={current.questionGroup} testo={current.text} figura={current.image} />
        <VeroFalso
          risposta={answers[current.id]}
          giusta={current.risposta}
          correzione
          bloccato={data(answers[current.id])}
          onRispondi={val => rispondi(current, val)}
        />
      </div>

      {/* Footer navigazione */}
      <div style={{padding:'10px 16px',paddingBottom:'calc(10px + env(safe-area-inset-bottom))',borderTop:'1px solid var(--border)',display:'flex',gap:8,flexShrink:0}}>
        <button onClick={()=>setCurrentIdx(i=>Math.max(0,i-1))} disabled={currentIdx===0}
          style={{display:'flex',alignItems:'center',gap:4,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'transparent',color:currentIdx===0?'var(--text3)':'var(--text)',fontSize:14.5,fontWeight:600,cursor:currentIdx===0?'default':'pointer',fontFamily:'inherit',opacity:currentIdx===0?0.4:1}}>
          <ChevronLeft size={15}/>Prec
        </button>
        <div style={{flex:1,padding:'10px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',textAlign:'center',fontSize:13.5,color:'var(--text3)'}}>
          <span style={{color:'var(--accent)',fontWeight:800}}>{answeredCount}</span>/{total} risposte
        </div>
        <button onClick={()=>setCurrentIdx(i=>Math.min(total-1,i+1))} disabled={currentIdx===total-1}
          style={{display:'flex',alignItems:'center',gap:4,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'transparent',color:currentIdx===total-1?'var(--text3)':'var(--text)',fontSize:14.5,fontWeight:600,cursor:currentIdx===total-1?'default':'pointer',fontFamily:'inherit',opacity:currentIdx===total-1?0.4:1}}>
          Succ<ChevronRight size={15}/>
        </button>
      </div>

      {/* Ripreso da dove si era rimasti: un'etichetta che sparisce da sola */}
      {ripreso && !isAllDone && (
        <div role="status" style={{position:'fixed',left:'50%',bottom:96,transform:'translateX(-50%)',zIndex:40,display:'flex',alignItems:'center',gap:8,padding:'0 18px',height:44,borderRadius:22,background:'var(--text)',color:'#fff',fontSize:15,fontWeight:700,whiteSpace:'nowrap',boxShadow:'0 10px 30px rgba(20,22,40,0.25)',animation:'sale .3s cubic-bezier(.2,.8,.2,1)'}}>
          <History size={17}/>Ripreso dalla domanda {currentIdx+1}
        </div>
      )}

      {/* Conferma: ricomincia da capo */}
      {chiediRiavvio && (
        <Avviso
          icona={<IconaAvviso tono="red"><RotateCcw size={32} color="var(--red)" strokeWidth={2.4}/></IconaAvviso>}
          titolo="Ricominciare da capo?"
          testo={<>Cancelli le <strong style={{ color: 'var(--text)' }}>{answeredCount} risposte</strong> date in questo argomento.</>}
          conferma={{ label: 'Ricomincia', onClick: ricomincia, tono: 'red' }}
          annulla="Annulla"
          onChiudi={() => setChiediRiavvio(false)}
        />
      )}

    </div>
  )
}
