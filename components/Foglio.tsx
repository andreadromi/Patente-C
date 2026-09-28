'use client'
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Un pannello che sale dal basso con un elenco dentro: i dettagli che non
 * devono allungare la pagina (argomenti, esami, dove si fa fatica) si aprono
 * qui. Stesso stile degli avvisi; si chiude toccando fuori, con la X o Esc.
 */
export function Foglio({ titolo, sottotitolo, onChiudi, children }: {
  titolo: string
  sottotitolo?: string
  onChiudi: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => { if (e.key === 'Escape') onChiudi() }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [onChiudi])

  return (
    <div onClick={onChiudi} role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,26,48,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'velo .2s ease-out' }}>
      <style>{`
        @keyframes velo { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pannello { from { transform: translateY(100%) } to { transform: none } }
      `}</style>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titolo}
        style={{ width: '100%', maxWidth: 480, maxHeight: '84dvh', display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(20,26,48,0.18)', animation: 'pannello .32s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--border)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: -0.4 }}>{titolo}</h2>
              {sottotitolo && <p style={{ fontSize: 15, color: 'var(--text3)', fontWeight: 600, margin: '3px 0 0' }}>{sottotitolo}</p>}
            </div>
            <button onClick={onChiudi} aria-label="Chiudi"
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={18} color="var(--text2)" />
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 20px calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
