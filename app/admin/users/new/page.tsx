'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Utente creato con successo!')
        router.push('/admin/users')
      } else {
        alert(data.error || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Errore durante la creazione dell\'utente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D8E4A8] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">Nuovo Utente</h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Crea un nuovo utente per il sistema
              </p>
            </div>
            <Link
              href="/admin/users"
              className="px-4 py-2 text-sm font-medium text-[#4D5057] hover:text-[#4D5057] border border-[#E2E6EA] rounded-lg hover:bg-white"
            >
              ← Torna alla Lista
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="es. mario.rossi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]0"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Username univoco per l&apos;accesso al sistema
            </p>
          </div>

          {/* Info */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#064E3B] mb-2">
              ℹ️ Note
            </h4>
            <ul className="text-xs text-[#065F46] space-y-1 ml-4 list-disc">
              <li>L&apos;utente verrà creato come utente normale (non admin)</li>
              <li>Non è richiesta password per utenti normali</li>
              <li>
                L&apos;utente potrà accedere alla dashboard ed eseguire simulazioni
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/admin/users"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-[#4D5057] bg-[#059669] rounded-lg hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creazione...' : 'Crea Utente'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
