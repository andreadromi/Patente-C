'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, Target, Play, Clock, CheckCircle2 } from 'lucide-react'

interface Simulation { id: string; number: number; capitoloCode: string | null; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null }

const TOPIC_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  guida_riposo:      { from:'#1E3A5F', to:'#0C111D', accent:'#60A5FA' },
  cronotachigrafo:   { from:'#1E1B4B', to:'#0C111D', accent:'#A78BFA' },
  trasporto_persone: { from:'#1C3A2F', to:'#0C111D', accent:'#34D399' },
  documenti:         { from:'#1E3A5F', to:'#0C111D', accent:'#38BDF8' },
  incidente:         { from:'#3B1A1A', to:'#0C111D', accent:'#FB923C' },
  ruote:             { from:'#1A2E1A', to:'#0C111D', accent:'#4ADE80' },
  dimensioni:        { from:'#2D1B4E', to:'#0C111D', accent:'#C084FC' },
  visivo:            { from:'#1E3A5F', to:'#0C111D', accent:'#67E8F9' },
  caricamento:       { from:'#1C3A2F', to:'#0C111D', accent:'#6EE7B7' },
  rimorchi:          { from:'#2D2A1A', to:'#0C111D', accent:'#FCD34D' },
  motori:            { from:'#3B1A1A', to:'#0C111D', accent:'#F87171' },
  lubrificazione:    { from:'#1A2E2D', to:'#0C111D', accent:'#2DD4BF' },
  pneumatici:        { from:'#1E1B4B', to:'#0C111D', accent:'#818CF8' },
  freni:             { from:'#3B2A1A', to:'#0C111D', accent:'#FDBA74' },
  guasti:            { from:'#2A1A1A', to:'#0C111D', accent:'#FCA5A5' },
  manutenzione:      { from:'#1A2A2E', to:'#0C111D', accent:'#7DD3FC' },
  merci:             { from:'#2D2A1A', to:'#0C111D', accent:'#FDE68A' },
}

const DEFAULT_COLOR = { from:'#1E2D4A', to:'#0C111D', accent:'#3B82F6' }

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
  const argomentiCompletati = capitoli.filter(({ sims }) =>
    sims.every(s => getLast(s.id)?.status === 'COMPLETED')
  ).length

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 12px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, marginBottom:4 }}>PATENTE C · CE</div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:32, fontWeight:900, margin:0, letterSpacing:-1.5, textTransform:'uppercase' }}>FOCUS</h1>
          <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{argomentiCompletati}/{capitoli.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {capitoli.map(({ titolo, code, sims }) => {
            const completati = sims.filter(s => getLast(s.id)?.status === 'COMPLETED').length
            const tuttoFatto = completati === sims.length
            const pct = Math.round((completati / sims.length) * 100)
            const inCorso = sims.find(s => getLast(s.id)?.status === 'IN_PROGRESS')
            const prossimo = inCorso || sims.find(s => !getLast(s.id)) || sims[sims.length-1]
            const { from, accent } = TOPIC_COLORS[code] || DEFAULT_COLOR
            const totaleDomande = sims.length * 40

            return (
              <Link key={code} href={`/simulations/${prossimo.id}`} style={{ textDecoration:'none' }}>
                <div style={{
                  borderRadius:20, padding:'16px 14px',
                  background: tuttoFatto ? '#052E16' : `linear-gradient(145deg,${from},#0C111D)`,
                  border:`1px solid ${tuttoFatto ? '#166534' : accent}22`,
                  display:'flex', flexDirection:'column', gap:10,
                  minHeight:140, position:'relative', overflow:'hidden',
                  boxShadow: tuttoFatto ? 'none' : `0 4px 20px ${accent}15`
                }}>
                  {/* Cerchio decorativo */}
                  <div style={{ position:'absolute', right:-20, top:-20, width:80, height:80, borderRadius:'50%', background:`${accent}12` }}/>

                  {/* Icona status */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${accent}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {tuttoFatto
                        ? <CheckCircle2 size={18} color="#4ADE80"/>
                        : inCorso
                          ? <Clock size={18} color={accent}/>
                          : <Target size={18} color={accent}/>}
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color: tuttoFatto ? '#4ADE80' : accent }}>
                      {tuttoFatto ? '✓' : `${pct}%`}
                    </span>
                  </div>

                  {/* Titolo */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#F9FAFB', lineHeight:1.3, marginBottom:3 }}>{titolo}</div>
                    <div style={{ fontSize:11, color:'#4B5563' }}>{totaleDomande} domande</div>
                  </div>

                  {/* Progress + CTA */}
                  <div>
                    <div style={{ height:3, background:'#1F2937', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
                      <div style={{ height:'100%', borderRadius:2, background: tuttoFatto ? '#4ADE80' : accent, width:`${pct}%`, transition:'width 0.6s' }}/>
                    </div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${accent}18`, borderRadius:8, padding:'5px 10px' }}>
                      {tuttoFatto
                        ? <><CheckCircle2 size={11} color="#4ADE80"/><span style={{ fontSize:11, color:'#4ADE80', fontWeight:700 }}>Completato</span></>
                        : inCorso
                          ? <><Clock size={11} color={accent}/><span style={{ fontSize:11, color:accent, fontWeight:700 }}>Continua</span></>
                          : <><Play size={11} color={accent}/><span style={{ fontSize:11, color:accent, fontWeight:700 }}>Inizia</span></>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
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
