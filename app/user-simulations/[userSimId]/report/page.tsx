'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, RotateCcw, Home, BookOpen, ChevronDown, ChevronUp, Trophy, Target } from 'lucide-react'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWrong, setShowWrong] = useState(false)
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    fetch(`/api/user-simulations/${userSimId}/report`)
      .then(r => r.json())
      .then(data => {
        setReport(data)
        setLoading(false)
        setTimeout(() => setAnimDone(true), 100)
      })
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const errors = report.errors ?? (40 - (report.score ?? 0))
  const passed = report.passed
  const pct = Math.round(((report.score || 0) / 40) * 100)
  const wrongAnswers = (report.answers || []).filter((a: any) => !a.isCorrect)
  const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`

  return (
    <div style={{ minHeight:'100vh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', paddingBottom:80 }}>

      {/* Hero risultato */}
      <div style={{ padding:'40px 20px 32px', textAlign:'center', background: passed ? 'linear-gradient(180deg,#052E16,#030712)' : 'linear-gradient(180deg,#450A0A,#030712)' }}>
        <div style={{ marginBottom:20, opacity: animDone ? 1 : 0, transform: animDone ? 'scale(1)' : 'scale(0.5)', transition:'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
          {passed
            ? <Trophy size={64} color="#FBBF24" style={{ filter:'drop-shadow(0 0 20px rgba(251,191,36,0.5))' }}/>
            : <Target size={64} color="#F87171" style={{ filter:'drop-shadow(0 0 20px rgba(248,113,113,0.4))' }}/>}
        </div>
        <h1 style={{ fontSize:36, fontWeight:900, letterSpacing:-1, color: passed ? '#4ADE80' : '#F87171', margin:'0 0 6px 0', opacity: animDone ? 1 : 0, transition:'opacity 0.5s 0.2s' }}>
          {passed ? 'PROMOSSO' : 'NON SUFFICIENTE'}
        </h1>
        <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 28px 0' }}>
          Quiz {report.simulationNumber} · {fmtTime(report.timeElapsed || 0)}
        </p>

        {/* 3 stat grandi */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, maxWidth:360, margin:'0 auto', opacity: animDone ? 1 : 0, transition:'opacity 0.5s 0.3s' }}>
          {[
            { icon: <CheckCircle2 size={20} color="#4ADE80"/>, value: report.score, label:'Corrette', color:'#4ADE80' },
            { icon: <XCircle size={20} color={errors > 4 ? '#F87171' : '#FB923C'}/>, value: errors, label:'Errori', color: errors > 4 ? '#F87171' : '#FB923C', suffix: errors > 4 ? ' ✗' : ' ✓' },
            { icon: <Target size={20} color="#60A5FA"/>, value: `${pct}%`, label:'Score', color:'#60A5FA' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'16px 8px', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:24, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}{s.suffix || ''}</div>
              <div style={{ fontSize:11, color:'#4B5563', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Barra progress */}
        <div style={{ maxWidth:360, margin:'20px auto 0', opacity: animDone ? 1 : 0, transition:'opacity 0.5s 0.4s' }}>
          <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background: passed ? 'linear-gradient(90deg,#16A34A,#4ADE80)' : 'linear-gradient(90deg,#DC2626,#F87171)', width: animDone ? `${pct}%` : '0%', transition:'width 1s 0.5s ease' }}/>
          </div>
          <p style={{ fontSize:12, color:'#4B5563', marginTop:8 }}>
            {passed ? 'Complimenti! Meno di 4 errori.' : `${errors - 4} errori oltre il limite di 4`}
          </p>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* Risultati per capitolo */}
        {report.capitoloResults?.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:12, fontWeight:700, color:'#4B5563', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Per capitolo</h3>
            <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:18, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
              {report.capitoloResults.map((cr: any) => (
                <div key={cr.capitoloCode}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'#9CA3AF' }}>{cr.capitolo}</span>
                    <span style={{ color: cr.accuracy >= 50 ? '#4ADE80' : '#F87171', fontWeight:700 }}>{cr.correct}/{cr.total}</span>
                  </div>
                  <div style={{ height:4, background:'#1F2937', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, background: cr.accuracy >= 50 ? '#16A34A' : '#DC2626', width:`${cr.accuracy}%`, transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risposte sbagliate */}
        {wrongAnswers.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <button onClick={() => setShowWrong(v => !v)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0C111D', border:'1px solid #1F2937', borderRadius:16, padding:'14px 16px', cursor:'pointer', fontFamily:'inherit', marginBottom: showWrong ? 8 : 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <XCircle size={16} color="#F87171"/>
                <span style={{ fontSize:13, fontWeight:700, color:'#F87171' }}>Risposte sbagliate ({wrongAnswers.length})</span>
              </div>
              {showWrong ? <ChevronUp size={16} color="#4B5563"/> : <ChevronDown size={16} color="#4B5563"/>}
            </button>
            {showWrong && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {wrongAnswers.map((a: any) => (
                  <div key={a.index} style={{ background:'#0C111D', border:'1px solid #450A0A', borderRadius:14, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:'#4B5563', marginBottom:6 }}>Domanda {a.index} · {a.capitolo}</div>
                    <p style={{ fontSize:13, color:'#D1D5DB', margin:'0 0 8px 0', lineHeight:1.5 }}>{a.text}</p>
                    <div style={{ display:'flex', gap:12, fontSize:12 }}>
                      <span style={{ color:'#F87171', fontWeight:700 }}>Tua: {a.userAnswer === null ? 'n/r' : a.userAnswer ? 'VERO' : 'FALSO'}</span>
                      <span style={{ color:'#4ADE80', fontWeight:700 }}>Corretta: {a.risposta ? 'VERO' : 'FALSO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Link href={`/simulations/${report.simulationId || ''}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', borderRadius:16, fontWeight:800, fontSize:15, textDecoration:'none', boxShadow:'0 4px 16px rgba(37,99,235,0.35)' }}>
            <RotateCcw size={18} color="#fff"/>
            Riprova questo quiz
          </Link>
          <Link href="/dashboard" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 0', background:'#0C111D', color:'#9CA3AF', borderRadius:16, fontWeight:700, fontSize:14, textDecoration:'none', border:'1px solid #1F2937' }}>
            <Home size={16} color="#9CA3AF"/>
            Home
          </Link>
          <Link href="/weak-points" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 0', background:'#0C111D', color:'#9CA3AF', borderRadius:16, fontWeight:700, fontSize:14, textDecoration:'none', border:'1px solid #1F2937' }}>
            <BookOpen size={16} color="#9CA3AF"/>
            Ripassare i punti deboli
          </Link>
        </div>
      </div>
    </div>
  )
}
