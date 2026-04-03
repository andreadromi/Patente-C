'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Question = {
  id: string
  code: string
  text: string
  option1: string
  option2: string
  option3: string
  option4: string
  correctAnswer: number
  area: {
    id: string
    code: string
    name: string
  }
}

type Area = {
  id: string
  code: string
  name: string
}

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Carica aree
  useEffect(() => {
    fetch('/api/admin/areas')
      .then((res) => res.json())
      .then((data) => setAreas(data.areas || []))
      .catch((err) => console.error('Error loading areas:', err))
  }, [])

  // Carica domande con filtri
  useEffect(() => {
    loadQuestions()
  }, [page, search, selectedArea])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (search) params.append('search', search)
      if (selectedArea) params.append('areaId', selectedArea)

      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()

      if (res.ok) {
        setQuestions(data.questions || [])
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        alert(data.error || 'Errore durante il caricamento')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      alert('Errore durante il caricamento delle domande')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset a pagina 1
  }

  const handleAreaChange = (value: string) => {
    setSelectedArea(value)
    setPage(1) // Reset a pagina 1
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/questions/${deleteId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        alert('Domanda eliminata con successo')
        setDeleteId(null)
        loadQuestions() // Ricarica lista
      } else {
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Errore durante l\'eliminazione della domanda')
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
                Gestione Domande
              </h1>
              <p className="text-sm text-[#4D5057] mt-1">
                Totale: {total} domande
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
                href="/admin/questions/new"
                className="px-4 py-2 text-sm font-medium bg-[#059669] text-white rounded-lg hover:bg-green-700"
              >
                + Nuova Domanda
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtri */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cerca (codice o testo)
              </label>
              <input
                type="text"
                placeholder="es. MHN001 o 'contratto'"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per Area
              </label>
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tutte le aree</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.code} - {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#9CA3AF]">
              Caricamento...
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-[#9CA3AF]">
              Nessuna domanda trovata
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Codice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Testo Domanda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Area
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Risposta Corretta
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {q.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md truncate">{q.text}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                            {q.area.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                            {q.correctAnswer}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/questions/${q.id}/edit`}
                            className="text-[#059669] hover:text-[#064E3B] mr-4"
                          >
                            Modifica
                          </Link>
                          <button
                            onClick={() => setDeleteId(q.id)}
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

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Pagina {page} di {totalPages} • Totale: {total} domande
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Precedente
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successiva
                  </button>
                </div>
              </div>
            </>
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
              Sei sicuro di voler eliminare questa domanda? Questa azione non può essere annullata.
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
