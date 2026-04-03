'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default function EditSimulationPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    questions: '[]',
  })

  // Carica simulazione
  useEffect(() => {
    fetch(`/api/admin/simulations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.simulation) {
          const sim = data.simulation
          setFormData({
            number: sim.number.toString(),
            questions: JSON.stringify(JSON.parse(sim.questions), null, 2), // Pretty print
          })
        }
      })
      .catch((err) => {
        console.error('Error loading simulation:', err)
        alert('Errore durante il caricamento dei dati')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/simulations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Simulazione aggiornata con successo!')
        router.push('/admin/simulations')
      } else {
        alert(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Error updating simulation:', error)
      alert('Errore durante l\'aggiornamento della simulazione')
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
              <h1 className="text-2xl font-bold text-[#4D5057]">
                Modifica Simulazione
              </h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Simulazione #{formData.number}
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
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]0"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Numero progressivo univoco
            </p>
          </div>

          {/* Domande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codici Domande (JSON) <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={15}
              value={formData.questions}
              onChange={(e) =>
                setFormData({ ...formData, questions: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]0 font-mono text-sm"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Array JSON con 60 codici domanda
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Attenzione
            </h4>
            <p className="text-xs text-yellow-800">
              Modificare le domande di una simulazione può influenzare i report
              degli utenti che l&apos;hanno già completata. Procedi con cautela.
            </p>
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
