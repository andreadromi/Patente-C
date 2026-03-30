'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react'

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
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [showMenu, setShowMenu] = useState(false)
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

  // Scroll numeri al corrente
  useEffect(() => {
    if (numbersRef.current) {
      const btn = numbersRef.current.children[idx] as HTMLElement
      btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [idx])

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const goNext = useCallback(() => {
    setAnswered(null)
    if (idx < TOTAL - 1) setIdx(i => i + 1)
  }, [idx])

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || answered !== null) return
    const q = questions[idx]
    setAnswered(value)
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(p => ({ ...p, [q.id]: value }))
    setFeedback(p => ({ ...p, [q.id]: data.isCorrect }))

    // Auto-avanza se corretto dopo 1.2s
    if (data.isCorrect && idx < TOTAL - 1) {
      autoRef.current = setTimeout(() => goNext(), 1200)
    }
  }

  const goTo = (i: number) => {
    clearTimeout(autoRef.current!)
    setAnswered(questions[i]?.id in answers ? answers[questions[i].id] : null)
    setIdx(i)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
      <div style={{ width:40, height:40, border:'3px solid #1E2D4A', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <p style={{ color:'#475569', fontSize:13, fontFamily:'system-ui' }}>Caricamento simulazione...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, fontFamily:'system-ui' }}>
      <AlertTriangle size={48} color="#EF4444"/>
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
    <div style={{ height:'100dvh', background:'#020817', color:'#F1F5F9', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', background:'#0A0F1C', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C · {idx+1}/{TOTAL}</div>
          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {errorCount >= 3 && (
            <div style={{ background: errorCount >= 4 ? '#7F1D1D' : '#78350F', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, color: errorCount >= 4 ? '#FCA5A5' : '#FCD34D' }}>
              {errorCount >= 4 ? '⛔ Fuori!' : `⚠️ ${errorCount}/4`}
            </div>
          )}
          <div style={{ fontFamily:'monospace', fontSize:19, fontWeight:900, padding:'6px 12px', borderRadius:10, background: timeWarn ? '#2D0A0A' : '#0D1424', border:`1.5px solid ${timeWarn?'#EF4444':'#1E2D4A'}`, color: timeWarn ? '#EF4444' : '#3B82F6' }}>
            {fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Numeri domande — scroll orizzontale, occupa tutta la larghezza */}
      <div style={{ background:'#0A0F1C', borderBottom:'1px solid #0D1424', padding:'8px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          <button onClick={() => setIdx(i => Math.max(0, i-1))}
            style={{ padding:'0 10px', background:'none', border:'none', color:'#1E2D4A', cursor:'pointer', flexShrink:0 }}>
            <ChevronLeft size={18} color={idx > 0 ? '#475569' : '#1E2D4A'}/>
          </button>
          <div ref={numbersRef} style={{ flex:1, display:'flex', gap:5, overflowX:'auto', scrollbarWidth:'none', padding:'0 2px' }}>
            <style>{`.nums::-webkit-scrollbar{display:none}`}</style>
            {questions.map((qq, i) => {
              const isDone = qq.id in answers
              const isOk = feedback[qq.id]
              const isCur = i === idx
              return (
                <button key={i} onClick={() => goTo(i)} style={{
                  minWidth:34, height:34, borderRadius:9, border:'none', fontSize:11, fontWeight:800, cursor:'pointer', flexShrink:0,
                  background: isCur ? '#2563EB' : isDone ? (isOk ? '#022C22' : '#3D0A0A') : '#0D1424',
                  color: isCur ? '#fff' : isDone ? (isOk ? '#10B981' : '#EF4444') : '#2D3748',
                  boxShadow: isCur ? '0 0 12px rgba(37,99,235,0.7)' : 'none',
                  fontFamily:'inherit', transition:'all 0.15s'
                }}>{i+1}</button>
              )
            })}
          </div>
          <button onClick={() => setIdx(i => Math.min(TOTAL-1, i+1))}
            style={{ padding:'0 10px', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
            <ChevronRight size={18} color={idx < TOTAL-1 ? '#475569' : '#1E2D4A'}/>
          </button>
        </div>
        {/* Stats mini */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, fontSize:11, marginTop:4 }}>
          <span style={{ color:'#10B981', fontWeight:700 }}>✓ {correctCount}</span>
          <span style={{ color:'#2D3748' }}>{answeredCount}/{TOTAL}</span>
          <span style={{ color: errorCount >= 3 ? '#EF4444' : '#2D3748', fontWeight: errorCount >= 3 ? 700 : 400 }}>✗ {errorCount}</span>
        </div>
      </div>

      {/* Domanda */}
      <div style={{ flex:1, padding:'16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'#0D1424', borderRadius:18, padding:'18px 16px' }}>
          <p style={{ fontSize:16, lineHeight:1.7, color:'#F1F5F9', margin:0, fontWeight:500 }}>{q.text}</p>
        </div>

        {!isAns ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { val:true, label:'VERO', c:'#10B981', hover:'#022C22' },
              { val:false, label:'FALSO', c:'#EF4444', hover:'#2D0A0A' },
            ].map(({ val, label, c, hover }) => (
              <button key={label} onClick={() => handleAnswer(val)}
                style={{ padding:'18px 0', borderRadius:16, border:`2px solid ${c}22`, background:'#0D1424', color:c, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = hover)}
                onMouseLeave={e => (e.currentTarget.style.background = '#0D1424')}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ background: isCorrect ? '#022C22' : '#2D0A0A', border:`1px solid ${isCorrect?'#10B981':'#EF4444'}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
              {isCorrect
                ? <CheckCircle2 size={20} color="#10B981"/>
                : <XCircle size={20} color="#EF4444"/>}
              <span style={{ color: isCorrect ? '#10B981' : '#EF4444', fontWeight:800, fontSize:14 }}>
                {isCorrect ? 'Risposta corretta!' : `Sbagliato — risposta: ${answers[q.id] ? 'FALSO' : 'VERO'}`}
              </span>
            </div>
            {!isCorrect && idx < TOTAL - 1 && (
              <button onClick={goNext} style={{ padding:'14px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                Avanti →
              </button>
            )}
            {isCorrect && idx < TOTAL - 1 && (
              <div style={{ textAlign:'center', fontSize:12, color:'#2D3748' }}>Avanzamento automatico...</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav — stile app mobile */}
      <div style={{ background:'#0A0F1C', borderTop:'1px solid #0D1424', display:'flex', flexShrink:0 }}>
        <Link href="/dashboard" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#475569"/>
          <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/weak-points" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#475569"/>
          <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>Deboli</span>
        </Link>
        <button
          onClick={handleComplete}
          disabled={submitting}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          <Flag size={20} color={answeredCount === TOTAL ? '#10B981' : '#475569'}/>
          <span style={{ fontSize:10, color: answeredCount === TOTAL ? '#10B981' : '#475569', fontWeight:600 }}>
            {submitting ? '...' : `Termina`}
          </span>
        </button>
      </div>
    </div>
  )
}
