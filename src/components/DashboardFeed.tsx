"use client"
import { useState, useTransition } from "react"
import { IdeaCard } from "./IdeaCard"
import { useRouter } from "next/navigation"
import { getIdeas } from "@/actions/ideas"
import { ChevronLeft, ChevronRight, Clock, TrendingUp, Filter, Loader2, Lightbulb, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useSearchParams } from "next/navigation"
import { ExpandedIdeaModal } from "./ExpandedIdeaModal"

export function DashboardFeed({ initialIdeas, currentSort, currentQuery, initialPage, totalPages }: { initialIdeas: any[], currentSort: string, currentQuery: string, initialPage: number, totalPages: number }) {
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  
  const ideas = initialIdeas;
  
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

  const handleSort = (sortType: string) => {
    startTransition(() => {
      router.push(`/dashboard?sort=${sortType}${currentQuery ? `&q=${currentQuery}` : ''}&page=1`);
    });
  };

  const goToPage = (newPage: number) => {
    startTransition(() => {
      router.push(`/dashboard?sort=${currentSort}${currentQuery ? `&q=${currentQuery}` : ''}&page=${newPage}`);
    });
  };

  const sortButtons = [
    { key: 'latest', label: 'Latest', icon: Clock, activeColor: '' },
    { key: 'trending', label: 'Trending', icon: TrendingUp, activeColor: 'text-orange-500' },
    { key: 'contrarian', label: 'Contrarian', icon: Lightbulb, activeColor: 'text-purple-500' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mb-8">
        {/* Row 1: Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Difficulty filter */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5 block ml-1">Difficulty</span>
            <div className="flex items-center gap-1 liquid-glass rounded-xl p-1">
              {(["All", "Beginner", "Intermediate", "Advanced"] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setDifficultyFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${difficultyFilter === f ? 'text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'}`}
                >
                  {difficultyFilter === f && (
                    <motion.div layoutId="filter-indicator" className="absolute inset-0 bg-bg-surface-hover rounded-lg -z-10 border border-border-default" style={{ backgroundColor: 'var(--bg-surface-hover)' }} />
                  )}
                  {f}
                  <span className="ml-1 text-[10px] text-text-faint">
                    {difficultyCounts[f]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Domain filter */}
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5 block ml-1">Domain</span>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setDomainFilter("All")} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${domainFilter === "All" ? "liquid-glass text-text-primary" : "text-text-muted hover:text-text-primary hover:bg-bg-surface"}`}>All</button>
              {allDomains.map(d => (
                <button key={d} onClick={() => setDomainFilter(d)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${domainFilter === d ? "liquid-glass text-accent-text" : "text-text-muted hover:text-text-primary hover:bg-bg-surface"}`}>{d}</button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="self-end sm:self-auto sm:mt-5">
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-bg-surface"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          {/* Sort buttons (pushed right) */}
          <div className="sm:ml-auto">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted mb-1.5 block ml-1">Sort</span>
            <div className="flex liquid-glass rounded-xl p-1">
              {sortButtons.map(({ key, label, icon: Icon, activeColor }) => (
                <button 
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 relative ${currentSort === key ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {currentSort === key && <motion.div layoutId="sort-indicator" className="absolute inset-0 bg-bg-surface-hover rounded-lg -z-10 border border-border-default" style={{ backgroundColor: 'var(--bg-surface-hover)' }} />}
                  <Icon className={`w-3.5 h-3.5 ${currentSort === key ? activeColor : ''}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Showing <strong className="text-text-primary">{filtered.length}</strong> of {ideas.length} ideas
          </div>
        )}
      </div>

      <motion.div 
        className="flex flex-col gap-3 relative"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {isPending && (
           <div className="absolute inset-0 z-10 bg-bg-primary/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
           </div>
        )}
        
        {filtered.map((idea) => (
          <motion.div 
            key={idea.id}
            variants={itemVariants}
          >
             <IdeaCard idea={idea} onClick={() => setActiveIdeaId(idea.id)} />
          </motion.div>
        ))}
        
        {filtered.length === 0 && !isPending && (
           <div className="flex flex-col items-center justify-center py-24 text-text-muted border border-dashed border-border-default rounded-2xl bg-bg-surface">
             <Filter className="w-10 h-10 mb-3 opacity-20" />
             <p className="text-sm font-medium">No ideas found matching your criteria.</p>
             <p className="text-xs text-text-faint mt-1">Try adjusting your filters or search query.</p>
           </div>
        )}
      </motion.div>

      <AnimatePresence>
        {activeIdeaId && (
          <ExpandedIdeaModal idea={ideas.find(i => i.id === activeIdeaId)} onClose={() => setActiveIdeaId(null)} />
        )}
      </AnimatePresence>

      {!hasActiveFilters && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button 
            onClick={() => goToPage(initialPage - 1)}
            disabled={initialPage <= 1 || isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-border-default bg-bg-primary text-text-secondary disabled:opacity-50 hover:bg-bg-surface transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          
          <div className="text-sm font-medium text-text-muted">
            Page <span className="text-text-primary">{initialPage}</span> of {totalPages}
          </div>

          <button 
            onClick={() => goToPage(initialPage + 1)}
            disabled={initialPage >= totalPages || isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-border-default bg-bg-primary text-text-secondary disabled:opacity-50 hover:bg-bg-surface transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
