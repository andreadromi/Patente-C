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
    <div style={{ height:'100dvh', background:'#030712', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid #1F2937', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const total = data?.total || 0

  return (
    <div style={{ height:'100dvh', background:'#030712', color:'#F9FAFB', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#3B82F6', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>PATENTE C · CE</div>
        <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>PUNTI DEBOLI</h1>
      </div>

      {/* Contenuto */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px', gap:20 }}>
        {total === 0 ? (
          <>
            <Target size={56} color="#4ADE80"/>
            <div style={{ textAlign:'center' }}>
              <h2 style={{ fontSize:22, fontWeight:900, color:'#4ADE80', margin:'0 0 8px 0', textTransform:'uppercase' }}>NESSUN PUNTO DEBOLE</h2>
              <p style={{ color:'#4B5563', fontSize:14, margin:0 }}>Esegui dei quiz per tracciare gli errori.</p>
            </div>
            <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 24px', background:'#2563EB', color:'#fff', borderRadius:14, textDecoration:'none', fontWeight:700, fontSize:14, boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
              <Home size={16} color="#fff"/>
              Vai ai quiz
            </Link>
          </>
        ) : (
          <>
            <BookOpen size={52} color="#F87171"/>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:56, fontWeight:900, color:'#F87171', lineHeight:1, letterSpacing:-2 }}>{total}</div>
              <div style={{ fontSize:14, color:'#6B7280', marginTop:6 }}>domande da ripassare</div>
              <div style={{ fontSize:12, color:'#374151', marginTop:4 }}>3 risposte corrette consecutive = eliminato</div>
            </div>

            <div style={{ width:'100%', maxWidth:320 }}>
              <div style={{ height:5, background:'#1F2937', borderRadius:3, overflow:'hidden', marginBottom:20 }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#DC2626,#F87171)', width:'100%', borderRadius:3 }}/>
              </div>
              <Link href="/weak-points/practice" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'15px 0', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', borderRadius:16, fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:'0 4px 16px rgba(37,99,235,0.35)' }}>
                <Target size={20} color="#fff"/>
                INIZIA ALLENAMENTO
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background:'#0C111D', borderTop:'1px solid #111827', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', flexShrink:0 }}>
        <Link href="/dashboard" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <Home size={20} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Home</span>
        </Link>
        <Link href="/riepilogo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0', textDecoration:'none' }}>
          <BarChart3 size={20} color="#4B5563"/>
          <span style={{ fontSize:9, color:'#4B5563', fontWeight:600 }}>Riepilogo</span>
        </Link>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 0' }}>
          <BookOpen size={20} color="#2563EB"/>
          <span style={{ fontSize:9, color:'#2563EB', fontWeight:700 }}>Punti deboli</span>
        </div>
      </div>
    </div>
  )
}
