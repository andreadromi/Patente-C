import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) redirect('/login')

  const [totalUsers, totalQuestions, totalSimulations, totalCompleted, recentUsers] =
    await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.question.count(),
      prisma.simulation.count(),
      prisma.userSimulation.count({ where: { status: 'COMPLETED' } }),
      prisma.user.findMany({
        where: { isAdmin: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { _count: { select: { userSimulations: true } } }
      })
    ])

  async function handleLogout() {
    'use server'
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
    redirect('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#4D5057' }}>
      {/* Header */}
      <div style={{ background: '#D8E4A8', padding: '18px 20px', borderBottom: '2px solid #C8D498' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#2D3436', letterSpacing: 1 }}>ADMIN</div>
          <form action={handleLogout}>
            <button type="submit" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#4D5057', cursor: 'pointer' }}>
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
            { n: totalQuestions.toLocaleString(), label: 'Domande' },
            { n: totalSimulations, label: 'Simulazioni' },
            { n: totalCompleted, label: 'Completate' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#059669' }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gestione utenti */}
        <Link href="/admin/users" style={{ textDecoration: 'none', display: 'block', background: '#fff', border: '1px solid #E2E6EA', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#4D5057' }}>Gestione Utenti</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{totalUsers} utenti registrati</div>
            </div>
            <span style={{ fontSize: 18, color: '#9CA3AF' }}>→</span>
          </div>
        </Link>

        {/* Utenti recenti */}
        <div style={{ background: '#fff', border: '1px solid #E2E6EA', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: 2, marginBottom: 12 }}>UTENTI RECENTI</div>
          {recentUsers.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>Nessun utente</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#4D5057' }}>{u.username}</span>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>{u._count.userSimulations} quiz</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
