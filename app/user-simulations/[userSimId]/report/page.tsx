'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, RotateCcw, Trophy, Target, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWrong, setShowWrong] = useState(false)
  const [anim, setAnim] = useState(false)

  useEffect(() => {
    fetch(`/api/user-simulations/${userSimId}/report`)
      .then(r => r.json())
      .then(d => { setReport(d); setLoading(false); setTimeout(() => setAnim(true), 80) })
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (loading) return (
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const errors = report.errors ?? (40 - (report.score ?? 0))
  const passed = report.passed
  const pct = Math.round(((report.score||0)/40)*100)
  const wrong = (report.answers||[]).filter((a:any)=>!a.isCorrect)
  const fmtTime = (s:number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Hero — compatto in cima */}
      <div style={{ flexShrink:0, padding:'28px 20px 20px', textAlign:'center', background: passed ? 'linear-gradient(180deg,#052E16,#030712)' : 'linear-gradient(180deg,#2D0A0A,#030712)' }}>
        <div style={{ opacity:anim?1:0, transform:anim?'scale(1)':'scale(0.5)', transition:'all 0.45s cubic-bezier(.175,.885,.32,1.275)', marginBottom:12 }}>
          {passed
            ? <Trophy size={52} color="#FBBF24" style={{ filter:'drop-shadow(0 0 20px rgba(251,191,36,0.5))' }}/>
            : <Target size={52} color="#F87171" style={{ filter:'drop-shadow(0 0 16px rgba(248,113,113,0.4))' }}/>}
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:-0.5, color:passed?'#4ADE80':'#F87171', margin:'0 0 4px', textTransform:'uppercase', opacity:anim?1:0, transition:'opacity 0.4s 0.15s' }}>
          {passed ? 'PROMOSSO!' : 'NON SUFFICIENTE'}
        </h1>
        <p style={{ color:'#4B5563', fontSize:12, margin:'0 0 16px' }}>Quiz {report.simulationNumber} · {fmtTime(report.timeElapsed||0)}</p>

        {/* 3 stat */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, opacity:anim?1:0, transition:'opacity 0.4s 0.25s' }}>
          {[
            { v:report.score, label:'Corrette', color:'#4ADE80' },
            { v:`${errors}`, label:'Errori', color:errors>4?'#F87171':'#FB923C', suffix:errors>4?'  ✗':'  ✓' },
            { v:`${pct}%`, label:'Score', color:'#60A5FA' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#0C111D', borderRadius:14, padding:'12px 8px', border:'1px solid #1F2937' }}>
              <div style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}{s.suffix||''}</div>
              <div style={{ fontSize:10, color:'#4B5563', marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginTop:14, opacity:anim?1:0, transition:'opacity 0.4s 0.35s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1, height:7, background:'#1F2937', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:4, background:passed?'linear-gradient(90deg,#16A34A,#4ADE80)':'linear-gradient(90deg,#DC2626,#F87171)', width:anim?`${pct}%`:'0%', transition:'width 1s 0.5s ease' }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:passed?'#4ADE80':'#F87171', minWidth:36 }}>{pct}%</span>
          </div>
          <p style={{ fontSize:11, color:'#374151', marginTop:6 }}>
            {passed ? 'Meno di 4 errori — promosso!' : `${errors-4} errori oltre il limite di 4`}
          </p>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px' }}>

        {/* Capitoli */}
        {report.capitoloResults?.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Per capitolo</div>
            <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:16, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {report.capitoloResults.map((cr:any) => (
                <div key={cr.capitoloCode}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'#9CA3AF' }}>{cr.capitolo}</span>
                    <span style={{ color:cr.accuracy>=50?'#4ADE80':'#F87171', fontWeight:700 }}>{cr.correct}/{cr.total}</span>
                  </div>
                  <div style={{ height:4, background:'#1F2937', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, background:cr.accuracy>=50?'#16A34A':'#DC2626', width:`${cr.accuracy}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errori accordion */}
        {wrong.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <button onClick={() => setShowWrong(v=>!v)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0C111D', border:'1px solid #1F2937', borderRadius:14, padding:'12px 14px', cursor:'pointer', fontFamily:'inherit', marginBottom:showWrong?8:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <XCircle size={15} color="#F87171"/>
                <span style={{ fontSize:13, fontWeight:700, color:'#F87171' }}>Risposte sbagliate ({wrong.length})</span>
              </div>
              {showWrong ? <ChevronUp size={14} color="#4B5563"/> : <ChevronDown size={14} color="#4B5563"/>}
            </button>
            {showWrong && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {wrong.map((a:any) => (
                  <div key={a.index} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:10, color:'#374151', marginBottom:5 }}>Q{a.index} · {a.capitolo}</div>
                    {a.image && (
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                        <img src={`https://www.patentisuperiori.com/img-sign/${a.image}`} alt="" style={{ maxWidth:120, maxHeight:90, objectFit:'contain', borderRadius:6, background:'#fff', padding:4 }}/>
                      </div>
                    )}
                    <p style={{ fontSize:13, color:'#D1D5DB', margin:'0 0 7px', lineHeight:1.5 }}>{a.text}</p>
                    <div style={{ display:'flex', gap:14, fontSize:11 }}>
                      <span style={{ color:'#F87171', fontWeight:700 }}>Tu: {a.userAnswer===null?'—':a.userAnswer?'VERO':'FALSO'}</span>
                      <span style={{ color:'#4ADE80', fontWeight:700 }}>✓ {a.risposta?'VERO':'FALSO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, paddingBottom:16 }}>
          <Link href={`/simulations/${report.simulationId||''}`}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', borderRadius:14, fontWeight:800, fontSize:15, textDecoration:'none', boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
            <RotateCcw size={16} color="#fff"/> Riprova
          </Link>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Link href="/dashboard" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'12px 0', background:'#0C111D', color:'#6B7280', borderRadius:12, fontWeight:700, fontSize:13, textDecoration:'none', border:'1px solid #1F2937' }}>
              <Home size={14} color="#6B7280"/> Home
            </Link>
            <Link href="/weak-points" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'12px 0', background:'#0C111D', color:'#6B7280', borderRadius:12, fontWeight:700, fontSize:13, textDecoration:'none', border:'1px solid #1F2937' }}>
              <BookOpen size={14} color="#6B7280"/> Deboli
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0, paddingBottom:'env(safe-area-inset-bottom,8px)' }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/focus" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Target size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Focus</span>
        </Link>
        <Link href="/weak-points" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BookOpen size={19} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
