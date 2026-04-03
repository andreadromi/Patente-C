'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, Flag, BarChart3, ChevronLeft, ChevronRight, CheckCircle2, XCircle , Target } from 'lucide-react'

interface Question { id: string; text: string; image: string | null; capitolo: string }
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
  const [lastResult, setLastResult] = useState<boolean | null>(null)
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
    setLastResult(null)
    if (idx < TOTAL - 1) setIdx(i => i + 1)
  }, [idx])

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || q.id in answers) return
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(p => ({ ...p, [q.id]: value }))
    setFeedback(p => ({ ...p, [q.id]: data.isCorrect }))
    setLastResult(data.isCorrect)
    if (idx < TOTAL - 1) {
      autoRef.current = setTimeout(() => goNext(), data.isCorrect ? 900 : 1800)
    }
  }

  const goTo = (i: number) => {
    clearTimeout(autoRef.current!)
    setLastResult(null)
    setIdx(i)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, fontFamily:'system-ui' }}>
      <div style={{ width:40, height:40, border:'3px solid #1F2937', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <p style={{ color:'var(--text3)', fontSize:13 }}>Caricamento...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, fontFamily:'system-ui' }}>
      <XCircle size={48} color="#EF4444"/>
      <p style={{ color:'var(--text)', fontWeight:800, margin:0, fontSize:20 }}>Errore</p>
      <p style={{ color:'var(--text2)', fontSize:14, textAlign:'center', maxWidth:280 }}>{error}</p>
      <button onClick={() => { setError(null); setLoading(true); startSimulation() }}
        style={{ padding:'12px 28px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Riprova</button>
      <Link href="/dashboard" style={{ color:'var(--text3)', fontSize:13 }}>← Home</Link>
    </div>
  )

  const q = questions[idx]
  if (!q) return null

  const answeredCount = Object.keys(answers).length
  const errorCount = Object.values(feedback).filter(v => !v).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const isAnswered = q.id in answers
  const isCorrect = feedback[q.id]
  const timeWarn = timeLeft < 300

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', background:'var(--header-bg)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--accent2)', letterSpacing:2 }}>QUIZ · {idx+1}/{TOTAL}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ color:'var(--green)' }}>{correctCount}</span>
            <span style={{ color:'var(--text4)' }}>/</span>
            <span style={{ color: errorCount > 4 ? 'var(--red)' : 'var(--text3)' }}>{errorCount}</span>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:900, padding:'5px 11px', borderRadius:10,
            background: timeWarn ? 'var(--red-dim)' : 'var(--surface)',
            border:`1.5px solid ${timeWarn?'var(--red)':'var(--border)'}`,
            color: timeWarn ? 'var(--red)' : 'var(--accent2)' }}>
            {fmtTime(timeLeft)}
          </div>
          <Link href="/dashboard" style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, textDecoration:'none' }}>
            <Flag size={13} color="var(--text3)"/>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding:'6px 18px 0', background:'var(--card)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, height:7, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,var(--accent),var(--accent2))', width:`${(answeredCount/TOTAL)*100}%`, transition:'width 0.4s', borderRadius:4 }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--text4)', minWidth:32, textAlign:'right' }}>{answeredCount}/{TOTAL}</span>
        </div>
      </div>

      {/* Numeri domande */}
      <div style={{ background:'var(--card)', padding:'8px 0', flexShrink:0, borderBottom:'1px solid #111827' }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          <button onClick={() => goTo(Math.max(0,idx-1))} style={{ padding:'0 10px', background:'none', border:'none', cursor:'pointer' }}>
            <ChevronLeft size={16} color={idx > 0 ? 'var(--text3)' : 'var(--border)'}/>
          </button>
          <div ref={numbersRef} style={{ flex:1, display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none' }}>
            <style>{`div::-webkit-scrollbar{display:none}`}</style>
            {questions.map((qq, i) => {
              const done = qq.id in answers
              const ok = feedback[qq.id]
              const cur = i === idx
              return (
                <button key={i} onClick={() => goTo(i)} style={{
                  minWidth:36, height:36, borderRadius:9, border:'none', fontSize:12, fontWeight:800,
                  cursor:'pointer', flexShrink:0, fontFamily:'inherit', transition:'all 0.15s',
                  background: cur ? 'var(--accent)' : done ? (ok ? 'var(--green-dim)' : 'var(--red-dim)') : 'var(--surface)',
                  color: cur ? '#fff' : done ? (ok ? 'var(--green)' : 'var(--red)') : 'var(--text4)',
                  boxShadow: cur ? '0 0 10px rgba(37,99,235,0.5)' : 'none',
                }}>{i+1}</button>
              )
            })}
          </div>
          <button onClick={() => goTo(Math.min(TOTAL-1,idx+1))} style={{ padding:'0 10px', background:'none', border:'none', cursor:'pointer' }}>
            <ChevronRight size={16} color={idx < TOTAL-1 ? 'var(--text3)' : 'var(--border)'}/>
          </button>
        </div>
      </div>

      {/* Domanda — scrollabile */}
      <div style={{ flex:1, padding:'18px 18px 0', overflowY:'auto' }}>
        {q.image && (
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <img
              src={`https://www.patentisuperiori.com/img-sign/${q.image}`}
              alt="Immagine domanda"
              style={{ maxWidth:180, maxHeight:140, objectFit:'contain', borderRadius:8, background:'#fff', padding:8 }}
            />
          </div>
        )}
        <p style={{ fontSize:19, lineHeight:1.8, color:'var(--text)', margin:0, fontWeight:500 }}>{q.text}</p>
      </div>

      {/* Zona fissa bottoni — sempre nella stessa posizione */}
      <div style={{ padding:'14px 18px', flexShrink:0 }}>

        {/* Feedback — grande, stampatello */}
        <div style={{ height:32, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
          {isAnswered && lastResult !== null && (
            <span style={{ fontSize:18, fontWeight:900, letterSpacing:2, textTransform:'uppercase',
              color: lastResult ? 'var(--green)' : 'var(--red)' }}>
              {lastResult ? 'CORRETTO' : `SBAGLIATO · ${answers[q.id] ? 'FALSO' : 'VERO'}`}
            </span>
          )}
        </div>

        {/* Bottoni VERO / FALSO */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { val:true, label:'VERO', activeColor:'var(--green)', activeBg:'var(--green-dim)', activeBorder:'var(--green)' },
            { val:false, label:'FALSO', activeColor:'var(--red)', activeBg:'var(--red-dim)', activeBorder:'var(--red)' },
          ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
            const isSelected = isAnswered && answers[q.id] === val
            const isRight = isAnswered && isCorrect === (val === answers[q.id] ? isCorrect : !isCorrect)

            return (
              <button key={label} onClick={() => !isAnswered && handleAnswer(val)}
                style={{
                  padding:'17px 0', borderRadius:16, fontSize:16, fontWeight:900, letterSpacing:2,
                  cursor: isAnswered ? 'default' : 'pointer', fontFamily:'inherit', transition:'all 0.2s',
                  background: isAnswered ? (isSelected ? activeBg : 'var(--card)') : 'var(--card)',
                  border: `1.5px solid ${isAnswered ? (isSelected ? activeBorder : 'var(--border)') : 'var(--border)'}`,
                  color: isAnswered ? (isSelected ? activeColor : 'var(--text4)') : (label === 'VERO' ? 'var(--green)' : 'var(--red)'),
                  opacity: isAnswered && !isSelected ? 0.4 : 1,
                }}>
                {label}
              </button>
            )
          })}
        </div>


      </div>

      {/* Bottom nav */}
      <div style={{ background:'var(--card)', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom,8px)' }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={19} color="#4B5563"/><span style={{ fontSize:9, color:'var(--text3)', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/focus" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Target size={19} color="#4B5563"/><span style={{ fontSize:9, color:'var(--text3)', fontWeight:600 }}>Focus</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={19} color="#4B5563"/><span style={{ fontSize:9, color:'var(--text3)', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
