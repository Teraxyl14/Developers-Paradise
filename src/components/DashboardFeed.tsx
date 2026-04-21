"use client"
import { useState, useTransition } from "react"
import { IdeaCard } from "./IdeaCard"
import { useRouter } from "next/navigation"
import { getIdeas } from "@/actions/ideas"
import { Clock, TrendingUp, Filter, Loader2 } from "lucide-react"
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

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg p-1 shadow-sm dark:shadow-none">
          <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1" />
          {["All", "Beginner", "Intermediate", "Advanced"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${filter === f ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            >
              {filter === f && (
                <motion.div layoutId="filter-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-md -z-10 border border-zinc-200/50 dark:border-white/10 shadow-sm" />
              )}
              {f}
            </button>
          ))}
        </div>

        <div className="flex bg-white dark:bg-zinc-900/50 rounded-lg p-1 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <button 
            onClick={() => handleSort('latest')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 relative ${currentSort === 'latest' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-transparent'}`}
          >
            {currentSort === 'latest' && <motion.div layoutId="sort-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-md -z-10 border border-zinc-200/50 dark:border-white/10 shadow-sm" />}
            <Clock className="w-3.5 h-3.5" />
            Latest
          </button>
          <button 
             onClick={() => handleSort('trending')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 relative ${currentSort === 'trending' ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-transparent'}`}
          >
            {currentSort === 'trending' && <motion.div layoutId="sort-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-md -z-10 border border-zinc-200/50 dark:border-white/10 shadow-sm" />}
            <TrendingUp className={`w-3.5 h-3.5 ${currentSort === 'trending' ? 'text-orange-500' : ''}`} />
            Trending
          </button>
        </div>
      </div>

      <div className="space-y-4 relative">
        {(isPending || isSorting) && !isLoadingMore && (
           <div className="absolute inset-0 z-10 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
             <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
           </div>
        )}
        
        {filtered.map((idea, index) => (
          <motion.div 
            key={idea.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
             <IdeaCard idea={idea} />
          </motion.div>
        ))}
        
        {filtered.length === 0 && !isPending && (
           <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/20">
             <Filter className="w-10 h-10 mb-3 opacity-20" />
             <p className="text-sm">No ideas found matching your criteria.</p>
           </div>
        )}
      </div>

      {hasMore && filter === "All" && (
        <div className="mt-10 text-center">
          <button 
            onClick={loadMore}
            disabled={isPending}
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isPending && isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending && isLoadingMore ? 'Loading...' : 'Load More Ideas'}
          </button>
        </div>
      )}
    </div>
  )
}
