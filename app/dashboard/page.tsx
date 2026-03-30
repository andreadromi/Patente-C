'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, BookOpen, LogOut, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Play, Clock, Home, BarChart3 } from 'lucide-react'

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
    ]).then(([u, s, us]) => {
      if (!u.user) { router.push('/login'); return }
      setUser(u.user); setSimulations(s.simulations || [])
      setUserSims(Array.isArray(us) ? us : []); setLoading(false)
    })
  }, [router])

  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null
  const handleLogout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/login') }

  if (loading) return (
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(u => u.status === 'COMPLETED').length
  const passed = userSims.filter(u => u.passed).length
  const available = simulations.filter(s => getLast(s.id)?.status !== 'COMPLETED')
  const done = simulations.filter(s => getLast(s.id)?.status === 'COMPLETED')
  const safeIdx = Math.min(idx, Math.max(0, available.length - 1))
  const cur = available[safeIdx]
  const curLast = cur ? getLast(cur.id) : null
  const inProgress = curLast?.status === 'IN_PROGRESS'

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'16px 18px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(37,99,235,0.4)', flexShrink:0 }}>
            <Truck size={22} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2 }}>PATENTE C · CE</div>
            <div style={{ fontSize:18, fontWeight:900, color:'#F9FAFB', letterSpacing:-0.5, lineHeight:1.1 }}>{user?.username}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', background:'#0C111D', border:'1px solid #1F2937', borderRadius:10, cursor:'pointer' }}>
          <LogOut size={15} color="#4B5563"/>
        </button>
      </div>

      {/* Stats — niente icone sovrapposte, solo numeri grandi */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, padding:'0 16px 14px', flexShrink:0 }}>
        {[
          { big: completed, small: `/ ${simulations.length}`, label:'FATTI', color:'#3B82F6' },
          { big: passed, small: '', label:'PROMOSSI', color:'#4ADE80' },
          { big: available.length, small: '', label:'DA FARE', color:'#A78BFA' },
        ].map((s,i) => (
          <div key={i} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:14, padding:'13px 10px', textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1, letterSpacing:-1 }}>
              {s.big}{s.small && <span style={{ fontSize:12, color:'#374151', fontWeight:500 }}>{s.small}</span>}
            </div>
            <div style={{ fontSize:9, fontWeight:700, color:'#4B5563', marginTop:5, letterSpacing:1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Card quiz — flex 1 */}
      <div style={{ flex:1, padding:'0 16px', display:'flex', flexDirection:'column', minHeight:0, gap:10 }}>
        {available.length > 0 && cur ? (
          <>
            <Link href={`/simulations/${cur.id}`} style={{ textDecoration:'none', flex:1, display:'flex' }}>
              <div style={{ flex:1, borderRadius:22, background:'linear-gradient(150deg,#1E3A8A,#1E40AF 50%,#0C4A6E)', padding:'24px 22px', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(37,99,235,0.2)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ position:'absolute', right:-20, top:-20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
                <div style={{ position:'absolute', left:-10, bottom:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(147,197,253,0.12)', borderRadius:8, padding:'4px 11px' }}>
                      {inProgress ? <Clock size={10} color="#93C5FD"/> : <Play size={10} color="#93C5FD"/>}
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:'#93C5FD' }}>{inProgress ? 'IN CORSO' : 'PROSSIMO'}</span>
                    </div>
                    <span style={{ fontSize:11, color:'rgba(147,197,253,0.35)' }}>{safeIdx+1} / {available.length}</span>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(147,197,253,0.5)', letterSpacing:3, marginBottom:6, textTransform:'uppercase' }}>Quiz</div>
                  <div style={{ fontSize:52, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:-2, marginBottom:10 }}>{cur.number}</div>
                  <div style={{ color:'rgba(147,197,253,0.55)', fontSize:13 }}>40 domande · 40 min · max 4 errori</div>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.12)', borderRadius:14, padding:'13px 22px', alignSelf:'flex-start' }}>
                  {inProgress ? <Clock size={16} color="#fff"/> : <Play size={16} color="#fff"/>}
                  <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{inProgress ? 'Continua' : 'Inizia'}</span>
                </div>
              </div>
            </Link>

            {/* Frecce + dots */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                style={{ width:44, height:40, background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===0?'default':'pointer', flexShrink:0 }}>
                <ChevronLeft size={18} color={idx===0?'#1F2937':'#6B7280'}/>
              </button>
              <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5, alignItems:'center' }}>
                {(() => {
                  const total = available.length, max = 7
                  let start = Math.max(0, safeIdx - Math.floor(max/2))
                  let end = Math.min(total, start + max)
                  if (end - start < max) start = Math.max(0, end - max)
                  return available.slice(start, end).map((_, i) => {
                    const ri = start + i
                    return <button key={ri} onClick={() => setIdx(ri)}
                      style={{ width:ri===safeIdx?20:7, height:7, borderRadius:4, border:'none', cursor:'pointer', transition:'all 0.25s', background:ri===safeIdx?'#2563EB':'#1F2937' }}/>
                  })
                })()}
              </div>
              <button onClick={() => setIdx(i => Math.min(available.length-1,i+1))} disabled={idx===available.length-1}
                style={{ width:44, height:40, background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:idx===available.length-1?'default':'pointer', flexShrink:0 }}>
                <ChevronRight size={18} color={idx===available.length-1?'#1F2937':'#6B7280'}/>
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0C111D', border:'1px solid #1F2937', borderRadius:22 }}>
            <CheckCircle2 size={48} color="#4ADE80" style={{ marginBottom:10 }}/>
            <div style={{ fontSize:18, fontWeight:900, color:'#4ADE80', textTransform:'uppercase' }}>Tutti completati!</div>
          </div>
        )}

        {/* Storico compatto */}
        {done.length > 0 && (
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Storico recente</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {done.slice(0,2).map(sim => {
                const last = getLast(sim.id)!
                return (
                  <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:last.passed?'#052E16':'#450A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {last.passed ? <CheckCircle2 size={15} color="#4ADE80"/> : <XCircle size={15} color="#F87171"/>}
                        </div>
                        <span style={{ fontWeight:700, fontSize:13 }}>Quiz {sim.number}</span>
                        <span style={{ fontSize:12, color:'#4B5563' }}>
                          <span style={{ color:last.passed?'#4ADE80':'#F87171', fontWeight:700 }}>{last.score}/40</span>
                          {' · '}{last.errors} err.
                        </span>
                      </div>
                      <ChevronRight size={13} color="#374151"/>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

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
