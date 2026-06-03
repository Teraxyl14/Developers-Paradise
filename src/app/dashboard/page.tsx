import { getIdeas } from "@/actions/ideas"
import { DashboardFeed } from "@/components/DashboardFeed"
import { SearchBar } from "@/components/SearchBar"
import { Compass } from "lucide-react"
import prisma from "@/lib/prisma"

export const unstable_instant = false

export default async function DashboardPage(props: { 
  searchParams?: Promise<{ sort?: string, q?: string, page?: string, difficulty?: string, domain?: string, ideaId?: string }> 
}) {
  const searchParams = await props.searchParams;
  const sortBy = searchParams?.sort === 'trending' ? 'trending' : searchParams?.sort === 'contrarian' ? 'contrarian' : 'latest';
  const query = searchParams?.q || '';
  const page = parseInt(searchParams?.page || '1');
  const difficulty = searchParams?.difficulty || 'All';
  const domain = searchParams?.domain || 'All';
  const initialExpandedIdeaId = searchParams?.ideaId || null;

  // Execute all heavy database queries concurrently to reduce server render time
  const [
    { ideas, totalPages },
    domainsData,
    difficultyCountsData,
    totalIdeasCount
  ] = await Promise.all([
    getIdeas(sortBy, query, page, 10, difficulty, domain),
    prisma.idea.groupBy({
      by: ['domain'],
      _count: { domain: true },
      orderBy: { domain: 'asc' }
    }),
    prisma.idea.groupBy({
      by: ['difficulty'],
      _count: { id: true }
    }),
    prisma.idea.count()
  ]);

  const allDomains = domainsData.map(d => ({
    name: d.domain,
    count: d._count.domain
  }));
  const difficultyCounts = {
    All: totalIdeasCount,
    Beginner: difficultyCountsData.find(d => d.difficulty === 'Beginner')?._count.id || 0,
    Intermediate: difficultyCountsData.find(d => d.difficulty === 'Intermediate')?._count.id || 0,
    Advanced: difficultyCountsData.find(d => d.difficulty === 'Advanced')?._count.id || 0,
  };
  
  return (
    <main className="max-w-5xl mx-auto py-6 sm:py-10 px-4 md:px-6">
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-display">Discovery Feed</h1>
            </div>
            <p className="text-xs sm:text-sm text-text-muted ml-10">Explore real developer pain points, system bottlenecks, and validated product opportunities extracted autonomously from global software communities.</p>
          </div>
          <SearchBar />
        </div>
      </div>
      <DashboardFeed 
        initialIdeas={ideas} 
        currentSort={sortBy} 
        currentQuery={query} 
        initialPage={page} 
        totalPages={totalPages} 
        currentDifficulty={difficulty}
        currentDomain={domain}
        allDomains={allDomains}
        difficultyCounts={difficultyCounts}
        initialExpandedIdeaId={initialExpandedIdeaId}
      />
    </main>
  )
}
