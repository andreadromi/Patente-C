'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = (v: string) => /^[a-zA-Z0-9._-]{2,20}$/.test(v)
  const clean = username.trim()
  const valid = isValid(clean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean })
    })
    if (res.ok) router.push('/dashboard')
    else { setError('Accesso non riuscito. Riprova.'); setLoading(false) }
  }

  return (
    <div style={{ height:'100dvh', background:'#030712', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:22, background:'linear-gradient(135deg,#2563EB,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(37,99,235,0.5)' }}>
          <Truck size={36} color="#fff"/>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'#3B82F6', letterSpacing:3, textTransform:'uppercase', marginBottom:6 }}>Patente C · CE</div>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#F9FAFB', margin:0, letterSpacing:-1 }}>Simulatore Esame</h1>
        <p style={{ color:'#4B5563', fontSize:13, marginTop:6, margin:'6px 0 0' }}>40 domande · 40 min · max 4 errori</p>
      </div>

      {/* Form */}
      <div style={{ width:'100%', maxWidth:340 }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:2, textTransform:'uppercase', display:'block', marginBottom:8 }}>
              Il tuo nome
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="es. andrea"
              maxLength={20}
              autoFocus
              style={{
                width:'100%', background:'#0C111D',
                border:`1.5px solid ${clean && !valid ? '#DC2626' : valid && clean ? '#166534' : '#1F2937'}`,
                borderRadius:14, padding:'14px 16px', color:'#F9FAFB',
                fontSize:16, outline:'none', fontFamily:'inherit',
                boxSizing:'border-box', transition:'border-color 0.2s'
              }}
            />
            <p style={{ fontSize:11, color: clean && !valid ? '#EF4444' : '#374151', marginTop:6, margin:'6px 0 0' }}>
              {clean && !valid ? 'Solo lettere e numeri, min 2 caratteri' : 'Nessuna password richiesta'}
            </p>
          </div>

          {error && <p style={{ color:'#EF4444', fontSize:13, margin:0 }}>{error}</p>}

          <button type="submit" disabled={!valid || loading}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              padding:'15px 0', borderRadius:16, border:'none', cursor: valid ? 'pointer' : 'not-allowed',
              background: valid ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#0C111D',
              color: valid ? '#fff' : '#374151', fontSize:16, fontWeight:800,
              fontFamily:'inherit', transition:'all 0.2s',
              boxShadow: valid ? '0 4px 20px rgba(37,99,235,0.4)' : 'none' }}>
            {loading ? 'Accesso...' : <><span>Entra</span><ArrowRight size={18} color={valid?'#fff':'#374151'}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:12, color:'#374151', marginTop:20 }}>
          Admin? <a href="/admin/login" style={{ color:'#3B82F6' }}>Accedi qui</a>
        </p>
      </div>
    </div>
  )
}
