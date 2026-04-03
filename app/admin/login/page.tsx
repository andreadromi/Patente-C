'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, ArrowRight } from 'lucide-react'

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
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    })
    if (res.ok) router.push('/admin/dashboard')
    else { setError('Credenziali non valide'); setLoading(false) }
  }

  return (
    <div style={{ height: '100dvh', background: '#F8F9FC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Truck size={36} color="#fff" />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Patente C · CE</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#4D5057', margin: 0 }}>Amministrazione</h1>
      </div>

      <div style={{ width: '100%', maxWidth: 340 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" autoFocus
              style={{ width: '100%', background: '#fff', border: '1.5px solid #E2E6EA', borderRadius: 14, padding: '14px', color: '#4D5057', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••"
              style={{ width: '100%', background: '#fff', border: '1.5px solid #E2E6EA', borderRadius: 14, padding: '14px', color: '#4D5057', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {error && <p style={{ color: '#D97706', fontSize: 13, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={!valid || loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '15px 0', borderRadius: 16, border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
              background: valid ? '#059669' : '#E2E6EA',
              color: valid ? '#fff' : '#9CA3AF', fontSize: 16, fontWeight: 800,
              fontFamily: 'inherit'
            }}>
            {loading ? 'Accesso...' : <><span>Accedi</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 }}>
          <a href="/login" style={{ color: '#059669' }}>← Torna al login utente</a>
        </p>
      </div>
    </div>
  )
}
