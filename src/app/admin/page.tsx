import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Shield, Users, Database, Star, GitBranch, MessageSquare, Activity } from "lucide-react"
import { AdminControls } from "./AdminControls"

const ADMIN_EMAILS = ['maruttewari12@gmail.com', 'myraanand06@gmail.com'];

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return (
      <main className="max-w-md mx-auto py-32 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">You don&apos;t have administrator privileges to view this page.</p>
        <a href="/dashboard" className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all hover:opacity-90">
          Back to Dashboard
        </a>
      </main>
    );
  }

  const [totalUsers, totalIdeas, totalRepos, totalUpvotes, totalComments, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.repository.count(),
    prisma.upvote.count(),
    prisma.comment.count(),
    prisma.user.findMany({
      orderBy: { emailVerified: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, image: true, emailVerified: true }
    })
  ]);

  // Fetch ALL ideas for moderation, with richer data
  const allIdeas = await prisma.idea.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      domain: true,
      difficulty: true,
      status: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
      _count: { select: { upvotes: true, comments: true } }
    }
  });

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Total Ideas", value: totalIdeas, icon: Database, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Total Upvotes", value: totalUpvotes, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Linked Repos", value: totalRepos, icon: GitBranch, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Comments", value: totalComments, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <main className="max-w-6xl mx-auto py-12 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Signed in as <strong className="text-zinc-700 dark:text-zinc-300">{session.user.email}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.06] shadow-sm">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} border mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.06] rounded-2xl shadow-sm p-6 mb-10">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Recent Users
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-white/5">
              {u.image ? (
                <img src={u.image} alt="" className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {u.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{u.name || 'Unknown'}</p>
                <p className="text-[11px] text-zinc-500 truncate">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Controls (Quick Actions + ALL Ideas moderation) */}
      <AdminControls ideas={allIdeas} />
    </main>
  )
}
