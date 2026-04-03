'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Credenziali non valide')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <span className="bg-red-700 text-[#4D5057] text-xs font-black px-3 py-1 rounded tracking-widest">AREA ADMIN</span>
          <h1 className="text-xl font-black text-[#4D5057] mt-3">Accesso Amministratore</h1>
        </div>

        <div className="bg-[#D5EA60] border border-[#E2E6EA] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280] tracking-widest uppercase font-bold block mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-white border border-[#E2E6EA] rounded-xl px-4 py-3 text-[#4D5057] focus:outline-none focus:border-[#059669] text-sm"
                autoFocus />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] tracking-widest uppercase font-bold block mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E2E6EA] rounded-xl px-4 py-3 text-[#4D5057] focus:outline-none focus:border-[#059669] text-sm" />
            </div>
            {error && <p className="text-[#D97706] text-xs">{error}</p>}
            <button type="submit" disabled={loading || !username || !password}
              className="w-full py-3 bg-[#059669] text-[#4D5057] font-black rounded-xl text-sm disabled:opacity-40">
              {loading ? 'Accesso...' : 'Accedi →'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          <a href="/login" className="text-[#9CA3AF] hover:text-[#4D5057]">← Torna al login utente</a>
        </p>
      </div>
    </div>
  )
}
