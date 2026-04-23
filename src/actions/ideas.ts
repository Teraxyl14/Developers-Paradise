"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const RRF_K = 60;

export async function getIdeas(sortBy: 'latest' | 'trending' | 'contrarian' = 'latest', searchQuery: string = '', page: number = 1, limit: number = 10) {
  const session = await auth();
  
  // 1. Standard Keyword Search Clause
  const keywordWhereClause = searchQuery ? {
    OR: [
      { title: { contains: searchQuery, mode: 'insensitive' as const } },
      { description: { contains: searchQuery, mode: 'insensitive' as const } },
      { domain: { contains: searchQuery, mode: 'insensitive' as const } }
    ]
  } : {};

  // For Contrarian sort, we ONLY want ideas with 0 repositories linked, but ideally some saves/upvotes.
  const baseWhere = sortBy === 'contrarian' 
    ? { ...keywordWhereClause, repositories: { none: {} } } 
    : keywordWhereClause;

  const orderByLogic = sortBy === 'trending' ? { upvotes: { _count: 'desc' as const } } 
                   : sortBy === 'contrarian' ? { savedBy: { _count: 'desc' as const } }
                   : { createdAt: 'desc' as const };

  // 2. Hybrid Search Logic (Triggered if query implies natural language)
  if (searchQuery.includes(" ") && process.env.GEMINI_API_KEY) {
      let embeddingResult;
      try {
         const response = await ai.models.embedContent({
           model: 'gemini-embedding-001',
           contents: searchQuery,
         });
         embeddingResult = response.embeddings?.[0]?.values;
      } catch(e) {
         console.error("Search embedding failed", e);
      }

      if (embeddingResult && embeddingResult.length === 3072) {
          const formattedEmbedding = `[${embeddingResult.join(',')}]`;
          
          // Execute both searches in parallel for maximum speed
          const [rawVectorResults, keywordResults] = await Promise.all([
             // Vector Dense Search
             prisma.$queryRaw<any[]>`
                SELECT id, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
                FROM "Idea"
                WHERE embedding IS NOT NULL
                ORDER BY similarity DESC
                LIMIT 50;
             `,
             // Keyword Sparse Search
             prisma.idea.findMany({
                where: baseWhere,
                select: { id: true },
                orderBy: orderByLogic,
                take: 50
             })
          ]);

          // Reciprocal Rank Fusion (RRF) Algorithm
          const rrfScores = new Map<string, number>();

          // Assign RRF scores for Semantic Vector hits
          rawVectorResults.forEach((res, rank) => {
             rrfScores.set(res.id, (rrfScores.get(res.id) || 0) + (1 / (RRF_K + rank + 1)));
          });

          // Assign RRF scores for Exact Keyword hits
          keywordResults.forEach((res, rank) => {
             rrfScores.set(res.id, (rrfScores.get(res.id) || 0) + (1 / (RRF_K + rank + 1)));
          });

          // Sort combined unique IDs by their fused mathematical score
          let sortedFusedIds = Array.from(rrfScores.entries())
              .sort((a, b) => b[1] - a[1])
              .map(entry => entry[0]);

          // Paginate the fused results
          const paginatedIds = sortedFusedIds.slice((page - 1) * limit, page * limit);

          if (paginatedIds.length > 0) {
             // Fetch full objects holding relational data for the winners
             const populatedIdeas = await prisma.idea.findMany({
                where: { id: { in: paginatedIds } },
                include: {
                  tags: { include: { tag: true } },
                  savedBy: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
                  repositories: true,
                  _count: { select: { upvotes: true, comments: true } },
                  upvotes: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
                  waitlist: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
                  author: { select: { name: true, id: true } }
                }
             });

             // If contrarian, we must filter out the vector results that have repos
             // (because the raw SQL vector search didn't filter them out initially to stay fast)
             let finalIdeas = paginatedIds.map(id => populatedIdeas.find(i => i.id === id)).filter((i): i is NonNullable<typeof i> => i !== undefined);
             if (sortBy === 'contrarian') {
                 finalIdeas = finalIdeas.filter(i => i.repositories.length === 0);
             }

             return finalIdeas;
          }
      }
  }

  // 3. Fallback: Pure Keyword Search and Sorting (If no spaces, or API fails)
  return prisma.idea.findMany({
    where: baseWhere,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      tags: { include: { tag: true } },
      savedBy: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
      repositories: true,
      _count: { select: { upvotes: true, comments: true } },
      upvotes: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
      waitlist: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
      author: { select: { name: true, id: true } }
    },
    orderBy: orderByLogic
  });
}
