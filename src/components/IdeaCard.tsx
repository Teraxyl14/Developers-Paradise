"use client"
import { useState, useOptimistic, startTransition, useTransition, useRef } from "react"
import { toggleSaveIdea, linkRepository, toggleUpvote, updateIdeaStatus, toggleWaitlist } from "@/actions/interactions"
import { deleteIdea } from "@/actions/submissions"
import { runPerformanceAudit } from "@/actions/audit"
import { generateRepoRoast } from "@/actions/roast"
import { CommentSection } from "@/components/CommentSection"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp, Bookmark, ExternalLink, MessageSquare, Trash2, ArrowUpRight, CheckCircle2, Clock, HandMetal, Users, Flame, Loader2, BarChart2 } from "lucide-react"

import { MarketIntelligence } from "@/components/MarketIntelligence"

export function IdeaCard({ idea, initiallyExpanded = false }: { idea: any, initiallyExpanded?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [repoUrl, setRepoUrl] = useState("");
  const [showComments, setShowComments] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);

  const requireAuth = () => {
    if (!session?.user?.id) {
      router.push('/api/auth/signin?callbackUrl=/dashboard');
      return false;
    }
    return true;
  };
  
  const isAuthor = session?.user?.id === idea.authorId;
  const commentCount = idea._count?.comments || 0;

  // Optimistic UI states
  const [optSaved, addOptSaved] = useOptimistic(idea.savedBy?.length > 0, (state, newValue: boolean) => newValue);
  const [optWaitlisted, addOptWaitlisted] = useOptimistic(idea.waitlist?.some((w:any) => w.userId === session?.user?.id) || false, (state, newValue: boolean) => newValue);
  const [optWaitlistCount, addOptWaitlistCount] = useOptimistic(idea.waitlist?.length || 0, (state, newCount: number) => newCount);
  const [optUpvoted, addOptUpvoted] = useOptimistic(idea.upvotes?.length > 0, (state, newValue: boolean) => newValue);
  const [optUpvoteCount, addOptUpvoteCount] = useOptimistic(idea._count?.upvotes || 0, (state, newCount: number) => newCount);
  const [optStatus, addOptStatus] = useOptimistic(idea.status || 'OPEN', (state, newStatus: string) => newStatus);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    
    startTransition(() => {
      addOptUpvoted(!optUpvoted);
      addOptUpvoteCount(optUpvoted ? optUpvoteCount - 1 : optUpvoteCount + 1);
    });
    
    await toggleUpvote(idea.id);
  };

  const handleWaitlist = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!requireAuth()) return;
    
    startTransition(() => {
      addOptWaitlisted(!optWaitlisted);
      addOptWaitlistCount(optWaitlisted ? optWaitlistCount - 1 : optWaitlistCount + 1);
    });
    
    await toggleWaitlist(idea.id);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!requireAuth()) return;
    
    startTransition(() => {
      addOptSaved(!optSaved);
    });
    
    await toggleSaveIdea(idea.id);
  };

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded) setExpanded(true);
    setShowComments(true);
    setTimeout(() => {
      commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  };

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [openToCoFounders, setOpenToCoFounders] = useState(false);

  const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'SHIPPED') => {
    startTransition(() => {
       addOptStatus(newStatus);
    });
    await updateIdeaStatus(idea.id, newStatus);
  };

  const [isDeleting, startDeleting] = useTransition();
  const [isLinking, startLinking] = useTransition();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000); // Reset after 3s
      return;
    }
    startDeleting(async () => {
      await deleteIdea(idea.id);
    });
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    startLinking(async () => {
      await linkRepository(idea.id, repoUrl, openToCoFounders);
      setRepoUrl('');
      setOpenToCoFounders(false);
    });
  };

  const getStatusBadge = () => {
    switch(optStatus) {
      case 'IN_PROGRESS': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'SHIPPED': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Shipped</span>;
      default: return null;
    }
  };

  return (
    <div className="group border border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10 rounded-2xl p-5 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 transition-all relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-[1px]">
      <div className="flex flex-col md:flex-row md:items-start gap-4 cursor-pointer relative z-0" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button 
            onClick={handleUpvote}
            className={`flex flex-col items-center justify-center min-w-[48px] h-14 rounded-lg border transition-all shrink-0 active:scale-95 ${optUpvoted ? 'border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <ChevronUp className={`w-6 h-6 -mb-1 ${optUpvoted ? 'stroke-[3px]' : 'stroke-2'}`} />
            <span className="text-sm font-bold">{optUpvoteCount}</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
               <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">{idea.title}</h3>
               {getStatusBadge()}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300">
                {idea.domain}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300">
                {idea.difficulty}
              </span>
              <span className="flex items-center gap-1 text-zinc-500 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {idea.devTime}
              </span>
              {idea.author?.name && (
                 <span className="text-zinc-500 flex items-center gap-1 before:content-['•'] before:mr-2 whitespace-nowrap">
                   by {idea.author.name}
                 </span>
              )}
            </div>

            {idea.firstReportedAt && idea.lastReportedAt && (
               <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800 relative">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <span className="shrink-0">
                    Problem lifespan: <strong className="text-zinc-600 dark:text-zinc-300">{new Date(idea.firstReportedAt).getFullYear()}</strong> to <strong className="text-zinc-600 dark:text-zinc-300">{new Date(idea.lastReportedAt).getFullYear()}</strong>
                  </span>
               </div>
            )}
            </div>
            </div>
        {/* Right side items: Stack tags + Author Actions */}
        <div className="flex flex-col items-start md:items-end gap-3 shrink-0 ml-[64px] md:ml-0">
          {isAuthor && (
            <div className="flex gap-2 items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <select 
                 className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-[10px] uppercase font-semibold tracking-wider rounded px-2 py-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none cursor-pointer transition-colors"
                 value={optStatus}
                 onChange={(e) => handleStatusChange(e.target.value as any)}
                 onClick={(e) => e.stopPropagation()}
              >
                <option value="OPEN">Status: Open</option>
                <option value="IN_PROGRESS">Status: In Progress</option>
                <option value="SHIPPED">Status: Shipped</option>
              </select>
              <button 
                onClick={handleDelete}
                className={`px-2 py-1 rounded-md transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isConfirmingDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                title="Delete Idea"
              >
                {isConfirmingDelete ? 'Confirm?' : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap max-w-[200px] justify-start md:justify-end">
            {idea.recommendedStack.map((stack: string) => (
              <span key={stack} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-zinc-300">{stack}</span>
            ))}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-white/5 ml-0 md:ml-[64px]">
              <div className="flex flex-wrap gap-2 mb-6">
                {idea.recommendedStack.map((stack: string) => (
                  <span key={stack} className="px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md">
                    {stack}
                  </span>
                ))}
              </div>

              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                {idea.description}
              </p>
              
              <div className="flex flex-wrap gap-3 items-center mb-8">
                {idea.sourceUrl && (
                  <a href={idea.sourceUrl} target="_blank" className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 transition-colors border border-zinc-200 dark:border-white/5">
                    Source <ExternalLink className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  </a>
                )}
                <button onClick={handleDiscuss} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 transition-all active:scale-95 border border-zinc-200 dark:border-white/5">
                  Discuss ({commentCount}) <MessageSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>
                <button 
                  onClick={handleWaitlist} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 border ${optWaitlisted ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/5'}`}
                >
                  <HandMetal className={`w-3.5 h-3.5 ${optWaitlisted ? 'fill-current' : ''}`} />
                  {optWaitlisted ? `Waitlisted (${optWaitlistCount})` : `Join Waitlist (${optWaitlistCount})`}
                </button>
                <button 
                  onClick={handleSave} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 border ${optSaved ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/5'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${optSaved ? 'fill-current' : ''}`} />
                  {optSaved ? 'Saved' : 'Save'}
                </button>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-4 border border-zinc-200 dark:border-white/5 mb-6">
                <form onSubmit={handleLinkRepo} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="url" 
                      placeholder="Building this? Link your GitHub repo..." 
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      disabled={isLinking}
                      required
                    />
                    <button type="submit" disabled={isLinking} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm whitespace-nowrap disabled:opacity-50">
                      {isLinking ? 'Linking...' : 'Link Repo'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                     <input type="checkbox" id={`cofounder-${idea.id}`} checked={openToCoFounders} onChange={(e) => setOpenToCoFounders(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 cursor-pointer" />
                     <label htmlFor={`cofounder-${idea.id}`} className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">I am actively looking for technical co-founders to help build this.</label>
                  </div>
                </form>

                {idea.repositories.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {idea.repositories.map((repo: any) => (
                      <div key={repo.id} className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <a href={repo.url} target="_blank" className="group flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            {repo.url}
                          </a>
                          <div className="flex items-center gap-2">
                            {repo.openToCoFounders && (
                               <Link href={`/inbox?composeTo=${repo.userId}&context=${idea.id}`} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-500/30 transition-all shadow-sm">
                                 <Users className="w-3 h-3" /> Connect
                               </Link>
                            )}
                            {isAuthor && !repo.perfScore && !repo.url.includes('github.com') && (
                               <button onClick={() => startTransition(async () => { await runPerformanceAudit(repo.id, idea.id); })} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/30 transition-all shadow-sm">
                                  <BarChart2 className="w-3 h-3" /> Audit Site
                               </button>
                            )}
                            {isAuthor && !repo.architectureReport && repo.url.includes('github.com') && (
                               <button onClick={() => startTransition(async () => { await generateRepoRoast(repo.id, idea.id); })} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded border border-orange-200 dark:border-orange-500/30 transition-all shadow-sm">
                                  <Flame className="w-3 h-3" /> Roast Code
                               </button>
                            )}
                          </div>
                        </div>

                        {repo.perfScore && (
                           <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-white/5">
                              {repo.screenshotUrl && (
                                 <img src={repo.screenshotUrl} alt="Site preview" className="w-24 h-16 object-cover rounded shadow-sm border border-zinc-200 dark:border-white/10" />
                              )}
                              <div className="flex gap-4 w-full justify-around sm:justify-start">
                                 <div className="flex flex-col items-center">
                                    <span className={`text-lg font-black ${repo.perfScore >= 90 ? 'text-green-500' : repo.perfScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{repo.perfScore}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Perf</span>
                                 </div>
                                 <div className="flex flex-col items-center">
                                    <span className={`text-lg font-black ${repo.a11yScore >= 90 ? 'text-green-500' : repo.a11yScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{repo.a11yScore}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">A11y</span>
                                 </div>
                                 <div className="flex flex-col items-center">
                                    <span className={`text-lg font-black ${repo.seoScore >= 90 ? 'text-green-500' : repo.seoScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{repo.seoScore}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">SEO</span>
                                 </div>
                              </div>
                           </div>
                        )}

                        {repo.architectureReport && (
                           <div className="mt-3">
                              <details className="group/roast">
                                 <summary className="text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer flex items-center gap-1 hover:underline">
                                    <Flame className="w-3.5 h-3.5" /> View AI Architecture Roast
                                 </summary>
                                 <div className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                                    {repo.architectureReport}
                                 </div>
                              </details>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <MarketIntelligence ideaId={idea.id} initialAnalysis={idea.marketAnalysis} />

              <div ref={commentRef}>
                <CommentSection ideaId={idea.id} initialCount={commentCount} forceOpen={showComments} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
