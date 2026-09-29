'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Target, RotateCcw } from 'lucide-react'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { Stato } from '@/components/Stato'
import { BottomNav } from '@/components/BottomNav'

export default function WeakPointsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const load = () => {
    setLoading(true)
    fetch('/api/weak-points/start', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const [chiediAzzera, setChiediAzzera] = useState(false)
  const handleReset = async () => {
    setChiediAzzera(false)
    await fetch('/api/weak-points/reset', { method: 'POST' })
    load()
  }

  if (loading) return (
    <div style={{ height:'100dvh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const total = data?.total || 0

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 18px 14px', flexShrink:0, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
            <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:-1, textTransform:'uppercase' }}>PUNTI DEBOLI</h1>
        </div>
        {data?.total > 0 && (
          <button onClick={() => setChiediAzzera(true)} aria-label="Azzera i punti deboli" style={{ width:36, height:36, borderRadius:'50%', background:'rgba(var(--accent-rgb),0.10)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginTop:14 }}>
            <RotateCcw size={16} color="var(--accent)"/>
          </button>
        )}
      </div>

      {/* Contenuto: come lo stato vuoto del Riepilogo, a tutta larghezza, con
          l'icona della sezione (il libro della barra in basso) in cobalto */}
      {total === 0 ? (
        <Stato
          icona={<IconaAvviso><BookOpen size={32} color="var(--accent)" strokeWidth={2.1}/></IconaAvviso>}
          titolo="Niente da ripassare"
          testo="Le risposte sbagliate finiscono qui."
          principale={{ label: 'Vai ai quiz', onClick: () => router.push('/dashboard') }}
        />
      ) : (
        <Stato
          icona={<IconaAvviso><BookOpen size={32} color="var(--accent)" strokeWidth={2.1}/></IconaAvviso>}
          titolo={`${total} da ripassare`}
          testo="Ognuna esce dopo 3 risposte giuste di fila."
          principale={{ label: "Inizia l'allenamento", icona: <Target size={20}/>, onClick: () => router.push('/weak-points/practice') }}
        />
      )}

      {/* Bottom nav */}
      <BottomNav active="deboli"/>

      {chiediAzzera && (
        <Avviso
          icona={<IconaAvviso tono="red"><RotateCcw size={32} color="var(--red)" strokeWidth={2.4}/></IconaAvviso>}
          titolo="Azzerare i punti deboli?"
          testo="Tutte le risposte da ripassare vengono cancellate."
          conferma={{ label: 'Azzera', onClick: handleReset, tono: 'red' }}
          annulla="Annulla"
          onChiudi={() => setChiediAzzera(false)}
        />
      )}
    </div>
  )
}
