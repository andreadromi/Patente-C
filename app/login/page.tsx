'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() })
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('Errore di accesso. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚛</div>
          <span className="bg-amber-500 text-black text-xs font-black px-3 py-1 rounded tracking-widest">PATENTE C · CE</span>
          <h1 className="text-2xl font-black text-white mt-3">Simulatore Esame</h1>
          <p className="text-gray-500 text-sm mt-1">40 domande · 40 minuti · max 4 errori</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 tracking-widest uppercase font-bold block mb-2">
                Il tuo nome
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="es. andrea"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1.5">Nessuna password richiesta</p>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-3 bg-amber-500 text-black font-black rounded-xl text-sm tracking-wide disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Accesso...' : 'Entra →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Admin? <a href="/admin/login" className="text-amber-500 hover:underline">Accedi qui</a>
        </p>
      </div>
    </div>
  )
}
