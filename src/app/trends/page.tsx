import prisma from "@/lib/prisma"
import { TrendsDashboard } from "./TrendsDashboard"

export default async function TrendsPage() {
  const domains = await prisma.idea.groupBy({
    by: ['domain'],
    _count: { domain: true },
    orderBy: { _count: { domain: 'desc' } },
    take: 10
  });

  const difficulties = await prisma.idea.groupBy({
    by: ['difficulty'],
    _count: { difficulty: true }
  });

  // Prisma doesn't support grouping by array elements easily, so we aggregate in JS
  const allIdeas = await prisma.idea.findMany({ select: { recommendedStack: true } });
  const stackCounts: Record<string, number> = {};
  
  allIdeas.forEach(idea => {
    idea.recommendedStack.forEach(stack => {
       const s = stack.trim();
       if (!s) return;
       stackCounts[s] = (stackCounts[s] || 0) + 1;
    });
  });

  const sortedStacks = Object.entries(stackCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const formattedDomains = domains.map(d => ({ name: d.domain, count: d._count.domain }));
  const formattedDifficulties = difficulties.map(d => ({ name: d.difficulty, count: d._count.difficulty }));

  return (
    <main className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">Macro Trends</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Aggregated insights from thousands of raw developer workflow complaints, feature requests, and GitHub issues.</p>
      </div>

      <TrendsDashboard 
        domainData={formattedDomains} 
        stackData={sortedStacks} 
        difficultyData={formattedDifficulties} 
      />
    </main>
  );
}
