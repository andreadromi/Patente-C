'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BookOpen, BarChart3, Target, Play } from 'lucide-react'

interface Capitolo { id: number; code: string; name: string; nEsame: number; totalQuestions: number }

export default function FocusPage() {
  const router = useRouter()
  const [capitoli, setCapitoli] = useState<Capitolo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/capitoli').then(r => r.json()),
    ]).then(([u, c]) => {
      if (!u.user) { router.push('/login'); return }
      setCapitoli(c.capitoli || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1F2937', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const totalQ = capitoli.reduce((s, c) => s + c.totalQuestions, 0)

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent2)', letterSpacing: 2, marginBottom: 4 }}>PATENTE C · CE</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: -1, textTransform: 'uppercase' }}>FOCUS</h1>
          <span style={{ fontSize: 12, color: 'var(--text4)', fontWeight: 600 }}>{totalQ} domande</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {capitoli.map(cap => (
          <Link key={cap.code} href={`/focus/${cap.code}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card)', border: '1px solid #1F2937', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <Target size={20} color="#3B82F6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cap.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>{cap.totalQuestions} domande · {cap.nEsame} in esame</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid #1F2937' }}>
                <Play size={13} color="#3B82F6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)' }}>Studia</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ background: 'var(--card)', borderTop: '1px solid #111827', display: 'grid', paddingBottom: 'env(safe-area-inset-bottom,8px)', gridTemplateColumns: '1fr 1fr 1fr', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <Home size={19} color="#4B5563" /><span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Home</span>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0' }}>
          <Target size={19} color="#2563EB" /><span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>Focus</span>
        </div>
        <Link href="/weak-points" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
          <BookOpen size={19} color="#4B5563" /><span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Punti deboli</span>
        </Link>
      </div>
    </div>
  )
}
