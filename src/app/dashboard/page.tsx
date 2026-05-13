import { getIdeas } from "@/actions/ideas"
import { DashboardFeed } from "@/components/DashboardFeed"
import { SearchBar } from "@/components/SearchBar"
import { Compass } from "lucide-react"

export default async function DashboardPage(props: { searchParams?: Promise<{ sort?: string, q?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const sortBy = searchParams?.sort === 'trending' ? 'trending' : searchParams?.sort === 'contrarian' ? 'contrarian' : 'latest';
  const query = searchParams?.q || '';
  const page = parseInt(searchParams?.page || '1');
  const { ideas, totalPages } = await getIdeas(sortBy, query, page);
  
  return (
    <main className="max-w-5xl mx-auto py-10 px-4 md:px-6">
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight font-display">Discovery Feed</h1>
            </div>
            <p className="text-sm text-text-muted ml-10">Validated developer problems, ranked by community demand.</p>
          </div>
          <SearchBar />
        </div>
      </div>
      <DashboardFeed initialIdeas={ideas} currentSort={sortBy} currentQuery={query} initialPage={page} totalPages={totalPages} />
    </main>
  )
}
