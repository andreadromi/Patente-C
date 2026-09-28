import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) redirect('/login')

  const [totalUsers, totalQuestions, totalArgomenti, totalSimulations, totalCompleted, recentUsers] =
    await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.question.count(),
      prisma.argomento.count(),
      prisma.simulation.count({ where: { generata: false } }),
      prisma.userSimulation.count({ where: { status: 'COMPLETED' } }),
      prisma.user.findMany({
        where: { isAdmin: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { _count: { select: { userSimulations: true } } }
      }),
    ])

  async function handleLogout() {
    'use server'
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
    redirect('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'system-ui,-apple-system,sans-serif', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ background: 'var(--header-bg)', padding: '18px 20px', borderBottom: '1px solid var(--nav-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: 1 }}>ADMIN</div>
          <form action={handleLogout}>
            <button type="submit" style={{ padding: '8px 16px', background: 'var(--surface)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
              Esci
            </button>
          </form>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { n: totalUsers, label: 'Utenti' },
            { n: totalQuestions.toLocaleString('it-IT'), label: `Domande V/F · ${totalArgomenti} argomenti` },
            { n: totalSimulations, label: 'Simulazioni' },
            { n: totalCompleted, label: 'Completate' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gestione */}
        {[
          { href: '/admin/users', titolo: 'Gestione Utenti', sotto: `${totalUsers} utenti registrati` },
          { href: '/admin/simulations', titolo: 'Simulazioni', sotto: `${totalSimulations} simulazioni` },
          { href: '/admin/questions', titolo: 'Domande', sotto: `${totalQuestions.toLocaleString('it-IT')} domande del listato` },
        ].map(v => (
          <Link key={v.href} href={v.href} style={{ textDecoration: 'none', display: 'block', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{v.titolo}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{v.sotto}</div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--text3)' }}>→</span>
            </div>
          </Link>
        ))}
        <div style={{ height: 10 }} />

        {/* Utenti recenti */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: 2, marginBottom: 12 }}>UTENTI RECENTI</div>
          {recentUsers.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Nessun utente</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.username}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>{u._count.userSimulations} simulazioni</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
