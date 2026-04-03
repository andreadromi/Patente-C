'use client'

import { useState } from 'react'

interface Simulation {
  id: string
  number: number
}

interface Attempt {
  id: string
  score: number | null
  passed: boolean | null
  completedAt: Date | null
}

interface SimulationWithAttempts {
  simulation: Simulation
  attempts: Attempt[]
}

export function SimulationCarousel({ data }: { data: SimulationWithAttempts[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 3

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const currentData = data.slice(currentIndex, currentIndex + itemsPerPage)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - itemsPerPage))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(data.length - itemsPerPage, prev + itemsPerPage))
  }

  const currentPage = Math.floor(currentIndex / itemsPerPage) + 1

  return (
    <div className="relative">
      {/* Frecce Navigazione */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-gradient-to-r from-[#059669] to-[#047857] dark:from-[#ECFDF5]0 dark:to-[#059669] text-white hover:from-[#047857] hover:to-[#065F46] dark:hover:from-[#059669] dark:hover:to-[#047857] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pagina {currentPage} di {totalPages}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Simulazioni {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, data.length)} di {data.length}
          </p>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex + itemsPerPage >= data.length}
          className="p-3 rounded-full bg-gradient-to-r from-[#059669] to-[#047857] dark:from-[#ECFDF5]0 dark:to-[#059669] text-white hover:from-[#047857] hover:to-[#065F46] dark:hover:from-[#059669] dark:hover:to-[#047857] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
        {currentData.map(({ simulation, attempts }) => {
          const completedAttempts = attempts.filter(a => a.completedAt !== null)
          const lastAttempt = completedAttempts[0]

          return (
            <div
              key={simulation.id}
              className="bg-gradient-to-br from-white via-gray-50 to-[#ECFDF5] dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 hover:border-[#059669] dark:hover:border-[#ECFDF5]0 hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ECFDF5]0 to-[#047857] dark:from-[#059669] dark:to-[#059669] flex items-center justify-center text-white font-bold text-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                    {simulation.number}
                  </div>
                  {completedAttempts.length > 0 && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 dark:bg-green-400 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {completedAttempts.length}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Simulazione {simulation.number}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    60 domande • 2 ore
                  </p>
                </div>
              </div>

              {lastAttempt && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Ultimo tentativo
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {new Date(lastAttempt.completedAt!).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {lastAttempt.score}/60
                      </span>
                      <span
                        className={`ml-3 text-sm font-bold ${
                          lastAttempt.passed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {lastAttempt.passed ? '✓ PROMOSSO' : '✗ BOCCIATO'}
                      </span>
                    </div>
                    <a
                      href={`/user-simulations/${lastAttempt.id}/report`}
                      className="text-[#059669] dark:text-[#059669] hover:text-[#065F46] dark:hover:text-[#6EE7B7] font-medium text-sm hover:underline"
                    >
                      Report →
                    </a>
                  </div>
                </div>
              )}

              <a
                href={`/simulations/${simulation.id}`}
                className="block w-full px-6 py-3.5 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] dark:from-[#ECFDF5]0 dark:to-[#059669] dark:hover:from-[#059669] dark:hover:to-[#047857] text-white text-base font-semibold rounded-xl transition-all shadow-md hover:shadow-xl text-center transform hover:scale-105"
              >
                {completedAttempts.length > 0 ? '🔄 Nuova Prova' : '▶️ Inizia Simulazione'}
              </a>
            </div>
          )
        })}
      </div>

      {/* Indicatori Pagina (Dots) */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx * itemsPerPage)}
            className={`h-2 rounded-full transition-all ${
              idx === currentPage - 1
                ? 'w-8 bg-[#059669] dark:bg-[#059669]'
                : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
