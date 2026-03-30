'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Simulation { id: string; number: number; _count: { userSimulations: number } }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null; startedAt: string }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
    ]).then(([userData, simsData, userSimsData]) => {
      if (!userData.user) { router.push('/login'); return }
      setUser(userData.user)
      setSimulations(simsData.simulations || [])
      setUserSims(userSimsData || [])
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getSimStatus = (simId: string) => {
    const attempts = userSims.filter(us => us.simulationId === simId)
    if (!attempts.length) return null
    return attempts[attempts.length - 1]
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="bg-amber-500 text-black text-xs font-black px-2 py-1 rounded tracking-widest">PATENTE C</span>
            <h1 className="text-lg font-bold mt-1">Ciao, {user?.username}! 👋</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/weak-points" className="text-xs px-3 py-2 bg-gray-800 text-gray-300 rounded-lg font-medium">
              📚 Punti deboli
            </Link>
            <button onClick={handleLogout} className="text-xs px-3 py-2 bg-gray-800 text-gray-400 rounded-lg">
              Esci
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Simulate', value: completed, color: 'text-amber-400' },
            { label: 'Promosse', value: passed, color: 'text-green-400' },
            { label: 'Disponibili', value: simulations.length, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Lista simulazioni */}
        <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-3">
          Simulazioni · 40 domande · 40 minuti · max 4 errori
        </h2>
        <div className="space-y-2">
          {simulations.map(sim => {
            const lastAttempt = getSimStatus(sim.id)
            const isDone = lastAttempt?.status === 'COMPLETED'
            return (
              <div key={sim.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">Simulazione #{sim.number}</div>
                  {isDone && (
                    <div className="text-xs mt-0.5">
                      <span className={lastAttempt.passed ? 'text-green-400' : 'text-red-400'}>
                        {lastAttempt.passed ? '✓ Promosso' : '✗ Non sufficiente'}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {lastAttempt.score}/40 ({lastAttempt.errors} errori)
                      </span>
                    </div>
                  )}
                  {!isDone && lastAttempt?.status === 'IN_PROGRESS' && (
                    <div className="text-xs text-amber-400 mt-0.5">⏸ In corso</div>
                  )}
                  {!lastAttempt && (
                    <div className="text-xs text-gray-500 mt-0.5">Non ancora eseguita</div>
                  )}
                </div>
                <Link href={`/simulations/${sim.id}`}
                  className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-lg">
                  {isDone ? 'Riprova' : lastAttempt ? 'Continua' : 'Inizia'}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
