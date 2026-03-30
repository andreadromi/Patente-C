'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, BookOpen, LogOut, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Play, Clock } from 'lucide-react'

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
  const cur = available[Math.min(idx, available.length-1)]
  const curLast = cur ? getLast(cur.id) : null

  return (
    <div style={{ minHeight:'100vh', background:'#020817', color:'#F1F5F9', fontFamily:'system-ui,-apple-system,sans-serif', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Logo */}
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(37,99,235,0.4)' }}>
            <Truck size={22} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'#3B82F6', letterSpacing:2, textTransform:'uppercase' }}>Patente C · CE</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#F1F5F9', lineHeight:1.2 }}>{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/weak-points" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#0D1424', border:'1px solid #1A2540', borderRadius:12, textDecoration:'none', fontSize:12, color:'#94A3B8', fontWeight:600 }}>
            <BookOpen size={14} color="#94A3B8"/>
            Punti deboli
          </Link>
          <button onClick={handleLogout} style={{ padding:'8px 12px', background:'transparent', border:'1px solid #1A2540', borderRadius:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center' }}>
            <LogOut size={15} color="#475569"/>
          </button>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:22 }}>
          {[
            { v:`${completed}`, sub:`/ ${simulations.length}`, label:'Completate', c:'#3B82F6', icon:'🎯' },
            { v:`${passed}`, sub:'totali', label:'Promosse', c:'#10B981', icon:'✅' },
            { v:`${available.length}`, sub:'rimaste', label:'Da fare', c:'#8B5CF6', icon:'⏳' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0D1424', border:'1px solid #1A2540', borderRadius:16, padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:11, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}<span style={{ fontSize:12, color:'#2D3748', fontWeight:400 }}>{s.sub}</span></div>
              <div style={{ fontSize:10, color:'#475569', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Carosello */}
        {available.length > 0 && cur ? (
          <div style={{ marginBottom:22 }}>
            {/* Card simulazione */}
            <Link href={`/simulations/${cur.id}`} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
              <div style={{ borderRadius:22, background:'linear-gradient(145deg,#1a3a7c,#1e40af,#0c4a8a)', padding:'22px 20px', position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(37,99,235,0.3)' }}>
                <div style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(147,197,253,0.15)', borderRadius:8, padding:'3px 10px' }}>
                      {curLast?.status === 'IN_PROGRESS'
                        ? <Clock size={11} color="#93C5FD"/>
                        : <Play size={11} color="#93C5FD"/>}
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                        {curLast?.status === 'IN_PROGRESS' ? 'IN CORSO' : 'DISPONIBILE'}
                      </span>
                    </div>
                    <span style={{ fontSize:11, color:'rgba(147,197,253,0.5)' }}>{Math.min(idx,available.length-1)+1}/{available.length}</span>
                  </div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:-0.5, marginBottom:4 }}>
                    Simulazione {cur.number}
                  </div>
                  <div style={{ color:'rgba(147,197,253,0.7)', fontSize:12, marginBottom:18 }}>40 domande · 40 minuti · max 4 errori</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'11px 18px' }}>
                    {curLast?.status === 'IN_PROGRESS'
                      ? <Clock size={15} color="#fff"/>
                      : <Play size={15} color="#fff"/>}
                    <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>{curLast?.status === 'IN_PROGRESS' ? 'Continua' : 'Inizia'}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Frecce + numeri */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                style={{ width:40, height:40, background:'#0D1424', border:'1px solid #1A2540', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===0?'default':'pointer', flexShrink:0 }}>
                <ChevronLeft size={18} color={idx===0?'#1E2D4A':'#94A3B8'}/>
              </button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5, alignItems:'center' }}>
                {available.slice(0,7).map((_,i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{ width:i===idx?20:7, height:7, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.2s',
                      background:i===idx?'#2563EB':'#1E2D4A' }}/>
                ))}
                {available.length>7 && <span style={{ fontSize:10, color:'#2D3748' }}>+{available.length-7}</span>}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1,i+1))} disabled={idx===available.length-1}
                style={{ width:40, height:40, background:'#0D1424', border:'1px solid #1A2540', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===available.length-1?'default':'pointer', flexShrink:0 }}>
                <ChevronRight size={18} color={idx===available.length-1?'#1E2D4A':'#94A3B8'}/>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'32px 20px', background:'#0D1424', border:'1px solid #1A2540', borderRadius:20, marginBottom:22 }}>
            <CheckCircle2 size={44} color="#10B981" style={{ marginBottom:10 }}/>
            <div style={{ fontSize:16, fontWeight:800, color:'#10B981' }}>Tutte completate!</div>
            <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>Hai fatto tutte le {simulations.length} simulazioni</div>
          </div>
        )}

        {/* Storico */}
        {done.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:'#2D3748', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Storico recente</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {done.slice(0,4).map(sim => {
                const last = getLast(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0D1424', border:'1px solid #1A2540', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:last.passed?'#022C22':'#2D0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {last.passed
                            ? <CheckCircle2 size={18} color="#10B981"/>
                            : <XCircle size={18} color="#EF4444"/>}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>Simulazione {sim.number}</div>
                          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>
                            <span style={{ color:last.passed?'#10B981':'#EF4444', fontWeight:700 }}>{last.score}/40</span>
                            {' · '}{last.errors} errori
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#2D3748"/>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#0A0F1C', borderTop:'1px solid #0D1424', display:'flex' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0' }}>
          <Truck size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Home</span>
        </div>
        <Link href="/weak-points" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#475569"/>
          <span style={{ fontSize:10, color:'#475569', fontWeight:600 }}>Deboli</span>
        </Link>
      </div>
    </div>
  )
}
