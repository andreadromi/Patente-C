'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, ArrowRight } from 'lucide-react'
import { NOME_APP } from '@/lib/app'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = username.trim().length >= 2 && password.length >= 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    })
    if (res.ok) router.push('/admin/dashboard')
    else { setError('Credenziali non valide'); setLoading(false) }
  }

  return (
    <div style={{ height:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ width:76, height:76, borderRadius:24, background:'linear-gradient(135deg, var(--accent-scuro) 0%, var(--accent2) 100%)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 8px 32px rgba(var(--accent-rgb),0.3)' }}>
          <Crown size={36} color="#fff" />
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--accent)', letterSpacing:3, textTransform:'uppercase', marginBottom:8 }}>{NOME_APP}</div>
        <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 8px', letterSpacing:-0.5 }}>Amministrazione</h1>
        <p style={{ color:'var(--text3)', fontSize:13, margin:0 }}>Accesso riservato</p>
      </div>

      <div style={{ width:'100%', maxWidth:340 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'var(--text2)', letterSpacing:2, textTransform:'uppercase', display:'block', marginBottom:6 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoFocus
              style={{ width:'100%', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px', color:'var(--text)', fontSize:16, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'var(--text2)', letterSpacing:2, textTransform:'uppercase', display:'block', marginBottom:6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••"
              style={{ width:'100%', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px', color:'var(--text)', fontSize:16, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>

          {error && <p style={{ color:'var(--red)', fontSize:13, margin:0 }}>{error}</p>}

          <button type="submit" disabled={!valid || loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            padding:'15px 0', borderRadius:16, border:'none', cursor:valid?'pointer':'not-allowed',
            background:valid?'linear-gradient(135deg, var(--accent-scuro) 0%, var(--accent2) 100%)':'var(--surface)',
            color:valid?'#fff':'var(--text4)', fontSize:16, fontWeight:800, fontFamily:'inherit',
            boxShadow:valid?'0 4px 20px rgba(var(--accent-rgb),0.3)':'none', transition:'all 0.2s',
          }}>
            {loading ? 'Accesso...' : <><span>Accedi</span><ArrowRight size={18} color={valid?'#fff':'var(--text4)'}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--text4)', marginTop:20 }}>
          <a href="/login" style={{ color:'var(--accent)' }}>← Torna al login utente</a>
        </p>
      </div>
    </div>
  )
}
