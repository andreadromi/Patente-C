'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cleanN = nome.trim()
  const cleanC = cognome.trim()
  const valid = cleanN.length >= 2 && cleanC.length >= 2 && /^[a-zA-ZÀ-ú]+$/.test(cleanN) && /^[a-zA-ZÀ-ú]+$/.test(cleanC)
  const username = valid ? `${cleanN.toLowerCase()}.${cleanC.toLowerCase()}` : ''

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
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(37,99,235,0.5)' }}>
          <Truck size={36} color="#fff" />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent2)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Patente C · CE</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: -1 }}>Simulatore Esame</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6, margin: '6px 0 0' }}>40 domande · 40 min · max 4 errori</p>
      </div>

      <div style={{ width: '100%', maxWidth: 340 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value.replace(/[^a-zA-ZÀ-ú]/g, ''))} placeholder="Mario" maxLength={20} autoFocus
                style={{ width: '100%', background: 'var(--card)', border: '1.5px solid #1F2937', borderRadius: 14, padding: '14px 14px', color: 'var(--text)', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Cognome</label>
              <input type="text" value={cognome} onChange={e => setCognome(e.target.value.replace(/[^a-zA-ZÀ-ú]/g, ''))} placeholder="Rossi" maxLength={20}
                style={{ width: '100%', background: 'var(--card)', border: '1.5px solid #1F2937', borderRadius: 14, padding: '14px 14px', color: 'var(--text)', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text4)', margin: 0 }}>Nessuna password richiesta</p>

          {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={!valid || loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '15px 0', borderRadius: 16, border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
              background: valid ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : 'var(--card)',
              color: valid ? '#fff' : 'var(--text4)', fontSize: 16, fontWeight: 800,
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: 'none'
            }}>
            {loading ? 'Accesso...' : <><span>Entra</span><ArrowRight size={18} color={valid ? '#fff' : 'var(--text4)'} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text4)', marginTop: 20 }}>
          Admin? <a href="/admin/login" style={{ color: 'var(--accent2)' }}>Accedi qui</a>
        </p>
      </div>
    </div>
  )
}
