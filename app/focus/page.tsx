'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, Target, ChevronRight, CheckCircle2, Lock } from 'lucide-react'

interface Simulation { id: string; number: number; capitoloCode: string | null; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null }

export default function FocusPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
    ]).then(([u, s, us]) => {
      if (!u.user) { router.push('/login'); return }
      setSimulations(s.simulations || [])
      setUserSims(Array.isArray(us) ? us : [])
      setLoading(false)
    })
  }, [router])

  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null

  if (loading) return (
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Raggruppa per capitolo
  const byCapitolo: Record<string, { titolo: string; sims: Simulation[] }> = {}
  for (const sim of simulations) {
    const key = sim.capitoloCode || 'altro'
    const titolo = sim.titolo || 'Altro'
    if (!byCapitolo[key]) byCapitolo[key] = { titolo, sims: [] }
    byCapitolo[key].sims.push(sim)
  }

  const capitoli = Object.entries(byCapitolo)

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 12px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:4 }}>PATENTE C · CE</div>
        <h1 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>FOCUS</h1>
        <p style={{ fontSize:12, color:'#4B5563', margin:'4px 0 0' }}>Quiz tematici per argomento</p>
      </div>

      {/* Lista capitoli scrollabile */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {capitoli.map(([code, { titolo, sims }]) => {
            const completati = sims.filter(s => getLast(s.id)?.status === 'COMPLETED').length
            const passati = sims.filter(s => getLast(s.id)?.passed).length
            const tuttiDone = completati === sims.length
            const pct = sims.length > 0 ? Math.round((completati / sims.length) * 100) : 0

            return (
              <div key={code} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:18, overflow:'hidden' }}>
                {/* Header capitolo */}
                <div style={{ padding:'14px 16px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ flex:1, marginRight:12 }}>
                      <div style={{ fontSize:15, fontWeight:800, color:'#F9FAFB', marginBottom:2 }}>{titolo}</div>
                      <div style={{ fontSize:11, color:'#4B5563' }}>
                        {completati}/{sims.length} quiz · {passati} promossi
                      </div>
                    </div>
                    {tuttiDone
                      ? <CheckCircle2 size={20} color="#4ADE80"/>
                      : <span style={{ fontSize:12, fontWeight:700, color:'#3B82F6' }}>{pct}%</span>}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:4, background:'#1F2937', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${pct}%`, borderRadius:2, transition:'width 0.6s ease' }}/>
                  </div>
                </div>

                {/* Quiz del capitolo */}
                <div style={{ borderTop:'1px solid #1F2937', display:'flex', flexDirection:'column' }}>
                  {sims.map((sim, i) => {
                    const last = getLast(sim.id)
                    const done = last?.status === 'COMPLETED'
                    const inProg = last?.status === 'IN_PROGRESS'
                    const ok = last?.passed
                    return (
                      <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                        <div style={{ padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: i < sims.length - 1 ? '1px solid #111827' : 'none' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                              background: done ? (ok ? '#052E16' : '#2D0A0A') : inProg ? '#0F1E3D' : '#111827' }}>
                              {done
                                ? (ok ? <CheckCircle2 size={15} color="#4ADE80"/> : <Target size={15} color="#F87171"/>)
                                : <span style={{ fontSize:12, fontWeight:800, color: inProg ? '#93C5FD' : '#374151' }}>{i+1}</span>}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color: done ? (ok ? '#4ADE80' : '#F87171') : inProg ? '#93C5FD' : '#9CA3AF' }}>
                                Quiz {i+1}
                                {inProg && <span style={{ fontSize:10, color:'#3B82F6', marginLeft:6, fontWeight:600 }}>· in corso</span>}
                              </div>
                              {done && <div style={{ fontSize:11, color:'#4B5563', marginTop:1 }}>{last?.score}/40 risposte corrette</div>}
                            </div>
                          </div>
                          <ChevronRight size={14} color="#374151"/>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <Target size={19} color="#2563EB"/>
          <span style={{ fontSize:9, color:'#2563EB', fontWeight:700 }}>Focus</span>
        </div>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
