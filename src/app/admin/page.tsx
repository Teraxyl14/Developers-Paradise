import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Shield, Users, Database, Star } from "lucide-react"
import { AdminControls } from "./AdminControls"

export default async function AdminPage() {
  const session = await auth();
  const allowedEmails = ['maruttewari12@gmail.com', 'myraanand06@gmail.com'];

  if (!session?.user?.email || !allowedEmails.includes(session.user.email)) {
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

  const [totalUsers, totalIdeas, totalRepos, totalUpvotes] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.repository.count(),
    prisma.upvote.count()
  ]);

  const latestIdeas = await prisma.idea.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, title: true, authorId: true }
  });

  return (
    <main className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manage platform data, trigger events, and monitor growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Users</span>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{totalUsers}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Database className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Ideas</span>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{totalIdeas}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Upvotes</span>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{totalUpvotes}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Linked Repos</span>
          </div>
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{totalRepos}</span>
        </div>
      </div>

      <AdminControls ideas={latestIdeas} />
    </main>
  )
}
