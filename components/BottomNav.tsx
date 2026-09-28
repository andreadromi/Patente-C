'use client'
import Link from 'next/link'
import { Home, Target, BookOpen, BarChart3 } from 'lucide-react'

export function BottomNav({ active }: { active?: 'home' | 'focus' | 'deboli' | 'riepilogo' }) {
  const items = [
    { key: 'home',        href: '/dashboard',    Icon: Home,          label: 'Home' },
    { key: 'focus',       href: '/focus',         Icon: Target,        label: 'Focus' },
    { key: 'deboli',      href: '/weak-points',   Icon: BookOpen,      label: 'Punti Deboli' },
    { key: 'riepilogo',   href: '/riepilogo',     Icon: BarChart3,     label: 'Riepilogo' },
  ]
  return (
    <nav style={{ background:'var(--nav-bg)', borderTop:'1px solid var(--nav-border)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', flexShrink:0, padding:'6px 6px calc(env(safe-area-inset-bottom, 0px) + 6px)' }}>
      {items.map(({ key, href, Icon, label }) => {
        const isActive = key === active
        const El = isActive ? 'div' : Link
        const props = isActive ? {} : { href }
        return (
          <El key={key} {...(props as any)} className="tocco" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'6px 0 4px', textDecoration:'none', cursor:isActive?'default':'pointer' }}>
            {/* La sezione aperta sta in una pillola colorata, come nelle app di sistema */}
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:56, height:30, borderRadius:15, background:isActive?'rgba(var(--accent-rgb),0.13)':'transparent', transition:'background .2s' }}>
              <Icon size={22} color={isActive ? 'var(--accent)' : 'var(--text2)'} strokeWidth={isActive ? 2.4 : 2} />
            </span>
            <span style={{ fontSize:12.5, color:isActive?'var(--accent)':'var(--text2)', fontWeight:isActive?800:600, whiteSpace:'nowrap' }}>{label}</span>
          </El>
        )
      })}
    </nav>
  )
}
