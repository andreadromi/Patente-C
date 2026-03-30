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

  const getLastAttempt = (simId: string) => {
    const attempts = userSims.filter(us => us.simulationId === simId)
    return attempts.length ? attempts[0] : null
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const accuracy = completed > 0
    ? Math.round((userSims.filter(us => us.passed).length / completed) * 100)
    : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', borderRadius: 6, padding: '2px 10px', fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#fff' }}>
                PATENTE C
              </div>
            </div>
            <p style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              Ciao, {user?.username}! 👋
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/weak-points" style={{
              fontSize: 12, padding: '8px 14px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--subtext)', textDecoration: 'none', fontWeight: 600
            }}>
              📚 Punti deboli
            </Link>
            <button onClick={handleLogout} style={{
              fontSize: 12, padding: '8px 12px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--muted)', cursor: 'pointer'
            }}>Esci</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Simulate', value: completed, color: '#3B82F6' },
            { label: 'Promosse', value: passed, color: '#10B981' },
            { label: 'Precisione', value: `${accuracy}%`, color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '16px 12px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Simulazioni */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            {simulations.length} Simulazioni disponibili
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {simulations.map(sim => {
            const last = getLastAttempt(sim.id)
            const done = last?.status === 'COMPLETED'
            const inProgress = last?.status === 'IN_PROGRESS'
            return (
              <div key={sim.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${done && last.passed ? '#10B98133' : done ? '#EF444433' : 'var(--border)'}`,
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Simulazione #{sim.number}</span>
                    {inProgress && <span style={{ fontSize: 10, background: '#78350F', color: '#FCD34D', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>IN CORSO</span>}
                  </div>
                  {done ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: last.passed ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {last.passed ? '✓ Promosso' : '✗ Non suff.'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {last.score}/40 · {last.errors} errori
                      </span>
                    </div>
                  ) : !inProgress ? (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Non ancora eseguita</span>
                  ) : null}
                </div>
                <Link href={`/simulations/${sim.id}`} style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#fff',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  {done ? 'Riprova' : inProgress ? 'Continua' : 'Inizia'}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
