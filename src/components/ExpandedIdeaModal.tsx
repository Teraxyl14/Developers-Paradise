"use client"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { X, Clock, ExternalLink, MessageSquare, HandMetal, ChevronUp } from "lucide-react"
import { upvoteIdea, toggleWaitlist, addComment } from "@/actions/interactions"
import { useState } from "react"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function ExpandedIdeaModal({ idea, onClose }: { idea: any, onClose: () => void }) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isUpvoted = idea.upvotes?.length > 0;
  const isWaitlisted = idea.waitlist?.length > 0;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleUpvote = async () => {
    startTransition(async () => {
      try {
        await upvoteIdea(idea.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to upvote", error);
      }
    });
  };

  const handleWaitlist = async () => {
    startTransition(async () => {
      try {
        await toggleWaitlist(idea.id);
        router.refresh();
      } catch (error) {
        console.error("Failed to join waitlist", error);
      }
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    startTransition(async () => {
      try {
        await addComment(idea.id, comment);
        setComment("");
        router.refresh();
      } catch (error) {
        console.error("Failed to add comment", error);
      }
    });
  };

  if (!idea) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-y-auto overflow-x-hidden flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 dark:bg-black/90 backdrop-blur-xl pointer-events-auto"
        onClick={onClose}
      />
      
      <div className="w-full min-h-screen py-10 px-4 flex items-center justify-center">
        <motion.div 
          layoutId={`card-${idea.id}`}
          className="relative w-full max-w-4xl bg-bg-primary dark:bg-zinc-950 border border-border-default rounded-3xl p-6 md:p-12 pointer-events-auto shadow-[0_48px_96px_-12px_rgba(0,0,0,0.6)] flex flex-col gap-10"
        >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary bg-bg-surface hover:bg-bg-surface-hover rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Upvote side button in modal */}
            <button 
              onClick={handleUpvote}
              className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all shrink-0 ${
                isUpvoted 
                  ? "bg-accent/20 border-accent/50 text-accent-text" 
                  : "bg-bg-surface border-border-default hover:bg-bg-surface-hover text-text-muted"
              } ${isPending ? "opacity-70 grayscale" : ""}`}
              disabled={isPending}
            >
              <ChevronUp className={`w-6 h-6 -mb-1 ${isUpvoted ? "text-accent" : ""}`} />
              <span className="text-sm font-bold">{idea._count?.upvotes || 0}</span>
            </button>

            <div className="flex-1">
              <motion.h2 layoutId={`title-${idea.id}`} className="text-3xl md:text-5xl font-black text-text-primary font-display leading-[1.1] mb-4 pr-12 tracking-tight">
                {idea.title}
              </motion.h2>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-accent-soft border border-accent/10 text-xs font-bold text-accent-text uppercase tracking-wider">
                  {idea.domain}
                </span>
                <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-default text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {idea.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-default text-xs font-bold text-text-secondary flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  {idea.devTime}
                </span>
              </div>
            </div>
          </div>

          <motion.div layoutId={`desc-${idea.id}`} className="text-text-primary/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
            {idea.description}
          </motion.div>

          <div className="flex flex-wrap gap-2">
            {idea.recommendedStack.map((stack: string) => (
              <span key={stack} className="px-3 py-1.5 text-xs font-bold text-accent-text bg-accent/5 border border-accent/10 rounded-xl uppercase tracking-widest">
                {stack}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {idea.sourceUrl && (
              <a href={idea.sourceUrl} target="_blank" className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all active:scale-95">
                Visit Source <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button 
              onClick={handleWaitlist}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 border ${
                isWaitlisted 
                  ? "bg-green-500/10 border-green-500/30 text-green-500" 
                  : "bg-bg-surface border-border-default text-text-primary hover:bg-bg-surface-hover"
              } ${isPending ? "opacity-70 grayscale" : ""}`}
              disabled={isPending}
            >
              {isWaitlisted ? "On Waitlist" : "Join Waitlist"} <HandMetal className="w-4 h-4" />
            </button>
            <button 
              onClick={() => document.getElementById('comment-input')?.focus()}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black bg-bg-surface border border-border-default text-text-primary hover:bg-bg-surface-hover transition-all active:scale-95 ${isPending ? "opacity-70" : ""}`}
            >
              Discuss <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-border-default">
            <h3 className="text-lg font-bold text-text-primary mb-4">Discussion</h3>
            <form onSubmit={handleComment} className="flex gap-3 mb-6">
              <input 
                id="comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts or suggest a wedge strategy..."
                className="flex-1 bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
              />
              <button type="submit" className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-accent/10">
                Post
              </button>
            </form>

            <div className="space-y-4">
              {idea.comments?.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border-default rounded-2xl">
                  No comments yet. Be the first to start the discussion!
                </div>
              ) : (
                idea.comments?.map((c: any) => (
                  <div key={c.id} className="bg-bg-surface/50 p-4 rounded-2xl border border-border-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                        {c.user.name?.charAt(0) || "D"}
                      </div>
                      <span className="text-xs font-bold text-text-primary">{c.user.name}</span>
                      <span className="text-[10px] text-text-faint">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  )
}
