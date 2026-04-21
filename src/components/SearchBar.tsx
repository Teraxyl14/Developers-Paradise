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
      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
      <input 
        type="search" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ideas, tech, or domains..." 
        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-9 pr-24 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all focus:outline-none"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <button 
          type="submit" 
          disabled={isPending} 
          className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[60px]"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>
    </form>
  )
}
