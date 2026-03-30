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
    ]).then(([userData, simsData, userSimsData]) => {
      if (!userData.user) { router.push('/login'); return }
      setSimulations(simsData.simulations || [])
      setUserSims(Array.isArray(userSimsData) ? userSimsData : [])
      setLoading(false)
    })
  }, [router])

  const getLast = (simId: string) => userSims.filter(us => us.simulationId === simId)[0] || null

  if (loading) return (
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const completed = userSims.filter(us => us.status === 'COMPLETED').length
  const passed = userSims.filter(us => us.passed).length
  const failed = completed - passed
  const pct = simulations.length > 0 ? Math.round((completed / simulations.length) * 100) : 0

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Patente C · CE</div>
        <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, color:'#F9FAFB' }}>Riepilogo</h1>
      </div>

      {/* Stats sommario */}
      <div style={{ padding:'0 16px', marginBottom:16, flexShrink:0 }}>
        <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:18, padding:'16px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          {[
            { v:simulations.length, label:'Totali', color:'#6B7280' },
            { v:completed, label:'Fatti', color:'#3B82F6' },
            { v:passed, label:'Promossi', color:'#4ADE80' },
            { v:failed, label:'Falliti', color:'#F87171' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:'#4B5563', marginTop:3, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#4B5563', marginBottom:5 }}>
            <span>Progresso complessivo</span>
            <span style={{ color:'#3B82F6', fontWeight:700 }}>{pct}%</span>
          </div>
          <div style={{ height:5, background:'#1F2937', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#2563EB,#06B6D4)', width:`${pct}%`, borderRadius:3, transition:'width 1s ease' }}/>
          </div>
        </div>
      </div>

      {/* Griglia quiz — scrollabile */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
          Tutti i quiz
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {simulations.map(sim => {
            const last = getLast(sim.id)
            const done = last?.status === 'COMPLETED'
            const inProgress = last?.status === 'IN_PROGRESS'
            const isPassed = last?.passed

            let bg = '#0C111D'
            let border = '#1F2937'
            let color = '#374151'
            let Icon = Lock

            if (done && isPassed) { bg = '#052E16'; border = '#166534'; color = '#4ADE80'; Icon = CheckCircle2 }
            else if (done && !isPassed) { bg = '#450A0A'; border = '#7F1D1D'; color = '#F87171'; Icon = XCircle }
            else if (inProgress) { bg = '#1E3A5F'; border = '#1D4ED8'; color = '#93C5FD'; Icon = Clock }

            return (
              <Link key={sim.id} href={`/simulations/${sim.id}`} style={{ textDecoration:'none' }}>
                <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'12px 6px', textAlign:'center', transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <Icon size={16} color={color}/>
                  <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{sim.number}</div>
                  {done && (
                    <div style={{ fontSize:9, color: isPassed ? '#166534' : '#7F1D1D', fontWeight:700 }}>
                      {last?.score}/40
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Legenda */}
        <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
          {[
            { Icon: CheckCircle2, color:'#4ADE80', label:'Promosso' },
            { Icon: XCircle, color:'#F87171', label:'Non suff.' },
            { Icon: Clock, color:'#93C5FD', label:'In corso' },
            { Icon: Lock, color:'#374151', label:'Non fatto' },
          ].map(({ Icon, color, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Icon size={12} color={color}/>
              <span style={{ fontSize:11, color:'#4B5563' }}>{label}</span>
            </div>
          ))}
        </div>
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
