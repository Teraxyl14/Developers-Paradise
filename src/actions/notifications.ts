"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;
  
  return prisma.notification.count({
    where: { userId: session.user.id, read: false }
  });
}

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      actor: { select: { name: true, image: true } },
      idea: { select: { title: true } }
    }
  });
}

export async function markNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true }
  });
  
  revalidatePath('/dashboard');
}
