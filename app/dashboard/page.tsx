'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, LogOut, Trash2, ChevronLeft, ChevronRight, RotateCcw, GraduationCap } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { Avviso, IconaAvviso } from '@/components/Avviso'
import { NOME_APP } from '@/lib/app'
import { DOMANDE_PER_ESAME, DURATA_ESAME, ERRORI_AMMESSI } from '@/lib/esame'

interface Simulation { id: string; number: number; titolo: string | null }
interface UserSim { id: string; simulationId: string; status: string; passed: boolean | null; score: number | null; errors: number | null; startedAt: string | null }

const PER_PAGE = 6

function fmtName(u: string) { return u.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [userSims, setUserSims] = useState<UserSim[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [copertura, setCopertura] = useState<{ affrontate: number; totale: number } | null>(null)
  const [esamiReali, setEsamiReali] = useState<{ id: string; tipo: string }[]>([])
  const [creando, setCreando] = useState(false)
  const [erroreEsame, setErroreEsame] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/simulations').then(r => r.json()),
      fetch('/api/user-simulations').then(r => r.json()).catch(() => []),
      fetch('/api/esami-generati').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([u, s, us, eg]) => {
      if (!u.user) { router.push('/login'); return }
      setUser(u.user); setSimulations(s.simulations || [])
      setCopertura(eg?.copertura || null)
      setEsamiReali(eg?.esami || [])
      const sims = Array.isArray(us) ? us : []
      setUserSims(sims)
      const lastDone = sims.filter((u: UserSim) => u.status === 'COMPLETED')
      if (lastDone.length > 0) {
        const idx = (s.simulations || []).findIndex((sim: Simulation) => sim.id === lastDone[0].simulationId)
        if (idx >= 0) setPage(Math.floor(idx / PER_PAGE))
      }
      setLoading(false)
    })
  }, [router])

  const getLast = (id: string) => userSims.filter(u => u.simulationId === id)[0] || null
  // L'esame reale a metà (non ancora scaduto) si riprende; altrimenti se ne compone uno nuovo
  const esameInCorso = esamiReali.some(e => {
    const l = userSims.filter(u => u.simulationId === e.id)[0]
    return !!l && l.status === 'IN_PROGRESS' && !!l.startedAt && Date.now() - new Date(l.startedAt).getTime() < DURATA_ESAME * 1000
  })
  const apriEsame = async () => {
    setCreando(true); setErroreEsame(null)
    try {
      const r = await fetch('/api/esami-generati', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.id) { setErroreEsame('Non sono riuscito a comporre l\'esame'); setCreando(false); return }
      router.push(`/simulation/${d.id}`)
    } catch { setErroreEsame('Connessione assente: riprova'); setCreando(false) }
  }
  // Una simulazione finita: rifarla da capo, o azzerarne il risultato (torna "da fare")
  const [finita, setFinita] = useState<{ simId: string; userSimId: string; numero: number } | null>(null)
  const azzeraFinita = async () => {
    if (!finita) return
    const id = finita.userSimId
    setFinita(null)
    await fetch(`/api/user-simulations/${id}`, { method: 'DELETE' })
    const us = await fetch('/api/user-simulations').then(r => r.json()).catch(() => [])
    setUserSims(Array.isArray(us) ? us : [])
  }
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
  // Azzerare una simulazione in corso cancella le risposte: prima si chiede
  const [daAzzerare, setDaAzzerare] = useState<string | null>(null)
  const chiediAzzera = (e: React.MouseEvent, userSimId: string) => {
    e.preventDefault(); e.stopPropagation()
    setDaAzzerare(userSimId)
  }
  const handleReset = async (userSimId: string) => {
    setDaAzzerare(null)
    await fetch(`/api/user-simulations/${userSimId}`, { method: 'DELETE' })
    // Ricarica i dati senza navigare
    const us = await fetch('/api/user-simulations').then(r => r.json()).catch(() => [])
    setUserSims(Array.isArray(us) ? us : [])
  }

  if (loading) return (
    <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const completed = simulations.filter(sim => getLast(sim.id)?.status === 'COMPLETED').length
  // Le simulazioni non hanno soglia: servono a passare tutto il listato. Si
  // contano quelle finite senza nessun errore
  const passed = simulations.filter(sim => { const l = getLast(sim.id); return l?.status === 'COMPLETED' && (l.errors ?? 0) === 0 }).length
  const totalPages = Math.max(1, Math.ceil(simulations.length / PER_PAGE))
  const pageItems = simulations.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const lastCompletedId = userSims.filter(u => u.status === 'COMPLETED')[0]?.simulationId || null

  return (
    <div style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Hero Header */}
      <div style={{ background: 'var(--accent)', flexShrink: 0, padding: '18px 20px 0', paddingTop: 'calc(18px + env(safe-area-inset-top))', position: 'relative', zIndex: 1 }}>
        {/* Nome dell'app e, sotto, chi è collegato: su una riga sola non ci stavano */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={19} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.15 }}>{NOME_APP}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user ? fmtName(user.username) : ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} aria-label="Esci" style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
            <LogOut size={14} color="#fff" />
          </button>
        </div>
        {/* Stats cards — sporgono sul contenuto sottostante */}
        <div style={{ display: 'flex', gap: 10, marginBottom: -28 }}>
          {[
            { n: completed, label: 'Fatte', color: 'var(--accent)' },
            { n: passed, label: 'Perfette', color: 'var(--green)' },
            // Non "da fare": accanto alle schede numerate si confondeva col numero di una simulazione
            { n: copertura && copertura.totale ? `${Math.round((copertura.affrontate / copertura.totale) * 100)}%` : '0%', label: 'Archivio', color: 'var(--text2)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.n}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text2)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* L'esame vero e proprio: 40 domande, 40 minuti, al massimo 4 errori. Le
          simulazioni sotto servono invece a vedere tutte le domande del listato */}
      <button onClick={apriEsame} disabled={creando} className="tocco"
        style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '38px 16px 0', flexShrink: 0, padding: '12px 14px', borderRadius: 18, border: 'none', background: 'var(--accent)', color: '#fff', cursor: creando ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: creando ? 0.7 : 1, boxShadow: '0 8px 20px rgba(var(--accent-rgb),0.25)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{esameInCorso ? "Riprendi l'esame" : 'Esame reale'}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.85 }}>{erroreEsame || `${DOMANDE_PER_ESAME} domande · ${DURATA_ESAME / 60} min · max ${ERRORI_AMMESSI} errori`}</div>
        </div>
        <ChevronRight size={19} color="rgba(255,255,255,0.9)" />
      </button>

      <div style={{ padding: '14px 20px 0', fontSize: 15.5, fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>Tutte le domande del listato</div>

      {/* Cards */}
      <div style={{ flex: 1, padding: '8px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3,1fr)', gap: 10, minHeight: 0 }}>
        {pageItems.map((sim, idx) => {
          const last = getLast(sim.id)
          const isDone = last?.status === 'COMPLETED'
          // Verde se finita senza errori, rossa se ne ha almeno uno
          const isPassed = (last?.errors ?? 0) === 0
          const inProgress = last?.status === 'IN_PROGRESS'
          // Le simulazioni non scadono: lasciate a metà si riprendono quando si vuole
          const isExpired = false
          const isLast = sim.id === lastCompletedId && isDone && isPassed

          // Colore per stato
          const stateColor = isDone
            ? (isPassed ? 'var(--green)' : 'var(--red)')
            : isExpired ? 'var(--red)'
            : inProgress ? 'var(--accent)'
            : 'var(--text3)'
          const stateBg = inProgress ? 'rgba(var(--accent-rgb),0.04)' : isExpired ? 'rgba(var(--red-rgb),0.04)' : 'var(--card)'

          // Click card: se completata va al report, altrimenti alla simulazione
          const cardHref = isDone && last?.id
            ? `/user-simulations/${last.id}/report`
            : `/simulation/${sim.id}`

          const cardBorder = isLast ? 'var(--green)'
            : isDone ? (isPassed ? 'var(--green)' : 'var(--red)')
            : inProgress ? 'rgba(var(--accent-rgb),0.2)'
            : 'var(--border)'
          const cardBg = isLast ? 'rgba(var(--green-rgb),0.06)'
            : isDone ? (isPassed ? 'rgba(var(--green-rgb),0.04)' : 'rgba(var(--red-rgb),0.04)')
            : stateBg

          return (
            <Link key={sim.id} href={cardHref} style={{ textDecoration: 'none', display: 'flex' }}>
              <div className="scheda" style={{
                animationDelay: `${idx * 35}ms`,
                flex: 1, borderRadius: 16, padding: '14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: stateColor, fontVariantNumeric: 'tabular-nums' }}>{sim.number}</span>
                  {/* Un tasto tondo: rifarla se è finita o scaduta, azzerarla se è in corso */}
                  {(isDone || isExpired) && (
                    <span role="button" className="tocco" aria-label={`Rifai o azzera la simulazione ${sim.number}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (last?.id) setFinita({ simId: sim.id, userSimId: last.id, numero: sim.number }) }}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card)', boxShadow: 'var(--ombra)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <RotateCcw size={16} color="var(--accent)" strokeWidth={2.4} />
                    </span>
                  )}
                  {inProgress && !isExpired && last?.id && (
                    <span role="button" className="tocco" aria-label={`Azzera la simulazione ${sim.number}`} onClick={(e) => chiediAzzera(e, last.id)}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card)', boxShadow: 'var(--ombra)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={16} color="var(--text2)" strokeWidth={2.2} />
                    </span>
                  )}
                </div>
                {/* L'esito in un'etichetta sola: icona e poche parole */}
                {(() => {
                  const errori = last?.errors ?? 0
                  const [testo, colore] =
                    isDone && isPassed && errori === 0 ? ['Perfetta', 'var(--green)']
                    : isDone ? [`${errori} ${errori === 1 ? 'errore' : 'errori'}`, isPassed ? 'var(--green)' : 'var(--red)']
                    : isExpired ? ['Scaduta', 'var(--red)']
                    : inProgress ? ['In corso', 'var(--accent)']
                    : ['Da fare', 'var(--text3)']
                  return (
                    <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, color: colore, fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {testo}
                    </span>
                  )
                })()}
              </div>
            </Link>
          )
        })}
        {/* Fill empty slots */}
        {Array.from({ length: Math.max(0, PER_PAGE - pageItems.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ borderRadius: 16, background: 'transparent' }} />
        ))}
      </div>

      {/* Paginazione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', flexShrink: 0 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ flex: 1, height: 40, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.35 : 1, fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: 'var(--text2)' }}>
          <ChevronLeft size={16} />Prec
        </button>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap', padding: '0 4px' }}>{page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          style={{ flex: 1, height: 40, background: page === totalPages - 1 ? 'var(--card)' : 'var(--accent)', border: `1.5px solid ${page === totalPages - 1 ? 'var(--border)' : 'var(--accent)'}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: page === totalPages - 1 ? 'default' : 'pointer', opacity: page === totalPages - 1 ? 0.35 : 1, fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: page === totalPages - 1 ? 'var(--text2)' : '#fff' }}>
          Succ<ChevronRight size={16} />
        </button>
      </div>

      <BottomNav active="home" />

      {finita && (
        <Avviso
          icona={<IconaAvviso><RotateCcw size={32} color="var(--accent)" strokeWidth={2.4}/></IconaAvviso>}
          titolo={`Simulazione ${finita.numero}`}
          testo="Rifalla da capo, oppure azzerala: torna da fare, e i suoi punti deboli spariscono."
          conferma={{ label: 'Rifai', onClick: () => router.push(`/simulation/${finita.simId}`) }}
          secondaria={{ label: 'Azzera il risultato', tono: 'red', onClick: azzeraFinita }}
          annulla="Annulla"
          onChiudi={() => setFinita(null)}
        />
      )}

      {daAzzerare && (
        <Avviso
          icona={<IconaAvviso tono="red"><RotateCcw size={32} color="var(--red)" strokeWidth={2.4}/></IconaAvviso>}
          titolo="Azzerare la simulazione?"
          testo="Le risposte date finora vanno perse."
          conferma={{ label: 'Azzera', onClick: () => handleReset(daAzzerare), tono: 'red' }}
          annulla="Annulla"
          onChiudi={() => setDaAzzerare(null)}
        />
      )}
    </div>
  )
}
