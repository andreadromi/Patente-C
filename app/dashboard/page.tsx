'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Simulation { id: string; number: number }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
    ]).then(([userData, simsData, userSimsData]) => {
      if (!userData.user) { router.push('/login'); return }
      setUser(userData.user)
      setSimulations(simsData.simulations || [])
      setUserSims(Array.isArray(userSimsData) ? userSimsData : [])
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getLastAttempt = (simId: string) =>
    userSims.filter(us => us.simulationId === simId)[0] || null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const accuracy = completed > 0 ? Math.round((passed / completed) * 100) : 0

  // Trova prossima simulazione non ancora completata
  const nextSim = simulations.find(sim => {
    const last = getLastAttempt(sim.id)
    return !last || last.status !== 'COMPLETED'
  })
  const inProgressSim = simulations.find(sim => getLastAttempt(sim.id)?.status === 'IN_PROGRESS')
  const activeSim = inProgressSim || nextSim

  const completedSims = simulations.filter(sim => getLastAttempt(sim.id)?.status === 'COMPLETED')
  const recentCompleted = completedSims.slice(0, showAll ? completedSims.length : 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🚛</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#3B82F6' }}>PATENTE C · CE</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Ciao, {user?.username}!</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/weak-points" style={{ fontSize: 12, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--subtext)', textDecoration: 'none', fontWeight: 600 }}>
              📚
            </Link>
            <button onClick={handleLogout} style={{ fontSize: 12, padding: '8px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Esci
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Simulate', value: completed, color: '#3B82F6', total: simulations.length },
            { label: 'Promosse', value: passed, color: '#10B981' },
            { label: 'Precisione', value: `${accuracy}%`, color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>
                {s.value}{s.total ? <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>/{s.total}</span> : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Card prossima simulazione */}
        {activeSim && (
          <div style={{
            background: 'linear-gradient(135deg, #1E3A5F, #1E2D4A)',
            border: '1px solid #2563EB44',
            borderRadius: 20, padding: '24px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#60A5FA', marginBottom: 6 }}>
              {inProgressSim ? '⏸ IN CORSO' : '▶ PROSSIMA'}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px 0' }}>
              Simulazione #{activeSim.number}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px 0' }}>
              40 domande · 40 minuti · max 4 errori
            </p>
            <Link href={`/simulations/${activeSim.id}`} style={{
              display: 'block', textAlign: 'center', padding: '14px 0',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 16,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
            }}>
              {inProgressSim ? 'Continua simulazione →' : 'Inizia simulazione →'}
            </Link>
          </div>
        )}

        {/* Progress bar simulazioni */}
        {simulations.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Progresso</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{completed}/{simulations.length}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #2563EB, #06B6D4)',
                width: `${(completed / simulations.length) * 100}%`,
                transition: 'width 1s ease'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {simulations.map(sim => {
                const last = getLastAttempt(sim.id)
                const done = last?.status === 'COMPLETED'
                const active = last?.status === 'IN_PROGRESS'
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{
                    width: 28, height: 28, borderRadius: 6, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, textDecoration: 'none',
                    background: done ? (last.passed ? '#022C22' : '#2D0A0A') : active ? '#1E3A5F' : 'var(--bg)',
                    color: done ? (last.passed ? '#10B981' : '#EF4444') : active ? '#60A5FA' : 'var(--muted)',
                    border: `1px solid ${done ? (last.passed ? '#10B98144' : '#EF444444') : active ? '#2563EB' : 'var(--border)'}`,
                  }}>
                    {sim.number}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Ultime completate */}
        {completedSims.length > 0 && (
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              Completate
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentCompleted.map(sim => {
                const last = getLastAttempt(sim.id)!
                return (
                  <div key={sim.id} style={{
                    background: 'var(--bg-card)', border: `1px solid ${last.passed ? '#10B98122' : '#EF444422'}`,
                    borderRadius: 14, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Simulazione #{sim.number}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                        <span style={{ fontSize: 12, color: last.passed ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                          {last.passed ? '✓ Promosso' : '✗ Non suff.'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{last.score}/40 · {last.errors} errori</span>
                      </div>
                    </div>
                    <Link href={`/simulations/${sim.id}`} style={{
                      fontSize: 12, padding: '8px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--subtext)', textDecoration: 'none', fontWeight: 600
                    }}>Riprova</Link>
                  </div>
                )
              })}
              {completedSims.length > 3 && (
                <button onClick={() => setShowAll(v => !v)} style={{
                  background: 'none', border: 'none', color: '#3B82F6', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', textAlign: 'center', padding: '8px',
                  fontFamily: 'inherit'
                }}>
                  {showAll ? 'Mostra meno ↑' : `Mostra tutte (${completedSims.length}) ↓`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nessuna simulazione completata */}
        {completed === 0 && !activeSim && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <p>Nessuna simulazione ancora!</p>
          </div>
        )}
      </div>
    </div>
  )
}
