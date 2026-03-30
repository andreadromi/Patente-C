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
  const [idx, setIdx] = useState(0)

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

  const getLast = (simId: string) => userSims.filter(us => us.simulationId === simId)[0] || null

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#020817', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1E2D4A', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const available = simulations.filter(s => getLast(s.id)?.status !== 'COMPLETED')
  const done = simulations.filter(s => getLast(s.id)?.status === 'COMPLETED')
  const cur = available[idx]
  const curLast = cur ? getLast(cur.id) : null
  const safeIdx = Math.min(idx, Math.max(0, available.length - 1))

  return (
    <div style={{ minHeight:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚛</div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C · CE</div>
            <div style={{ fontSize:15, fontWeight:700 }}>{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/weak-points" style={{ padding:'8px 14px', background:'#0D1424', border:'1px solid #1E2D4A', borderRadius:10, textDecoration:'none', fontSize:12, color:'#94A3B8', fontWeight:600 }}>📚 Punti deboli</Link>
          <button onClick={handleLogout} style={{ padding:'8px 12px', background:'transparent', border:'1px solid #1E2D4A', borderRadius:10, color:'#475569', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Esci</button>
        </div>
      </div>

      <div style={{ padding:'0 16px 32px' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {[
            { v:`${completed}`, sub:`di ${simulations.length}`, c:'#3B82F6', label:'Completate' },
            { v:`${passed}`, sub:'totali', c:'#10B981', label:'Promosse' },
            { v:`${available.length}`, sub:'rimaste', c:'#8B5CF6', label:'Da fare' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0D1424', border:'1px solid #1A2540', borderRadius:14, padding:'13px 10px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>{s.label}</div>
              <div style={{ fontSize:9, color:'#2D3748', marginTop:1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Card carosello — altezza fissa compatta */}
        {available.length > 0 && cur ? (
          <div style={{ marginBottom:16 }}>
            <Link href={`/simulations/${cur.id}`} style={{ textDecoration:'none', display:'block' }}>
              <div style={{ borderRadius:22, background:'linear-gradient(145deg,#1a3a7c,#1e40af,#0c4a8a)', padding:'22px 22px 20px', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(37,99,235,0.25)' }}>
                <div style={{ position:'absolute', right:-20, top:-20, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                      {curLast?.status==='IN_PROGRESS' ? '⏸ IN CORSO' : '▶ PROSSIMA'}
                    </span>
                    <span style={{ fontSize:11, color:'rgba(147,197,253,0.5)' }}>{safeIdx+1}/{available.length}</span>
                  </div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:-0.5, marginBottom:4 }}>Simulazione #{cur.number}</div>
                  <div style={{ color:'rgba(147,197,253,0.7)', fontSize:12, marginBottom:18 }}>40 domande · 40 minuti · max 4 errori</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'11px 20px' }}>
                    <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>{curLast?.status==='IN_PROGRESS' ? 'Continua' : 'Inizia'}</span>
                    <span style={{ color:'rgba(255,255,255,0.6)' }}>→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Frecce carosello */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                style={{ width:44, height:40, background:'#0D1424', border:'1px solid #1E2D4A', borderRadius:12, color:idx===0?'#1E2D4A':'#94A3B8', fontSize:16, cursor:idx===0?'default':'pointer', fontFamily:'inherit' }}>←</button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5, alignItems:'center' }}>
                {available.slice(0,7).map((_,i) => (
                  <button key={i} onClick={() => setIdx(i)} style={{ width:i===idx?18:6, height:6, borderRadius:3, border:'none', cursor:'pointer', transition:'all 0.2s', background:i===idx?'#2563EB':'#1E2D4A' }}/>
                ))}
                {available.length>7 && <span style={{ color:'#2D3748', fontSize:10 }}>+{available.length-7}</span>}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1,i+1))} disabled={idx===available.length-1}
                style={{ width:44, height:40, background:'#0D1424', border:'1px solid #1E2D4A', borderRadius:12, color:idx===available.length-1?'#1E2D4A':'#94A3B8', fontSize:16, cursor:idx===available.length-1?'default':'pointer', fontFamily:'inherit' }}>→</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'32px 20px', background:'#0D1424', border:'1px solid #1E2D4A', borderRadius:20, marginBottom:16 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🏆</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#10B981' }}>Tutte completate!</div>
          </div>
        )}

        {/* Storico */}
        {done.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:'#2D3748', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Storico</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {done.slice(0,4).map(sim => {
                const last = getLast(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0D1424', border:'1px solid #1A2540', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:last.passed?'#022C22':'#2D0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
                          {last.passed?'✅':'❌'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>Simulazione #{sim.number}</div>
                          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>
                            <span style={{ color:last.passed?'#10B981':'#EF4444', fontWeight:700 }}>{last.score}/40</span>
                            {' · '}{last.errors} errori
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize:11, color:'#2D3748' }}>Riprova →</span>
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
