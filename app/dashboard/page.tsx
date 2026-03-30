'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, BookOpen, LogOut, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Play, Clock, Home } from 'lucide-react'

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
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const available = simulations.filter(s => getLast(s.id)?.status !== 'COMPLETED')
  const done = simulations.filter(s => getLast(s.id)?.status === 'COMPLETED')
  const cur = available[Math.min(idx, Math.max(0, available.length-1))]
  const curLast = cur ? getLast(cur.id) : null

  return (
    <div style={{ minHeight:'100vh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', paddingBottom:72 }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.4)' }}>
            <Truck size={22} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2 }}>PATENTE C · CE</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#F9FAFB', lineHeight:1.2 }}>{user?.username}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid #1F2937', borderRadius:10, cursor:'pointer' }}>
          <LogOut size={16} color="#4B5563"/>
        </button>
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {[
            { v:completed, sub:`/ ${simulations.length}`, label:'Quiz fatti', c:'#3B82F6', Icon: CheckCircle2 },
            { v:passed, sub:'totali', label:'Promossi', c:'#4ADE80', Icon: CheckCircle2 },
            { v:available.length, sub:'rimasti', label:'Da fare', c:'#A78BFA', Icon: Clock },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:16, padding:'14px 10px', textAlign:'center' }}>
              <s.Icon size={16} color={s.c} style={{ margin:'0 auto 6px' }}/>
              <div style={{ fontSize:22, fontWeight:900, color:s.c, lineHeight:1 }}>
                {s.v}<span style={{ fontSize:11, color:'#374151', fontWeight:400 }}>{s.sub}</span>
              </div>
              <div style={{ fontSize:10, color:'#4B5563', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Carosello quiz */}
        {available.length > 0 && cur ? (
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:12, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>
              {curLast?.status === 'IN_PROGRESS' ? 'In corso' : 'Prossimo quiz'}
            </h2>
            <Link href={`/simulations/${cur.id}`} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
              <div style={{ borderRadius:22, background:'linear-gradient(145deg,#1E3A8A,#1E40AF,#0C4A6E)', padding:'22px 20px', position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(37,99,235,0.25)' }}>
                <div style={{ position:'absolute', right:-15, top:-15, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(147,197,253,0.12)', borderRadius:8, padding:'3px 10px' }}>
                      {curLast?.status === 'IN_PROGRESS'
                        ? <Clock size={10} color="#93C5FD"/>
                        : <Play size={10} color="#93C5FD"/>}
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                        {curLast?.status === 'IN_PROGRESS' ? 'IN CORSO' : 'DISPONIBILE'}
                      </span>
                    </div>
                    <span style={{ fontSize:11, color:'rgba(147,197,253,0.4)' }}>{Math.min(idx,available.length-1)+1}/{available.length}</span>
                  </div>
                  <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:-0.5, marginBottom:4 }}>
                    Quiz {cur.number}
                  </div>
                  <div style={{ color:'rgba(147,197,253,0.65)', fontSize:12, marginBottom:18 }}>40 domande · 40 minuti · max 4 errori</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.14)', borderRadius:12, padding:'10px 18px' }}>
                    {curLast?.status === 'IN_PROGRESS' ? <Clock size={14} color="#fff"/> : <Play size={14} color="#fff"/>}
                    <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>
                      {curLast?.status === 'IN_PROGRESS' ? 'Continua' : 'Inizia'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Controlli carosello */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                style={{ width:40, height:40, background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===0?'default':'pointer', flexShrink:0 }}>
                <ChevronLeft size={18} color={idx===0?'#1F2937':'#6B7280'}/>
              </button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5, alignItems:'center' }}>
                {available.slice(0,7).map((_,i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{ width:i===idx?18:6, height:6, borderRadius:3, border:'none', cursor:'pointer', transition:'all 0.2s', background:i===idx?'#2563EB':'#1F2937' }}/>
                ))}
                {available.length>7 && <span style={{ fontSize:10, color:'#374151' }}>+{available.length-7}</span>}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1,i+1))} disabled={idx===available.length-1}
                style={{ width:40, height:40, background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===available.length-1?'default':'pointer', flexShrink:0 }}>
                <ChevronRight size={18} color={idx===available.length-1?'#1F2937':'#6B7280'}/>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'28px 20px', background:'#0C111D', border:'1px solid #1F2937', borderRadius:20, marginBottom:20 }}>
            <CheckCircle2 size={40} color="#4ADE80" style={{ marginBottom:8 }}/>
            <div style={{ fontSize:16, fontWeight:800, color:'#4ADE80' }}>Tutti i quiz completati!</div>
          </div>
        )}

        {/* Storico */}
        {done.length > 0 && (
          <>
            <h2 style={{ fontSize:12, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Storico</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {done.slice(0,5).map(sim => {
                const last = getLast(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:last.passed?'#052E16':'#450A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {last.passed ? <CheckCircle2 size={18} color="#4ADE80"/> : <XCircle size={18} color="#F87171"/>}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>Quiz {sim.number}</div>
                          <div style={{ fontSize:11, color:'#4B5563', marginTop:1 }}>
                            <span style={{ color:last.passed?'#4ADE80':'#F87171', fontWeight:700 }}>{last.score}/40</span>
                            {' · '}{last.errors} errori
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#374151"/>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0' }}>
          <Home size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Home</span>
        </div>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
