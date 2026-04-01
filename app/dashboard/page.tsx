'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface Simulation { id: string; number: number; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null }

const PER_PAGE = 4

function fmtName(u: string) { return u.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
    ]).then(([u, s, us]) => {
      if (!u.user) { router.push('/login'); return }
      setUser(u.user); setSimulations(s.simulations || [])
      const sims = Array.isArray(us) ? us : []
      setUserSims(sims)
      const lastDone = sims.filter((u: UserSim) => u.status === 'COMPLETED')
      if (lastDone.length > 0) {
        const idx = (s.simulations || []).findIndex((sim: Simulation) => sim.id === lastDone[0].simulationId)
        if (idx >= 0) setPage(Math.floor(idx / PER_PAGE))
      }
      setLoading(false)
    })
  }, [router])

  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

  if (loading) return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const completed = userSims.filter(u => u.status === 'COMPLETED').length
  const passed = userSims.filter(u => u.passed).length
  const totalPages = Math.ceil(simulations.length / PER_PAGE)
  const pageItems = simulations.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent)', letterSpacing: 1 }}>PATENTE C · CE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{user ? fmtName(user.username) : ''}</span>
          <button onClick={handleLogout} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
            <LogOut size={13} color="var(--text3)" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 14px', flexShrink: 0 }}>
        {[
          { n: completed, label: 'Fatti', color: 'var(--accent)' },
          { n: passed, label: 'Promossi', color: 'var(--green)' },
          { n: simulations.length - completed, label: 'Da fare', color: 'var(--text3)' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.n}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0, alignContent: 'start' }}>
        {pageItems.map(sim => {
          const last = getLast(sim.id)
          const isDone = last?.status === 'COMPLETED'
          const isPassed = last?.passed
          const inProgress = last?.status === 'IN_PROGRESS'

          return (
            <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                borderRadius: 16, padding: '18px 16px', background: 'var(--card)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 32, fontWeight: 900, lineHeight: 1,
                    color: isDone ? (isPassed ? 'var(--green)' : 'var(--red)') : 'var(--text)',
                  }}>{sim.number}</span>
                  {isDone && <CheckCircle2 size={16} color={isPassed ? 'var(--green)' : 'var(--red)'} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.3 }}>{sim.titolo || 'Quiz ' + sim.number}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 'auto' }}>
                  {isDone ? `${last.score}/40` : inProgress ? 'In corso' : '40 domande'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Paginazione */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 20px', flexShrink: 0 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ width: 36, height: 34, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'default' : 'pointer' }}>
          <ChevronLeft size={16} color={page === 0 ? 'var(--border)' : 'var(--text3)'} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)' }}>{page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          style={{ width: 36, height: 34, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages - 1 ? 'default' : 'pointer' }}>
          <ChevronRight size={16} color={page === totalPages - 1 ? 'var(--border)' : 'var(--text3)'} />
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
