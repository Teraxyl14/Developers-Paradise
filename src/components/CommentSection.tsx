"use client"
import { useState, useEffect, useRef } from "react"
import { addComment, getComments } from "@/actions/comments"

export function CommentSection({ ideaId, initialCount, forceOpen = false }: { ideaId: string, initialCount: number, forceOpen?: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (forceOpen && !isOpen) setIsOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      getComments(ideaId).then((data) => {
         setComments(data);
         setIsFetching(false);
         // Auto-focus the input when opened via Discuss button
         if (forceOpen) {
           setTimeout(() => inputRef.current?.focus(), 100);
         }
      });
    }
  }, [isOpen, ideaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await addComment(ideaId, content);
    setContent("");
    const newComments = await getComments(ideaId);
    setComments(newComments);
    setLoading(false);
  };

  return (
    <div className="mt-6 border-t border-zinc-200 dark:border-white/5 pt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm flex items-center gap-2 mb-4 transition-colors"
      >
        {isOpen ? "Hide Comments" : `View Comments (${initialCount})`}
      </button>

      {isOpen && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment or link a partial solution..."
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm">
              Post
            </button>
          </form>

          {isFetching ? (
             <div className="py-6 text-center text-sm text-zinc-500 animate-pulse">Loading comments...</div>
          ) : (
            <div className="space-y-3 mt-4">
              {comments.map(c => (
                <div key={c.id} className="bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-100 dark:border-transparent">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-300">{c.user.name || 'Developer'}</span>
                    <span className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-400">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-zinc-500">No comments yet. Be the first to discuss this idea!</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
