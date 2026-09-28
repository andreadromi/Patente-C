'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, ArrowRight } from 'lucide-react'
import { NOME_APP } from '@/lib/app'

export default function LoginPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cleanN = nome.trim()
  const cleanC = cognome.trim()
  const valid = cleanN.length >= 2 && cleanC.length >= 2
  const username = valid ? `${cleanN.toLowerCase().replace(/\s+/g,'_')}.${cleanC.toLowerCase().replace(/\s+/g,'_')}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
    if (res.ok) router.push('/dashboard')
    else { setError('Accesso non riuscito. Riprova.'); setLoading(false) }
  }

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ width:76, height:76, borderRadius:22, background:'linear-gradient(135deg, var(--accent-scuro) 0%, var(--accent2) 100%)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 32px rgba(var(--accent-rgb),0.3)' }}>
          <Truck size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, color:'var(--text)', margin:'0 0 6px', letterSpacing:-0.5 }}>{NOME_APP}</h1>
        <p style={{ color:'var(--text3)', fontSize:15.5, fontWeight:600, margin:0 }}>Esame di teoria C e CE</p>
      </div>

      <div style={{ width:'100%', maxWidth:340 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:14, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario" maxLength={20} autoFocus
                style={{ width:'100%', background:'#fff', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px', color:'var(--text)', fontSize:17, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:14, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 }}>Cognome</label>
              <input type="text" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi" maxLength={20}
                style={{ width:'100%', background:'#fff', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px', color:'var(--text)', fontSize:17, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
          </div>
          {error && <p style={{ color:'var(--red)', fontSize:14.5, margin:0 }}>{error}</p>}
          <button type="submit" disabled={!valid || loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            padding:'15px 0', borderRadius:16, border:'none', cursor:valid?'pointer':'not-allowed',
            background:valid?'linear-gradient(135deg, var(--accent-scuro) 0%, var(--accent2) 100%)':'var(--surface)',
            color:valid?'#fff':'var(--text3)', fontSize:17, fontWeight:800, fontFamily:'inherit',
            boxShadow:valid?'0 4px 20px rgba(var(--accent-rgb),0.3)':'none', transition:'all 0.2s',
          }}>
            {loading ? 'Accesso...' : <><span>Entra</span><ArrowRight size={18} color={valid?'#fff':'var(--text3)'} /></>}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:13.5, color:'var(--text3)', marginTop:20 }}>
          Admin? <a href="/admin/login" style={{ color:'var(--accent)' }}>Accedi qui</a>
        </p>
      </div>
    </div>
  )
}
