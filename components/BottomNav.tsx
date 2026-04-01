'use client'
import Link from 'next/link'
import { Home, Target, BookOpen } from 'lucide-react'

export function BottomNav({ active }: { active?: 'home' | 'focus' | 'deboli' }) {
  const items = [
    { key: 'home', href: '/dashboard', Icon: Home, label: 'Home' },
    { key: 'focus', href: '/focus', Icon: Target, label: 'Focus' },
    { key: 'deboli', href: '/weak-points', Icon: BookOpen, label: 'Punti deboli' },
  ]
  return (
    <div style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom,8px)' }}>
      {items.map(({ key, href, Icon, label }) => {
        const isActive = key === active
        const El = isActive ? 'div' : Link
        const props = isActive ? {} : { href, style: { textDecoration: 'none' } }
        return (
          <El key={key} {...(props as any)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
            <Icon size={19} color={isActive ? 'var(--accent)' : 'var(--text3)'} />
            <span style={{ fontSize: 9, color: isActive ? 'var(--accent)' : 'var(--text3)', fontWeight: isActive ? 700 : 600 }}>{label}</span>
          </El>
        )
      })}
    </div>
  )
}
