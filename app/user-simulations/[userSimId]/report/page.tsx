'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface CapitoloResult { capitolo: string; capitoloCode: string; total: number; correct: number; accuracy: number }
interface AnswerItem { index: number; text: string; risposta: boolean; userAnswer: boolean | null; isCorrect: boolean | null; capitolo: string }

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch(`/api/user-simulations/${userSimId}/report`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
  const errors = report.errors ?? (40 - (report.score ?? 0))
  const passed = report.passed
  const wrongAnswers: AnswerItem[] = (report.answers || []).filter((a: AnswerItem) => !a.isCorrect)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header risultato */}
        <div className={`rounded-2xl border p-6 text-center mb-6 ${passed ? 'bg-green-950 border-green-700' : 'bg-red-950 border-red-700'}`}>
          <div className="text-5xl mb-3">{passed ? '🏆' : '📚'}</div>
          <div className={`text-2xl font-black tracking-widest mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {passed ? 'PROMOSSO!' : 'NON SUFFICIENTE'}
          </div>
          <div className="text-gray-300 text-sm mb-4">
            Simulazione #{report.simulationNumber} · {fmtTime(report.timeElapsed || 0)}
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-black text-green-400">{report.score}</div>
              <div className="text-xs text-gray-400">corrette</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-black ${errors > 4 ? 'text-red-400' : 'text-amber-400'}`}>{errors}</div>
              <div className="text-xs text-gray-400">errori {errors > 4 ? '(max 4)' : '✓'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-amber-400">{Math.round((report.score / 40) * 100)}%</div>
              <div className="text-xs text-gray-400">accuratezza</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {passed ? 'Meno di 4 errori: avresti superato l\'esame!' : `${errors - 4} errori oltre il limite massimo di 4`}
          </div>
        </div>

        {/* Errori per capitolo */}
        {report.capitoloResults?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-sm text-amber-400 tracking-widest mb-3 uppercase">Per capitolo</h3>
            <div className="space-y-2">
              {report.capitoloResults.map((cr: CapitoloResult) => (
                <div key={cr.capitoloCode} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{cr.capitolo}</div>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${cr.accuracy >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${cr.accuracy}%` }} />
                    </div>
                  </div>
                  <div className="text-xs font-mono text-gray-400 shrink-0">
                    {cr.correct}/{cr.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risposte sbagliate */}
        {wrongAnswers.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-red-400 tracking-widest uppercase">
                Risposte sbagliate ({wrongAnswers.length})
              </h3>
              <button onClick={() => setShowAll(v => !v)} className="text-xs text-gray-500 hover:text-gray-300">
                {showAll ? 'Mostra meno' : 'Mostra tutte'}
              </button>
            </div>
            <div className="space-y-3">
              {(showAll ? wrongAnswers : wrongAnswers.slice(0, 5)).map((a: AnswerItem) => (
                <div key={a.index} className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">#{a.index} · {a.capitolo}</div>
                  <p className="text-sm text-gray-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{a.text}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-red-400">Tu: {a.userAnswer === null ? 'non risposta' : a.userAnswer ? 'VERO' : 'FALSO'}</span>
                    <span className="text-green-400">Corretto: {a.risposta ? 'VERO' : 'FALSO'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard"
            className="block text-center py-3 bg-amber-500 text-black font-black rounded-xl text-sm tracking-wide">
            ← Torna alla dashboard
          </Link>
          <Link href="/weak-points"
            className="block text-center py-3 bg-gray-800 text-gray-300 font-bold rounded-xl text-sm">
            📚 Allenati sui punti deboli
          </Link>
        </div>
      </div>
    </div>
  )
}
