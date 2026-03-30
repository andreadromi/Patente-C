'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface AnswerItem { index: number; text: string; risposta: boolean; userAnswer: boolean | null; isCorrect: boolean | null; capitolo: string }

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const userSimId = params.userSimId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWrong, setShowWrong] = useState(false)

  useEffect(() => {
    fetch(`/api/user-simulations/${userSimId}/report`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
  const errors = report.errors ?? (40 - (report.score ?? 0))
  const passed = report.passed
  const pct = Math.round((report.score / 40) * 100)
  const wrongAnswers = (report.answers || []).filter((a: AnswerItem) => !a.isCorrect)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>

        {/* Hero risultato */}
        <div style={{
          borderRadius: 24,
          border: `1px solid ${passed ? '#10B98144' : '#EF444444'}`,
          background: passed ? 'linear-gradient(135deg, #022C22, #042f2e)' : 'linear-gradient(135deg, var(--red-bg), #1a0a0a)',
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: 16,
        }} className="animate-slide-up">
          <div style={{ fontSize: 60, marginBottom: 8 }}>{passed ? '🏆' : '📚'}</div>
          <h1 style={{
            fontSize: 30, fontWeight: 900, letterSpacing: -0.5,
            color: passed ? '#10B981' : 'var(--red)', margin: '0 0 8px 0'
          }}>
            {passed ? 'PROMOSSO!' : 'NON SUFFICIENTE'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 24px 0' }}>
            Simulazione #{report.simulationNumber} · {fmtTime(report.timeElapsed || 0)}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Corrette', value: report.score, color: '#10B981' },
              { label: 'Errori', value: errors, color: errors > 4 ? 'var(--red)' : '#F59E0B', suffix: errors > 4 ? ' ✗' : ' ✓' },
              { label: 'Precisione', value: `${pct}%`, color: '#3B82F6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}{s.suffix || ''}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Barra accuratezza */}
          <div style={{ height: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 1s ease',
              background: passed ? 'linear-gradient(90deg, #059669, #10B981)' : 'linear-gradient(90deg, #991B1B, #EF4444)',
              width: `${pct}%`
            }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            {passed ? '🎉 Meno di 4 errori: avresti superato l\'esame!' : `${errors - 4} errori oltre il limite di 4`}
          </p>
        </div>

        {/* Capitoli */}
        {report.capitoloResults?.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '18px 16px', marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px 0' }}>
              Risultati per capitolo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.capitoloResults.map((cr: any) => (
                <div key={cr.capitoloCode}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--subtext)' }}>{cr.capitolo}</span>
                    <span style={{ color: cr.accuracy >= 50 ? '#10B981' : 'var(--red)', fontWeight: 700 }}>{cr.correct}/{cr.total}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${cr.accuracy}%`, background: cr.accuracy >= 50 ? '#10B981' : 'var(--red)', transition: 'width 0.8s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risposte sbagliate */}
        {wrongAnswers.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '18px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--red)', letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
                Errori ({wrongAnswers.length})
              </h3>
              <button onClick={() => setShowWrong(v => !v)} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showWrong ? 'Nascondi' : 'Mostra tutti'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(showWrong ? wrongAnswers : wrongAnswers.slice(0, 3)).map((a: AnswerItem) => (
                <div key={a.index} style={{ background: 'var(--red-bg)', border: '1px solid #EF444433', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>#{a.index} · {a.capitolo}</div>
                  <p style={{ fontSize: 13, color: 'var(--subtext)', margin: '0 0 8px 0', lineHeight: 1.5 }}>{a.text}</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>Tu: {a.userAnswer === null ? 'n/r' : a.userAnswer ? 'VERO' : 'FALSO'}</span>
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>✓ {a.risposta ? 'VERO' : 'FALSO'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/dashboard" style={{
            display: 'block', textAlign: 'center', padding: '14px 0',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: 15,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
          }}>← Dashboard</Link>
          <Link href="/weak-points" style={{
            display: 'block', textAlign: 'center', padding: '14px 0',
            background: 'var(--bg-card)', color: 'var(--subtext)',
            borderRadius: 14, fontWeight: 700, fontSize: 14,
            textDecoration: 'none', border: '1px solid var(--border)',
          }}>📚 Ripassa i punti deboli</Link>
        </div>
      </div>
    </div>
  )
}
