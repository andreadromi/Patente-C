'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, CheckCircle2, XCircle, Target, RotateCcw } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface WPQ { weakPointId: string; questionId: string; text: string; image: string | null; capitolo: string; consecutiveCorrect: number; totalAttempts: number }

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
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (done) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, textAlign:'center', paddingBottom:80 }}>
      <Target size={56} color="#FBBF24"/>
      <h1 style={{ fontSize:28, fontWeight:900, color:'var(--text)', margin:0 }}>Sessione completata!</h1>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:'20px 24px', width:'100%', maxWidth:320 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
          <span style={{ color:'var(--text3)' }}>Risposte corrette</span>
          <span style={{ color:'var(--green)', fontWeight:700 }}>{correct}/{questions.length}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
          <span style={{ color:'var(--text3)' }}>Punti deboli eliminati</span>
          <span style={{ color:'var(--accent2)', fontWeight:700 }}>{removed}</span>
        </div>
      </div>
      <button onClick={() => { setIdx(0); setAnswered(null); setFeedback(null); setDone(false); setCorrect(0); setRemoved(0) }}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 28px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:14, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
        <RotateCcw size={16} color="#fff"/>
        Ricomincia
      </button>
      <Link href="/weak-points" style={{ color:'var(--text3)', fontSize:13 }}>← Torna ai punti deboli</Link>

      <BottomNav active="deboli"/>
    </div>
  )

  const q = questions[idx]

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'12px 18px', background:'#EEF0E4', borderBottom:'none', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--red)', letterSpacing:2 }}>PUNTI DEBOLI · {idx+1}/{questions.length}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{q.capitolo}</div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < q.consecutiveCorrect ? 'var(--green)' : 'var(--border)', transition:'background 0.3s' }}/>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:'var(--surface)', flexShrink:0 }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,var(--red),#D97706)', width:`${(idx/questions.length)*100}%`, transition:'width 0.4s' }}/>
      </div>

      {/* Contenuto */}
      <div style={{ flex:1, padding:'20px 18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'20px 18px' }}>
          {q.image && (
            <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
              <img
                src={`https://www.patentisuperiori.com/img-sign/${q.image}`}
                alt="Immagine domanda"
                style={{ maxWidth:160, maxHeight:120, objectFit:'contain', borderRadius:8, background:'#fff', padding:6 }}
              />
            </div>
          )}
          <p style={{ fontSize:19, lineHeight:1.8, color:'var(--text)', margin:0, fontWeight:500 }}>{q.text}</p>
        </div>

        {feedback && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background: feedback.isCorrect ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius:14, border:`1px solid ${feedback.isCorrect?'var(--green)':'var(--red)'}` }}>
            {feedback.isCorrect ? <CheckCircle2 size={18} color="#059669"/> : <XCircle size={18} color="#D97706"/>}
            <span style={{ color: feedback.isCorrect ? 'var(--green)' : 'var(--red)', fontWeight:700, fontSize:14 }}>
              {feedback.isCorrect
                ? feedback.removed ? '🎉 Punto debole eliminato!' : `Corretto! (${q.consecutiveCorrect+1}/3)`
                : `Sbagliato — risposta: ${feedback.correctAnswer ? 'VERO' : 'FALSO'}`}
            </span>
          </div>
        )}

        {!answered ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={() => handleAnswer(true)} style={{ padding:'17px 0', borderRadius:16, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit', background:'var(--card)', border:'1.5px solid var(--border)', color:'var(--green)' }}>VERO</button>
            <button onClick={() => handleAnswer(false)} style={{ padding:'17px 0', borderRadius:16, fontSize:16, fontWeight:900, letterSpacing:2, cursor:'pointer', fontFamily:'inherit', background:'var(--card)', border:'1.5px solid var(--border)', color:'var(--red)' }}>FALSO</button>
          </div>
        ) : (
          !feedback?.isCorrect && (
            <button onClick={goNext} style={{ padding:'14px 0', background:'var(--accent)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
              Avanti →
            </button>
          )
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav active="deboli"/>
    </div>
  )
}
