import prisma from "@/lib/prisma"
import { Trophy, TrendingUp, Star, GitMerge } from "lucide-react"

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: {
      submittedIdeas: {
        include: { _count: { select: { upvotes: true } } }
      },
      repositories: true,
    }
  });

  const rankedUsers = users.map(user => {
    const ideasSubmitted = user.submittedIdeas.length;
    const upvotesReceived = user.submittedIdeas.reduce((sum, idea) => sum + idea._count.upvotes, 0);
    const reposLinked = user.repositories.length;

    // Calculation: 5 pts per idea, 2 pts per upvote, 10 pts per repo linked.
    const score = (ideasSubmitted * 5) + (upvotesReceived * 2) + (reposLinked * 10);

    return {
       id: user.id,
       name: user.name || 'Anonymous Developer',
       image: user.image,
       ideasSubmitted,
       upvotesReceived,
       reposLinked,
       score
    }
  }).filter(u => u.score > 0).sort((a, b) => b.score - a.score);

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-yellow-500/10 rounded-full mb-4">
           <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">Top Developers</h1>
        <p className="text-zinc-500 dark:text-zinc-400">The most impactful builders actively solving developer pain points.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Developer</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center hidden sm:table-cell">Ideas</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center hidden sm:table-cell">Upvotes</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center hidden sm:table-cell">Repos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {rankedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {index === 0 && <span className="text-yellow-500">1</span>}
                      {index === 1 && <span className="text-zinc-400">2</span>}
                      {index === 2 && <span className="text-amber-600">3</span>}
                      {index > 2 && index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-zinc-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold text-sm">
                      {user.score} pts
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center text-zinc-600 dark:text-zinc-400 text-sm hidden sm:table-cell">
                    {user.ideasSubmitted}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center text-zinc-600 dark:text-zinc-400 text-sm hidden sm:table-cell">
                    {user.upvotesReceived}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center text-zinc-600 dark:text-zinc-400 text-sm hidden sm:table-cell">
                    {user.reposLinked}
                  </td>
                </tr>
              ))}
              {rankedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No ranked developers yet. Start submitting and building ideas!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
