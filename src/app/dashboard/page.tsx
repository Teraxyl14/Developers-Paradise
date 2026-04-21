import { getIdeas } from "@/actions/ideas"
import { DashboardFeed } from "@/components/DashboardFeed"
import { SearchBar } from "@/components/SearchBar"

export default async function DashboardPage(props: { searchParams?: Promise<{ sort?: string, q?: string }> }) {
  const searchParams = await props.searchParams;
  const sortBy = searchParams?.sort === 'trending' ? 'trending' : 'latest';
  const query = searchParams?.q || '';
  const ideas = await getIdeas(sortBy, query);
  
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Discovery Feed</h1>
        <SearchBar />
      </div>
      <DashboardFeed initialIdeas={ideas} currentSort={sortBy} currentQuery={query} />
    </main>
  )
}
