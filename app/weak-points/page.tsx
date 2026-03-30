'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Home, BarChart3, Target, ChevronRight } from 'lucide-react'

export default function WeakPointsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weak-points/start', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const total = data?.total || 0

  return (
    <div style={{ minHeight:'100vh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', paddingBottom:72 }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2 }}>PATENTE C</div>
          <h1 style={{ fontSize:24, fontWeight:900, margin:0, letterSpacing:-0.5 }}>Punti deboli</h1>
        </div>
        <Link href="/dashboard" style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'#0C111D', border:'1px solid #1F2937', borderRadius:10, textDecoration:'none' }}>
          <ChevronRight size={16} color="#4B5563" style={{ transform:'rotate(180deg)' }}/>
        </Link>
      </div>

      <div style={{ padding:'0 16px' }}>
        {total === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Target size={60} color="#4ADE80" style={{ marginBottom:16 }}/>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#4ADE80', margin:'0 0 8px 0' }}>Nessun punto debole!</h2>
            <p style={{ color:'#4B5563', fontSize:14 }}>Esegui dei quiz per tracciare gli errori.</p>
            <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:20, padding:'12px 24px', background:'#2563EB', color:'#fff', borderRadius:14, textDecoration:'none', fontWeight:700, fontSize:14 }}>
              <Home size={16} color="#fff"/>
              Vai ai quiz
            </Link>
          </div>
        ) : (
          <>
            <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:20, padding:'24px 20px', textAlign:'center', marginBottom:20 }}>
              <BookOpen size={40} color="#F87171" style={{ marginBottom:12 }}/>
              <div style={{ fontSize:48, fontWeight:900, color:'#F87171', lineHeight:1 }}>{total}</div>
              <div style={{ fontSize:14, color:'#6B7280', marginTop:6 }}>domande da ripassare</div>
              <div style={{ fontSize:12, color:'#374151', marginTop:4 }}>3 risposte corrette consecutive = eliminato</div>
            </div>

            {/* Progress bar */}
            <div style={{ background:'#0C111D', border:'1px solid #1F2937', borderRadius:16, padding:'14px 16px', marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#4B5563', marginBottom:8 }}>
                <span>Progresso ripasso</span>
                <span>{total} rimasti</span>
              </div>
              <div style={{ height:6, background:'#1F2937', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#DC2626,#F87171)', width:'100%', borderRadius:3 }}/>
              </div>
            </div>

            <Link href="/weak-points/practice" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'16px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', borderRadius:16, fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:'0 4px 16px rgba(37,99,235,0.35)' }}>
              <Target size={20} color="#fff"/>
              Inizia allenamento
            </Link>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:10, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'10px 0' }}>
          <BookOpen size={20} color="#2563EB"/>
          <span style={{ fontSize:10, color:'#2563EB', fontWeight:700 }}>Punti deboli</span>
        </div>
      </div>
    </div>
  )
}
