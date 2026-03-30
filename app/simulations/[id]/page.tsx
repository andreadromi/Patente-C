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

  const [questions, setQuestions] = useState<Question[]>([])
  const [userSimId, setUserSimId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [showCorrect, setShowCorrect] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleComplete = useCallback(async () => {
    if (!userSimId || submitting) return
    setSubmitting(true)
    clearInterval(timerRef.current!)
    const timeElapsed = TIME_LIMIT - timeLeft
    const res = await fetch(`/api/user-simulations/${userSimId}/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeElapsed })
    })
    if (res.ok) router.push(`/user-simulations/${userSimId}/report`)
    else {
      const data = await res.json()
      setError(data.error || 'Errore nel completare la simulazione')
      setSubmitting(false)
    }
  }, [userSimId, submitting, timeLeft, router])

  const startSimulation = useCallback(async () => {
    try {
      const res = await fetch(`/api/simulations/${simulationId}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Errore ${res.status}`)
        setLoading(false)
        return
      }
      setUserSimId(data.userSimulationId)
      setQuestions(data.questions || [])
      // Ripristina risposte esistenti
      if (data.existingAnswers) {
        const ans: Record<string, boolean> = {}
        const fb: Record<string, boolean> = {}
        Object.entries(data.existingAnswers).forEach(([qid, a]: any) => {
          if (a.userAnswer !== null && a.userAnswer !== undefined) {
            ans[qid] = a.userAnswer
            fb[qid] = a.isCorrect
          }
        })
        setAnswers(ans)
        setFeedback(fb)
        // Vai alla prima domanda non risposta
        const firstUnanswered = (data.questions || []).findIndex((q: Question) => !(q.id in ans))
        if (firstUnanswered > 0) setCurrentIdx(firstUnanswered)
      }
      setLoading(false)
    } catch (e: any) {
      setError('Errore di connessione: ' + e.message)
      setLoading(false)
    }
  }, [simulationId])

  useEffect(() => { startSimulation() }, [startSimulation])

  useEffect(() => {
    if (loading || error) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleComplete(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [loading, error, handleComplete])

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || answered !== null) return
    const q = questions[currentIdx]
    setAnswered(value)
    setShowCorrect(false)
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(prev => ({ ...prev, [q.id]: value }))
    setFeedback(prev => ({ ...prev, [q.id]: data.isCorrect }))
    setShowCorrect(true)
  }

  const goNext = () => {
    setAnswered(null)
    setShowCorrect(false)
    if (currentIdx < TOTAL - 1) setCurrentIdx(i => i + 1)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:44, height:44, border:'3px solid var(--border)', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'var(--muted)', fontSize:14 }}>Caricamento simulazione...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, gap:16 }}>
      <div style={{ fontSize:48 }}>⚠️</div>
      <h2 style={{ color:'var(--red)', fontWeight:800, margin:0 }}>Errore</h2>
      <p style={{ color:'var(--muted)', fontSize:14, textAlign:'center', maxWidth:300 }}>{error}</p>
      <button onClick={() => { setError(null); setLoading(true); startSimulation() }}
        style={{ padding:'12px 24px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
        Riprova
      </button>
      <Link href="/dashboard" style={{ color:'var(--muted)', fontSize:13 }}>← Torna alla dashboard</Link>
    </div>
  )

  const q = questions[currentIdx]
  if (!q) return null

  const answeredCount = Object.keys(answers).length
  const errorCount = Object.values(feedback).filter(v => !v).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const isAnswered = q.id in answers
  const currentIsCorrect = feedback[q.id]
  const timeWarning = timeLeft < 300

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'12px 16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:'#3B82F6' }}>PATENTE C · {currentIdx+1}/{TOTAL}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:1, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.capitolo}</div>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:900, padding:'6px 12px', borderRadius:10,
            background: timeWarning ? 'var(--red-bg)' : 'var(--bg)',
            border:`2px solid ${timeWarning ? 'var(--red)' : 'var(--border)'}`,
            color: timeWarning ? 'var(--red)' : '#3B82F6',
          }}>
            {fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Barra errori */}
      {errorCount >= 3 && (
        <div style={{ background: errorCount >= 4 ? '#7F1D1D' : '#78350F', padding:'8px 16px', textAlign:'center', fontSize:13, fontWeight:700, color: errorCount >= 4 ? '#FCA5A5' : '#FCD34D' }}>
          {errorCount >= 5 ? '❌ Simulazione fallita' : errorCount === 4 ? '⚠️ Limite raggiunto! Prossimo errore = bocciato' : '⚡ 3 errori — stai attento!'}
        </div>
      )}

      {/* Progress */}
      <div style={{ background:'var(--bg-card)', padding:'8px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ height:6, background:'var(--bg)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
            <div style={{ height:'100%', borderRadius:3, transition:'width 0.3s', background:'linear-gradient(90deg, #2563EB, #06B6D4)', width:`${(answeredCount/TOTAL)*100}%` }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
            <span style={{ color:'#10B981', fontWeight:700 }}>✓ {correctCount}</span>
            <span style={{ color:'var(--muted)' }}>{answeredCount}/{TOTAL}</span>
            <span style={{ color: errorCount >= 4 ? 'var(--red)' : '#EF4444', fontWeight: errorCount >= 3 ? 800 : 400 }}>✗ {errorCount}</span>
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ flex:1, padding:'16px', overflowY:'auto' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>

          {/* Domanda */}
          <div style={{ background:'var(--bg-card)', border:`1px solid ${isAnswered ? (currentIsCorrect ? '#10B98133' : '#EF444433') : 'var(--border)'}`, borderRadius:20, padding:'20px 18px', marginBottom:14, transition:'border-color 0.3s' }}>
            <p style={{ fontSize:16, lineHeight:1.7, color:'var(--text)', margin:0, fontWeight:500 }}>
              {q.text}
            </p>
          </div>

          {/* Bottoni V/F */}
          {!isAnswered ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                { value: true, label: 'VERO', color: '#10B981', darkBg: '#022C22', border: '#10B981' },
                { value: false, label: 'FALSO', color: '#EF4444', darkBg: '#2D0A0A', border: '#EF4444' },
              ].map(({ value, label, color, darkBg, border }) => (
                <button key={label} onClick={() => handleAnswer(value)}
                  style={{ padding:'18px 0', borderRadius:16, border:`2px solid ${border}33`,
                    background:'var(--bg-card)', color, fontSize:16, fontWeight:900,
                    letterSpacing:2, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = darkBg; (e.currentTarget as HTMLButtonElement).style.borderColor = border }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.borderColor = border+'33' }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom:14 }}>
              {/* Mostra risposta data */}
              <div style={{ background: currentIsCorrect ? 'var(--green-bg)' : 'var(--red-bg)', border:`1px solid ${currentIsCorrect ? '#10B981' : '#EF4444'}`, borderRadius:16, padding:'14px 18px', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{currentIsCorrect ? '✓' : '✗'}</span>
                  <span style={{ color: currentIsCorrect ? '#10B981' : '#EF4444', fontWeight:800, fontSize:15 }}>
                    {currentIsCorrect ? 'Risposta corretta!' : `Sbagliato — la risposta è ${answers[q.id] === true ? 'FALSO' : 'VERO'}`}
                  </span>
                </div>
              </div>
              {currentIdx < TOTAL - 1 && (
                <button onClick={goNext} style={{ width:'100%', padding:'14px 0', background:'linear-gradient(135deg, #2563EB, #1D4ED8)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(37,99,235,0.4)', fontFamily:'inherit' }}>
                  Avanti →
                </button>
              )}
              {(answeredCount === TOTAL || currentIdx === TOTAL - 1) && (
                <button onClick={handleComplete} disabled={submitting} style={{ width:'100%', padding:'14px 0', background:'linear-gradient(135deg, #10B981, #059669)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:submitting?'not-allowed':'pointer', boxShadow:'0 4px 16px rgba(16,185,129,0.3)', fontFamily:'inherit', opacity:submitting?0.6:1, marginTop:8 }}>
                  {submitting ? 'Calcolo...' : '✓ Termina e vedi risultati'}
                </button>
              )}
            </div>
          )}

          {/* Griglia navigazione */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {questions.map((qq, i) => {
              const isAns = qq.id in answers
              const isCur = i === currentIdx
              return (
                <button key={i} onClick={() => { setAnswered(isAns ? answers[qq.id] : null); setCurrentIdx(i) }}
                  style={{ width:30, height:30, borderRadius:8, border:'none', fontSize:10, fontWeight:800, cursor:'pointer', transition:'all 0.1s', fontFamily:'inherit',
                    background: isCur ? '#2563EB' : isAns ? (feedback[qq.id] ? '#022C22' : '#2D0A0A') : 'var(--bg-card)',
                    color: isCur ? '#fff' : isAns ? (feedback[qq.id] ? '#10B981' : '#EF4444') : 'var(--muted)',
                    boxShadow: isCur ? '0 2px 8px rgba(37,99,235,0.5)' : 'none',
                  }}>
                  {i+1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
