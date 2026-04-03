'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSimulationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    questions: '[]',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Simulazione creata con successo!')
        router.push('/admin/simulations')
      } else {
        alert(data.error || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Error creating simulation:', error)
      alert('Errore durante la creazione della simulazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D5EA60] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">
                Nuova Simulazione
              </h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Crea una nuova simulazione con 60 domande
              </p>
            </div>
            <Link
              href="/admin/simulations"
              className="px-4 py-2 text-sm font-medium text-[#4D5057] hover:text-[#4D5057] border border-[#E2E6EA] rounded-lg hover:bg-white"
            >
              ← Torna alla Lista
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* Numero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero Simulazione <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="es. 20"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Numero progressivo univoco (es. 1, 2, 3...)
            </p>
          </div>

          {/* Domande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codici Domande (JSON) <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={12}
              placeholder='["MHN001", "MHN002", "MHN003", ...]'
              value={formData.questions}
              onChange={(e) =>
                setFormData({ ...formData, questions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Array JSON con 60 codici domanda. Esempio:{' '}
              <code>[&quot;MHN001&quot;, &quot;MHN002&quot;, ...]</code>
            </p>
          </div>

          {/* Helper */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Suggerimento
            </h4>
            <p className="text-xs text-blue-800 mb-2">
              Per generare automaticamente una simulazione casuale:
            </p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Usa Prisma Studio per vedere i codici domande disponibili</li>
              <li>
                Oppure usa uno script per generare array JSON casuale da 60
                codici
              </li>
              <li>
                Le domande devono coprire tutte le 8 aree (A-H) con proporzioni
                corrette
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/admin/simulations"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-[#4D5057] bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creazione...' : 'Crea Simulazione'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
