'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, BookOpen, LogOut, CheckCircle2, XCircle, Play, Clock, Home, BarChart3, Target, ChevronLeft, ChevronRight } from 'lucide-react'

interface Simulation { id: string; number: number; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null }

const PER_PAGE = 6

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
      setUser(u.user)
      setSimulations(s.simulations || [])
      const sims = Array.isArray(us) ? us : []
      setUserSims(sims)

      // Auto-scroll to page of last completed
      const lastDone = sims.filter((u: UserSim) => u.status === 'COMPLETED')
      if (lastDone.length > 0) {
        const lastSimId = lastDone[0].simulationId
        const idx = (s.simulations || []).findIndex((sim: Simulation) => sim.id === lastSimId)
        if (idx >= 0) setPage(Math.floor(idx / PER_PAGE))
      }
      setLoading(false)
    })
  }, [router])

  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

  if (loading) return (
    <div style={{ height: '100dvh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1F2937', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(u => u.status === 'COMPLETED').length
  const passed = userSims.filter(u => u.passed).length
  const totalPages = Math.ceil(simulations.length / PER_PAGE)
  const pageItems = simulations.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  // Find last completed simulation id
  const lastCompletedId = userSims.filter(u => u.status === 'COMPLETED')[0]?.simulationId || null

  return (
    <div style={{ height: '100dvh', background: '#030712', color: '#F9FAFB', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', letterSpacing: 2 }}>PATENTE C · CE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F9FAFB', letterSpacing: -0.5 }}>{user?.username}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0C111D', border: '1px solid #1F2937', borderRadius: 10, cursor: 'pointer' }}>
          <LogOut size={14} color="#4B5563" />
        </button>
      </div>

      {/* Stats compatti */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 16px 10px', flexShrink: 0 }}>
        {[
          { big: completed, small: `/${simulations.length}`, label: 'FATTI', color: '#3B82F6' },
          { big: passed, small: '', label: 'PROMOSSI', color: '#4ADE80' },
          { big: simulations.length - completed, small: '', label: 'DA FARE', color: '#6B7280' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0C111D', border: '1px solid #1F2937', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>
              {s.big}{s.small && <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{s.small}</span>}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#4B5563', marginTop: 4, letterSpacing: 1.5 }}>{s.label}</div>
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
                flex: 1, borderRadius: 16, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: isLast ? '#0F1E3D' : '#0C111D',
                border: `1.5px solid ${isLast ? '#1E40AF' : isDone ? (isPassed ? '#14532D' : '#450A0A') : '#1F2937'}`,
                transition: 'all 0.2s',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: isLast ? '#60A5FA' : isDone ? (isPassed ? '#4ADE80' : '#F87171') : '#F9FAFB', lineHeight: 1 }}>
                      {sim.number}
                    </span>
                    {isDone ? (
                      isPassed ? <CheckCircle2 size={18} color="#4ADE80" /> : <XCircle size={18} color="#F87171" />
                    ) : inProgress ? (
                      <Clock size={16} color="#60A5FA" />
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.3 }}>
                    {sim.titolo || 'Quiz ' + sim.number}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {isDone ? (
                    <div style={{ fontSize: 11, fontWeight: 700, color: isPassed ? '#4ADE80' : '#F87171' }}>
                      {last.score}/40 · {last.errors} err.
                    </div>
                  ) : inProgress ? (
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>In corso</div>
                  ) : (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>40 domande</div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Paginazione */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', flexShrink: 0 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ width: 36, height: 32, background: '#0C111D', border: '1px solid #1F2937', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'default' : 'pointer' }}>
          <ChevronLeft size={16} color={page === 0 ? '#1F2937' : '#6B7280'} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', minWidth: 60, textAlign: 'center' }}>
          {page + 1} / {totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          style={{ width: 36, height: 32, background: '#0C111D', border: '1px solid #1F2937', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages - 1 ? 'default' : 'pointer' }}>
          <ChevronRight size={16} color={page === totalPages - 1 ? '#1F2937' : '#6B7280'} />
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#0C111D', borderTop: '1px solid #111827', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0' }}>
          <Home size={19} color="#2563EB" /><span style={{ fontSize: 9, color: '#2563EB', fontWeight: 700 }}>Home</span>
        </div>
        <Link href="/focus" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Target size={19} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Focus</span>
        </Link>
        <Link href="/riepilogo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BarChart3 size={20} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Riepilogo</span>
        </Link>
        <Link href="/weak-points" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BookOpen size={20} color="#4B5563" /><span style={{ fontSize: 9, color: '#4B5563', fontWeight: 600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
