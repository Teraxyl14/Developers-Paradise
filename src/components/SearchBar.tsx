"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-1 max-w-sm relative group">
      <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
      <input 
        type="search" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ideas, tech, or domains..." 
        className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl pl-10 pr-24 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all focus:outline-none shadow-sm"
      />
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
        <button 
          type="submit" 
          disabled={isPending} 
          className="bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center justify-center min-w-[60px]"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>
    </form>
  )
}
