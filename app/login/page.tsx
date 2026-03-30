'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const isValid = (val: string) => /^[a-zA-Z0-9._-]{2,20}$/.test(val)
  const clean = username.trim()
  const valid = isValid(clean)
  const showError = clean.length > 0 && !valid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean })
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('Errore di accesso. Riprova.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: 380 }} className="animate-slide-up">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🚛</div>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            borderRadius: 8, padding: '4px 14px',
            fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#fff',
            marginBottom: 14
          }}>PATENTE C · CE</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: '0 0 6px 0', letterSpacing: -0.5 }}>
            Simulatore Esame
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            40 domande · 40 minuti · max 4 errori
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
        }} className={shake ? 'animate-shake' : ''}>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--subtext)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Il tuo nome utente
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="es. andrea123"
                maxLength={20}
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: `2px solid ${showError ? 'var(--red)' : valid && clean ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '13px 16px',
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ fontSize: 12, marginTop: 6, color: showError ? 'var(--red)' : 'var(--muted)' }}>
                {showError
                  ? 'Solo lettere, numeri e punti. Min 2 caratteri, no spazi.'
                  : 'Nessuna password richiesta'}
              </p>
            </div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !valid}
              style={{
                width: '100%',
                padding: '14px 0',
                background: valid ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'var(--border)',
                color: valid ? '#fff' : 'var(--muted)',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 800,
                cursor: valid ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                letterSpacing: 0.5,
                fontFamily: 'inherit',
                boxShadow: valid ? '0 4px 20px rgba(37,99,235,0.4)' : 'none',
              }}
            >
              {loading ? '...' : 'Entra →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>
          Admin? <a href="/admin/login" style={{ color: '#3B82F6' }}>Accedi qui</a>
        </p>
      </div>
    </div>
  )
}
