'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type User = {
  id: string
  username: string
  createdAt: string
  completedSimulations: number
}

export default function UsersListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users || [])
      } else {
        alert(data.error || 'Errore durante il caricamento')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Errore durante il caricamento degli utenti')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        alert('Utente eliminato con successo')
        setDeleteId(null)
        loadUsers()
      } else {
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Errore durante l\'eliminazione dell\'utente')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Gestione Utenti
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Totale: {users.length} utenti
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800"
              >
                ← Dashboard
              </Link>
              <Link
                href="/admin/users/new"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Nuovo Utente
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
            <div className="p-8 text-center text-gray-500">
              Caricamento...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nessun utente trovato
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrato il
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Simulazioni Completate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {u.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {u.completedSimulations} completate
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/users/${u.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Modifica
                        </Link>
                        <button
                          onClick={() => setDeleteId(u.id)}
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
              Sei sicuro di voler eliminare questo utente? Verranno eliminate
              anche tutte le sue simulazioni, risposte e punti deboli. Questa
              azione non può essere annullata.
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
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
