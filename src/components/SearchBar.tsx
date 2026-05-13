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
      <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
      <input 
        type="search" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ideas, tech, or domains..." 
        className="w-full bg-bg-surface border border-border-default rounded-xl pl-10 pr-24 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all focus:outline-none"
      />
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
        <button 
          type="submit" 
          disabled={isPending} 
          className="bg-bg-surface hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center justify-center min-w-[60px]"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>
    </form>
  )
}
