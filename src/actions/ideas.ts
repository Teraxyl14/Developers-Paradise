"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getIdeas(sortBy: 'latest' | 'trending' = 'latest', searchQuery: string = '', page: number = 1, limit: number = 10) {
  const session = await auth();
  
  // 1. Semantic Vector Search if query is a phrase
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
          
          // Use raw SQL to find the closest vectors, then map back to Prisma objects
          const rawResults: any[] = await prisma.$queryRaw`
              SELECT id, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
              FROM "Idea"
              WHERE embedding IS NOT NULL
              ORDER BY similarity DESC
              LIMIT ${limit} OFFSET ${(page - 1) * limit};
          `;

          if (rawResults.length > 0) {
             const ideaIds = rawResults.map(r => r.id);
             
             // Fetch full objects holding relational data
             const populatedIdeas = await prisma.idea.findMany({
                where: { id: { in: ideaIds } },
                include: {
                  tags: { include: { tag: true } },
                  savedBy: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
                  repositories: true,
                  _count: { select: { upvotes: true, comments: true } },
                  upvotes: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
                  author: { select: { name: true, id: true } }
                }
             });

             // Re-sort populated ideas to match the vector similarity order
             return ideaIds.map(id => populatedIdeas.find(i => i.id === id)).filter((i): i is NonNullable<typeof i> => i !== undefined);
          }
      }
  }

  // 2. Standard Keyword Search and Sorting
  const whereClause = searchQuery ? {
    OR: [
      { title: { contains: searchQuery, mode: 'insensitive' as const } },
      { description: { contains: searchQuery, mode: 'insensitive' as const } },
      { domain: { contains: searchQuery, mode: 'insensitive' as const } }
    ]
  } : {};

  return prisma.idea.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      tags: { include: { tag: true } },
      savedBy: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
      repositories: true,
      _count: {
        select: { upvotes: true, comments: true }
      },
      upvotes: session?.user?.id ? { where: { userId: session.user.id } } : undefined,
      author: { select: { name: true, id: true } }
    },
    orderBy: sortBy === 'trending' 
      ? { upvotes: { _count: 'desc' } }
      : { createdAt: 'desc' }
  });
}
