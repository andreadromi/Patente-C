'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, Target, Play, Clock, CheckCircle2, ChevronRight } from 'lucide-react'

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
    if (!byCapitolo[key]) byCapitolo[key] = { titolo: sim.titolo || 'Altro', sims: [] }
    byCapitolo[key].sims.push(sim)
  }

  const capitoli = Object.entries(byCapitolo)
  const totaleArgomenti = capitoli.length
  const argomentiCompletati = capitoli.filter(([_, { sims }]) =>
    sims.every(s => getLast(s.id)?.status === 'COMPLETED')
  ).length

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 10px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:4 }}>PATENTE C · CE</div>
        <h1 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>FOCUS</h1>
        <p style={{ fontSize:12, color:'#4B5563', margin:'4px 0 0' }}>
          {argomentiCompletati}/{totaleArgomenti} argomenti completati
        </p>
      </div>

      {/* Lista argomenti */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 16px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {capitoli.map(([code, { titolo, sims }]) => {
            const completati = sims.filter(s => getLast(s.id)?.status === 'COMPLETED').length
            const passati = sims.filter(s => getLast(s.id)?.passed).length
            const tuttoFatto = completati === sims.length
            const pct = Math.round((completati / sims.length) * 100)

            // Trova il prossimo quiz da fare (in corso prima, poi il primo non completato)
            const inCorso = sims.find(s => getLast(s.id)?.status === 'IN_PROGRESS')
            const prossimo = inCorso || sims.find(s => !getLast(s.id))
            const target = prossimo || sims[sims.length - 1] // se tutti fatti, l'ultimo

            let bg = '#0C111D'
            let borderColor = '#1F2937'
            let accentColor = '#3B82F6'

            if (tuttoFatto) { bg = '#052E16'; borderColor = '#166534'; accentColor = '#4ADE80' }
            else if (inCorso) { borderColor = '#1D4ED8'; accentColor = '#93C5FD' }

            return (
              <Link key={code} href={`/simulations/${target.id}`} style={{ textDecoration:'none' }}>
                <div style={{ background:bg, border:`1.5px solid ${borderColor}`, borderRadius:18, padding:'16px', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ flex:1, marginRight:12 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#F9FAFB', marginBottom:2 }}>{titolo}</div>
                      <div style={{ fontSize:11, color:'#4B5563' }}>
                        {sims.length * 40} domande totali
                        {passati > 0 && <span style={{ color:'#4ADE80', marginLeft:6 }}>· {passati * 40} corrette</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {tuttoFatto
                        ? <CheckCircle2 size={22} color="#4ADE80"/>
                        : (
                          <div style={{ display:'flex', alignItems:'center', gap:6, background: inCorso ? '#0F1E3D' : '#111827', borderRadius:10, padding:'7px 12px' }}>
                            {inCorso ? <Clock size={14} color="#93C5FD"/> : <Play size={14} color="#3B82F6"/>}
                            <span style={{ fontSize:13, fontWeight:800, color: inCorso ? '#93C5FD' : '#3B82F6' }}>
                              {inCorso ? 'Continua' : pct > 0 ? `${pct}%` : 'Inizia'}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height:5, background:'#1F2937', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, transition:'width 0.6s ease',
                      background: tuttoFatto ? '#16A34A' : 'linear-gradient(90deg,#2563EB,#06B6D4)',
                      width:`${pct}%` }}/>
                  </div>

                  {/* Badge quiz completati */}
                  {completati > 0 && !tuttoFatto && (
                    <div style={{ fontSize:10, color:'#374151', marginTop:6 }}>
                      {completati}/{sims.length} sessioni completate
                    </div>
                  )}
                </div>
              </Link>
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
