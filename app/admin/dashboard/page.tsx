import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    redirect('/login')
  }

  // Statistiche globali
  const [totalUsers, totalQuestions, totalSimulations, totalCompletedSims] =
    await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.question.count(),
      prisma.simulation.count(),
      prisma.userSimulation.count({ where: { status: 'COMPLETED' } }),
    ])

  async function handleLogout() {
    'use server'
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Area Admin - Simulazioni Esami
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              Amministratore: <span className="font-medium">{user.username}</span>
            </p>
          </div>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Utenti</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Domande</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalQuestions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Simulazioni</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSimulations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Sim. Completate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCompletedSims}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gestione Utenti */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-blue-600">
              <h3 className="text-lg font-semibold text-white">
                Gestione Utenti
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Visualizza, crea, modifica ed elimina utenti del sistema.
              </p>
              <a
                href="/admin/users"
                className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                Gestisci Utenti
              </a>
            </div>
          </div>

          {/* Gestione Domande */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-600">
              <h3 className="text-lg font-semibold text-white">
                Gestione Domande
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                CRUD completo delle 872 domande con filtri e ricerca.
              </p>
              <a
                href="/admin/questions"
                className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                Gestisci Domande
              </a>
            </div>
          </div>

          {/* Gestione Simulazioni */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-purple-600">
              <h3 className="text-lg font-semibold text-white">
                Gestione Simulazioni
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Visualizza, crea e modifica le 19 simulazioni pre-generate.
              </p>
              <a
                href="/admin/simulations"
                className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                Gestisci Simulazioni
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
