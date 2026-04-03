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
        take: 5,
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
    <div className="min-h-screen bg-[#F8F9FC] text-[#4D5057]">
      {/* Header */}
      <div className="bg-[#D5EA60] border-b border-[#E2E6EA] px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="bg-[#059669] text-white text-xs font-black px-2 py-1 rounded tracking-widest">ADMIN</span>
            <h1 className="text-lg font-black mt-1">Pannello Amministrazione</h1>
            <p className="text-xs text-[#9CA3AF]">{user.username}</p>
          </div>
          <form action={handleLogout}>
            <button className="text-xs px-3 py-2 bg-white text-[#6B7280] rounded-lg border border-[#E2E6EA]">
              Esci
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Utenti', value: totalUsers, icon: '👤', color: 'text-[#059669]' },
            { label: 'Domande', value: totalQuestions.toLocaleString(), icon: '📝', color: 'text-[#059669]' },
            { label: 'Simulazioni', value: totalSimulations, icon: '🎯', color: 'text-purple-400' },
            { label: 'Completate', value: totalCompleted, icon: '✅', color: 'text-[#059669]' },
          ].map(s => (
            <div key={s.label} className="bg-[#D5EA60] border border-[#E2E6EA] rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#9CA3AF]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {[
            { href: '/admin/questions', label: '📝 Gestione Domande', desc: `${totalQuestions.toLocaleString()} domande nel database` },
            { href: '/admin/simulations', label: '🎯 Gestione Simulazioni', desc: `${totalSimulations} simulazioni disponibili` },
            { href: '/admin/users', label: '👤 Gestione Utenti', desc: `${totalUsers} utenti registrati` },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="bg-[#D5EA60] border border-[#E2E6EA] hover:border-[#059669] rounded-xl p-4 flex items-center justify-between transition-colors">
              <div>
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</div>
              </div>
              <span className="text-gray-600 text-lg">→</span>
            </Link>
          ))}
        </div>

        {/* Ultimi utenti */}
        {recentUsers.length > 0 && (
          <div className="bg-[#D5EA60] border border-[#E2E6EA] rounded-xl p-4">
            <h3 className="text-xs text-[#059669] tracking-widest uppercase font-bold mb-3">Ultimi utenti registrati</h3>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center text-sm">
                  <span className="text-[#4D5057]">{u.username}</span>
                  <span className="text-gray-600 text-xs">{u._count.userSimulations} simulazioni</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
