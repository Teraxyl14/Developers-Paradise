import prisma from "@/lib/prisma"
import { LeaderboardView } from "./LeaderboardView"

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: {
      submittedIdeas: {
        include: { _count: { select: { upvotes: true } } }
      },
      repositories: true,
    }
  });

  const rankedUsers = users.map(user => {
    const ideasSubmitted = user.submittedIdeas.length;
    const upvotesReceived = user.submittedIdeas.reduce((sum, idea) => sum + idea._count.upvotes, 0);
    const reposLinked = user.repositories.length;

    // Calculation: 5 pts per idea, 2 pts per upvote, 10 pts per repo linked.
    const score = (ideasSubmitted * 5) + (upvotesReceived * 2) + (reposLinked * 10);

    return {
       id: user.id,
       name: user.name || 'Anonymous Developer',
       image: user.image,
       ideasSubmitted,
       upvotesReceived,
       reposLinked,
       score
    }
  }).filter(u => u.score > 0).sort((a, b) => b.score - a.score);

  return (
    <main className="max-w-5xl mx-auto py-12 px-4 md:px-6">
      <LeaderboardView rankedUsers={rankedUsers} />
    </main>
  )
}
