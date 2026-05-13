import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idea = await prisma.idea.findUnique({ where: { id: resolvedParams.id } });
  
  if (!idea) return { title: "Idea Not Found" };

  return {
    title: `${idea.title} | DevParadise`,
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
  const idea = await prisma.idea.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!idea) notFound();

  redirect(`/dashboard?ideaId=${resolvedParams.id}`);
}
