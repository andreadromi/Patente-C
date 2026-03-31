'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, CheckCircle2, XCircle, Target, RotateCcw } from 'lucide-react'

interface WPQ { weakPointId: string; questionId: string; text: string; capitolo: string; consecutiveCorrect: number; totalAttempts: number }

export default function WPPracticePage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WPQ[]>([])
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState<{isCorrect:boolean;correctAnswer:boolean;removed:boolean}|null>(null)
  const [loading, setLoading] = useState(true)
  const [correct, setCorrect] = useState(0)
  const [removed, setRemoved] = useState(0)
  const [done, setDone] = useState(false)
  const autoRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/weak-points/start', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (!data.questions?.length) { router.push('/weak-points'); return }
        setQuestions(data.questions); setLoading(false)
      })
  }, [router])

  const goNext = () => {
    clearTimeout(autoRef.current!)
    setAnswered(null); setFeedback(null)
    if (idx + 1 >= questions.length) setDone(true)
    else setIdx(i => i + 1)
  }

  const handleAnswer = async (value: boolean) => {
    if (answered !== null) return
    const q = questions[idx]
    setAnswered(value)
    const res = await fetch('/api/weak-points/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.questionId, userAnswer: value })
    })
    const data = await res.json()
    setFeedback(data)
    if (data.isCorrect) { setCorrect(c => c+1); autoRef.current = setTimeout(() => goNext(), 1000) }
    if (data.removed) setRemoved(r => r+1)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (done) return (
    <div style={{ minHeight:'100vh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, textAlign:'center', paddingBottom:80 }}>
      <Target size={56} color="#FBBF24"/>
      <h1 style={{ fontSize:28, fontWeight:900, color:'#F9FAFB', margin:0 }}>Sessione completata!</h1>
      <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:18, padding:'20px 24px', width:'100%', maxWidth:320 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
          <span style={{ color:'#4B5563' }}>Risposte corrette</span>
          <span style={{ color:'#4ADE80', fontWeight:700 }}>{correct}/{questions.length}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
          <span style={{ color:'#4B5563' }}>Punti deboli eliminati</span>
          <span style={{ color:'#FBBF24', fontWeight:700 }}>{removed}</span>
        </div>
      </div>
      <button onClick={() => { setIdx(0); setAnswered(null); setFeedback(null); setDone(false); setCorrect(0); setRemoved(0) }}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 28px', background:'#2563EB', color:'#fff', border:'none', borderRadius:14, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
        <RotateCcw size={16} color="#fff"/>
        Ricomincia
      </button>
      <Link href="/weak-points" style={{ color:'#4B5563', fontSize:13 }}>← Torna ai punti deboli</Link>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0' }}>
          <BookOpen size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Punti deboli</span>
        </div>
      </div>
    </div>
  )

  const q = questions[idx]

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 18px', background:'#0C111D', borderBottom:'1px solid #111827', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#F87171', letterSpacing:2 }}>PUNTI DEBOLI · {idx+1}/{questions.length}</div>
          <div style={{ fontSize:11, color:'#4B5563', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < q.consecutiveCorrect ? '#4ADE80' : '#1F2937', transition:'background 0.3s' }}/>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:'#111827', flexShrink:0 }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#DC2626,#F87171)', width:`${(idx/questions.length)*100}%`, transition:'width 0.4s' }}/>
      </div>

      {/* Contenuto */}
      <div style={{ flex:1, padding:'20px 18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:20, padding:'20px 18px' }}>
          <p style={{ fontSize:19, lineHeight:1.8, color:'#F9FAFB', margin:0, fontWeight:500 }}>{q.text}</p>
        </div>

        {feedback && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background: feedback.isCorrect ? '#052E16' : '#450A0A', borderRadius:14, border:`1px solid ${feedback.isCorrect?'#166534':'#7F1D1D'}` }}>
            {feedback.isCorrect ? <CheckCircle2 size={18} color="#4ADE80"/> : <XCircle size={18} color="#F87171"/>}
            <span style={{ color: feedback.isCorrect ? '#4ADE80' : '#F87171', fontWeight:700, fontSize:14 }}>
              {feedback.isCorrect
                ? feedback.removed ? '🎉 Punto debole eliminato!' : `Corretto! (${q.consecutiveCorrect+1}/3)`
                : `Sbagliato — risposta: ${feedback.correctAnswer ? 'VERO' : 'FALSO'}`}
            </span>
          </div>
        )}

        {!answered ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {[
              { val:true, label:'VERO', c:'#4ADE80', border:'#14532D', hover:'#052E16' },
              { val:false, label:'FALSO', c:'#F87171', border:'#7F1D1D', hover:'#450A0A' },
            ].map(({ val, label, c, border, hover }) => (
              <button key={label} onClick={() => handleAnswer(val)}
                style={{ padding:'18px 0', borderRadius:16, border:`1.5px solid ${border}`, background:'#0C111D', color:c, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = hover)}
                onMouseLeave={e => (e.currentTarget.style.background = '#0C111D')}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          !feedback?.isCorrect && (
            <button onClick={goNext} style={{ padding:'14px 0', background:'#2563EB', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
              Avanti →
            </button>
          )
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 0' }}>
          <BookOpen size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Punti deboli</span>
        </div>
      </div>
    </div>
  )
}
