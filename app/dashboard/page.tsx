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

  const getLastAttempt = (simId: string) =>
    userSims.filter(us => us.simulationId === simId)[0] || null

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const pct = simulations.length > 0 ? Math.round((completed / simulations.length) * 100) : 0

  const nextSim = simulations.find(sim => {
    const last = getLastAttempt(sim.id)
    return !last || last.status !== 'COMPLETED'
  })
  const inProgressSim = simulations.find(sim => getLastAttempt(sim.id)?.status === 'IN_PROGRESS')
  const activeSim = inProgressSim || nextSim

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'14px 20px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg, #2563EB, #06B6D4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🚛</div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', letterSpacing:1 }}>PATENTE C · CE</div>
              <div style={{ fontSize:15, fontWeight:700, marginTop:1 }}>{user?.username}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/weak-points" style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, textDecoration:'none', fontSize:18 }}>📚</Link>
            <button onClick={handleLogout} style={{ padding:'0 14px', height:36, background:'transparent', border:'1px solid var(--border)', borderRadius:10, color:'var(--muted)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Esci</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px' }}>

        {/* Prossima simulazione - hero card */}
        {activeSim && (
          <Link href={`/simulations/${activeSim.id}`} style={{ textDecoration:'none', display:'block', marginBottom:20 }}>
            <div style={{ borderRadius:24, overflow:'hidden', position:'relative',
              background:'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #0369A1 100%)',
              padding:'28px 24px', boxShadow:'0 8px 32px rgba(37,99,235,0.4)' }}>
              {/* Decorazione */}
              <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
              <div style={{ position:'absolute', right:20, bottom:-30, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>

              <div style={{ position:'relative' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:'#93C5FD', marginBottom:8 }}>
                  {inProgressSim ? '⏸ CONTINUA DA DOVE ERI' : '▶ PROSSIMA SIMULAZIONE'}
                </div>
                <h2 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 6px 0', letterSpacing:-0.5 }}>
                  Simulazione #{activeSim.number}
                </h2>
                <p style={{ color:'#93C5FD', fontSize:13, margin:'0 0 22px 0' }}>
                  40 domande · 40 minuti · max 4 errori
                </p>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(10px)', borderRadius:12, padding:'12px 20px', color:'#fff', fontWeight:800, fontSize:15 }}>
                  {inProgressSim ? 'Continua →' : 'Inizia →'}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { label:'Completate', value:`${completed}/${simulations.length}`, color:'#3B82F6', icon:'🎯' },
            { label:'Promosse', value:passed, color:'#10B981', icon:'✅' },
            { label:'Progresso', value:`${pct}%`, color:'#8B5CF6', icon:'📈' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'16px 12px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar totale */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'16px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>Tutte le simulazioni</span>
            <span style={{ fontSize:12, color:'var(--muted)' }}>{completed} di {simulations.length}</span>
          </div>
          <div style={{ height:8, background:'var(--bg)', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
            <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg, #2563EB, #06B6D4)', width:`${pct}%`, transition:'width 1s ease' }}/>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {simulations.map(sim => {
              const last = getLastAttempt(sim.id)
              const done = last?.status === 'COMPLETED'
              const active = last?.status === 'IN_PROGRESS'
              const isNext = sim.id === activeSim?.id && !active
              return (
                <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, textDecoration:'none', transition:'all 0.15s',
                  background: isNext ? '#1E3A8A' : done ? (last.passed ? '#022C22' : '#2D0A0A') : active ? '#1E3A5F' : 'var(--bg)',
                  color: isNext ? '#60A5FA' : done ? (last.passed ? '#10B981' : '#EF4444') : active ? '#60A5FA' : 'var(--muted)',
                  border:`1px solid ${isNext ? '#2563EB' : done ? (last.passed ? '#10B98133' : '#EF444433') : active ? '#2563EB33' : 'var(--border)'}`,
                  boxShadow: isNext ? '0 0 8px rgba(37,99,235,0.4)' : 'none',
                }}>
                  {sim.number}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Ultime completate */}
        {userSims.filter(us => us.status === 'COMPLETED').length > 0 && (
          <div>
            <h3 style={{ fontSize:12, fontWeight:700, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Storico</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {simulations.filter(sim => getLastAttempt(sim.id)?.status === 'COMPLETED').slice(0, 5).map(sim => {
                const last = getLastAttempt(sim.id)!
                return (
                  <div key={sim.id} style={{ background:'var(--bg-card)', border:`1px solid ${last.passed ? '#10B98122' : '#EF444422'}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background: last.passed ? '#022C22' : '#2D0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                        {last.passed ? '✅' : '❌'}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>Sim. #{sim.number}</div>
                        <div style={{ fontSize:12, color:'var(--muted)' }}>{last.score}/40 · {last.errors} errori</div>
                      </div>
                    </div>
                    <Link href={`/simulations/${sim.id}`} style={{ fontSize:12, padding:'7px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, color:'var(--subtext)', textDecoration:'none', fontWeight:600 }}>Riprova</Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
