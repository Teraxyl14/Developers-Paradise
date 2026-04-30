"use client"
import { motion } from "framer-motion"
import { Trophy, Crown, Star, GitBranch, Lightbulb, ChevronUp } from "lucide-react"

type RankedUser = {
  id: string
  name: string
  image: string | null
  ideasSubmitted: number
  upvotesReceived: number
  reposLinked: number
  score: number
}

function PodiumCard({ user, rank, delay }: { user: RankedUser, rank: number, delay: number }) {
  const config: Record<number, { gradient: string, ring: string, height: string, medal: string, shadow: string }> = {
    1: { gradient: "from-yellow-400 to-amber-500", ring: "ring-yellow-400/30", height: "h-32", medal: "🥇", shadow: "shadow-yellow-500/20" },
    2: { gradient: "from-zinc-300 to-zinc-400", ring: "ring-zinc-300/30", height: "h-24", medal: "🥈", shadow: "shadow-zinc-400/20" },
    3: { gradient: "from-amber-600 to-amber-700", ring: "ring-amber-600/30", height: "h-20", medal: "🥉", shadow: "shadow-amber-600/20" },
  }
  const c = config[rank]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center ${rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}
    >
      <div className="relative mb-3">
        {rank === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3, type: "spring" }}
            className="absolute -top-5 left-1/2 -translate-x-1/2"
          >
            <Crown className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}
        {user.image ? (
          <img src={user.image} alt={user.name} className={`w-16 h-16 md:w-20 md:h-20 rounded-full ring-4 ${c.ring} shadow-xl ${c.shadow} object-cover`} />
        ) : (
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xl font-bold ring-4 ${c.ring} shadow-xl ${c.shadow}`}>
            {user.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[120px] text-center">{user.name}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{user.score} pts</span>
      <div className={`w-20 md:w-28 ${c.height} bg-gradient-to-t ${c.gradient} rounded-t-xl mt-3 flex items-start justify-center pt-3 shadow-lg ${c.shadow}`}>
        <span className="text-2xl">{c.medal}</span>
      </div>
    </motion.div>
  )
}

export function LeaderboardView({ rankedUsers }: { rankedUsers: RankedUser[] }) {
  const top3 = rankedUsers.slice(0, 3)
  const rest = rankedUsers.slice(3)

  return (
    <>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/20 mb-4">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">Top Developers</h1>
        <p className="text-zinc-500 dark:text-zinc-400">The most impactful builders actively solving real developer problems.</p>
      </motion.div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 md:gap-6 mb-12">
          {top3.map((user, i) => (
            <PodiumCard key={user.id} user={user} rank={i + 1} delay={i * 0.15} />
          ))}
        </div>
      )}

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-white/[0.06]">
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Developer</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center">Score</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center hidden sm:table-cell">
                  <Lightbulb className="w-3.5 h-3.5 inline -mt-0.5" /> Ideas
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center hidden sm:table-cell">
                  <ChevronUp className="w-3.5 h-3.5 inline -mt-0.5" /> Upvotes
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center hidden sm:table-cell">
                  <GitBranch className="w-3.5 h-3.5 inline -mt-0.5" /> Repos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-white/[0.04]">
              {rankedUsers.map((user, index) => (
                <motion.tr 
                  key={user.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400' :
                      index === 1 ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                      index === 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-white/10 group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white group-hover:scale-105 transition-transform">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-sm stat-number">
                      {user.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-600 dark:text-zinc-400 stat-number hidden sm:table-cell">
                    {user.ideasSubmitted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-600 dark:text-zinc-400 stat-number hidden sm:table-cell">
                    {user.upvotesReceived}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-600 dark:text-zinc-400 stat-number hidden sm:table-cell">
                    {user.reposLinked}
                  </td>
                </motion.tr>
              ))}
              {rankedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <Star className="w-8 h-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-medium">No ranked developers yet.</p>
                    <p className="text-sm mt-1">Start submitting and building ideas!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  )
}
