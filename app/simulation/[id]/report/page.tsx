'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

interface AreaResult {
  areaCode: string
  areaName: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  passed: boolean
}

interface Question {
  id: string
  code: string
  text: string
  option1: string
  option2: string
  option3: string
  option4: string
  correctAnswer: number
  area: {
    code: string
    name: string
  }
}

interface Answer {
  id: string
  userAnswer: number | null
  isCorrect: boolean
  answeredAt: string
}

interface QuestionWithAnswer {
  position: number
  question: Question
  answer: Answer | null
}

interface UserSimulation {
  id: string
  simulationId: string
  status: string
  score: number
  passed: boolean
  startedAt: string
  completedAt: string
  timeElapsed: number
}

export default function ReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const simulationId = params.id as string
  const userSimulationId = searchParams.get('userSimulationId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userSimulation, setUserSimulation] = useState<UserSimulation | null>(null)
  const [areaResults, setAreaResults] = useState<AreaResult[]>([])
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  // Carica report
  useEffect(() => {
    if (!userSimulationId) {
      setError('ID simulazione mancante')
      setLoading(false)
      return
    }

    async function loadReport() {
      try {
        const response = await fetch(`/api/user-simulations/${userSimulationId}/report`)

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Errore caricamento report')
          setLoading(false)
          return
        }

        const data = await response.json()
        setUserSimulation(data.userSimulation)
        setAreaResults(data.areaResults)
        setQuestionsWithAnswers(data.questionsWithAnswers)
        setLoading(false)
      } catch (err) {
        console.error('Errore:', err)
        setError('Errore di connessione')
        setLoading(false)
      }
    }

    loadReport()
  }, [userSimulationId])

  // Formatta tempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  // Toggle espansione domanda
  const toggleQuestion = (position: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(position)) {
      newExpanded.delete(position)
    } else {
      newExpanded.add(position)
    }
    setExpandedQuestions(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento report...</p>
        </div>
      </div>
    )
  }

  if (error || !userSimulation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error || 'Errore caricamento report'}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    )
  }

  const percentage = Math.round((userSimulation.score / 60) * 100)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report Simulazione {simulationId}
          </h1>
          <p className="text-gray-600">
            Completata il {new Date(userSimulation.completedAt).toLocaleString('it-IT')}
          </p>
        </div>

        {/* Risultato Finale */}
        <div
          className={`rounded-lg shadow-md p-8 mb-6 text-center ${
            userSimulation.passed
              ? 'bg-green-100 border-4 border-green-500'
              : 'bg-red-100 border-4 border-red-500'
          }`}
        >
          <div
            className={`text-6xl font-bold mb-4 ${
              userSimulation.passed ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {userSimulation.passed ? '✅ PROMOSSO' : '❌ BOCCIATO'}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {userSimulation.score} / 60 ({percentage}%)
          </div>
          <div className="text-lg text-gray-700">
            Tempo impiegato: {formatTime(userSimulation.timeElapsed)}
          </div>
        </div>

        {/* Risultati per Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Risultati per Area
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Area</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Risposte Corrette</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Accuratezza</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Esito</th>
                </tr>
              </thead>
              <tbody>
                {areaResults.map((area) => (
                  <tr key={area.areaCode} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{area.areaCode}</div>
                      <div className="text-sm text-gray-600">{area.areaName}</div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-900">
                      {area.correctAnswers} / {area.totalQuestions}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-medium ${
                          area.accuracy >= 50
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {Math.round(area.accuracy)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`text-2xl ${
                          area.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {area.passed ? '✅' : '❌'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            * Per superare la simulazione, tutte le aree devono avere almeno il 50% di accuratezza
          </div>
        </div>

        {/* Revisione Domande */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Revisione Domande
          </h2>
          <div className="space-y-2">
            {questionsWithAnswers.map((item) => {
              const isExpanded = expandedQuestions.has(item.position)
              const isCorrect = item.answer?.isCorrect || false
              const userAnswer = item.answer?.userAnswer || null

              return (
                <div
                  key={item.position}
                  className={`border-2 rounded-lg overflow-hidden ${
                    isCorrect
                      ? 'border-green-300'
                      : userAnswer === null
                      ? 'border-gray-300'
                      : 'border-red-300'
                  }`}
                >
                  {/* Header domanda */}
                  <button
                    onClick={() => toggleQuestion(item.position)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${
                      isCorrect
                        ? 'bg-green-50'
                        : userAnswer === null
                        ? 'bg-gray-50'
                        : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl ${
                          isCorrect
                            ? 'text-green-600'
                            : userAnswer === null
                            ? 'text-gray-400'
                            : 'text-red-600'
                        }`}
                      >
                        {isCorrect ? '✅' : userAnswer === null ? '⚪' : '❌'}
                      </span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          Domanda {item.position}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.question.area.code} - {item.question.area.name}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </button>

                  {/* Dettaglio domanda */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-white border-t border-gray-200">
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">
                          Codice: {item.question.code}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {item.question.text}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((num) => {
                          const isUserAnswer = userAnswer === num
                          const isCorrectAnswer = item.question.correctAnswer === num

                          return (
                            <div
                              key={num}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectAnswer
                                  ? 'bg-green-100 border-green-500'
                                  : isUserAnswer
                                  ? 'bg-red-100 border-red-500'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium bg-white border-2 border-gray-300">
                                  {num}
                                </span>
                                <div className="flex-1">
                                  <div className="text-gray-900">
                                    {item.question[`option${num}` as keyof Question] as string}
                                  </div>
                                  {isCorrectAnswer && (
                                    <div className="text-sm font-medium text-green-700 mt-1">
                                      ✅ Risposta corretta
                                    </div>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <div className="text-sm font-medium text-red-700 mt-1">
                                      ❌ Tua risposta (errata)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {userAnswer === null && (
                        <div className="mt-3 text-sm text-gray-600 italic">
                          Non hai risposto a questa domanda
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Torna alla Dashboard
          </button>
          <button
            onClick={() => router.push(`/simulation/${simulationId}`)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Riprova Simulazione
          </button>
        </div>
      </div>
    </div>
  )
}
