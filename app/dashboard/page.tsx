'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Truck, LogOut, CheckCircle2, XCircle, Play, Clock, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface Simulation { id: string; number: number; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null }

const PER_PAGE = 6

function fmtName(username: string) {
  return username.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
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
      setUser(u.user)
      setSimulations(s.simulations || [])
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
  const lastCompletedId = userSims.filter(u => u.status === 'COMPLETED')[0]?.simulationId || null

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={19} color="#fff" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', letterSpacing: 1 }}>PATENTE C · CE</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{user ? fmtName(user.username) : ''}</span>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer' }}>
            {theme === 'dark' ? <Sun size={13} color="var(--text3)" /> : <Moon size={13} color="var(--text3)" />}
          </button>
          <button onClick={handleLogout}
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer' }}>
            <LogOut size={13} color="var(--text3)" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 16px 10px', flexShrink: 0 }}>
        {[
          { big: completed, label: 'FATTI', sub: `di ${simulations.length}`, color: 'var(--accent2)' },
          { big: passed, label: 'PROMOSSI', sub: '', color: 'var(--green)' },
          { big: simulations.length - completed, label: 'DA FARE', sub: '', color: 'var(--text3)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.big}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text3)', marginTop: 4, letterSpacing: 1.5 }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Grid 6 cards */}
      <div style={{ flex: 1, padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3,1fr)', gap: 8, minHeight: 0 }}>
        {pageItems.map(sim => {
          const last = getLast(sim.id)
          const isDone = last?.status === 'COMPLETED'
          const isPassed = last?.passed
          const inProgress = last?.status === 'IN_PROGRESS'
          const isLast = sim.id === lastCompletedId

          return (
            <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
              <div style={{
                flex: 1, borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: 'var(--card)',
                border: `1.5px solid ${isDone ? (isPassed ? 'var(--green)' : 'var(--red)') : isLast ? 'var(--accent)' : 'var(--border)'}`,
                opacity: isDone && !isLast ? 0.85 : 1,
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{sim.number}</span>
                    {isDone ? (isPassed ? <CheckCircle2 size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />) 
                      : inProgress ? <Clock size={14} color="var(--accent2)" /> : null}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.3 }}>{sim.titolo || 'Quiz ' + sim.number}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: isDone ? (isPassed ? 'var(--green)' : 'var(--red)') : inProgress ? 'var(--accent2)' : 'var(--text4)' }}>
                  {isDone ? `${last.score}/40 · ${last.errors} err.` : inProgress ? 'In corso' : '40 domande'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Paginazione */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', flexShrink: 0 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ width: 36, height: 32, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'default' : 'pointer' }}>
          <ChevronLeft size={16} color={page === 0 ? 'var(--border)' : 'var(--text3)'} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', minWidth: 60, textAlign: 'center' }}>{page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          style={{ width: 36, height: 32, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages - 1 ? 'default' : 'pointer' }}>
          <ChevronRight size={16} color={page === totalPages - 1 ? 'var(--border)' : 'var(--text3)'} />
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
