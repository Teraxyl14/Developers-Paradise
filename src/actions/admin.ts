"use server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { Resend } from "resend"
import { revalidatePath } from "next/cache"

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  if (session.user.email !== process.env.ADMIN_EMAIL) {
      throw new Error("Forbidden: Admin access required");
  }
  return session.user.email;
}

export async function sendAdminTestEmail() {
  const email = await requireAdmin();
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
     console.warn("RESEND_API_KEY is not configured. Email blocked.");
     return { success: false, message: "RESEND_API_KEY not configured." };
  }
  
  try {
     await resend.emails.send({
        from: 'Developers Paradise Admin <onboarding@resend.dev>',
        to: email,
        subject: 'Developers Paradise: Admin Test Email Successful',
        html: '<p>This is a test email dispatched directly from your Developers Paradise Admin Dashboard! Your Resend configuration is working perfectly.</p>'
     });
     return { success: true, message: "Test email sent to " + email };
  } catch (error: any) {
     return { success: false, message: error.message };
  }
}

export async function deleteIdeaAsAdmin(ideaId: string) {
  await requireAdmin();
  
  await prisma.idea.delete({ where: { id: ideaId } });
  
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}
