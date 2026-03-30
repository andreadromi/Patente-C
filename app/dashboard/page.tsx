'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, BookOpen, LogOut, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Play, Clock, Home , BarChart3 } from 'lucide-react'

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
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const available = simulations.filter(s => getLast(s.id)?.status !== 'COMPLETED')
  const done = simulations.filter(s => getLast(s.id)?.status === 'COMPLETED')
  const safeIdx = Math.min(idx, Math.max(0, available.length - 1))
  const cur = available[safeIdx]
  const curLast = cur ? getLast(cur.id) : null

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'16px 18px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.4)', flexShrink:0 }}>
            <Truck size={22} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, textTransform:'uppercase' }}>Patente C · CE</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#F9FAFB', letterSpacing:-0.5, lineHeight:1.1 }}>{user?.username}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', background:'#0C111D', border:'1px solid #1F2937', borderRadius:10, cursor:'pointer' }}>
          <LogOut size={16} color="#4B5563"/>
        </button>
      </div>

      {/* Stats — 3 card compatte */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, padding:'0 16px', marginBottom:16, flexShrink:0 }}>
        {[
          { value: completed, total: simulations.length, label:'Fatti', color:'#3B82F6' },
          { value: passed, label:'Promossi', color:'#4ADE80' },
          { value: available.length, label:'Da fare', color:'#A78BFA' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1, letterSpacing:-0.5 }}>
              {s.value}
              {s.total && <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>/{s.total}</span>}
            </div>
            <div style={{ fontSize:11, color:'#4B5563', marginTop:4, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Carosello — prende tutto lo spazio rimasto */}
      <div style={{ flex:1, padding:'0 16px', display:'flex', flexDirection:'column', minHeight:0, marginBottom:8 }}>

        {available.length > 0 && cur ? (
          <>
            {/* Card quiz — si espande */}
            <Link href={`/simulations/${cur.id}`} style={{ textDecoration:'none', display:'flex', flex:1, marginBottom:10 }}>
              <div style={{ flex:1, borderRadius:22, background:'linear-gradient(150deg,#1E3A8A 0%,#1E40AF 60%,#0C4A6E 100%)', padding:'24px 22px', position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(37,99,235,0.25)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
                <div style={{ position:'absolute', right:30, bottom:-30, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }}/>

                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(147,197,253,0.15)', borderRadius:8, padding:'4px 12px' }}>
                      {curLast?.status === 'IN_PROGRESS'
                        ? <Clock size={11} color="#93C5FD"/>
                        : <Play size={11} color="#93C5FD"/>}
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>
                        {curLast?.status === 'IN_PROGRESS' ? 'IN CORSO' : 'DISPONIBILE'}
                      </span>
                    </div>
                    <span style={{ fontSize:12, color:'rgba(147,197,253,0.4)' }}>{safeIdx + 1}/{available.length}</span>
                  </div>

                  <div style={{ fontSize:13, fontWeight:600, color:'rgba(147,197,253,0.6)', marginBottom:4, letterSpacing:1 }}>QUIZ</div>
                  <div style={{ fontSize:40, fontWeight:900, color:'#fff', letterSpacing:-2, lineHeight:1, marginBottom:8 }}>
                    {cur.number}
                  </div>
                  <div style={{ color:'rgba(147,197,253,0.6)', fontSize:13 }}>
                    40 domande · 40 min · max 4 errori
                  </div>
                </div>

                <div style={{ position:'relative' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'13px 22px' }}>
                    {curLast?.status === 'IN_PROGRESS' ? <Clock size={16} color="#fff"/> : <Play size={16} color="#fff"/>}
                    <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>
                      {curLast?.status === 'IN_PROGRESS' ? 'Continua' : 'Inizia'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Frecce carosello */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <button onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx === 0}
                style={{ width:44, height:44, background:'#0C111D', border:'1px solid #1F2937', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===0?'default':'pointer', flexShrink:0 }}>
                <ChevronLeft size={20} color={idx===0?'#1F2937':'#6B7280'}/>
              </button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5, alignItems:'center' }}>
                {available.slice(0, 7).map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{ width:i===idx?20:7, height:7, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.2s', background:i===idx?'#2563EB':'#1F2937' }}/>
                ))}
                {available.length > 7 && <span style={{ fontSize:10, color:'#374151' }}>+{available.length-7}</span>}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1, i+1))} disabled={idx === available.length-1}
                style={{ width:44, height:44, background:'#0C111D', border:'1px solid #1F2937', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===available.length-1?'default':'pointer', flexShrink:0 }}>
                <ChevronRight size={20} color={idx===available.length-1?'#1F2937':'#6B7280'}/>
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0C111D', border:'1px solid #1F2937', borderRadius:22 }}>
            <CheckCircle2 size={48} color="#4ADE80" style={{ marginBottom:12 }}/>
            <div style={{ fontSize:20, fontWeight:900, color:'#4ADE80' }}>Tutti completati!</div>
            <div style={{ fontSize:13, color:'#4B5563', marginTop:4 }}>{simulations.length} quiz eseguiti</div>
          </div>
        )}
      </div>

      {/* Storico — solo se c'è spazio, max 2 voci */}
      {done.length > 0 && (
        <div style={{ padding:'0 16px', flexShrink:0, marginBottom:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Storico recente</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {done.slice(0, 2).map(sim => {
              const last = getLast(sim.id)!
              return (
                <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:13, padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:last.passed?'#052E16':'#450A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {last.passed ? <CheckCircle2 size={16} color="#4ADE80"/> : <XCircle size={16} color="#F87171"/>}
                      </div>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14 }}>Quiz {sim.number}</span>
                        <span style={{ fontSize:12, color:'#4B5563', marginLeft:8 }}>
                          <span style={{ color:last.passed?'#4ADE80':'#F87171', fontWeight:700 }}>{last.score}/40</span>
                          {' · '}{last.errors} errori
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#374151"/>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <Home size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Home</span>
        </div>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Deboli</span>
        </Link>
      </div>
    </div>
  )
}
