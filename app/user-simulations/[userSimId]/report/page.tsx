'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { RotateCcw, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

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
      .then(d => { setReport(d); setLoading(false) })
      .catch(() => router.push('/dashboard'))
  }, [userSimId, router])

  if (loading) return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const score = report.score || 0
  const errors = report.errors ?? (40 - score)
  const passed = report.passed
  const pct = Math.round((score / 40) * 100)
  const wrong = (report.answers || []).filter((a: any) => !a.isCorrect)
  const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Risultato */}
      <div style={{ padding: '32px 20px 24px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: passed ? 'var(--green-dim)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          {passed ? <CheckCircle2 size={28} color="var(--green)" /> : <XCircle size={28} color="var(--red)" />}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: passed ? 'var(--green)' : 'var(--red)', margin: '0 0 4px', letterSpacing: -0.5 }}>
          {passed ? 'PROMOSSO' : 'NON SUFFICIENTE'}
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 12, margin: 0 }}>Quiz {report.simulationNumber} · {fmtTime(report.timeElapsed || 0)}</p>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--green)' }}>{score}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Corrette</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: errors > 4 ? 'var(--red)' : 'var(--text2)' }}>{errors}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Errori</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent2)' }}>{pct}%</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Score</div>
          </div>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

        {/* Errori */}
        {wrong.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setShowWrong(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Risposte sbagliate ({wrong.length})</span>
              {showWrong ? <ChevronUp size={14} color="var(--text3)" /> : <ChevronDown size={14} color="var(--text3)" />}
            </button>
            {showWrong && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {wrong.map((a: any) => (
                  <div key={a.index} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 5 }}>Q{a.index} · {a.capitolo}</div>
                    {a.image && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <img src={`https://www.patentisuperiori.com/img-sign/${a.image}`} alt="" style={{ maxWidth: 100, maxHeight: 70, objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 3 }} />
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 7px', lineHeight: 1.5 }}>{a.text}</p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                      <span style={{ color: 'var(--text3)', fontWeight: 600 }}>Tu: {a.userAnswer === null ? '—' : a.userAnswer ? 'V' : 'F'}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>{a.risposta ? 'VERO' : 'FALSO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Azioni */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
          <Link href={`/simulations/${report.simulationId || ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', background: 'var(--accent)', color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            <RotateCcw size={16} /> Riprova
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
