"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp, MessageSquare, Clock, X, ExternalLink, HandMetal, ChevronDown, PlusCircle } from "lucide-react"
import { upvoteIdea, toggleWaitlist, addComment } from "@/actions/interactions"
import { useState, useTransition, useOptimistic } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IdeaCard({ idea, isExpanded, onToggle }: { idea: any, isExpanded?: boolean, onToggle?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  
  const isUpvotedInitial = idea.upvotes?.length > 0;
  const isWaitlistedInitial = idea.waitlist?.length > 0;
  const upvoteCountInitial = idea._count?.upvotes || 0;
  
  const [optimisticUpvote, addOptimisticUpvote] = useOptimistic(
    { isUpvoted: isUpvotedInitial, count: upvoteCountInitial },
    (state, newIsUpvoted: boolean) => ({
      isUpvoted: newIsUpvoted,
      count: state.isUpvoted === newIsUpvoted ? state.count : newIsUpvoted ? state.count + 1 : state.count - 1
    })
  );

  const [optimisticWaitlist, addOptimisticWaitlist] = useOptimistic(
    isWaitlistedInitial,
    (state, newIsWaitlisted: boolean) => newIsWaitlisted
  );

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    idea.comments || [],
    (state, newComment: any) => [newComment, ...state]
  );

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      window.location.hash = '#login';
      return;
    }
    startTransition(async () => {
      addOptimisticUpvote(!optimisticUpvote.isUpvoted);
      try {
        await upvoteIdea(idea.id);
      } catch (error) {
        console.error("Failed to upvote", error);
      }
    });
  };

  const handleWaitlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      window.location.hash = '#login';
      return;
    }
    startTransition(async () => {
      addOptimisticWaitlist(!optimisticWaitlist);
      try {
        await toggleWaitlist(idea.id);
      } catch (error) {
        console.error("Failed to join waitlist", error);
      }
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      window.location.hash = '#login';
      return;
    }
    if (!comment.trim()) return;
    
    const newComment = {
      id: Math.random().toString(),
      content: comment,
      createdAt: new Date().toISOString(),
      user: { name: session.user?.name || "You", image: session.user?.image }
    };

    startTransition(async () => {
      addOptimisticComment(newComment);
      const commentText = comment;
      setComment("");
      try {
        await addComment(idea.id, commentText);
      } catch (error) {
        console.error("Failed to add comment", error);
      }
    });
  };

  return (
    <motion.div
      id={`idea-card-${idea.id}`}
      layout="position"
      whileHover={isExpanded ? undefined : { y: -2, scale: 0.998 }}
      whileTap={isExpanded ? undefined : { scale: 0.992 }}
      onClick={onToggle}
      className={`group bg-white/[0.02] dark:bg-zinc-950/40 border transition-all duration-300 relative overflow-hidden shadow-sm text-left ${
        isExpanded 
          ? "border-accent/40 rounded-3xl p-6 sm:p-8 bg-zinc-950/60 dark:bg-zinc-950/80 shadow-2xl" 
          : "border-border-default/50 dark:border-white/5 hover:border-accent/40 rounded-2xl p-5 sm:p-6 cursor-pointer hover:shadow-xl hover:shadow-accent/[0.02] dark:hover:shadow-accent/[0.04]"
      }`}
    >
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      {/* Header section (Always visible) */}
      <div className="flex gap-4 sm:gap-5 items-start">
        {/* Upvote Column */}
        <div className="flex flex-col items-center shrink-0">
          <button
            onClick={handleUpvote}
            className={`flex flex-col items-center justify-center w-11 h-14 rounded-xl border transition-all duration-300 ${optimisticUpvote.isUpvoted
                ? "bg-accent/20 border-accent/40 text-accent shadow-[inset_0_0_12px_rgba(99,102,241,0.15)]"
                : "bg-white/5 dark:bg-zinc-900/40 border-border-default/80 dark:border-white/5 hover:bg-accent/10 hover:border-accent/20 text-text-muted hover:text-accent"
              } ${isPending ? "opacity-70 grayscale" : ""}`}
            disabled={isPending}
          >
            <ChevronUp className={`w-5 h-5 transition-transform duration-300 ${optimisticUpvote.isUpvoted ? "translate-y-[-1px] scale-110" : "group-hover/upvote:-translate-y-0.5"}`} />
            <span className={`text-xs font-mono font-bold mt-0.5 ${optimisticUpvote.isUpvoted ? "text-accent" : "text-text-secondary"}`}>{optimisticUpvote.count}</span>
          </button>
        </div>

        {/* Title/Description Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className={`font-bold font-display leading-snug mb-2 group-hover:text-accent transition-colors duration-300 text-left ${
              isExpanded ? "text-xl sm:text-2xl text-text-primary pr-6" : "text-base sm:text-lg line-clamp-2 pr-4"
            }`}>
              {idea.title}
            </h3>
            
            {isExpanded && onToggle && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="p-1.5 text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-full transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isExpanded && (
            <p className="text-xs sm:text-sm text-text-muted line-clamp-2 mb-4 leading-relaxed font-medium text-left">
              {idea.description}
            </p>
          )}

          {/* Quick Tags Row (Always visible when collapsed, repositioned when expanded) */}
          {!isExpanded && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-accent-soft text-accent-text border border-accent/10">
                {idea.domain}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 border border-border-default/50 dark:border-white/5 text-text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3 text-text-muted" /> {idea.devTime}
              </span>
              <div className="flex-1" />
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-text-muted">
                <MessageSquare className="w-3.5 h-3.5" />
                {idea._count?.comments || 0}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Inline Expanded Content box (Smooth height trigger) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-6"
          >
            {/* Meta tags at the top of expanded area */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-accent/15 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-wider">
                {idea.domain}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-text-secondary uppercase tracking-wider">
                {idea.difficulty || "Intermediate"}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-text-secondary flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                {idea.devTime}
              </span>
            </div>

            {/* Description */}
            <div className="text-text-primary/90 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium text-left bg-white/[0.02] dark:bg-zinc-900/10 p-5 rounded-2xl border border-white/5">
              {idea.description}
            </div>

            {/* Recommended Stack */}
            <div className="flex flex-wrap gap-2 justify-start items-center">
              <span className="text-[10px] font-mono font-black uppercase text-text-muted mr-2">Target Stack:</span>
              {idea.recommendedStack?.map((stack: string) => (
                <span key={stack} className="px-2.5 py-1 text-[9px] font-black text-accent bg-accent/5 border border-accent/10 rounded-lg uppercase tracking-widest">
                  {stack}
                </span>
              ))}
            </div>

            {/* Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {idea.sourceUrl && (
                <a 
                  href={idea.sourceUrl} 
                  target="_blank" 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-black bg-accent hover:bg-accent-hover text-white transition-all duration-300 active:scale-95 shadow-md shadow-accent/10"
                >
                  Visit Source Discussions <ExternalLink className="w-4 h-4" />
                </a>
              )}
              
              <button 
                onClick={handleWaitlist}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-black transition-all duration-300 active:scale-95 border ${
                  optimisticWaitlist 
                    ? "bg-green-500/20 border-green-500/40 text-green-400" 
                    : "bg-white/5 border-white/10 text-text-primary hover:bg-white/10"
                } ${isPending ? "opacity-70 grayscale" : ""}`}
                disabled={isPending}
              >
                {optimisticWaitlist ? "You are on the Waitlist" : "Join Developer Waitlist"} <HandMetal className="w-4 h-4" />
              </button>
            </div>

            {/* Inline Discussion Section */}
            <div className="border-t border-white/10 pt-6 mt-2 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider font-display">Discussion Feed</h4>
                <span className="text-xs text-text-muted font-mono">({idea.comments?.length || 0} Comments)</span>
              </div>

              {/* Comment submit form */}
              <form onSubmit={handleComment} onClick={(e) => e.stopPropagation()} className="flex gap-2">
                <input 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={session ? "Contribute architectural feedback..." : "Sign in to join the code discussion"}
                  disabled={!session}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none disabled:opacity-50 text-white"
                />
                <button 
                  type="submit" 
                  disabled={!session || !comment.trim()} 
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Post
                </button>
              </form>

              {/* Comments Feed list */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {optimisticComments.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-xs border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    No compiler complaints yet. Add yours above!
                  </div>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  optimisticComments.map((c: any) => (
                    <div key={c.id} className="bg-white/[0.02] dark:bg-zinc-900/10 p-3.5 rounded-xl border border-white/5 transition-all text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6.5 h-6.5 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-[9px] font-black text-accent">
                          {c.user.name?.charAt(0) || "D"}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black text-text-primary leading-none mb-0.5">{c.user.name}</span>
                          <span className="text-[8px] text-text-faint font-bold uppercase tracking-wider">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Collapse Trigger at bottom */}
            {onToggle && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-white/10 hover:border-accent/40 rounded-xl text-xs font-mono font-bold text-text-muted hover:text-accent transition-all duration-300"
              >
                <ChevronDown className="w-3.5 h-3.5 rotate-180" /> Collapse Thread
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
