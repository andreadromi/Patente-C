'use client'
import { BottomNav } from '@/components/BottomNav'
import { IconaArgomento } from '@/components/IconaArgomento'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Argomento { id: number; code: string; name: string; nEsame: number; totalQuestions: number }

/**
 * Lo studio per argomento: i capitoli del listato, con quante domande ha
 * ciascuno, quante ne escono all'esame e a che punto si è. Dentro, le domande
 * una dopo l'altra con la correzione subito (focus/[code]).
 */
export default function FocusPage() {
  const router = useRouter()
  const [argomenti, setArgomenti] = useState<Argomento[]>([])
  const [risposte, setRisposte] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/argomenti').then(r => r.json()),
      fetch('/api/focus/progress').then(r => r.ok ? r.json() : { risposte: {} }).catch(() => ({ risposte: {} })),
    ]).then(([u, a, p]) => {
      if (!u.user) { router.push('/login'); return }
      setArgomenti(a.argomenti || [])
      setRisposte(p.risposte || {})
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const totale = argomenti.reduce((s, a) => s + a.totalQuestions, 0)

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: -1, textTransform: 'uppercase' }}>FOCUS</h1>
        <div style={{ fontSize: 14.5, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>
          {totale.toLocaleString('it-IT')} domande, un argomento alla volta
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {argomenti.map((a, idx) => {
          if (a.totalQuestions === 0) return (
            <div key={a.code} className="scheda" style={{ animationDelay: `${Math.min(idx, 12) * 40}ms`, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.5 }}>
              <IconaArgomento code={a.code} spenta />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.25 }}>{a.name}</div>
                <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>Nessuna domanda caricata</div>
              </div>
            </div>
          )
          const date = Math.min(risposte[a.code] ?? 0, a.totalQuestions)
          // Anche poche risposte si vedono: mai 0% se se n'è data almeno una
          const pct = !date ? 0 : Math.max(1, Math.round((date / a.totalQuestions) * 100))
          return (
            <Link key={a.code} href={`/focus/${a.code}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="scheda" style={{ animationDelay: `${Math.min(idx, 12) * 40}ms`, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 14px 16px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <IconaArgomento code={a.code} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.25 }}>{a.name}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                    {`${a.totalQuestions.toLocaleString('it-IT')} domande · ${a.nEsame} all'esame`}
                  </div>
                  {/* A che punto è lo studio di questo argomento */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                    </div>
                    {date > 0 && (
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: pct === 100 ? 'var(--green)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text3)" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          )
        })}
      </div>

      <BottomNav active="focus"/>
    </div>
  )
}
