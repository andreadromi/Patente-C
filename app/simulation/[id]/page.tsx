'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Flag, Pause } from 'lucide-react'
import { Stato } from '@/components/Stato'
import { nomeBreve } from '@/lib/argomenti'
import { DURATA_ESAME } from '@/lib/esame'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { Domanda } from '@/components/Domanda'
import { VeroFalso } from '@/components/VeroFalso'
import { Numeri } from '@/components/Numeri'
import { Avanzamento } from '@/components/Avanzamento'

interface QuestionItem {
  id: string; code: string; text: string; image: string | null
  argomento: string; argomentoCode: string; risposta: boolean
}
type LocalAnswers = Record<string, boolean | null>

function formatTime(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60
  if (h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

const risposta = (v: boolean | null | undefined) => v === true || v === false

export default function SimulationPage() {
  const params = useParams()
  const router = useRouter()
  const simId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userSimId, setUserSimId] = useState('')
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [answers, setAnswers] = useState<LocalAnswers>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  // Il passaggio automatico alla domanda dopo, in attesa
  const avantiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (avantiRef.current) clearTimeout(avantiRef.current) }, [])
  // Esame reale: il tempo che resta. Simulazioni: il tempo passato sulla pagina
  const [timeLeft, setTimeLeft] = useState(DURATA_ESAME)
  const scadenzaRef = useRef(0)
  const [secondi, setSecondi] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  // "Esci" apre prima questa scelta: uscire e riprendere dopo, o consegnare
  const [chiediUscita, setChiediUscita] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [paused, setPaused] = useState(false)
  // Le simulazioni sono in Studio, con la correzione subito; l'Esame reale è
  // come quello vero: col tempo, la correzione alla fine, e le risposte che
  // si cambiano fino alla consegna
  const [reale, setReale] = useState(false)
  const studyMode = !reale
  // Risposte di cui si è già vista la correzione: bloccate
  const [rivelate, setRivelate] = useState<Set<string>>(new Set())
  const savingRef = useRef<Record<string, boolean>>({})
  const ultimaRef = useRef<Record<string, { val: boolean; blocca: boolean }>>({})
  const completingRef = useRef(false)


  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/simulations/${simId}/start`, { method: 'POST' })
        if (!res.ok) { const d = await res.json(); setError(d.error||'Errore'); setLoading(false); return }
        const d = await res.json()
        const domande: QuestionItem[] = d.questions || []
        setUserSimId(d.userSimulationId)
        setReale(d.tipo === 'reale')
        setQuestions(domande)
        const prev: LocalAnswers = {}
        for (const [k,v] of Object.entries(d.existingAnswers||{})) prev[k] = v as boolean|null
        setAnswers(prev)
        setRivelate(new Set<string>(d.rivelate||[]))

        // Riprende dalla prima domanda ancora senza risposta invece di ripartire dalla 1
        const daFare = domande.findIndex(q => !risposta(prev[q.id]))
        setCurrentIdx(daFare >= 0 ? daFare : 0)

        // Le simulazioni si lasciano e si riprendono quando si vuole: il tempo
        // passato si ricorda e riparte da lì
        if (d.tipo !== 'reale') {
          let salvato = NaN
          try { salvato = parseInt(localStorage.getItem(`sim_secondi_${d.userSimulationId}`) ?? '') } catch { /* archivio del browser non disponibile */ }
          setSecondi(Number.isFinite(salvato) && salvato > 0 ? salvato : 0)
          setLoading(false)
          return
        }

        // Esame reale: corre anche a pagina chiusa, come il giorno dell'esame.
        // Il tempo passato lo misura il server: l'orologio del telefono può
        // non coincidere col suo, e da qui in poi conta solo quanto scorre
        const elapsed = Math.max(0, Number(d.elapsed) || 0)
        // Se il tempo è finito mentre si era fuori, si consegna
        if (elapsed >= DURATA_ESAME) {
          await fetch(`/api/user-simulations/${d.userSimulationId}/complete`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceComplete: true }),
          })
          router.push(`/user-simulations/${d.userSimulationId}/report`)
          return
        }
        scadenzaRef.current = Date.now() + (DURATA_ESAME - elapsed) * 1000
        setTimeLeft(DURATA_ESAME - elapsed)
        setLoading(false)
      } catch { setError('Errore di connessione'); setLoading(false) }
    }
    load()
  }, [simId, router])

  // Il tempo passato in una simulazione si ricorda: uscendo e rientrando si riparte da lì
  useEffect(() => {
    if (loading || !userSimId || reale) return
    try { localStorage.setItem(`sim_secondi_${userSimId}`, String(secondi)) } catch { /* niente archivio: pazienza */ }
  }, [secondi, loading, userSimId, reale])

  // Un secondo alla volta. Nell'esame il conto alla rovescia si ricalcola
  // dalla scadenza, e non si ferma mai: il tempo vero scorre anche mentre un
  // avviso è aperto o il telefono rallenta la pagina in secondo piano. Nelle
  // simulazioni è un cronometro, fermo mentre si decide se uscire.
  useEffect(() => {
    if (loading) return
    if (reale) {
      const t = setInterval(() => setTimeLeft(Math.max(0, Math.round((scadenzaRef.current - Date.now()) / 1000))), 1000)
      return () => clearInterval(t)
    }
    if (paused) return
    const t = setInterval(() => setSecondi(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [loading, paused, reale])

  // Esame reale: allo scadere del tempo si consegna da soli
  useEffect(() => {
    if (reale && !loading && timeLeft <= 0) handleComplete()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reale, loading, timeLeft])

  // Manda al server l'ultimo valore scelto. Se una richiesta è già in corso,
  // è quella a rimandare il valore nuovo quando finisce: un secondo tocco
  // veloce non va perso.
  const saveAnswer = useCallback(async (qId: string, val: boolean, blocca: boolean) => {
    ultimaRef.current[qId] = { val, blocca }
    if (!userSimId||savingRef.current[qId]) return
    savingRef.current[qId] = true
    try {
      for (;;) {
        const daInviare = ultimaRef.current[qId]
        const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ questionId: qId, userAnswer: daInviare.val, blocca: daInviare.blocca }),
        })
        if (res.status === 409) {
          // Il server l'ha già come corretta: la pagina si allinea a quello che ha salvato
          const d = await res.json().catch(() => ({}))
          if (typeof d.userAnswer === 'boolean') setAnswers(prev => ({...prev, [qId]: d.userAnswer}))
          setRivelate(prev => new Set(prev).add(qId))
          break
        }
        if (!res.ok || ultimaRef.current[qId] === daInviare) break
      }
    } catch {} finally { savingRef.current[qId] = false }
  }, [userSimId])

  const rispondi = (q: QuestionItem, val: boolean) => {
    if (rivelate.has(q.id)) return
    setAnswers(prev => ({...prev, [q.id]: val}))
    // In Studio la correzione compare subito: da lì la risposta non si cambia più
    if (studyMode) setRivelate(prev => new Set(prev).add(q.id))
    saveAnswer(q.id, val, studyMode)
    // Si va avanti da soli: nell'esame dopo ogni risposta, in Studio quando è
    // giusta (sbagliata, si resta a guardare la correzione)
    if (reale || val === q.risposta) {
      // Si va avanti solo se si è ancora su questa domanda: se nel frattempo
      // ci si è spostati a mano (Succ, un numero), il salto sarebbe doppio e
      // una domanda resterebbe indietro senza risposta
      const da = currentIdx
      if (avantiRef.current) clearTimeout(avantiRef.current)
      avantiRef.current = setTimeout(() => {
        avantiRef.current = null
        setCurrentIdx(i => i === da ? Math.min(questions.length - 1, da + 1) : i)
      }, reale ? 350 : 700)
    }
  }

  const handleComplete = async () => {
    if (completingRef.current) return
    completingRef.current = true
    setCompleting(true); setSubmitError('')
    try {
      const res = await fetch(`/api/user-simulations/${userSimId}/complete`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ timeElapsed: secondi, forceComplete: true }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error||'Non sono riuscito a consegnare l\'esame'); setCompleting(false); setShowConfirm(true); completingRef.current=false; return }
      try { localStorage.removeItem(`sim_secondi_${userSimId}`) } catch { /* niente archivio */ }
      router.push(`/user-simulations/${userSimId}/report`)
    } catch { setSubmitError('Connessione assente: riprova'); setCompleting(false); setShowConfirm(true); completingRef.current=false }
  }

  if (loading) return (
    <div style={{height:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <p style={{color:'var(--text3)',fontSize:14.5}}>Caricamento...</p>
    </div>
  )
  if (error) return (
    <div style={{height:'100dvh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      <Stato
        icona={<IconaAvviso tono="red"><AlertCircle size={34} color="var(--red)" strokeWidth={2.4}/></IconaAvviso>}
        titolo="Non si apre"
        testo={error}
        principale={{ label: 'Torna alla Home', onClick: () => router.push('/dashboard') }}
      />
    </div>
  )

  const total = questions.length
  const current = questions[currentIdx]
  if (!current) return null

  const answeredCount = questions.filter(q => risposta(answers[q.id])).length
  const timerColor = timeLeft<300 ? 'var(--red)' : timeLeft<600 ? 'var(--amber)' : 'var(--accent)'
  const bloccata = rivelate.has(current.id)

  return (
    <div style={{height:'100dvh',background:'var(--bg)',color:'var(--text)',fontFamily:'system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Intestazione, una fascia sola: l'argomento della domanda aperta (e
          nell'esame il tempo), i numeri nei loro rettangoli che scorrono e,
          sul bordo basso, la linea dell'avanzamento. Il colore del
          rettangolo dice com'è andata (all'esame solo se è data) */}
      <div style={{background:'var(--card)',boxShadow:'var(--ombra)',position:'relative',zIndex:1,flexShrink:0}}>
        <div style={{padding:'12px 16px 2px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{minWidth:0,flex:1,marginRight:10}}>
            <div style={{fontSize:17,fontWeight:800,letterSpacing:-0.2,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {nomeBreve(current.argomentoCode, current.argomento)}
            </div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text3)',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>
              Domanda {currentIdx+1} di {total}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            {reale && (
              <div style={{display:'flex',alignItems:'center',gap:5,color:timerColor}}>
                <Clock size={14}/>
                <span style={{fontSize:17,fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button className="pillola" onClick={()=>{ setPaused(true); setChiediUscita(true) }}>
              Esci
            </button>
          </div>
        </div>
        <Numeri totale={questions.length} corrente={currentIdx} onScegli={setCurrentIdx}
          esito={idx => {
            const q = questions[idx]
            if (!risposta(answers[q.id])) return 'vuota'
            if (!studyMode) return 'data'
            return answers[q.id] === q.risposta ? 'giusta' : 'sbagliata'
          }} />
        <Avanzamento fatte={answeredCount} totale={total} />
      </div>

      {/* Corpo: il riquadro della domanda prende lo spazio libero, sempre lo
          stesso, e VERO/FALSO stanno sempre allo stesso posto, con o senza figura */}
      <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',gap:12,padding:'16px 16px 10px'}}>
        <Domanda key={`domanda-${current.id}`} riempi codice={current.code} testo={current.text} figura={current.image} />
        <VeroFalso key={`risposta-${current.id}`}
          risposta={answers[current.id]}
          giusta={current.risposta}
          correzione={studyMode}
          bloccato={bloccata}
          onRispondi={val => rispondi(current, val)}
        />
      </div>

      {/* Footer */}
      <div style={{padding:'10px 16px',paddingBottom:'calc(10px + env(safe-area-inset-bottom))',borderTop:'1px solid var(--border)',display:'flex',gap:8,flexShrink:0}}>
        <button onClick={()=>setCurrentIdx(i=>Math.max(0,i-1))} disabled={currentIdx===0}
          style={{display:'flex',alignItems:'center',gap:4,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'transparent',color:currentIdx===0?'var(--text3)':'var(--text)',fontSize:14.5,fontWeight:600,cursor:currentIdx===0?'default':'pointer',fontFamily:'inherit',opacity:currentIdx===0?0.4:1}}>
          <ChevronLeft size={15}/>Prec
        </button>
        {answeredCount >= total ? (
          <button onClick={()=>setShowConfirm(true)}
            style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:'var(--red)',color:'#fff',fontSize:14.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
            {reale ? 'Consegna' : 'Termina'}
          </button>
        ) : (
          <div style={{flex:1,padding:'10px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',textAlign:'center',fontSize:13.5,color:'var(--text3)'}}>
            <span style={{color:'var(--accent)',fontWeight:800}}>{answeredCount}</span>/{total} risposte
          </div>
        )}
        <button onClick={()=>setCurrentIdx(i=>Math.min(total-1,i+1))} disabled={currentIdx===total-1}
          style={{display:'flex',alignItems:'center',gap:4,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'transparent',color:currentIdx===total-1?'var(--text3)':'var(--text)',fontSize:14.5,fontWeight:600,cursor:currentIdx===total-1?'default':'pointer',fontFamily:'inherit',opacity:currentIdx===total-1?0.4:1}}>
          Succ<ChevronRight size={15}/>
        </button>
      </div>

      {/* Uscita: le risposte restano salvate, si riprende quando si vuole */}
      {chiediUscita && (
        <Avviso
          icona={<IconaAvviso><Pause size={32} color="var(--accent)" strokeWidth={2.4}/></IconaAvviso>}
          titolo={reale ? "Uscire dall'esame?" : 'Uscire?'}
          testo={reale
            ? 'Le risposte restano salvate, ma il tempo continua a scorrere.'
            : 'Le risposte restano salvate: riprendi da qui quando vuoi.'}
          conferma={{ label: 'Esci, riprendo dopo', onClick: () => router.push('/dashboard') }}
          secondaria={{ label: reale ? 'Consegna e correggi' : 'Termina e correggi', onClick: () => { setChiediUscita(false); setShowConfirm(true) } }}
          annulla="Continua"
          onChiudi={() => { setChiediUscita(false); setPaused(false) }}
        />
      )}

      {/* Consegna: quante domande restano, e basta */}
      {showConfirm && (() => {
        const mancano = total - answeredCount
        const chiudi = () => { setShowConfirm(false); setSubmitError(''); setPaused(false) }
        return (
          <Avviso
            icona={<IconaAvviso tono={mancano ? 'accent' : 'green'}><Flag size={32} color={mancano ? 'var(--accent)' : 'var(--green)'} strokeWidth={2.4}/></IconaAvviso>}
            titolo={reale ? "Consegnare l'esame?" : 'Terminare la simulazione?'}
            testo={mancano === 0
              ? (reale ? 'Hai risposto a tutte le domande. Dopo la consegna non si cambiano più.' : 'Hai risposto a tutte le domande.')
              : <>{mancano === 1 ? 'Manca ' : 'Mancano '}<strong style={{ color: 'var(--text)' }}>{mancano} {mancano === 1 ? 'risposta' : 'risposte'}</strong>: {mancano === 1 ? 'conta' : 'contano'} come {mancano === 1 ? 'errore' : 'errori'}.</>}
            conferma={{ label: completing ? 'Correggo…' : (reale ? 'Consegna e correggi' : 'Termina e correggi'), onClick: handleComplete, disabled: completing }}
            annulla="Continua"
            errore={submitError || undefined}
            onChiudi={chiudi}
          />
        )
      })()}
    </div>
  )
}
