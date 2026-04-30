"use client"
import { useState } from "react"
import { sendAdminTestEmail, deleteIdeaAsAdmin } from "@/actions/admin"
import { Mail, Loader2, Trash2, Search, ChevronUp, MessageSquare, Filter } from "lucide-react"

export function AdminControls({ ideas }: { ideas: any[] }) {
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    if (!confirm("Are you sure you want to permanently delete this idea? This cannot be undone.")) return;
    
    setDeletingIds(prev => new Set(prev).add(id));
    await deleteIdeaAsAdmin(id);
  };

  const filtered = ideas.filter(idea => {
    const matchesSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) || idea.domain?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    'OPEN': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    'IN_PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    'SHIPPED': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.06] shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-500" /> Quick Actions
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleTestEmail}
            disabled={loadingEmail}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Test Email
          </button>
        </div>
        {emailStatus && (
          <p className={`mt-3 text-sm font-medium ${emailStatus.startsWith('Error') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{emailStatus}</p>
        )}
      </div>

      {/* Content Moderation */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" /> Content Moderation
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Showing <strong className="text-zinc-700 dark:text-zinc-300">{filtered.length}</strong> of {ideas.length} total ideas
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ideas..."
                  className="pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all w-48"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none focus:border-blue-500/50 transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SHIPPED">Shipped</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/10">
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Domain</th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Author</th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  <ChevronUp className="w-3 h-3 inline" />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  <MessageSquare className="w-3 h-3 inline" />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filtered.map((idea) => (
                <tr key={idea.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white text-sm max-w-xs truncate">{idea.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(idea.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{idea.domain || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[idea.status] || statusColors['OPEN']}`}>
                      {idea.status?.replace('_', ' ') || 'OPEN'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{idea.author?.name || 'Scraped'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{idea._count?.upvotes || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{idea._count?.comments || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(idea.id)}
                      disabled={deletingIds.has(idea.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 inline-flex items-center gap-1 active:scale-95"
                    >
                      {deletingIds.has(idea.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" /> Delete</>}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400 text-sm">No ideas match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
