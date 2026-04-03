'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Target, BarChart3, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'

interface Question { id: string; text: string; image: string | null; risposta: boolean }

export default function FocusStudyPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const numbersRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<NodeJS.Timeout | null>(null)

  const [capName, setCapName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [lastResult, setLastResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/capitolo/${code}/questions`)
      .then(r => r.json())
      .then(data => {
        if (!data.questions?.length) { router.push('/focus'); return }
        setCapName(data.capitolo.name)
        setQuestions(data.questions)
        setLoading(false)
      })
      .catch(() => router.push('/focus'))
  }, [code, router])

  useEffect(() => {
    if (numbersRef.current) {
      const btn = numbersRef.current.children[idx] as HTMLElement
      btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [idx])

  const goNext = () => {
    clearTimeout(autoRef.current!)
    setLastResult(null)
    if (idx < questions.length - 1) setIdx(i => i + 1)
  }

  const handleAnswer = (value: boolean) => {
    const q = questions[idx]
    if (q.id in answers) return
    const isCorrect = value === q.risposta
    setAnswers(p => ({ ...p, [q.id]: value }))
    setFeedback(p => ({ ...p, [q.id]: isCorrect }))
    setLastResult(isCorrect)
    if (idx < questions.length - 1) {
      autoRef.current = setTimeout(() => goNext(), isCorrect ? 900 : 1800)
    }
  }

  const goTo = (i: number) => {
    clearTimeout(autoRef.current!)
    setLastResult(null)
    setIdx(i)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const q = questions[idx]
  if (!q) return null

  const answeredCount = Object.keys(answers).length
  const correctCount = Object.values(feedback).filter(v => v).length
  const isAnswered = q.id in answers
  const total = questions.length

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 18px', background: 'var(--header-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '2px solid #C8D498' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent2)', letterSpacing: 2 }}>FOCUS · {idx + 1}/{total}</div>
          <div style={{ fontSize: 12, color: '#4D5057', marginTop: 1 }}>{capName}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text4)' }}>
          {correctCount}/{answeredCount}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '6px 18px 0', background: 'var(--card)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#059669,#059669)', width: `${(answeredCount / total) * 100}%`, transition: 'width 0.4s', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', minWidth: 40, textAlign: 'right' }}>{answeredCount}/{total}</span>
        </div>
      </div>

      {/* Numeri domande */}
      <div style={{ background: 'var(--card)', padding: '8px 0', flexShrink: 0, borderBottom: '1px solid #E2E6EA' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => goTo(Math.max(0, idx - 1))} style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={16} color={idx > 0 ? 'var(--text3)' : 'var(--border)'} />
          </button>
          <div ref={numbersRef} style={{ flex: 1, display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            <style>{`div::-webkit-scrollbar{display:none}`}</style>
            {questions.map((qq, i) => {
              const done = qq.id in answers
              const ok = feedback[qq.id]
              const cur = i === idx
              return (
                <button key={i} onClick={() => goTo(i)} style={{
                  minWidth: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 800,
                  cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.15s',
                  background: cur ? 'var(--accent)' : done ? (ok ? 'var(--green-dim)' : 'var(--red-dim)') : 'var(--surface)',
                  color: cur ? '#fff' : done ? (ok ? 'var(--green)' : 'var(--red)') : 'var(--text4)',
                  boxShadow: cur ? '0 0 10px rgba(37,99,235,0.5)' : 'none',
                }}>{i + 1}</button>
              )
            })}
          </div>
          <button onClick={() => goTo(Math.min(total - 1, idx + 1))} style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight size={16} color={idx < total - 1 ? 'var(--text3)' : 'var(--border)'} />
          </button>
        </div>
      </div>

      {/* Domanda */}
      <div style={{ flex: 1, padding: '18px 18px 0', overflowY: 'auto' }}>
        {q.image && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={`https://www.patentisuperiori.com/img-sign/${q.image}`} alt="Immagine domanda"
              style={{ maxWidth: 180, maxHeight: 140, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 8 }} />
          </div>
        )}
        <p style={{ fontSize: 19, lineHeight: 1.8, color: 'var(--text)', margin: 0, fontWeight: 500 }}>{q.text}</p>
      </div>

      {/* Feedback + Bottoni V/F */}
      <div style={{ padding: '14px 18px', flexShrink: 0 }}>
        <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          {isAnswered && lastResult !== null && (
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              color: lastResult ? 'var(--green)' : 'var(--red)' }}>
              {lastResult ? 'CORRETTO' : `SBAGLIATO · ${answers[q.id] ? 'FALSO' : 'VERO'}`}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { val: true, label: 'VERO', activeColor: 'var(--green)', activeBg: 'var(--green-dim)', activeBorder: 'var(--green)' },
            { val: false, label: 'FALSO', activeColor: 'var(--red)', activeBg: 'var(--red-dim)', activeBorder: 'var(--red)' },
          ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
            const isSelected = isAnswered && answers[q.id] === val
            return (
              <button key={label} onClick={() => !isAnswered && handleAnswer(val)}
                style={{
                  padding: '17px 0', borderRadius: 16, fontSize: 16, fontWeight: 900, letterSpacing: 2,
                  cursor: isAnswered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
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
      <div style={{ background: '#D8E4A8', borderTop: '2px solid #C8D498', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom,8px)' }}>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Home size={19} color="#4B5563" /><span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Home</span>
        </Link>
        <Link href="/focus" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Target size={19} color="#059669" /><span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>Focus</span>
        </Link>
        <Link href="/weak-points" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BookOpen size={19} color="#4B5563" /><span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
