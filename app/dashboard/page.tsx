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

  return (
    <div style={{ height:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🚛</div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'#3B82F6', letterSpacing:1.5 }}>PATENTE C · CE</div>
            <div style={{ fontSize:14, fontWeight:700, lineHeight:1.2 }}>{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <Link href="/weak-points" style={{ padding:'7px 12px', background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:10, textDecoration:'none', fontSize:12, color:'#94A3B8', fontWeight:600 }}>📚</Link>
          <button onClick={handleLogout} style={{ padding:'7px 12px', background:'transparent', border:'1px solid #1E2D4A', borderRadius:10, color:'#475569', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>Esci</button>
        </div>
      </div>

      {/* Stats — compatte */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, padding:'0 16px', marginBottom:14, flexShrink:0 }}>
        {[
          { v:`${completed}/${simulations.length}`, sub:'completate', c:'#3B82F6' },
          { v:`${passed}`, sub:'promosse', c:'#10B981' },
          { v:`${available.length}`, sub:'rimaste', c:'#8B5CF6' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:14, padding:'11px 10px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Carosello principale — si espande */}
      <div style={{ flex:1, padding:'0 16px', display:'flex', flexDirection:'column', minHeight:0 }}>

        {available.length > 0 && cur ? (
          <>
            {/* Card simulazione */}
            <div style={{ flex:1, borderRadius:22, background:'linear-gradient(145deg,#1a3a7c,#1e40af,#0c4a8a)', padding:'22px 22px 18px', position:'relative', overflow:'hidden', boxShadow:'0 12px 40px rgba(37,99,235,0.3)', marginBottom:10, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
              <div style={{ position:'absolute', right:20, bottom:-35, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                    {curLast?.status === 'IN_PROGRESS' ? '⏸ IN CORSO' : '▶ DISPONIBILE'}
                  </span>
                  <span style={{ fontSize:11, color:'rgba(147,197,253,0.6)' }}>{idx+1} / {available.length}</span>
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:-1, marginBottom:4 }}>
                  Simulazione #{cur.number}
                </div>
                <div style={{ color:'rgba(147,197,253,0.75)', fontSize:12, marginBottom:0 }}>
                  40 domande · 40 min · max 4 errori
                </div>
              </div>
              <Link href={`/simulations/${cur.id}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(255,255,255,0.16)', backdropFilter:'blur(8px)', borderRadius:14, padding:'13px 0', textDecoration:'none', marginTop:16 }}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{curLast?.status === 'IN_PROGRESS' ? 'Continua' : 'Inizia'}</span>
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:16 }}>→</span>
              </Link>
            </div>

            {/* Frecce + dots */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexShrink:0 }}>
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                style={{ width:48, height:44, background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:12, color:idx===0?'#1E2D4A':'#94A3B8', fontSize:16, cursor:idx===0?'default':'pointer', fontFamily:'inherit' }}>←</button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:5 }}>
                {available.slice(0,8).map((_,i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{ width:i===idx?22:7, height:7, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.2s',
                      background:i===idx?'#2563EB':'#1E2D4A' }}/>
                ))}
                {available.length > 8 && <span style={{ color:'#475569', fontSize:10 }}>+{available.length-8}</span>}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1,i+1))} disabled={idx===available.length-1}
                style={{ width:48, height:44, background:'#0F1729', border:'1px solid #1E2D4A', borderRadius:12, color:idx===available.length-1?'#1E2D4A':'#94A3B8', fontSize:16, cursor:idx===available.length-1?'default':'pointer', fontFamily:'inherit' }}>→</button>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0F1729', borderRadius:22, border:'1px solid #1E2D4A', marginBottom:14 }}>
            <div style={{ fontSize:44 }}>🏆</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#10B981', marginTop:8 }}>Tutte completate!</div>
          </div>
        )}

        {/* Storico compatto — ultime 3 */}
        {done.length > 0 && (
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Storico</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {done.slice(0,3).map(sim => {
                const last = getLast(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0F1729', border:`1px solid ${last.passed?'#10B98118':'#EF444418'}`, borderRadius:13, padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:16 }}>{last.passed?'✅':'❌'}</span>
                        <div>
                          <span style={{ fontWeight:700, fontSize:13 }}>Sim. #{sim.number}</span>
                          <span style={{ fontSize:12, color:'#475569', marginLeft:8 }}>{last.score}/40 · {last.errors} err.</span>
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:'#475569' }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
      <div style={{ height:16 }}/>
    </div>
  )
}
