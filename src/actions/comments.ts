"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function addComment(ideaId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!content.trim()) throw new Error("Content cannot be empty");

  await prisma.comment.create({
    data: {
      userId: session.user.id,
      ideaId,
      content: content.trim()
    }
  });

  revalidatePath('/dashboard');
}

export async function getComments(ideaId: string) {
  return prisma.comment.findMany({
    where: { ideaId },
    include: {
      user: { select: { name: true, image: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
