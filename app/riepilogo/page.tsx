'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3 , Target } from 'lucide-react'

interface Simulation { id: string; number: number }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null }

export default function RiepilogoPage() {
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

  const completed = userSims.filter(u => u.status === 'COMPLETED').length
  const passed = userSims.filter(u => u.passed).length
  const failed = completed - passed
  const pct = simulations.length > 0 ? Math.round((completed / simulations.length) * 100) : 0

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header compatto */}
      <div style={{ padding:'16px 18px 10px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:3 }}>PATENTE C · CE</div>
        <h1 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>RIEPILOGO</h1>
      </div>

      {/* Stats in una riga + progress */}
      <div style={{ padding:'0 16px 10px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {[
            { v:simulations.length, label:'Tot.', color:'#6B7280' },
            { v:completed, label:'Fatti', color:'#3B82F6' },
            { v:passed, label:'Pass.', color:'#4ADE80' },
            { v:failed, label:'Fall.', color:'#F87171' },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, padding:'9px 6px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:9, color:'#374151', marginTop:3, fontWeight:600, letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar spessa */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, height:8, background:'#1F2937', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${pct}%`, borderRadius:4, transition:'width 1s ease' }}/>
          </div>
          <span style={{ fontSize:13, fontWeight:800, color:'#3B82F6', minWidth:38, textAlign:'right' }}>{pct}%</span>
        </div>
      </div>

      {/* Griglia 5 colonne */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 8px' }}>
        <style>{`
          .grid-cell { transition: transform 0.1s; }
          .grid-cell:active { transform: scale(0.94); }
        `}</style>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
          {simulations.map(sim => {
            const last = getLast(sim.id)
            const done = last?.status === 'COMPLETED'
            const inProg = last?.status === 'IN_PROGRESS'
            const ok = last?.passed

            // Stili per stato
            let bg = '#0C111D'
            let borderColor = '#1F2937'
            let numColor = '#374151'
            let scoreColor = 'transparent'
            let dotColor = 'transparent'

            if (done && ok)      { bg='#052E16'; borderColor='#166534'; numColor='#4ADE80'; scoreColor='#166534' }
            else if (done && !ok){ bg='#2D0A0A'; borderColor='#7F1D1D'; numColor='#F87171'; scoreColor='#7F1D1D' }
            else if (inProg)     { bg='#0F1E3D'; borderColor='#2563EB'; numColor='#93C5FD'; dotColor='#2563EB' }

            return (
              <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }} className="grid-cell">
                <div style={{ background:bg, border:`1.5px solid ${borderColor}`, borderRadius:12, padding:'8px 4px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, position:'relative', minHeight:58 }}>

                  {/* Dot pulsante per "in corso" */}
                  {inProg && (
                    <div style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'#2563EB', boxShadow:'0 0 6px #2563EB' }}/>
                  )}

                  {/* Numero */}
                  <div style={{ fontSize:17, fontWeight:900, color:numColor, lineHeight:1 }}>{sim.number}</div>

                  {/* Score se completato */}
                  {done && (
                    <div style={{ fontSize:9, fontWeight:700, color: ok ? '#4ADE80' : '#F87171', lineHeight:1 }}>
                      {last?.score}/40
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Legenda compatta */}
      <div style={{ padding:'6px 16px 8px', borderTop:'1px solid #111827', display:'flex', gap:16, flexShrink:0 }}>
        {[
          { color:'#4ADE80', label:'Passato' },
          { color:'#F87171', label:'Fallito' },
          { color:'#2563EB', label:'In corso' },
          { color:'#374151', label:'Da fare' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:color }}/>
            <span style={{ fontSize:10, color:'#4B5563' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <BarChart3 size={20} color="#2563EB"/>
          <span style={{ fontSize:9, color:'#2563EB', fontWeight:700 }}>Riepilogo</span>
        </div>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
