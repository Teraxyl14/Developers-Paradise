"use client"
import { useState } from "react"
import { sendAdminTestEmail, deleteIdeaAsAdmin } from "@/actions/admin"
import { Mail, Loader2, Trash2 } from "lucide-react"

export function AdminControls({ ideas }: { ideas: any[] }) {
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleTestEmail = async () => {
    setLoadingEmail(true);
    setEmailStatus(null);
    try {
      const res = await sendAdminTestEmail();
      setEmailStatus(res.message);
    } catch (e: any) {
      setEmailStatus("Error: " + e.message);
    }
    setLoadingEmail(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this idea?")) return;
    
    setDeletingIds(prev => new Set(prev).add(id));
    await deleteIdeaAsAdmin(id);
    // State cleans itself up via server revalidation
  };

  return (
    <div className="space-y-12">
      <section className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleTestEmail}
            disabled={loadingEmail}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Test Email to Me
          </button>
        </div>
        {emailStatus && (
          <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">{emailStatus}</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Content Moderation (Latest 50 Ideas)</h2>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10">
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Idea Title</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {ideas.map((idea) => (
                  <tr key={idea.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-zinc-900 dark:text-white text-sm max-w-sm truncate">{idea.title}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {idea.authorId ? 'Manual User' : 'Python Scraper'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDelete(idea.id)}
                        disabled={deletingIds.has(idea.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center justify-center min-w-[70px]"
                      >
                        {deletingIds.has(idea.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {ideas.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">No ideas to moderate.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
