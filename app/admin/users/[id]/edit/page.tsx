'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')

  // Carica utente
  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username)
        }
      })
      .catch((err) => {
        console.error('Error loading user:', err)
        alert('Errore durante il caricamento dei dati')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Utente aggiornato con successo!')
        router.push('/admin/users')
      } else {
        alert(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Errore durante l\'aggiornamento dell\'utente')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#EEF0E4] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">Modifica Utente</h1>
              <p className="text-sm text-[#4D5057] mt-1">Username: {username}</p>
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]0"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Modifica username dell&apos;utente
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Note
            </h4>
            <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
              <li>
                Le simulazioni e i dati dell&apos;utente NON verranno modificati
              </li>
              <li>Solo l&apos;username verrà aggiornato</li>
              <li>
                L&apos;utente dovrà usare il nuovo username per accedere al sistema
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
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-[#4D5057] bg-[#059669] rounded-lg hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
