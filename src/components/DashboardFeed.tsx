"use client"
import { useState, useTransition } from "react"
import { IdeaCard } from "./IdeaCard"
import { useRouter } from "next/navigation"
import { getIdeas } from "@/actions/ideas"
import { Clock, TrendingUp, Filter, Loader2, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

export function DashboardFeed({ initialIdeas, currentSort, currentQuery }: { initialIdeas: any[], currentSort: string, currentQuery: string }) {
  const [filter, setFilter] = useState("All");
  const [ideas, setIdeas] = useState(initialIdeas);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialIdeas.length === 10);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();
  
  const filtered = filter === "All" 
    ? ideas 
    : ideas.filter(i => i.difficulty === filter);

  const loadMore = () => {
    setIsLoadingMore(true);
    startTransition(async () => {
      const nextPage = page + 1;
      const newIdeas = await getIdeas(currentSort as any, currentQuery, nextPage);
      if (newIdeas.length < 10) setHasMore(false);
      setIdeas([...ideas, ...newIdeas]);
      setPage(nextPage);
      setIsLoadingMore(false);
    });
  };

  const [isSorting, startSorting] = useTransition();

  const handleSort = (sortType: string) => {
    startSorting(() => {
      router.push(`/dashboard?sort=${sortType}${currentQuery ? `&q=${currentQuery}` : ''}`);
    });
  };

  const sortButtons = [
    { key: 'latest', label: 'Latest', icon: Clock, activeColor: '' },
    { key: 'trending', label: 'Trending', icon: TrendingUp, activeColor: 'text-orange-500' },
    { key: 'contrarian', label: 'Contrarian', icon: Lightbulb, activeColor: 'text-purple-500' },
  ]

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Difficulty filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-xl p-1 shadow-sm">
          <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 ml-2 mr-1" />
          {["All", "Beginner", "Intermediate", "Advanced"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${filter === f ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
            >
              {filter === f && (
                <motion.div layoutId="filter-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg -z-10 border border-zinc-200/50 dark:border-white/[0.08] shadow-sm" />
              )}
              {f}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex bg-white dark:bg-zinc-900/50 rounded-xl p-1 border border-zinc-200/80 dark:border-white/[0.06] shadow-sm">
          {sortButtons.map(({ key, label, icon: Icon, activeColor }) => (
            <button 
              key={key}
              onClick={() => handleSort(key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 relative ${currentSort === key ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-transparent'}`}
            >
              {currentSort === key && <motion.div layoutId="sort-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg -z-10 border border-zinc-200/50 dark:border-white/[0.08] shadow-sm" />}
              <Icon className={`w-3.5 h-3.5 ${currentSort === key ? activeColor : ''}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative">
        {(isPending || isSorting) && !isLoadingMore && (
           <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#050507]/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
             <div className="flex flex-col items-center gap-2">
               <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
             </div>
           </div>
        )}
        
        {filtered.map((idea, index) => (
          <motion.div 
            key={idea.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
             <IdeaCard idea={idea} />
          </motion.div>
        ))}
        
        {filtered.length === 0 && !isPending && (
           <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
             <Filter className="w-10 h-10 mb-3 opacity-20" />
             <p className="text-sm font-medium">No ideas found matching your criteria.</p>
             <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters or search query.</p>
           </div>
        )}
      </div>

      {hasMore && filter === "All" && (
        <div className="mt-10 text-center">
          <button 
            onClick={loadMore}
            disabled={isPending}
            className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/15 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 mx-auto hover:-translate-y-0.5"
          >
            {isPending && isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending && isLoadingMore ? 'Loading...' : 'Load More Ideas'}
          </button>
        </div>
      )}
    </div>
  )
}
