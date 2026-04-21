"use client"
import { useState, useOptimistic, startTransition, useTransition } from "react"
import { toggleSaveIdea, linkRepository, toggleUpvote, updateIdeaStatus } from "@/actions/interactions"
import { deleteIdea } from "@/actions/submissions"
import { CommentSection } from "@/components/CommentSection"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp, Bookmark, ExternalLink, MessageSquare, Trash2, ArrowUpRight, CheckCircle2, Clock } from "lucide-react"

export function IdeaCard({ idea, initiallyExpanded = false }: { idea: any, initiallyExpanded?: boolean }) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [repoUrl, setRepoUrl] = useState("");
  
  const isAuthor = session?.user?.id === idea.authorId;
  const commentCount = idea._count?.comments || 0;

  // Optimistic UI states
  const [optSaved, addOptSaved] = useOptimistic(idea.savedBy?.length > 0, (state, newValue: boolean) => newValue);
  const [optUpvoted, addOptUpvoted] = useOptimistic(idea.upvotes?.length > 0, (state, newValue: boolean) => newValue);
  const [optUpvoteCount, addOptUpvoteCount] = useOptimistic(idea._count?.upvotes || 0, (state, newCount: number) => newCount);
  const [optStatus, addOptStatus] = useOptimistic(idea.status || 'OPEN', (state, newStatus: string) => newStatus);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    
    startTransition(() => {
      addOptUpvoted(!optUpvoted);
      addOptUpvoteCount(optUpvoted ? optUpvoteCount - 1 : optUpvoteCount + 1);
    });
    
    await toggleUpvote(idea.id);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!session?.user?.id) return;
    
    startTransition(() => {
      addOptSaved(!optSaved);
    });
    
    await toggleSaveIdea(idea.id);
  };

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'SHIPPED') => {
    startTransition(() => {
       addOptStatus(newStatus);
    });
    await updateIdeaStatus(idea.id, newStatus);
  };

  const [isDeleting, startDeleting] = useTransition();

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

  const getStatusBadge = () => {
    switch(optStatus) {
      case 'IN_PROGRESS': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'SHIPPED': return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Shipped</span>;
      default: return null;
    }
  };

  return (
    <div className="group border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 rounded-xl p-5 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 transition-all relative overflow-hidden shadow-sm hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-start gap-4 cursor-pointer relative z-0" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button 
            onClick={handleUpvote}
            className={`flex flex-col items-center justify-center min-w-[48px] h-14 rounded-lg border transition-all shrink-0 ${optUpvoted ? 'border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white'}`}
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
              <span key={stack} className="px-2 py-1 text-xs bg-blue-900/50 border border-blue-800 rounded text-zinc-100 dark:text-zinc-300">{stack}</span>
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
            <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-white/5 ml-[64px]">
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
                <Link href={`/idea/${idea.id}`} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 transition-colors border border-zinc-200 dark:border-white/5">
                  Discuss <MessageSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                </Link>
                <button 
                  onClick={handleSave} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all border ${optSaved ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/5'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${optSaved ? 'fill-current' : ''}`} />
                  {optSaved ? 'Saved' : 'Save'}
                </button>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-4 border border-zinc-200 dark:border-white/5 mb-6">
                <form action={async () => { await linkRepository(idea.id, repoUrl); setRepoUrl(''); }} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url" 
                    placeholder="Building this? Link your GitHub repo..." 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    required
                  />
                  <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm whitespace-nowrap">
                    Link Repo
                  </button>
                </form>

                {idea.repositories.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {idea.repositories.map((repo: any) => (
                      <a key={repo.id} href={repo.url} target="_blank" className="group flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-white/5 px-3 py-2 rounded-md border border-zinc-200 dark:border-white/5 transition-colors w-fit">
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors" />
                        {repo.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <CommentSection ideaId={idea.id} initialCount={commentCount} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
