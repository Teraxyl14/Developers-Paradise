"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function sendMessage(receiverId: string, content: string, ideaId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!content.trim()) throw new Error("Message cannot be empty");

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      ideaId,
      content: content.trim()
    }
  });

  // Create a notification for the receiver
  await prisma.notification.create({
     data: {
       userId: receiverId,
       actorId: session.user.id,
       type: "MESSAGE",
       content: `sent you a message${ideaId ? ' regarding an idea' : ''}.`
     }
  });

  revalidatePath('/inbox');
}

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      idea: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return messages;
}
