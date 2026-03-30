'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function WeakPointsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weak-points/start', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const total = data?.total || 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="bg-red-700 text-white text-xs font-black px-2 py-1 rounded tracking-widest">PUNTI DEBOLI</span>
          <Link href="/dashboard" className="text-xs text-gray-500">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-2xl font-black mb-2">I tuoi punti deboli</h1>

        {total === 0 ? (
          <div className="bg-green-950 border border-green-700 rounded-xl p-6 mt-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-green-400 font-bold">Nessun punto debole!</p>
            <p className="text-gray-400 text-sm mt-1">Esegui qualche simulazione per tracciare gli errori.</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6 mb-6">
              <div className="text-4xl font-black text-red-400 mb-1">{total}</div>
              <div className="text-gray-400 text-sm">domande da ripassare</div>
              <div className="text-xs text-gray-600 mt-2">
                3 risposte corrette consecutive = punto debole eliminato
              </div>
            </div>
            <Link href="/weak-points/practice"
              className="inline-block w-full py-3 bg-amber-500 text-black font-black rounded-xl text-sm tracking-wide">
              🎯 Inizia allenamento
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
