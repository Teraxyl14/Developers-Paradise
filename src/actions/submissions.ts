"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function submitIdea(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const difficulty = formData.get("difficulty") as string;
  const devTime = formData.get("devTime") as string;
  const domain = formData.get("domain") as string;
  const rawStack = formData.get("recommendedStack") as string;

  if (!title || !description || !difficulty || !devTime || !domain) {
    throw new Error("All fields are required.");
  }

  // Generate Vector Embedding for Duplicate Detection
  const textToEmbed = `${title}. ${description}`;
  let embeddingResult;
  try {
     const response = await ai.models.embedContent({
       model: 'gemini-embedding-001',
       contents: textToEmbed,
     });
     embeddingResult = response.embeddings?.[0]?.values;
  } catch(e) {
     console.error("Embedding generation failed", e);
  }

  // Check for duplicates using pgvector cosine similarity (<=>)
  // Lower distance means higher similarity. Threshold set to 0.15 (85% similar).
  if (embeddingResult && embeddingResult.length === 3072) {
     const formattedEmbedding = `[${embeddingResult.join(',')}]`;
     const similarIdeas: any[] = await prisma.$queryRaw`
        SELECT id, title, 1 - (embedding <=> ${formattedEmbedding}::vector) as similarity
        FROM "Idea"
        WHERE embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 1;
     `;

     if (similarIdeas.length > 0 && similarIdeas[0].similarity > 0.85) {
         throw new Error(`Duplicate Idea Detected! This is very similar to an existing idea: "${similarIdeas[0].title}". Consider contributing to that one instead.`);
     }
  }

  const recommendedStack = rawStack
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Prisma does not support raw inserting vector types via the standard ORM `create` method easily without experimental flags,
  // so we create the record first, then update it with raw SQL to inject the embedding safely.
  const newIdea = await prisma.idea.create({
    data: {
      title,
      description,
      difficulty,
      devTime,
      domain,
      recommendedStack,
      authorId: session.user.id,
      status: 'OPEN'
    }
  });

  if (embeddingResult && embeddingResult.length === 3072) {
      try {
          const formattedEmbedding = `[${embeddingResult.join(',')}]`;
          await prisma.$executeRaw`
              UPDATE "Idea" 
              SET embedding = ${formattedEmbedding}::vector 
              WHERE id = ${newIdea.id}
          `;
      } catch(e) {
          // If embedding insertion fails, rollback the initial creation to maintain data integrity
          await prisma.idea.delete({ where: { id: newIdea.id } });
          console.error("Failed to inject embedding into database", e);
          throw new Error("Internal server error while saving the idea.");
      }
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect(`/idea/${newIdea.id}`);
}

export async function deleteIdea(ideaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== session.user.id) throw new Error("You can only delete ideas you submitted.");

  await prisma.idea.delete({
    where: { id: ideaId }
  });

  revalidatePath('/dashboard');
  revalidatePath('/profile');
}
