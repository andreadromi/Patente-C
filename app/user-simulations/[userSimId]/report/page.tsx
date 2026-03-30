'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, RotateCcw, Home, BookOpen, Trophy, Target, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
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
  const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`
  const wrong = (report.answers||[]).filter((a:any) => !a.isCorrect)

  return (
    <div style={{ minHeight:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', paddingBottom:72 }}>

      {/* Hero */}
      <div style={{ padding:'40px 20px 28px', textAlign:'center', background:passed?'linear-gradient(180deg,#052E16 0%,#030712 100%)':'linear-gradient(180deg,#450A0A 0%,#030712 100%)' }}>
        <div style={{ marginBottom:16, opacity:anim?1:0, transform:anim?'scale(1)':'scale(0.4)', transition:'all 0.5s cubic-bezier(.175,.885,.32,1.275)' }}>
          {passed
            ? <Trophy size={64} color="#FBBF24" style={{ filter:'drop-shadow(0 0 24px rgba(251,191,36,0.5))' }}/>
            : <Target size={64} color="#F87171" style={{ filter:'drop-shadow(0 0 20px rgba(248,113,113,0.35))' }}/>}
        </div>
        <h1 style={{ fontSize:34, fontWeight:900, letterSpacing:-1, color:passed?'#4ADE80':'#F87171', margin:'0 0 4px', textTransform:'uppercase', opacity:anim?1:0, transition:'opacity 0.4s 0.2s' }}>
          {passed ? 'PROMOSSO' : 'NON SUFFICIENTE'}
        </h1>
        <p style={{ color:'#4B5563', fontSize:13, margin:'0 0 24px' }}>Quiz {report.simulationNumber} · {fmtTime(report.timeElapsed||0)}</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, maxWidth:340, margin:'0 auto', opacity:anim?1:0, transition:'opacity 0.4s 0.3s' }}>
          {[
            { v:report.score, label:'Corrette', color:'#4ADE80', Icon:CheckCircle2 },
            { v:errors, label:'Errori', color:errors>4?'#F87171':'#FB923C', Icon:XCircle, suffix:errors>4?' ✗':' ✓' },
            { v:`${pct}%`, label:'Score', color:'#60A5FA', Icon:BarChart3 },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 8px', border:'1px solid rgba(255,255,255,0.06)' }}>
              <s.Icon size={16} color={s.color} style={{ margin:'0 auto 6px', display:'block' }}/>
              <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.v}{s.suffix||''}</div>
              <div style={{ fontSize:10, color:'#4B5563', marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth:340, margin:'18px auto 0', opacity:anim?1:0, transition:'opacity 0.4s 0.4s' }}>
          <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:passed?'linear-gradient(90deg,#16A34A,#4ADE80)':'linear-gradient(90deg,#DC2626,#F87171)', width:anim?`${pct}%`:'0%', transition:'width 1s 0.5s ease' }}/>
          </div>
          <p style={{ fontSize:11, color:'#4B5563', marginTop:7 }}>
            {passed?'Complimenti! Meno di 4 errori.':`${errors-4} errori oltre il limite`}
          </p>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Capitoli */}
        {report.capitoloResults?.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#374151', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Per capitolo</div>
            <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:16, padding:'14px', display:'flex', flexDirection:'column', gap:9 }}>
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
          <div style={{ marginBottom:16 }}>
            <button onClick={() => setShow(v=>!v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0C111D', border:'1px solid #1F2937', borderRadius:14, padding:'13px 16px', cursor:'pointer', fontFamily:'inherit', marginBottom:show?8:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <XCircle size={15} color="#F87171"/>
                <span style={{ fontSize:13, fontWeight:700, color:'#F87171' }}>Errori ({wrong.length})</span>
              </div>
              {show?<ChevronUp size={15} color="#4B5563"/>:<ChevronDown size={15} color="#4B5563"/>}
            </button>
            {show && (
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {wrong.map((a:any) => (
                  <div key={a.index} style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:13, padding:'13px 15px' }}>
                    <div style={{ fontSize:10, color:'#4B5563', marginBottom:5 }}>Q{a.index} · {a.capitolo}</div>
                    <p style={{ fontSize:13, color:'#D1D5DB', margin:'0 0 7px', lineHeight:1.5 }}>{a.text}</p>
                    <div style={{ display:'flex', gap:14, fontSize:12 }}>
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
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          <Link href={`/simulations/${report.simulationId||''}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', borderRadius:16, fontWeight:800, fontSize:15, textDecoration:'none', boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
            <RotateCcw size={17} color="#fff"/> Riprova
          </Link>
          <Link href="/dashboard" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 0', background:'#0C111D', color:'#6B7280', borderRadius:14, fontWeight:700, fontSize:14, textDecoration:'none', border:'1px solid #1F2937' }}>
            <Home size={15} color="#6B7280"/> Home
          </Link>
          <Link href="/weak-points" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 0', background:'#0C111D', color:'#6B7280', borderRadius:14, fontWeight:700, fontSize:14, textDecoration:'none', border:'1px solid #1F2937' }}>
            <BookOpen size={15} color="#6B7280"/> Punti deboli
          </Link>
        </div>
      </div>
    </div>
  )
}
