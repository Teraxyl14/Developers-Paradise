import prisma from "@/lib/prisma"
import { TrendsDashboard } from "./TrendsDashboard"
import { BarChart3 } from "lucide-react"

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

  // Fetch ML Clusters for the Market Galaxy
  const clusters = await prisma.cluster.findMany();

  const fragileDependencies = await prisma.fragileDependency.findMany({
    orderBy: { complaintCount: 'desc' },
    take: 5
  });

  return (
    <main className="max-w-6xl mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 mb-4">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">Macro Trends & Market Galaxy</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Aggregated insights and AI-clustered market demand mapping based on raw developer workflow complaints.</p>
      </div>

      <TrendsDashboard 
        domainData={formattedDomains} 
        stackData={sortedStacks} 
        difficultyData={formattedDifficulties} 
        clusterData={clusters}
        fragileDeps={fragileDependencies}
      />
    </main>
  );
}
