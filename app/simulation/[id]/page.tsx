'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Question {
  id: string
  code: string
  text: string
  option1: string
  option2: string
  option3: string
  option4: string
  area: {
    code: string
    name: string
  }
}

export default function SimulationPage() {
  const params = useParams()
  const router = useRouter()
  const simulationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userSimulationId, setUserSimulationId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [timeLeft, setTimeLeft] = useState(7200) // 2 ore in secondi
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Carica simulazione
  useEffect(() => {
    async function loadSimulation() {
      try {
        const response = await fetch(`/api/simulations/${simulationId}/start`, {
          method: 'POST',
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Errore caricamento simulazione')
          setLoading(false)
          return
        }

        const data = await response.json()
        setUserSimulationId(data.userSimulationId)
        setQuestions(data.questions)
        setAnswers(data.answers || {})

        // Calcola tempo rimanente
        const startedAt = new Date(data.startedAt)
        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
        const remaining = Math.max(0, 7200 - elapsed)
        setTimeLeft(remaining)

        setLoading(false)
      } catch (err) {
        console.error('Errore:', err)
        setError('Errore di connessione')
        setLoading(false)
      }
    }

    loadSimulation()
  }, [simulationId])

  // Timer countdown
  useEffect(() => {
    if (loading || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Tempo scaduto - completa automaticamente
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, timeLeft])

  // Salva risposta
  const saveAnswer = useCallback(async (questionId: string, userAnswer: number | null) => {
    try {
      await fetch(`/api/user-simulations/${userSimulationId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, userAnswer }),
      })
    } catch (err) {
      console.error('Errore salvataggio risposta:', err)
    }
  }, [userSimulationId])

  // Gestisce selezione risposta
  const handleSelectAnswer = (answer: number) => {
    const currentQuestion = questions[currentIndex]
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
    saveAnswer(currentQuestion.id, answer)
  }

  // Completa simulazione
  const handleComplete = async () => {
    if (completing) return

    setCompleting(true)
    try {
      const response = await fetch(`/api/user-simulations/${userSimulationId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Errore completamento simulazione')
        setCompleting(false)
        return
      }

      // Redirect a pagina report
      router.push(`/simulation/${simulationId}/report?userSimulationId=${userSimulationId}`)
    } catch (err) {
      console.error('Errore:', err)
      alert('Errore di connessione')
      setCompleting(false)
    }
  }

  // Formatta tempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento simulazione...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-2 rounded-lg"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.values(answers).filter((a) => a !== null).length
  const progress = (answeredCount / 60) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con timer e progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Simulazione {simulationId}
              </h1>
              <p className="text-gray-600">
                Domanda {currentIndex + 1} di 60
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  timeLeft < 600 ? 'text-red-600' : 'text-[#059669]'
                }`}
              >
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-600">Tempo rimanente</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#059669] h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {answeredCount} / 60 domande risposte ({Math.round(progress)}%)
          </p>
        </div>

        {/* Domanda */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-4">
            <span className="inline-block bg-[#D1FAE5] text-[#065F46] text-sm font-medium px-3 py-1 rounded">
              {currentQuestion.area.code} - {currentQuestion.area.name}
            </span>
            <span className="ml-2 text-gray-500 text-sm">
              Codice: {currentQuestion.code}
            </span>
          </div>

          <h2 className="text-xl font-medium text-gray-900 mb-6">
            {currentQuestion.text}
          </h2>

          {/* Opzioni di risposta */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handleSelectAnswer(num)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion.id] === num
                    ? 'border-[#059669] bg-[#ECFDF5]'
                    : 'border-gray-300 hover:border-[#059669] bg-white'
                }`}
              >
                <div className="flex items-start">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium ${
                      answers[currentQuestion.id] === num
                        ? 'bg-[#059669] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {num}
                  </span>
                  <span className="flex-1 text-gray-900">
                    {currentQuestion[`option${num}` as keyof Question] as string}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigazione */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ← Precedente
          </button>

          <button
            onClick={() => setShowConfirmComplete(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Termina Simulazione
          </button>

          <button
            onClick={() =>
              setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
            }
            disabled={currentIndex === questions.length - 1}
            className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Successiva →
          </button>
        </div>

        {/* Griglia navigazione domande */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Navigazione Rapida
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-full aspect-square rounded text-sm font-medium ${
                  index === currentIndex
                    ? 'bg-[#059669] text-white'
                    : answers[q.id] !== null && answers[q.id] !== undefined
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal conferma completamento */}
      {showConfirmComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Conferma Terminazione
            </h3>
            <p className="text-gray-700 mb-6">
              Sei sicuro di voler terminare la simulazione?
              {answeredCount < 60 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Attenzione: hai risposto solo a {answeredCount} domande su 60.
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmComplete(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {completing ? 'Completamento...' : 'Termina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
