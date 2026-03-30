'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Question { id: string; text: string; capitolo: string }

const TOTAL = 40
const TIME_LIMIT = 40 * 60

export default function SimulationPage() {
  const router = useRouter()
  const params = useParams()
  const simulationId = params.id as string
  const scrollRef = useRef<HTMLDivElement>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [userSimId, setUserSimId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleComplete = useCallback(async () => {
    if (!userSimId || submitting) return
    setSubmitting(true)
    clearInterval(timerRef.current!)
    const res = await fetch(`/api/user-simulations/${userSimId}/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeElapsed: TIME_LIMIT - timeLeft })
    })
    if (res.ok) router.push(`/user-simulations/${userSimId}/report`)
    else { setSubmitting(false) }
  }, [userSimId, submitting, timeLeft, router])

  const startSimulation = useCallback(async () => {
    try {
      const res = await fetch(`/api/simulations/${simulationId}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Errore ${res.status}`); setLoading(false); return }
      setUserSimId(data.userSimulationId)
      setQuestions(data.questions || [])
      if (data.existingAnswers) {
        const ans: Record<string, boolean> = {}
        const fb: Record<string, boolean> = {}
        Object.entries(data.existingAnswers).forEach(([qid, a]: any) => {
          if (a.userAnswer !== null && a.userAnswer !== undefined) { ans[qid] = a.userAnswer; fb[qid] = a.isCorrect }
        })
        setAnswers(ans); setFeedback(fb)
        const first = (data.questions || []).findIndex((q: Question) => !(q.id in ans))
        if (first > 0) setIdx(first)
      }
      setLoading(false)
    } catch (e: any) { setError('Errore: ' + e.message); setLoading(false) }
  }, [simulationId])

  useEffect(() => { startSimulation() }, [startSimulation])

  useEffect(() => {
    if (loading || error) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); handleComplete(); return 0 } return t - 1 })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [loading, error, handleComplete])

  // Scroll la barra numerata al numero corrente
  useEffect(() => {
    if (scrollRef.current) {
      const btn = scrollRef.current.children[idx] as HTMLElement
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [idx])

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || answered !== null || idx >= questions.length) return
    const q = questions[idx]
    setAnswered(value)
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(p => ({ ...p, [q.id]: value }))
    setFeedback(p => ({ ...p, [q.id]: data.isCorrect }))
  }

  const goTo = (i: number) => { setAnswered(null); setIdx(i) }
  const goNext = () => { setAnswered(null); if (idx < TOTAL - 1) setIdx(i => i + 1) }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
      <div style={{ width:40, height:40, border:'3px solid #1E2D4A', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <p style={{ color:'#475569', fontSize:13 }}>Caricamento...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16 }}>
      <div style={{ fontSize:44 }}>⚠️</div>
      <p style={{ color:'#EF4444', fontWeight:800, margin:0, fontSize:18 }}>Errore</p>
      <p style={{ color:'#475569', fontSize:13, textAlign:'center', maxWidth:280 }}>{error}</p>
      <button onClick={() => { setError(null); setLoading(true); startSimulation() }}
        style={{ padding:'12px 28px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Riprova</button>
      <Link href="/dashboard" style={{ color:'#475569', fontSize:12 }}>← Dashboard</Link>
    </div>
  )

  const q = questions[idx]
  if (!q) return null

  const answeredCount = Object.keys(answers).length
  const errorCount = Object.values(feedback).filter(v => !v).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const isAns = q.id in answers
  const isCorrect = feedback[q.id]
  const timeWarn = timeLeft < 300

  return (
    <div style={{ height:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 18px', background:'#0A0F1C', borderBottom:'1px solid #0D1424', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C · {idx+1}/{TOTAL}</div>
          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:900, padding:'6px 14px', borderRadius:10, background: timeWarn ? '#2D0A0A' : '#0D1424', border:`1.5px solid ${timeWarn?'#EF4444':'#1E2D4A'}`, color: timeWarn ? '#EF4444' : '#3B82F6' }}>
          {fmtTime(timeLeft)}
        </div>
      </div>

      {/* Barra errori */}
      {errorCount >= 3 && (
        <div style={{ padding:'7px 18px', background: errorCount >= 4 ? '#7F1D1D' : '#78350F', textAlign:'center', fontSize:12, fontWeight:700, color: errorCount >= 4 ? '#FCA5A5' : '#FCD34D', flexShrink:0 }}>
          {errorCount >= 4 ? '⛔ Hai raggiunto il limite massimo di errori!' : '⚠️ Attenzione: 3 errori su 4'}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding:'8px 18px', background:'#0A0F1C', flexShrink:0 }}>
        <div style={{ height:4, background:'#0D1424', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${(answeredCount/TOTAL)*100}%`, transition:'width 0.3s', borderRadius:2 }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
          <span style={{ color:'#10B981', fontWeight:700 }}>✓ {correctCount}</span>
          <span style={{ color:'#475569' }}>{answeredCount}/{TOTAL} risposte</span>
          <span style={{ color: errorCount >= 3 ? '#EF4444' : '#475569', fontWeight: errorCount >= 3 ? 700 : 400 }}>✗ {errorCount}</span>
        </div>
      </div>

      {/* Numeri domande — scroll orizzontale */}
      <div ref={scrollRef} style={{ display:'flex', gap:6, padding:'10px 18px', overflowX:'auto', flexShrink:0, scrollbarWidth:'none', msOverflowStyle:'none' }}>
        <style>{`.scroll-hide::-webkit-scrollbar{display:none}`}</style>
        {questions.map((qq, i) => {
          const isDone = qq.id in answers
          const isOk = feedback[qq.id]
          const isCur = i === idx
          return (
            <button key={i} onClick={() => goTo(i)} style={{
              minWidth:30, height:30, borderRadius:8, border:'none', fontSize:11, fontWeight:800, cursor:'pointer', flexShrink:0,
              background: isCur ? '#2563EB' : isDone ? (isOk ? '#022C22' : '#3D0A0A') : '#0D1424',
              color: isCur ? '#fff' : isDone ? (isOk ? '#10B981' : '#EF4444') : '#475569',
              boxShadow: isCur ? '0 0 10px rgba(37,99,235,0.6)' : 'none',
              fontFamily:'inherit',
            }}>{i+1}</button>
          )
        })}
      </div>

      {/* Domanda — area scrollabile */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 18px 0' }}>
        <div style={{ background:'#0D1424', borderRadius:18, padding:'18px 16px', marginBottom:14 }}>
          <p style={{ fontSize:16, lineHeight:1.7, color:'#F1F5F9', margin:0, fontWeight:500 }}>
            {q.text}
          </p>
        </div>

        {/* Bottoni V/F */}
        {!isAns ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              { val:true, label:'VERO', c:'#10B981', bg:'#022C22', border:'#10B98140' },
              { val:false, label:'FALSO', c:'#EF4444', bg:'#2D0A0A', border:'#EF444440' },
            ].map(({ val, label, c, bg, border }) => (
              <button key={label} onClick={() => handleAnswer(val)}
                style={{ padding:'17px 0', borderRadius:16, border:`2px solid ${border}`, background:'#0D1424', color:c, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget).style.background = bg }}
                onMouseLeave={e => { (e.currentTarget).style.background = '#0D1424' }}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom:14 }}>
            <div style={{ background: isCorrect ? '#022C22' : '#2D0A0A', border:`1px solid ${isCorrect?'#10B981':'#EF4444'}`, borderRadius:14, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>{isCorrect ? '✓' : '✗'}</span>
              <span style={{ color: isCorrect ? '#10B981' : '#EF4444', fontWeight:800, fontSize:14 }}>
                {isCorrect ? 'Risposta corretta!' : `Sbagliato — risposta: ${answers[q.id] ? 'FALSO' : 'VERO'}`}
              </span>
            </div>
            {idx < TOTAL - 1 && (
              <button onClick={goNext} style={{ width:'100%', padding:'14px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
                Avanti →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer — Termina */}
      <div style={{ padding:'12px 18px 20px', background:'#020817', flexShrink:0 }}>
        <button onClick={handleComplete} disabled={submitting || answeredCount < TOTAL}
          style={{ width:'100%', padding:'14px 0', background: answeredCount === TOTAL ? 'linear-gradient(135deg,#10B981,#059669)' : '#0D1424', color: answeredCount === TOTAL ? '#fff' : '#1E3A3A', border:`1px solid ${answeredCount===TOTAL?'transparent':'#0D2020'}`, borderRadius:14, fontSize:15, fontWeight:800, cursor: answeredCount === TOTAL ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'all 0.2s' }}>
          {submitting ? 'Calcolo risultati...' : `Termina (${answeredCount}/40 risposte)`}
        </button>
      </div>
    </div>
  )
}
