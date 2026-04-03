'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Simulation = {
  id: string
  number: number
  questions: string
  questionCount: number
  createdAt: string
}

export default function SimulationsListPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadSimulations()
  }, [])

  const loadSimulations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/simulations')
      const data = await res.json()

      if (res.ok) {
        setSimulations(data.simulations || [])
      } else {
        alert(data.error || 'Errore durante il caricamento')
      }
    } catch (error) {
      console.error('Error loading simulations:', error)
      alert('Errore durante il caricamento delle simulazioni')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/simulations/${deleteId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        alert('Simulazione eliminata con successo')
        setDeleteId(null)
        loadSimulations()
      } else {
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting simulation:', error)
      alert('Errore durante l\'eliminazione della simulazione')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D8E4A8] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#4D5057]">
                Gestione Simulazioni
              </h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Totale: {simulations.length} simulazioni
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-[#4D5057] hover:text-[#4D5057] border border-[#E2E6EA] rounded-lg hover:bg-white"
              >
                ← Dashboard
              </Link>
              <Link
                href="/admin/simulations/new"
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-[#4D5057] rounded-lg hover:bg-purple-700"
              >
                + Nuova Simulazione
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#9CA3AF]">
              Caricamento...
            </div>
          ) : simulations.length === 0 ? (
            <div className="p-8 text-center text-[#9CA3AF]">
              Nessuna simulazione trovata
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Numero
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Domande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Creata il
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {simulations.map((sim) => (
                    <tr key={sim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          Simulazione {sim.number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {sim.questionCount} domande
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sim.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/simulations/${sim.id}/edit`}
                          className="text-[#059669] hover:text-[#064E3B] mr-4"
                        >
                          Modifica
                        </Link>
                        <button
                          onClick={() => setDeleteId(sim.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Conferma Eliminazione
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Sei sicuro di voler eliminare questa simulazione? Questa azione
              non può essere annullata.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-[#4D5057] bg-[#D97706] rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
