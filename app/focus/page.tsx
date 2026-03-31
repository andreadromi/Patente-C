'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, Target, Play, Clock, CheckCircle2 } from 'lucide-react'

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

  const byCapitolo: Record<string, { titolo: string; code: string; sims: Simulation[] }> = {}
  for (const sim of simulations) {
    const key = sim.capitoloCode || 'altro'
    if (!byCapitolo[key]) byCapitolo[key] = { titolo: sim.titolo || 'Altro', code: key, sims: [] }
    byCapitolo[key].sims.push(sim)
  }
  const capitoli = Object.values(byCapitolo)
  const completati = capitoli.filter(({ sims }) => sims.every(s => getLast(s.id)?.status === 'COMPLETED')).length

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      <div style={{ padding:'18px 18px 10px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:4 }}>PATENTE C · CE</div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>FOCUS</h1>
          <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{completati}/{capitoli.length}</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {capitoli.map(({ titolo, sims }) => {
          const done = sims.filter(s => getLast(s.id)?.status === 'COMPLETED').length
          const tuttoFatto = done === sims.length
          const pct = Math.round((done / sims.length) * 100)
          const inCorso = sims.find(s => getLast(s.id)?.status === 'IN_PROGRESS')
          const prossimo = inCorso || sims.find(s => !getLast(s.id)) || sims[sims.length-1]

          return (
            <Link key={titolo} href={`/simulations/${prossimo.id}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'#0C111D', border:`1px solid ${tuttoFatto ? '#166534' : '#1F2937'}`, borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                {/* Icona stato */}
                <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background: tuttoFatto ? '#052E16' : inCorso ? '#0F1E3D' : '#111827' }}>
                  {tuttoFatto
                    ? <CheckCircle2 size={20} color="#4ADE80"/>
                    : inCorso
                      ? <Clock size={20} color="#93C5FD"/>
                      : <Target size={20} color="#374151"/>}
                </div>

                {/* Testo + progress */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#F9FAFB', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{titolo}</div>
                  <div style={{ height:4, background:'#1F2937', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                    <div style={{ height:'100%', borderRadius:2, background: tuttoFatto ? '#4ADE80' : '#2563EB', width:`${pct}%`, transition:'width 0.5s' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'#374151' }}>{sims.length * 40} domande · {pct}%</div>
                </div>

                {/* CTA */}
                <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:10,
                  background: tuttoFatto ? '#052E16' : '#111827',
                  border:`1px solid ${tuttoFatto ? '#166534' : '#1F2937'}` }}>
                  {tuttoFatto
                    ? <CheckCircle2 size={13} color="#4ADE80"/>
                    : inCorso
                      ? <Clock size={13} color="#93C5FD"/>
                      : <Play size={13} color="#3B82F6"/>}
                  <span style={{ fontSize:12, fontWeight:700, color: tuttoFatto ? '#4ADE80' : inCorso ? '#93C5FD' : '#3B82F6' }}>
                    {tuttoFatto ? 'Fatto' : inCorso ? 'Riprendi' : 'Inizia'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={19} color="#4B5563"/><span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <Target size={19} color="#2563EB"/><span style={{ fontSize:9, color:'#2563EB', fontWeight:700 }}>Focus</span>
        </div>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={19} color="#4B5563"/><span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={19} color="#4B5563"/><span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
