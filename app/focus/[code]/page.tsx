'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Target, BarChart3, BookOpen, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1F2937', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
    <div style={{ height: '100dvh', background: '#030712', color: '#F9FAFB', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 18px', background: '#0C111D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #111827' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', letterSpacing: 2 }}>FOCUS · {idx + 1}/{total}</div>
          <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{capName}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
          {correctCount}/{answeredCount}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '6px 18px 0', background: '#0C111D', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 7, background: '#1F2937', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#2563EB,#06B6D4)', width: `${(answeredCount / total) * 100}%`, transition: 'width 0.4s', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', minWidth: 40, textAlign: 'right' }}>{answeredCount}/{total}</span>
        </div>
      </div>

      {/* Numeri domande */}
      <div style={{ background: '#0C111D', padding: '8px 0', flexShrink: 0, borderBottom: '1px solid #111827' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => goTo(Math.max(0, idx - 1))} style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={16} color={idx > 0 ? '#4B5563' : '#1F2937'} />
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
                  background: cur ? '#2563EB' : done ? (ok ? '#14532D' : '#450A0A') : '#111827',
                  color: cur ? '#fff' : done ? (ok ? '#4ADE80' : '#F87171') : '#374151',
                  boxShadow: cur ? '0 0 10px rgba(37,99,235,0.5)' : 'none',
                }}>{i + 1}</button>
              )
            })}
          </div>
          <button onClick={() => goTo(Math.min(total - 1, idx + 1))} style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight size={16} color={idx < total - 1 ? '#4B5563' : '#1F2937'} />
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
        <p style={{ fontSize: 19, lineHeight: 1.8, color: '#F9FAFB', margin: 0, fontWeight: 500 }}>{q.text}</p>
      </div>

      {/* Feedback + Bottoni V/F */}
      <div style={{ padding: '14px 18px', flexShrink: 0 }}>
        <div style={{ height: 24, display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          {isAnswered && lastResult !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {lastResult ? <CheckCircle2 size={15} color="#4ADE80" /> : <XCircle size={15} color="#F87171" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: lastResult ? '#4ADE80' : '#F87171' }}>
                {lastResult ? 'Corretto!' : `Sbagliato — risposta: ${answers[q.id] ? 'FALSO' : 'VERO'}`}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { val: true, label: 'VERO', activeColor: '#4ADE80', activeBg: '#052E16', activeBorder: '#166534' },
            { val: false, label: 'FALSO', activeColor: '#F87171', activeBg: '#450A0A', activeBorder: '#7F1D1D' },
          ].map(({ val, label, activeColor, activeBg, activeBorder }) => {
            const isSelected = isAnswered && answers[q.id] === val
            return (
              <button key={label} onClick={() => !isAnswered && handleAnswer(val)}
                style={{
                  padding: '17px 0', borderRadius: 16, fontSize: 16, fontWeight: 900, letterSpacing: 2,
                  cursor: isAnswered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: isAnswered ? (isSelected ? activeBg : '#0C111D') : '#0C111D',
                  border: `1.5px solid ${isAnswered ? (isSelected ? activeBorder : '#1F2937') : '#1F2937'}`,
                  color: isAnswered ? (isSelected ? activeColor : '#374151') : (label === 'VERO' ? '#4ADE80' : '#F87171'),
                  opacity: isAnswered && !isSelected ? 0.4 : 1,
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#0C111D', borderTop: '1px solid #111827', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Home size={19} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Home</span>
        </Link>
        <Link href="/focus" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Target size={19} color="#2563EB" /><span style={{ fontSize: 9, color: '#2563EB', fontWeight: 700 }}>Focus</span>
        </Link>
        <Link href="/riepilogo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BarChart3 size={19} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Riepilogo</span>
        </Link>
        <Link href="/weak-points" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BookOpen size={19} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
