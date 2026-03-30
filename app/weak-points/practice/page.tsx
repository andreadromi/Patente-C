'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WPQuestion {
  weakPointId: string
  questionId: string
  text: string
  capitolo: string
  consecutiveCorrect: number
  totalAttempts: number
}

export default function WPPracticePage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WPQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: boolean; removed: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [correct, setCorrect] = useState(0)
  const [removed, setRemoved] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/weak-points/start', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (!data.questions?.length) { router.push('/weak-points'); return }
        setQuestions(data.questions)
        setLoading(false)
      })
  }, [router])

  const handleAnswer = async (value: boolean) => {
    if (answered !== null) return
    const q = questions[idx]
    setAnswered(value)

    const res = await fetch('/api/weak-points/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.questionId, userAnswer: value })
    })
    const data = await res.json()
    setFeedback(data)
    if (data.isCorrect) setCorrect(c => c + 1)
    if (data.removed) setRemoved(r => r + 1)
  }

  const goNext = () => {
    setAnswered(null)
    setFeedback(null)
    if (idx + 1 >= questions.length) setDone(true)
    else setIdx(i => i + 1)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-2xl font-black text-amber-400 mb-2">Sessione completata!</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Risposte corrette</span>
            <span className="text-green-400 font-bold">{correct}/{questions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Punti deboli eliminati</span>
            <span className="text-amber-400 font-bold">{removed}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => { setIdx(0); setAnswered(null); setFeedback(null); setDone(false); setCorrect(0); setRemoved(0) }}
            className="w-full py-3 bg-amber-500 text-black font-black rounded-xl text-sm">
            🔄 Ricomincia sessione
          </button>
          <Link href="/dashboard" className="block w-full py-3 bg-gray-800 text-gray-300 font-bold rounded-xl text-sm text-center">
            ← Dashboard
          </Link>
        </div>
      </div>
    </div>
  )

  const q = questions[idx]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="bg-red-700 text-white text-xs font-black px-2 py-1 rounded tracking-widest">PUNTI DEBOLI</span>
            <div className="text-xs text-gray-400 mt-1">{idx + 1}/{questions.length} · {removed} eliminati</div>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">← Esci</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Progress */}
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all"
            style={{ width: `${((idx) / questions.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-amber-500 uppercase tracking-widest font-bold">{q.capitolo}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < q.consecutiveCorrect ? 'bg-green-400' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>
          <p className="text-base leading-relaxed text-gray-100" style={{ fontFamily: 'Georgia, serif' }}>
            {q.text}
          </p>
        </div>

        {/* Bottoni */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { value: true, label: 'VERO', color: 'green' },
            { value: false, label: 'FALSO', color: 'red' },
          ].map(({ value, label, color }) => {
            let cls = `py-4 rounded-xl border-2 font-black text-sm tracking-widest transition-all `
            if (answered === null) {
              cls += color === 'green'
                ? 'border-green-600 text-green-400 bg-gray-900 hover:bg-green-950'
                : 'border-red-600 text-red-400 bg-gray-900 hover:bg-red-950'
            } else if (answered === value) {
              cls += feedback?.isCorrect
                ? 'border-green-500 text-green-300 bg-green-950'
                : 'border-red-500 text-red-300 bg-red-950'
            } else {
              cls += 'border-gray-800 text-gray-600 bg-gray-900 opacity-40'
            }
            return (
              <button key={label} className={cls} onClick={() => handleAnswer(value)} disabled={answered !== null}>
                {answered !== null && answered === value && (feedback?.isCorrect ? '✓ ' : '✗ ')}{label}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-xl border p-4 mb-4 ${feedback.isCorrect ? 'bg-green-950 border-green-700' : 'bg-red-950 border-red-700'}`}>
            <p className={`font-bold text-sm ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {feedback.isCorrect
                ? `✓ Corretto! ${feedback.removed ? '🎉 Punto debole eliminato!' : `(${q.consecutiveCorrect + 1}/3 per eliminarlo)`}`
                : `✗ Sbagliato — risposta: ${feedback.correctAnswer ? 'VERO' : 'FALSO'} · Contatore azzerato`
              }
            </p>
          </div>
        )}

        {answered !== null && (
          <button onClick={goNext}
            className="w-full py-3 bg-amber-500 text-black font-black rounded-xl text-sm tracking-wide">
            {idx + 1 >= questions.length ? 'Fine sessione →' : 'Prossima →'}
          </button>
        )}
      </div>
    </div>
  )
}
