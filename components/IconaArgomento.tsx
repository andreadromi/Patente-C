import { aspettoArgomento } from '@/lib/argomenti'

/** Il riquadro colorato con l'icona dell'argomento. */
export function IconaArgomento({ code, size = 40, spenta = false }: { code: string; size?: number; spenta?: boolean }) {
  const { Icona, colore } = aspettoArgomento(code)
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: spenta ? 'var(--surface)' : colore,
    }}>
      <Icona size={Math.round(size * 0.5)} color={spenta ? 'var(--text3)' : '#fff'} strokeWidth={2.2} />
    </div>
  )
}
