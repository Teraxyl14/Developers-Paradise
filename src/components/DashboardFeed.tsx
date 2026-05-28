"use client"
import { useState, useTransition, useRef, useEffect } from "react"
import { IdeaCard } from "./IdeaCard"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  TrendingUp, 
  Filter, 
  Loader2, 
  Lightbulb, 
  X, 
  ChevronDown, 
  Search,
  Network, 
  Server, 
  Cpu, 
  Database, 
  Eye, 
  Terminal, 
  Shield, 
  Sparkles, 
  Smartphone, 
  Code2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ExpandedIdeaModal } from "./ExpandedIdeaModal"

// Helper to resolve specific category icons for visual appeal
const getDomainIcon = (domain: string) => {
  const name = domain.toLowerCase();
  if (name.includes("devops") || name.includes("infra") || name.includes("cloud")) return Network;
  if (name.includes("backend") || name.includes("api") || name.includes("server")) return Server;
  if (name.includes("ai") || name.includes("ml") || name.includes("model") || name.includes("intelligence")) return Sparkles;
  if (name.includes("database") || name.includes("data") || name.includes("sql") || name.includes("postgres")) return Database;
  if (name.includes("frontend") || name.includes("ui") || name.includes("css") || name.includes("client")) return Eye;
  if (name.includes("devtools") || name.includes("tool") || name.includes("cli")) return Terminal;
  if (name.includes("security") || name.includes("auth") || name.includes("crypto")) return Shield;
  if (name.includes("mobile") || name.includes("app") || name.includes("ios") || name.includes("android")) return Smartphone;
  return Code2; // Default fallback icon
};

export function DashboardFeed({ 
  initialIdeas, 
  currentSort, 
  currentQuery, 
  initialPage, 
  totalPages,
  currentDifficulty,
  currentDomain,
  allDomains,
  difficultyCounts,
  initialExpandedIdeaId
}: { 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialIdeas: { id: string, [key: string]: any }[], 
  currentSort: string, 
  currentQuery: string, 
  initialPage: number, 
  totalPages: number,
  currentDifficulty: string,
  currentDomain: string,
  allDomains: { name: string, count: number }[],
  difficultyCounts: { All: number, Beginner: number, Intermediate: number, Advanced: number },
  initialExpandedIdeaId?: string | null
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(initialExpandedIdeaId || null);
  
  // Smooth scroll centered on the expanded card
  useEffect(() => {
    if (activeIdeaId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`idea-card-${activeIdeaId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350); // wait for framer-motion layout to update height
      return () => clearTimeout(timer);
    }
  }, [activeIdeaId]);

  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const ideas = initialIdeas;
  const hasActiveFilters = currentDifficulty !== "All" || currentDomain !== "All";

  // Dynamic search path construction
  const navigateWithFilters = (newSort: string, newQuery: string, newPage: number, newDifficulty: string, newDomain: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (newSort && newSort !== 'latest') params.set('sort', newSort);
      if (newQuery) params.set('q', newQuery);
      if (newPage > 1) params.set('page', String(newPage));
      if (newDifficulty && newDifficulty !== 'All') params.set('difficulty', newDifficulty);
      if (newDomain && newDomain !== 'All') params.set('domain', newDomain);
      
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    navigateWithFilters(currentSort, currentQuery, 1, "All", "All");
  };

  const handleSort = (sortType: string) => {
    navigateWithFilters(sortType, currentQuery, 1, currentDifficulty, currentDomain);
  };

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    navigateWithFilters(currentSort, currentQuery, newPage, currentDifficulty, currentDomain);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortButtons = [
    { key: 'latest', label: 'Latest', icon: Clock, activeColor: '' },
    { key: 'trending', label: 'Trending', icon: TrendingUp, activeColor: 'text-orange-500' },
    { key: 'contrarian', label: 'Contrarian', icon: Lightbulb, activeColor: 'text-purple-500' },
  ];

  // Helper for generating premium numbered pagination with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (initialPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (initialPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', initialPage - 1, initialPage, initialPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const filteredDropdownDomains = allDomains.filter(d => 
    d.name.toLowerCase().includes(domainSearch.toLowerCase())
  );

  const ActiveDomainIcon = currentDomain !== "All" ? getDomainIcon(currentDomain) : Filter;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 25 } }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        {/* Row 1: Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
            {/* Difficulty segment selector */}
            <div className="w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block ml-1">Difficulty</span>
              <div className="flex items-center gap-1 liquid-glass rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start">
                {(["All", "Beginner", "Intermediate", "Advanced"] as const).map(f => (
                  <button 
                    key={f} 
                    onClick={() => navigateWithFilters(currentSort, currentQuery, 1, f, currentDomain)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative flex-1 sm:flex-none text-center ${currentDifficulty === f ? 'text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'}`}
                  >
                    {currentDifficulty === f && (
                      <motion.div 
                        layoutId="difficulty-indicator" 
                        className="absolute inset-0 bg-bg-surface-hover rounded-lg -z-10 border border-border-default" 
                        style={{ backgroundColor: 'var(--bg-surface-hover)' }} 
                      />
                    )}
                    <span className="relative z-10">{f}</span>
                    <span className="ml-1 text-[10px] text-text-faint relative z-10">
                      ({difficultyCounts[f]})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Dropdown Selector */}
            <div className="relative w-full sm:w-64" ref={dropdownRef}>
              <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block ml-1">Domain</span>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold rounded-xl liquid-glass text-text-primary hover:border-border-hover transition-all"
              >
                <div className="flex items-center gap-2 text-left min-w-0">
                  {/* eslint-disable-next-line react-hooks/static-components */}
                  <ActiveDomainIcon className="w-4 h-4 text-accent shrink-0" />
                  <span className="truncate">
                    {currentDomain === "All" ? "All Domains" : currentDomain}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 mt-2 bg-bg-primary/95 backdrop-blur-xl border border-border-default shadow-2xl rounded-2xl p-2 z-50 max-h-72 overflow-y-auto flex flex-col gap-1 w-full"
                  >
                    {/* Search Field */}
                    <div className="relative px-2 py-1.5 border-b border-border-default/40 mb-1 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <input
                        type="text"
                        placeholder="Search domains..."
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-faint w-full focus:ring-0 p-0"
                      />
                      {domainSearch && (
                        <button onClick={() => setDomainSearch("")}>
                          <X className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
                        </button>
                      )}
                    </div>

                    {/* Option: All */}
                    <button
                      onClick={() => {
                        navigateWithFilters(currentSort, currentQuery, 1, currentDifficulty, "All");
                        setIsDropdownOpen(false);
                        setDomainSearch("");
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${currentDomain === "All" ? "bg-accent/10 text-accent-text border border-accent/20" : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Filter className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">All Domains</span>
                      </div>
                      <span className="text-[10px] text-text-faint">({difficultyCounts.All})</span>
                    </button>

                    {/* Dynamic structured list */}
                    {filteredDropdownDomains.map(d => {
                      const Icon = getDomainIcon(d.name);
                      return (
                        <button
                          key={d.name}
                          onClick={() => {
                            navigateWithFilters(currentSort, currentQuery, 1, currentDifficulty, d.name);
                            setIsDropdownOpen(false);
                            setDomainSearch("");
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${currentDomain === d.name ? "bg-accent/10 text-accent-text border border-accent/20" : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{d.name}</span>
                          </div>
                          <span className="text-[10px] text-text-faint">({d.count})</span>
                        </button>
                      );
                    })}

                    {filteredDropdownDomains.length === 0 && (
                      <div className="text-center py-4 text-xs text-text-faint">
                        No domains found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sort Buttons */}
          <div className="w-full lg:w-auto lg:self-end">
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5 block ml-1">Sort By</span>
            <div className="flex liquid-glass rounded-xl p-1 w-full lg:w-auto justify-between sm:justify-start">
              {sortButtons.map(({ key, label, icon: Icon, activeColor }) => (
                <button 
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 relative flex-1 sm:flex-none justify-center ${currentSort === key ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {currentSort === key && (
                    <motion.div 
                      layoutId="sort-indicator" 
                      className="absolute inset-0 bg-bg-surface-hover rounded-lg -z-10 border border-border-default" 
                      style={{ backgroundColor: 'var(--bg-surface-hover)' }} 
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${currentSort === key ? activeColor : ''}`} />
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-dashed border-border-default/80 bg-bg-surface/30">
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
              Active filters: 
              {currentDifficulty !== "All" && (
                <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent-text text-[10px] font-bold border border-accent/10">
                  Difficulty: {currentDifficulty}
                </span>
              )}
              {currentDomain !== "All" && (
                <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent-text text-[10px] font-bold border border-accent/10">
                  Domain: {currentDomain}
                </span>
              )}
            </div>
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-accent-text hover:text-accent transition-colors px-2 py-1 rounded-md bg-accent/5 hover:bg-accent/10 border border-accent/10"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <motion.div 
        className="flex flex-col gap-3.5 relative min-h-[300px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {isPending && (
           <div className="absolute inset-0 z-10 bg-bg-primary/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
           </div>
        )}
        
        {ideas.map((idea) => (
          <motion.div 
            key={idea.id}
            variants={itemVariants}
            layout="position"
          >
             <IdeaCard 
               idea={idea} 
               isExpanded={activeIdeaId === idea.id} 
               onToggle={() => setActiveIdeaId(activeIdeaId === idea.id ? null : idea.id)} 
             />
          </motion.div>
        ))}
        
        {ideas.length === 0 && !isPending && (
           <div className="flex flex-col items-center justify-center py-24 text-text-muted border border-dashed border-border-default rounded-3xl bg-bg-surface/50">
             <Filter className="w-12 h-12 mb-4 opacity-15 text-accent" />
             <p className="text-sm font-semibold text-text-primary">No ideas found matching your criteria</p>
             <p className="text-xs text-text-faint mt-1 max-w-sm text-center">Try adjusting your filters, searching for a different keyword, or clearing filters entirely.</p>
             <button
               onClick={clearFilters}
               className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
             >
               Clear Active Filters
             </button>
           </div>
        )}
      </motion.div>

      {/* Numbered Premium Pagination System */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1.5 sm:gap-2">
          {/* Previous Button */}
          <button 
            onClick={() => goToPage(initialPage - 1)}
            disabled={initialPage <= 1 || isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border-default bg-bg-primary text-text-secondary disabled:opacity-40 disabled:hover:bg-bg-primary hover:bg-bg-surface hover:text-text-primary hover:border-border-hover transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Prev</span>
          </button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span 
                    key={`ellipsis-${idx}`} 
                    className="w-8 h-8 flex items-center justify-center text-text-faint text-xs font-bold"
                  >
                    ...
                  </span>
                );
              }
              
              const isCurrent = initialPage === pageNum;
              
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => goToPage(pageNum as number)}
                  disabled={isPending}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ${isCurrent ? 'text-accent-text border border-accent/20 shadow-inner' : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'}`}
                >
                  {isCurrent && (
                    <motion.div 
                      layoutId="active-page-glow" 
                      className="absolute inset-0 bg-accent/15 rounded-lg border border-accent/30 -z-10 shadow-lg shadow-accent/5" 
                    />
                  )}
                  <span className="relative z-10">{pageNum}</span>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button 
            onClick={() => goToPage(initialPage + 1)}
            disabled={initialPage >= totalPages || isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border-default bg-bg-primary text-text-secondary disabled:opacity-40 disabled:hover:bg-bg-primary hover:bg-bg-surface hover:text-text-primary hover:border-border-hover transition-all"
          >
            <span className="hidden sm:inline">Next</span> <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
