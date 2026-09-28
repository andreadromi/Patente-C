'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { Stato, Numeri } from '@/components/Stato'
import { IconaAvviso } from '@/components/Avviso'
import { BottomNav } from '@/components/BottomNav'
import { Domanda } from '@/components/Domanda'
import { VeroFalso } from '@/components/VeroFalso'
import { nomeBreve } from '@/lib/argomenti'

interface WPQ {
  weakPointId: string; questionId: string; code: string; text: string
  questionGroup: string|null; image: string|null
  argomento: string; argomentoCode: string; consecutiveCorrect: number; totalAttempts: number
}

export default function WPPracticePage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WPQ[]>([])
  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<{risposta:boolean;isCorrect:boolean;correctAnswer:boolean;removed:boolean}|null>(null)
  const [loading, setLoading] = useState(true)
  const [correct, setCorrect] = useState(0)
  const [removed, setRemoved] = useState(0)
  const [done, setDone] = useState(false)
  const autoRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(() => () => { if (autoRef.current) clearTimeout(autoRef.current) }, [])

  useEffect(() => {
    fetch('/api/weak-points/start', { method:'POST' })
      .then(r=>r.json())
      .then(data => {
        if (!data.questions?.length) { router.push('/weak-points'); return }
        setQuestions(data.questions); setLoading(false)
      })
  }, [router])

  const current = questions[idx]

  const handleAnswer = async (val: boolean) => {
    if (feedback || !current) return
    const res = await fetch('/api/weak-points/answer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ weakPointId: current.weakPointId, questionId: current.questionId, userAnswer: val })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) return
    setFeedback({ risposta: val, ...data })
    if (data.isCorrect) setCorrect(c=>c+1)
    if (data.removed) setRemoved(r=>r+1)
    autoRef.current = setTimeout(next, data.isCorrect ? 1200 : 2400)
  }

  const next = () => {
    if (autoRef.current) clearTimeout(autoRef.current)
    setFeedback(null)
    if (idx+1 >= questions.length) setDone(true)
    else setIdx(i=>i+1)
  }

  if (loading) return (
    <div style={{height:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
    </div>
  )

  if (done) return (
    <div style={{height:'100dvh',background:'var(--bg)',color:'var(--text)',fontFamily:'system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column'}}>
      <Stato
        icona={<IconaAvviso tono="green"><Trophy size={34} color="var(--green)" strokeWidth={2.2}/></IconaAvviso>}
        titolo="Allenamento finito"
        principale={{ label: 'Torna ai Punti deboli', onClick: () => router.push('/weak-points') }}
      >
        <Numeri voci={[
          { n: correct, label: 'Giuste', colore: 'var(--accent)' },
          { n: removed, label: 'Tolte', colore: 'var(--green)' },
          { n: questions.length, label: 'Totale' },
        ]}/>
      </Stato>
      <BottomNav active="deboli" />
    </div>
  )

  if (!current) return null

  return (
    <div style={{height:'100dvh',background:'var(--bg)',color:'var(--text)',fontFamily:'system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontSize:14.5,fontWeight:700}}>Punti Deboli</div>
        <div style={{fontSize:13.5,color:'var(--text3)'}}>
          <span style={{color:'var(--accent)',fontWeight:700}}>{idx+1}</span>/{questions.length}
          &nbsp;·&nbsp;Tolte: <span style={{color:'var(--green)',fontWeight:700}}>{removed}</span>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'20px 16px'}}>
        <Domanda codice={current.code} etichetta={nomeBreve(current.argomentoCode, current.argomento)}
          gruppo={current.questionGroup} testo={current.text} figura={current.image} />

        <VeroFalso
          risposta={feedback?.risposta}
          giusta={feedback?.correctAnswer ?? true}
          correzione={!!feedback}
          bloccato={!!feedback}
          onRispondi={handleAnswer}
          sotto={feedback?.removed && (
            <div style={{marginTop:4,fontSize:14,fontWeight:700,color:'var(--green)'}}>Tolta dai punti deboli: 3 giuste di fila</div>
          )}
        />

        {feedback && (
          <button onClick={next} style={{width:'100%',marginTop:14,padding:'12px',borderRadius:12,border:'1.5px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:14.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            Prossima →
          </button>
        )}
      </div>

      <BottomNav active="deboli" />
    </div>
  )
}
