'use client'

import { useState, useEffect } from 'react'

interface Simulation {
  id: string
  number: number
}

interface UserSimulation {
  id: string
  simulationId: string
  status: string
  score: number | null
  passed: boolean | null
  completedAt: Date | null
}

interface SimulationSliderProps {
  simulations: Simulation[]
  userSimulations: UserSimulation[]
}

export function SimulationSlider({
  simulations,
  userSimulations,
}: SimulationSliderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(8)

  // Detect screen size on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateCardsPerPage = () => {
        setCardsPerPage(window.innerWidth < 1024 ? 3 : 8)
      }
      updateCardsPerPage()
      window.addEventListener('resize', updateCardsPerPage)
      return () => window.removeEventListener('resize', updateCardsPerPage)
    }
  }, [])

  const totalPages = Math.ceil(simulations.length / cardsPerPage)
  const startIndex = currentPage * cardsPerPage
  const visibleSimulations = simulations.slice(
    startIndex,
    startIndex + cardsPerPage
  )

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  return (
    <div className="relative">
      {/* Navigation arrows */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage
                  ? 'bg-amber-600 dark:bg-amber-500 w-6'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Grid - 3 cards on mobile, 2 rows x 4 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity duration-300">
        {visibleSimulations.map((simulation) => {
          const attempts = userSimulations.filter(
            (us) => us.simulationId === simulation.id
          )
          const completedAttempts = attempts.filter(
            (us) => us.status === 'COMPLETED'
          )
          const lastAttempt = completedAttempts[0]

          return (
            <div
              key={simulation.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all"
            >
              {/* Header compatto */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-amber-600 dark:bg-amber-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {simulation.number}
                    </div>
                    {completedAttempts.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {completedAttempts.length}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Sim. {simulation.number}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      60 dom • 2h
                    </p>
                  </div>
                </div>
                {/* Score inline se presente */}
                {lastAttempt && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {lastAttempt.score}/60
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(lastAttempt.completedAt!).toLocaleDateString(
                        'it-IT',
                        {
                          day: '2-digit',
                          month: '2-digit',
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons row */}
              <div className="flex gap-2">
                <a
                  href={`/simulations/${simulation.id}`}
                  className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors text-center shadow-sm"
                >
                  {completedAttempts.length > 0 ? 'Riprova' : 'Inizia'}
                </a>
                {lastAttempt && (
                  <a
                    href={`/user-simulations/${lastAttempt.id}/report`}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
                      lastAttempt.passed
                        ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        : 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    }`}
                  >
                    {lastAttempt.passed ? '✓' : '✗'}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
