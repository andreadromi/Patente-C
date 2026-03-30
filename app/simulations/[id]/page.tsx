'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

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
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [animState, setAnimState] = useState<'idle'|'correct'|'wrong'>('idle')
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
    else setSubmitting(false)
  }, [userSimId, submitting, timeLeft, router])

  const startSimulation = useCallback(async () => {
    const res = await fetch(`/api/simulations/${simulationId}/start`, { method: 'POST' })
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setUserSimId(data.userSimulationId)
    setQuestions(data.questions)
    setLoading(false)
  }, [simulationId, router])

  useEffect(() => { startSimulation() }, [startSimulation])

  useEffect(() => {
    if (loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleComplete(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [loading, handleComplete])

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || answered !== null) return
    const q = questions[currentIdx]
    setAnswered(value)
    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(prev => ({ ...prev, [q.id]: value }))
    setFeedback(prev => ({ ...prev, [q.id]: data.isCorrect }))
    setAnimState(data.isCorrect ? 'correct' : 'wrong')
    setTimeout(() => setAnimState('idle'), 600)
  }

  const goNext = () => {
    setAnswered(null)
    if (currentIdx < TOTAL - 1) setCurrentIdx(i => i + 1)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Preparazione simulazione...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const q = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const errorCount = Object.values(feedback).filter(v => !v).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const currentFeedback = feedback[q?.id]
  const timeWarning = timeLeft < 300
  const criticalErrors = errorCount >= 4

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#3B82F6' }}>PATENTE C</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{q?.capitolo?.substring(0, 28)}</div>
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 20, fontWeight: 900,
            padding: '6px 14px', borderRadius: 10,
            background: timeWarning ? '#2D0A0A' : 'var(--bg)',
            border: `2px solid ${timeWarning ? 'var(--red)' : 'var(--border)'}`,
            color: timeWarning ? 'var(--red)' : '#3B82F6',
            animation: timeWarning ? 'pulse 1s infinite' : 'none',
          }}>
            {fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Errori critici banner */}
      {criticalErrors && (
        <div style={{ background: '#7F1D1D', padding: '8px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>
          ⚠️ {errorCount === 4 ? 'Hai raggiunto il limite — un altro errore e sei fuori!' : `${errorCount} errori — sei fuori!`}
        </div>
      )}
      {errorCount === 3 && !criticalErrors && (
        <div style={{ background: '#78350F', padding: '8px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FCD34D' }}>
          ⚡ Attenzione: 3 errori su 4 massimi
        </div>
      )}

      {/* Progress */}
      <div style={{ background: 'var(--bg-card)', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.4s', background: 'linear-gradient(90deg, #2563EB, #06B6D4)', width: `${(answeredCount / TOTAL) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#10B981', fontWeight: 700 }}>✓ {correctCount}</span>
            <span style={{ color: 'var(--muted)' }}>{answeredCount}/{TOTAL} risposte</span>
            <span style={{ color: errorCount >= 3 ? 'var(--red)' : '#EF4444', fontWeight: errorCount >= 3 ? 800 : 400 }}>✗ {errorCount}</span>
          </div>
        </div>
      </div>

      {/* Domanda */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${animState === 'correct' ? '#10B981' : animState === 'wrong' ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 20,
            padding: '20px 18px',
            marginBottom: 14,
            transition: 'border-color 0.3s',
          }} className={animState === 'wrong' ? 'animate-shake' : animState === 'correct' ? 'animate-pop' : ''}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#3B82F6', textTransform: 'uppercase', marginBottom: 10 }}>
              Domanda {currentIdx + 1} di {TOTAL}
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--text)', margin: 0, fontWeight: 500 }}>
              {q?.text}
            </p>
          </div>

          {/* Bottoni V/F */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { value: true, label: 'VERO', emoji: '✓' },
              { value: false, label: 'FALSO', emoji: '✗' },
            ].map(({ value, label, emoji }) => {
              const isSelected = answered === value
              const isCorrectAnswer = answered !== null && value === (currentFeedback !== undefined ? !currentFeedback === !value : null)
              let bg = 'var(--bg-card)'
              let border = value ? '#10B981' : '#EF4444'
              let color = value ? '#10B981' : '#EF4444'
              let opacity = 1

              if (answered !== null) {
                if (isSelected && currentFeedback) { bg = 'var(--green-bg)'; border = '#10B981'; color = '#10B981' }
                else if (isSelected && !currentFeedback) { bg = 'var(--red-bg)'; border = 'var(--red)'; color = 'var(--red)' }
                else { opacity = 0.3 }
              }

              return (
                <button key={label}
                  onClick={() => handleAnswer(value)}
                  disabled={answered !== null}
                  style={{
                    padding: '16px 0', borderRadius: 14, border: `2px solid ${border}`,
                    background: bg, color, fontSize: 15, fontWeight: 900,
                    letterSpacing: 2, cursor: answered !== null ? 'default' : 'pointer',
                    transition: 'all 0.2s', opacity, fontFamily: 'inherit',
                    boxShadow: answered === null ? `0 0 0 0 transparent` : 'none',
                  }}
                  onMouseEnter={e => { if (answered === null) (e.target as HTMLElement).style.boxShadow = `0 0 16px ${value ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.boxShadow = 'none' }}
                >
                  {isSelected && (currentFeedback ? '✓ ' : '✗ ')}{label}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {answered !== null && (
            <div style={{
              borderRadius: 14, border: `1px solid ${currentFeedback ? '#10B981' : 'var(--red)'}`,
              background: currentFeedback ? 'var(--green-bg)' : 'var(--red-bg)',
              padding: '12px 16px', marginBottom: 14,
            }} className="animate-slide-up">
              <p style={{ color: currentFeedback ? '#10B981' : 'var(--red)', fontWeight: 800, fontSize: 14, margin: 0 }}>
                {currentFeedback
                  ? '✓ Risposta corretta!'
                  : `✗ Sbagliato — la risposta è ${answers[q?.id] === true ? 'FALSO' : 'VERO'}`}
              </p>
            </div>
          )}

          {/* Navigazione */}
          {answered !== null && currentIdx < TOTAL - 1 && (
            <button onClick={goNext} style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)', fontFamily: 'inherit',
              marginBottom: 14,
            }}>
              Avanti →
            </button>
          )}

          {(answeredCount === TOTAL || (answered !== null && currentIdx === TOTAL - 1)) && (
            <button onClick={handleComplete} disabled={submitting} style={{
              width: '100%', padding: '14px 0',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontFamily: 'inherit',
              opacity: submitting ? 0.6 : 1, marginBottom: 16,
            }}>
              {submitting ? 'Calcolo risultati...' : '✓ Termina e vedi risultati'}
            </button>
          )}

          {/* Griglia navigazione */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {questions.map((_, i) => {
              const qId = questions[i]?.id
              const isAns = qId in answers
              const isCur = i === currentIdx
              return (
                <button key={i}
                  onClick={() => { setAnswered(null); setCurrentIdx(i) }}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: isCur ? '#2563EB' : isAns ? (feedback[qId] ? '#022C22' : '#2D0A0A') : 'var(--bg-card)',
                    color: isCur ? '#fff' : isAns ? (feedback[qId] ? '#10B981' : 'var(--red)') : 'var(--muted)',
                    border: `1px solid ${isCur ? '#2563EB' : isAns ? (feedback[qId] ? '#10B981' : 'var(--red)') : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  )
}
