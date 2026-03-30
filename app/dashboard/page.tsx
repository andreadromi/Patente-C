'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [carouselIdx, setCarouselIdx] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

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

  // Carosello — mostra tutte le simulazioni non ancora completate
  const availableSims = simulations.filter(s => getLastAttempt(s.id)?.status !== 'COMPLETED')
  const completedSims = simulations.filter(s => getLastAttempt(s.id)?.status === 'COMPLETED')
  const currentSim = availableSims[carouselIdx] || availableSims[0]

  const goPrev = () => setCarouselIdx(i => Math.max(0, i - 1))
  const goNext = () => setCarouselIdx(i => Math.min(availableSims.length - 1, i + 1))

  const simStatus = currentSim ? getLastAttempt(currentSim.id) : null
  const isInProgress = simStatus?.status === 'IN_PROGRESS'

  return (
    <div style={{ minHeight:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚛</div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C · CE</div>
            <div style={{ fontSize:14, fontWeight:700 }}>{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/weak-points" style={{ padding:'8px 14px', background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:10, textDecoration:'none', fontSize:12, color:'#94A3B8', fontWeight:600 }}>
            📚 Deboli
          </Link>
          <button onClick={handleLogout} style={{ padding:'8px 14px', background:'transparent', border:'1px solid #1E2D4A', borderRadius:10, color:'#475569', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Esci</button>
        </div>
      </div>

      <div style={{ padding:'0 16px 40px', maxWidth:600, margin:'0 auto' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:28 }}>
          {[
            { v:`${completed}/${simulations.length}`, sub:'completate', c:'#3B82F6' },
            { v:`${passed}`, sub:'promosse', c:'#10B981' },
            { v:`${simulations.length - completed}`, sub:'rimaste', c:'#8B5CF6' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:16, padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Carosello simulazioni */}
        {availableSims.length > 0 ? (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
              Prossime simulazioni
            </div>

            {/* Card carosello */}
            <div style={{ borderRadius:24, background:'linear-gradient(145deg,#1a3a7c,#1e40af,#0c4a8a)', padding:'28px 24px', position:'relative', overflow:'hidden', boxShadow:'0 12px 40px rgba(37,99,235,0.3)', marginBottom:14 }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
              <div style={{ position:'absolute', right:20, bottom:-40, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                    {isInProgress ? '⏸ IN CORSO' : '▶ DISPONIBILE'}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(147,197,253,0.6)' }}>
                    {carouselIdx + 1} di {availableSims.length}
                  </div>
                </div>
                <h2 style={{ fontSize:32, fontWeight:900, color:'#fff', margin:'0 0 6px 0', letterSpacing:-1 }}>
                  Simulazione #{currentSim?.number}
                </h2>
                <p style={{ color:'rgba(147,197,253,0.75)', fontSize:13, margin:'0 0 22px 0' }}>
                  40 domande · 40 minuti · max 4 errori
                </p>
                <Link href={`/simulations/${currentSim?.id}`} style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', borderRadius:14, padding:'13px 22px', textDecoration:'none' }}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{isInProgress ? 'Continua' : 'Inizia'}</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:20 }}>→</span>
                </Link>
              </div>
            </div>

            {/* Frecce carosello */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={goPrev} disabled={carouselIdx === 0}
                style={{ flex:1, padding:'13px 0', background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:14, color: carouselIdx === 0 ? '#1E2D4A' : '#94A3B8', fontSize:18, cursor: carouselIdx === 0 ? 'default' : 'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                ←
              </button>

              {/* Dots */}
              <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                {availableSims.slice(0, 7).map((_, i) => (
                  <button key={i} onClick={() => setCarouselIdx(i)}
                    style={{ width: i === carouselIdx ? 20 : 8, height:8, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.2s',
                      background: i === carouselIdx ? '#2563EB' : '#1E2D4A' }}/>
                ))}
                {availableSims.length > 7 && <span style={{ color:'#475569', fontSize:11 }}>+{availableSims.length-7}</span>}
              </div>

              <button onClick={goNext} disabled={carouselIdx === availableSims.length - 1}
                style={{ flex:1, padding:'13px 0', background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:14, color: carouselIdx === availableSims.length-1 ? '#1E2D4A' : '#94A3B8', fontSize:18, cursor: carouselIdx === availableSims.length-1 ? 'default' : 'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'40px 20px', background:'#0F1729', borderRadius:20, border:'1px solid #1E2D4A', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#10B981' }}>Tutte completate!</div>
            <div style={{ fontSize:13, color:'#475569', marginTop:6 }}>Hai fatto tutte e {simulations.length} le simulazioni</div>
          </div>
        )}

        {/* Storico completate */}
        {completedSims.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
              Storico ({completedSims.length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {completedSims.slice(0,5).map(sim => {
                const last = getLastAttempt(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0F1729', border:`1px solid ${last.passed?'#10B98120':'#EF444420'}`, borderRadius:16, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:38, height:38, borderRadius:11, background:last.passed?'#022C22':'#2D0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                          {last.passed ? '✅' : '❌'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>Simulazione #{sim.number}</div>
                          <div style={{ fontSize:12, color:'#475569', marginTop:1 }}>
                            <span style={{ color:last.passed?'#10B981':'#EF4444', fontWeight:700 }}>{last.score}/40</span>
                            {' · '}{last.errors} errori
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:'#475569' }}>Riprova →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
