import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { IdeaCard } from "@/components/IdeaCard"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idea = await prisma.idea.findUnique({ where: { id: resolvedParams.id } });
  
  if (!idea) return { title: "Idea Not Found" };

  return {
    title: `${idea.title} | Dev Pain Points`,
    description: idea.description,
    openGraph: {
      title: idea.title,
      description: idea.description,
      type: "article",
    },
  }
}

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();

  const idea = await prisma.idea.findUnique({
    where: { id: resolvedParams.id },
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
  });

  if (!idea) notFound();

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <IdeaCard idea={idea} initiallyExpanded={true} />
    </main>
  );
}
