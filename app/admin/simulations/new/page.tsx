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
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">
                Nuova Simulazione
              </h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Crea una nuova simulazione con 40 domande vero/falso
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
              placeholder="es. 1001"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Numero univoco, da 1000 in su (es. 1001, 1002...)
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
              placeholder='["codice 1", "codice 2", ...]'
              value={formData.questions}
              onChange={(e) =>
                setFormData({ ...formData, questions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Array JSON con i codici delle domande del listato (di solito 40), come li
              mostra la pagina Domande
            </p>
          </div>

          {/* Helper */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[var(--accent-scuro)] mb-2">
              💡 Suggerimento
            </h4>
            <ol className="text-xs text-[#065F46] space-y-1 ml-4 list-decimal">
              <li>I codici sono quelli del listato ministeriale: si trovano nella pagina Domande</li>
              <li>Usa numeri da 1000 in su: quelli sotto sono le simulazioni dell&apos;archivio, che il seed riallinea</li>
              <li>All&apos;esame escono 40 domande, un numero fisso per ogni argomento</li>
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
              className="px-6 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-scuro)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creazione...' : 'Crea Simulazione'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
