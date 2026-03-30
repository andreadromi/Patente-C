'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, CheckCircle2, XCircle, Clock, Lock } from 'lucide-react'

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
  const pct = simulations.length > 0 ? Math.round((completed / simulations.length) * 100) : 0

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 12px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:4 }}>PATENTE C · CE</div>
        <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>RIEPILOGO</h1>
      </div>

      {/* Stats + progress */}
      <div style={{ padding:'0 16px 12px', flexShrink:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
          {[
            { v:simulations.length, label:'TOTALI', color:'#6B7280' },
            { v:completed, label:'FATTI', color:'#3B82F6' },
            { v:passed, label:'PASSATI', color:'#4ADE80' },
            { v:completed-passed, label:'FALLITI', color:'#F87171' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, letterSpacing:-0.5 }}>{s.v}</div>
              <div style={{ fontSize:8, fontWeight:700, color:'#374151', marginTop:3, letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, height:6, background:'#1F2937', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${pct}%`, borderRadius:3, transition:'width 1s ease' }}/>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:'#3B82F6', minWidth:35 }}>{pct}%</span>
        </div>
      </div>

      {/* Griglia — 4 colonne, celle più grandi */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 }}>
          {simulations.map(sim => {
            const last = getLast(sim.id)
            const done = last?.status === 'COMPLETED'
            const inProg = last?.status === 'IN_PROGRESS'
            const ok = last?.passed

            let bg = '#0C111D', border = '#1F2937', numColor = '#374151'
            let Icon = Lock, iconColor = '#374151'

            if (done && ok)     { bg='#052E16'; border='#166534'; numColor='#4ADE80'; Icon=CheckCircle2; iconColor='#4ADE80' }
            else if (done && !ok) { bg='#450A0A'; border='#7F1D1D'; numColor='#F87171'; Icon=XCircle; iconColor='#F87171' }
            else if (inProg)    { bg='#0F2147'; border='#1D4ED8'; numColor='#93C5FD'; Icon=Clock; iconColor='#93C5FD' }

            return (
              <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'12px 8px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <Icon size={15} color={iconColor}/>
                  <div style={{ fontSize:16, fontWeight:900, color:numColor, lineHeight:1 }}>{sim.number}</div>
                  {done && <div style={{ fontSize:9, color:ok?'#166534':'#7F1D1D', fontWeight:700 }}>{last?.score}/40</div>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div style={{ padding:'8px 16px', borderTop:'1px solid #111827', display:'flex', gap:14, flexShrink:0 }}>
        {[
          { Icon:CheckCircle2, color:'#4ADE80', label:'Passato' },
          { Icon:XCircle, color:'#F87171', label:'Fallito' },
          { Icon:Clock, color:'#93C5FD', label:'In corso' },
          { Icon:Lock, color:'#374151', label:'Da fare' },
        ].map(({ Icon, color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Icon size={11} color={color}/>
            <span style={{ fontSize:10, color:'#4B5563' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <BarChart3 size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Riepilogo</span>
        </div>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Deboli</span>
        </Link>
      </div>
    </div>
  )
}
