'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, Flag, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'

interface Question { id: string; text: string; capitolo: string }
const TOTAL = 40
const TIME_LIMIT = 40 * 60

export default function SimulationPage() {
  const router = useRouter()
  const params = useParams()
  const simulationId = params.id as string
  const numbersRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<NodeJS.Timeout | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [userSimId, setUserSimId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [lastFeedback, setLastFeedback] = useState<{correct: boolean, show: boolean} | null>(null)
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
    else setSubmitting(false)
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

  // Auto-complete quando tutte risposte date
  useEffect(() => {
    if (!loading && Object.keys(answers).length === TOTAL && questions.length === TOTAL) {
      setTimeout(() => handleComplete(), 800)
    }
  }, [answers, questions, loading, handleComplete])

  useEffect(() => {
    if (numbersRef.current) {
      const btn = numbersRef.current.children[idx] as HTMLElement
      btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [idx])

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const goNext = useCallback(() => {
    setLastFeedback(null)
    if (idx < TOTAL - 1) setIdx(i => i + 1)
  }, [idx])

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || q.id in answers) return
    const q2 = questions[idx]
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q2.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(p => ({ ...p, [q2.id]: value }))
    setFeedback(p => ({ ...p, [q2.id]: data.isCorrect }))
    setLastFeedback({ correct: data.isCorrect, show: true })

    if (idx < TOTAL - 1) {
      autoRef.current = setTimeout(() => goNext(), data.isCorrect ? 900 : 1400)
    }
  }

  const goTo = (i: number) => {
    clearTimeout(autoRef.current!)
    setLastFeedback(null)
    setIdx(i)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, fontFamily:'system-ui' }}>
      <div style={{ width:40, height:40, border:'3px solid #1E2D4A', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <p style={{ color:'#4B5563', fontSize:13 }}>Preparazione quiz...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, fontFamily:'system-ui' }}>
      <XCircle size={48} color="#EF4444"/>
      <p style={{ color:'#F1F5F9', fontWeight:800, margin:0, fontSize:20 }}>Errore</p>
      <p style={{ color:'#6B7280', fontSize:14, textAlign:'center', maxWidth:280 }}>{error}</p>
      <button onClick={() => { setError(null); setLoading(true); startSimulation() }}
        style={{ padding:'12px 28px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>Riprova</button>
      <Link href="/dashboard" style={{ color:'#4B5563', fontSize:13 }}>← Home</Link>
    </div>
  )

  const q = questions[idx]
  if (!q) return null

  const answeredCount = Object.keys(answers).length
  const errorCount = Object.values(feedback).filter(v => !v).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const timeWarn = timeLeft < 300
  const isAnswered = q.id in answers

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 18px', background:'#0C111D', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, borderBottom:'1px solid #111827' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2 }}>QUIZ · {idx+1}/{TOTAL}</div>
          <div style={{ fontSize:11, color:'#4B5563', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {errorCount >= 3 && (
            <div style={{ background: errorCount >= 4 ? '#450A0A' : '#431407', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, color: errorCount >= 4 ? '#FCA5A5' : '#FED7AA', display:'flex', alignItems:'center', gap:4 }}>
              <XCircle size={11} color={errorCount >= 4 ? '#FCA5A5' : '#FED7AA'}/>
              {errorCount}/4
            </div>
          )}
          <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:900, padding:'6px 13px', borderRadius:10,
            background: timeWarn ? '#450A0A' : '#111827',
            border:`1.5px solid ${timeWarn?'#DC2626':'#1F2937'}`,
            color: timeWarn ? '#F87171' : '#3B82F6' }}>
            {fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress bar sottile */}
      <div style={{ height:3, background:'#111827', flexShrink:0 }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${(answeredCount/TOTAL)*100}%`, transition:'width 0.4s' }}/>
      </div>

      {/* Numeri domande scrollabili */}
      <div style={{ background:'#0C111D', padding:'8px 0', flexShrink:0, borderBottom:'1px solid #111827' }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          <button onClick={() => goTo(Math.max(0,idx-1))} style={{ padding:'0 10px', background:'none', border:'none', cursor:'pointer' }}>
            <ChevronLeft size={16} color={idx > 0 ? '#4B5563' : '#1F2937'}/>
          </button>
          <div ref={numbersRef} style={{ flex:1, display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none' }}>
            <style>{`div::-webkit-scrollbar{display:none}`}</style>
            {questions.map((qq, i) => {
              const done = qq.id in answers
              const ok = feedback[qq.id]
              const cur = i === idx
              return (
                <button key={i} onClick={() => goTo(i)} style={{
                  minWidth:32, height:32, borderRadius:8, border:'none', fontSize:11, fontWeight:800, cursor:'pointer', flexShrink:0, fontFamily:'inherit', transition:'all 0.15s',
                  background: cur ? '#2563EB' : done ? (ok ? '#14532D' : '#450A0A') : '#111827',
                  color: cur ? '#fff' : done ? (ok ? '#4ADE80' : '#F87171') : '#374151',
                  boxShadow: cur ? '0 0 10px rgba(37,99,235,0.5)' : 'none',
                }}>{i+1}</button>
              )
            })}
          </div>
          <button onClick={() => goTo(Math.min(TOTAL-1,idx+1))} style={{ padding:'0 10px', background:'none', border:'none', cursor:'pointer' }}>
            <ChevronRight size={16} color={idx < TOTAL-1 ? '#4B5563' : '#1F2937'}/>
          </button>
        </div>


      </div>

      {/* Domanda */}
      <div style={{ flex:1, padding:'20px 18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Testo domanda */}
        <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:20, padding:'20px 18px' }}>
          <p style={{ fontSize:17, lineHeight:1.75, color:'#F9FAFB', margin:0, fontWeight:500 }}>{q.text}</p>
        </div>

        {/* Feedback mini sotto domanda — solo quando risposta data */}
        {isAnswered && lastFeedback?.show && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background: feedback[q.id] ? '#14532D' : '#450A0A', borderRadius:14, border:`1px solid ${feedback[q.id]?'#166534':'#7F1D1D'}` }}>
            {feedback[q.id]
              ? <CheckCircle2 size={18} color="#4ADE80"/>
              : <XCircle size={18} color="#F87171"/>}
            <span style={{ fontSize:14, fontWeight:700, color: feedback[q.id] ? '#4ADE80' : '#F87171' }}>
              {feedback[q.id] ? 'Corretto!' : `Sbagliato — risposta: ${answers[q.id] ? 'FALSO' : 'VERO'}`}
            </span>
          </div>
        )}

        {/* Bottoni */}
        {!isAnswered ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { val:true, label:'VERO', c:'#4ADE80', border:'#14532D', hover:'#052E16' },
              { val:false, label:'FALSO', c:'#F87171', border:'#7F1D1D', hover:'#450A0A' },
            ].map(({ val, label, c, border, hover }) => (
              <button key={label} onClick={() => handleAnswer(val)}
                style={{ padding:'18px 0', borderRadius:16, border:`1.5px solid ${border}`, background:'#0C111D', color:c, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = hover)}
                onMouseLeave={e => (e.currentTarget.style.background = '#0C111D')}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ padding:'18px 0', borderRadius:16, border:`1.5px solid ${feedback[q.id]?'#14532D':'#1F2937'}`, background: feedback[q.id] ? '#052E16' : '#0C111D', color:'#4ADE80', fontSize:16, fontWeight:900, letterSpacing:2, textAlign:'center', opacity: answers[q.id] === true ? 1 : 0.3 }}>
              VERO
            </div>
            <div style={{ padding:'18px 0', borderRadius:16, border:`1.5px solid ${!feedback[q.id]?'#7F1D1D':'#1F2937'}`, background: !feedback[q.id] ? '#450A0A' : '#0C111D', color:'#F87171', fontSize:16, fontWeight:900, letterSpacing:2, textAlign:'center', opacity: answers[q.id] === false ? 1 : 0.3 }}>
              FALSO
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Deboli</span>
        </Link>
        <button onClick={handleComplete} disabled={submitting}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          <Flag size={20} color={submitting ? '#4B5563' : '#6B7280'}/>
          <span style={{ fontSize:10, color: submitting ? '#4B5563' : '#6B7280', fontWeight:600 }}>
            {submitting ? '...' : 'Termina'}
          </span>
        </button>
      </div>
    </div>
  )
}
