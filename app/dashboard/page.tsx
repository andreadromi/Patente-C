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
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid #1E2D4A', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const pct = simulations.length > 0 ? Math.round((completed / simulations.length) * 100) : 0

  const inProgressSim = simulations.find(s => getLastAttempt(s.id)?.status === 'IN_PROGRESS')
  const nextSim = simulations.find(s => { const l = getLastAttempt(s.id); return !l || l.status !== 'COMPLETED' })
  const activeSim = inProgressSim || nextSim
  const completedSims = simulations.filter(s => getLastAttempt(s.id)?.status === 'COMPLETED')

  return (
    <div style={{ minHeight:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header sottile */}
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚛</div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C</div>
            <div style={{ fontSize:14, fontWeight:700, lineHeight:1 }}>{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/weak-points" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:10, textDecoration:'none', fontSize:12, color:'#94A3B8', fontWeight:600 }}>
            <span>📚</span> Deboli
          </Link>
          <button onClick={handleLogout} style={{ padding:'8px 14px', background:'transparent', border:'1px solid #1E2D4A', borderRadius:10, color:'#475569', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Esci</button>
        </div>
      </div>

      <div style={{ padding:'0 16px 32px', maxWidth:600, margin:'0 auto' }}>

        {/* Hero — prossima simulazione */}
        {activeSim && (
          <Link href={`/simulations/${activeSim.id}`} style={{ textDecoration:'none', display:'block', marginBottom:24 }}>
            <div style={{ borderRadius:28, background:'linear-gradient(145deg,#1a3a7c,#1e40af,#0c4a8a)', padding:'30px 26px', position:'relative', overflow:'hidden', boxShadow:'0 16px 48px rgba(37,99,235,0.35)' }}>
              <div style={{ position:'absolute', right:-40, top:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
              <div style={{ position:'absolute', right:30, bottom:-50, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(147,197,253,0.15)', borderRadius:20, padding:'4px 12px', marginBottom:14 }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>{inProgressSim ? '⏸ IN CORSO' : '▶ PROSSIMA'}</span>
                </div>
                <h2 style={{ fontSize:30, fontWeight:900, color:'#fff', margin:'0 0 8px 0', letterSpacing:-1 }}>
                  Simulazione #{activeSim.number}
                </h2>
                <p style={{ color:'rgba(147,197,253,0.8)', fontSize:13, margin:'0 0 24px 0' }}>
                  40 domande · 40 minuti · max 4 errori
                </p>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', borderRadius:14, padding:'12px 22px' }}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{inProgressSim ? 'Continua' : 'Inizia'}</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:18 }}>→</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
          {[
            { v: `${completed}`, sub: `di ${simulations.length} sim.`, c:'#3B82F6' },
            { v: `${passed}`, sub: 'promosse', c:'#10B981' },
            { v: `${pct}%`, sub: 'completato', c:'#8B5CF6' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:18, padding:'16px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:s.c, letterSpacing:-0.5 }}>{s.v}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Lista simulazioni completate */}
        {completedSims.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Storico</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {completedSims.slice(0,5).map(sim => {
                const last = getLastAttempt(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0F1729', border:`1px solid ${last.passed?'#10B98120':'#EF444420'}`, borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:last.passed?'#022C22':'#2D0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                          {last.passed ? '✅' : '❌'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#F1F5F9' }}>Sim. #{sim.number}</div>
                          <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>
                            <span style={{ color: last.passed?'#10B981':'#EF4444', fontWeight:700 }}>{last.score}/40</span>
                            <span> · {last.errors} errori</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:'#475569' }}>Riprova →</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* Tutte le simulazioni — accordion compatto */}
        {simulations.length > completedSims.length && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
              Disponibili ({simulations.length - completedSims.length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {simulations.filter(s => getLastAttempt(s.id)?.status !== 'COMPLETED').slice(0,6).map(sim => {
                const last = getLastAttempt(sim.id)
                const isActive = last?.status === 'IN_PROGRESS'
                const isNext = sim.id === activeSim?.id && !isActive
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background: isNext ? '#0F2A5A' : '#0F1729', border:`1px solid ${isNext?'#2563EB':isActive?'#2563EB33':'#1E2D4A'}`, borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background: isNext?'#1E3A8A':isActive?'#1E3A5F':'#0D1117', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: isNext?'#60A5FA':isActive?'#60A5FA':'#475569' }}>
                          {sim.number}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color: isNext?'#F1F5F9':'#94A3B8' }}>
                            Simulazione #{sim.number}
                            {isNext && <span style={{ marginLeft:8, fontSize:10, background:'#1E3A8A', color:'#60A5FA', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>PROSSIMA</span>}
                            {isActive && <span style={{ marginLeft:8, fontSize:10, background:'#1E3A5F', color:'#60A5FA', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>IN CORSO</span>}
                          </div>
                          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>40 domande</div>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color: isNext?'#3B82F6':'#475569' }}>→</div>
                    </div>
                  </Link>
                )
              })}
              {simulations.filter(s => getLastAttempt(s.id)?.status !== 'COMPLETED').length > 6 && (
                <div style={{ textAlign:'center', fontSize:12, color:'#475569', padding:'8px' }}>
                  + {simulations.filter(s => getLastAttempt(s.id)?.status !== 'COMPLETED').length - 6} altre simulazioni disponibili
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
