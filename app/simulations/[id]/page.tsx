'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Question {
  id: string
  text: string
  capitolo: string
  capitoloCode: string
}

const TOTAL = 40
const TIME_LIMIT = 40 * 60 // 40 minuti

export default function SimulationPage() {
  const router = useRouter()
  const params = useParams()
  const simulationId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [userSimId, setUserSimId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [answered, setAnswered] = useState<boolean | null>(null) // risposta appena data
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startSimulation = useCallback(async () => {
    const res = await fetch(`/api/simulations/${simulationId}/start`, { method: 'POST' })
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setUserSimId(data.userSimulationId)
    setQuestions(data.questions)
    setLoading(false)
  }, [simulationId, router])

  useEffect(() => { startSimulation() }, [startSimulation])

  // Timer countdown
  useEffect(() => {
    if (loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleComplete(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [loading])

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleAnswer = async (value: boolean) => {
    if (!userSimId || answered !== null) return
    const q = questions[currentIdx]
    setAnswered(value)

    const res = await fetch(`/api/user-simulations/${userSimId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, userAnswer: value })
    })
    const data = await res.json()
    setAnswers(prev => ({ ...prev, [q.id]: value }))
    setFeedback(prev => ({ ...prev, [q.id]: data.isCorrect }))
  }

  const goNext = () => {
    setAnswered(null)
    if (currentIdx < TOTAL - 1) setCurrentIdx(i => i + 1)
  }

  const handleComplete = async () => {
    if (!userSimId || submitting) return
    setSubmitting(true)
    clearInterval(timerRef.current!)
    const timeElapsed = TIME_LIMIT - timeLeft
    const res = await fetch(`/api/user-simulations/${userSimId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeElapsed })
    })
    if (res.ok) router.push(`/user-simulations/${userSimId}/report`)
    else setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Caricamento simulazione...</p>
      </div>
    </div>
  )

  const q = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const correctCount = Object.values(feedback).filter(v => v === true).length
  const errorCount = Object.values(feedback).filter(v => v === false).length
  const currentFeedback = feedback[q?.id]
  const timeWarning = timeLeft < 300

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="bg-amber-500 text-black text-xs font-black px-2 py-1 rounded tracking-widest">PATENTE C</span>
            <div className="text-xs text-gray-400 mt-1">Simulazione #{questions.length > 0 ? simulationId.slice(-4) : '...'}</div>
          </div>
          <div className={`font-mono text-xl font-bold px-4 py-2 rounded-lg border ${timeWarning ? 'text-red-400 border-red-800 bg-red-950' : 'text-amber-400 border-gray-700 bg-gray-800'}`}>
            {fmtTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 px-4 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / TOTAL) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="text-green-400">✓ {correctCount}</span>
            <span className="text-gray-400">{answeredCount}/{TOTAL} risposte</span>
            <span className="text-red-400">✗ {errorCount}</span>
          </div>
        </div>
      </div>

      {/* Domanda */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
            <div className="text-amber-500 text-xs tracking-widest font-bold mb-3 uppercase">
              Domanda {currentIdx + 1} · {q?.capitolo}
            </div>
            <p className="text-base leading-relaxed text-gray-100" style={{ fontFamily: 'Georgia, serif' }}>
              {q?.text}
            </p>
          </div>

          {/* Bottoni V/F */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { value: true, label: 'VERO', color: 'green' },
              { value: false, label: 'FALSO', color: 'red' },
            ].map(({ value, label, color }) => {
              const isSelected = answered === value
              const isCorrectAnswer = currentFeedback !== undefined && value === questions.find(qq => qq.id === q?.id) // unused
              let cls = `flex-1 py-4 rounded-xl border-2 font-black text-sm tracking-widest transition-all `
              if (answered === null) {
                cls += color === 'green'
                  ? 'border-green-600 text-green-400 bg-gray-900 hover:bg-green-950'
                  : 'border-red-600 text-red-400 bg-gray-900 hover:bg-red-950'
              } else if (isSelected) {
                cls += currentFeedback
                  ? 'border-green-500 text-green-300 bg-green-950'
                  : 'border-red-500 text-red-300 bg-red-950'
              } else {
                cls += 'border-gray-800 text-gray-600 bg-gray-900 opacity-40'
              }
              return (
                <button key={label} className={cls}
                  onClick={() => handleAnswer(value)}
                  disabled={answered !== null}>
                  {answered !== null && isSelected && (currentFeedback ? '✓ ' : '✗ ')}
                  {label}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {answered !== null && (
            <div className={`rounded-xl border p-4 mb-4 ${currentFeedback ? 'bg-green-950 border-green-700' : 'bg-red-950 border-red-700'}`}>
              <p className={`font-bold text-sm ${currentFeedback ? 'text-green-400' : 'text-red-400'}`}>
                {currentFeedback ? '✓ Risposta corretta!' : `✗ Sbagliato — la risposta è ${answers[q?.id] === true ? 'FALSO' : 'VERO'}`}
              </p>
            </div>
          )}

          {/* Navigazione */}
          <div className="flex gap-3">
            {answered !== null && currentIdx < TOTAL - 1 && (
              <button onClick={goNext}
                className="flex-1 py-3 bg-amber-500 text-black font-black rounded-xl text-sm tracking-wide">
                Avanti →
              </button>
            )}
            {(answeredCount === TOTAL || (answered !== null && currentIdx === TOTAL - 1)) && (
              <button onClick={handleComplete} disabled={submitting}
                className="flex-1 py-3 bg-green-600 text-white font-black rounded-xl text-sm tracking-wide disabled:opacity-50">
                {submitting ? 'Calcolo...' : '✓ Termina e vedi risultati'}
              </button>
            )}
          </div>

          {/* Navigazione rapida domande */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {questions.map((_, i) => {
              const qId = questions[i]?.id
              const isAnswered = qId in answers
              const isCurrent = i === currentIdx
              return (
                <button key={i}
                  onClick={() => { setAnswered(null); setCurrentIdx(i) }}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                    isCurrent ? 'bg-amber-500 text-black' :
                    isAnswered ? (feedback[qId] ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300') :
                    'bg-gray-800 text-gray-500'
                  }`}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
