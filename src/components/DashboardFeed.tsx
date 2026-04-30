"use client"
import { useState, useTransition } from "react"
import { IdeaCard } from "./IdeaCard"
import { useRouter } from "next/navigation"
import { getIdeas } from "@/actions/ideas"
import { Clock, TrendingUp, Filter, Loader2, Lightbulb, X, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"

export function DashboardFeed({ initialIdeas, currentSort, currentQuery }: { initialIdeas: any[], currentSort: string, currentQuery: string }) {
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [ideas, setIdeas] = useState(initialIdeas);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialIdeas.length === 10);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();
  
  // Derive unique domains from loaded ideas
  const allDomains = Array.from(new Set(ideas.map(i => i.domain).filter(Boolean))).sort();

  const filtered = ideas.filter(i => {
    if (difficultyFilter !== "All" && i.difficulty !== difficultyFilter) return false;
    if (domainFilter !== "All" && i.domain !== domainFilter) return false;
    return true;
  });

  // Count ideas per difficulty level
  const difficultyCounts = {
    All: ideas.length,
    Beginner: ideas.filter(i => i.difficulty === "Beginner").length,
    Intermediate: ideas.filter(i => i.difficulty === "Intermediate").length,
    Advanced: ideas.filter(i => i.difficulty === "Advanced").length,
  };

  const hasActiveFilters = difficultyFilter !== "All" || domainFilter !== "All";

  const clearFilters = () => {
    setDifficultyFilter("All");
    setDomainFilter("All");
  };

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
      <div className="flex flex-col gap-3 mb-8">
        {/* Row 1: Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Difficulty filter */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 block ml-1">Difficulty</span>
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-xl p-1 shadow-sm">
              {(["All", "Beginner", "Intermediate", "Advanced"] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setDifficultyFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${difficultyFilter === f ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'}`}
                >
                  {difficultyFilter === f && (
                    <motion.div layoutId="filter-indicator" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg -z-10 border border-zinc-200/50 dark:border-white/[0.08] shadow-sm" />
                  )}
                  {f}
                  <span className="ml-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    {difficultyCounts[f]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Domain filter dropdown */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 block ml-1">Domain</span>
            <div className="relative">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.06] rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              >
                <option value="All">All Domains</option>
                {allDomains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="self-end sm:self-auto sm:mt-5">
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            </div>
          )}

          {/* Sort buttons (pushed right) */}
          <div className="sm:ml-auto">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 block ml-1">Sort by</span>
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
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Showing <strong className="text-zinc-700 dark:text-zinc-200">{filtered.length}</strong> of {ideas.length} ideas
          </div>
        )}
      </div>

      <div className="space-y-6 relative">
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

      {hasMore && !hasActiveFilters && (
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
