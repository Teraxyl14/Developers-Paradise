"use client"
import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { Search, Compass, TrendingUp, Trophy, PlusCircle } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-full max-w-lg bg-zinc-900/90 liquid-glass rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        label="Global Command Menu"
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
      >
        <div className="flex items-center px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-zinc-400" />
          <Command.Input 
            autoFocus
            className="w-full bg-transparent p-4 outline-none text-zinc-100 placeholder:text-zinc-500" 
            placeholder="Type a command or search..." 
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="p-4 text-sm text-center text-zinc-500">No results found.</Command.Empty>
          
          <Command.Group heading="Navigation" className="text-xs font-semibold text-zinc-500 px-2 py-1">
            <Command.Item 
              onSelect={() => { router.push('/dashboard'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <Compass className="w-4 h-4" /> Discovery Feed
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push('/trends'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <TrendingUp className="w-4 h-4" /> Market Trends
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push('/leaderboard'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push('/submit'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Submit Problem
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
