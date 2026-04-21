import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: Request) {
  // Simple Security: Ensure only the automated cron service can trigger this endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
     return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  try {
    // 1. Get Top 5 Ideas from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const topIdeas = await prisma.idea.findMany({
      where: {
        createdAt: { gte: oneWeekAgo },
        status: 'OPEN'
      },
      orderBy: {
        upvotes: { _count: 'desc' }
      },
      take: 5
    });

    if (topIdeas.length === 0) {
       return NextResponse.json({ message: "No new ideas this week to send." });
    }

    // 2. Fetch all user emails
    const users = await prisma.user.findMany({
      select: { email: true }
    });

    const emails = users.map(u => u.email).filter(Boolean) as string[];
    
    if (emails.length === 0) {
      return NextResponse.json({ message: "No users to email." });
    }

    // 3. Format the email digest
    const ideasHtml = topIdeas.map(idea => `
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #111;">${idea.title}</h3>
        <p style="color: #666; font-size: 14px;"><strong>Domain:</strong> ${idea.domain} | <strong>Difficulty:</strong> ${idea.difficulty}</p>
        <p style="color: #444;">${idea.description.substring(0, 150)}...</p>
        <a href="${process.env.AUTH_URL}/idea/${idea.id}" style="display: inline-block; padding: 8px 16px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">View & Build This Idea</a>
      </div>
    `).join('');

    const htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Top 5 Developer Pain Points of the Week</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.5;">Here are the most upvoted problems that developers are actively begging someone to solve. Pick one and start building your next SaaS today.</p>
        ${ideasHtml}
        <p style="color: #888; font-size: 12px; margin-top: 32px; text-align: center;">You are receiving this because you signed up for Developers Paradise. <a href="${process.env.AUTH_URL}/profile" style="color: #888;">Manage Profile</a></p>
      </div>
    `;

    // 4. Dispatch email batch
    await resend.emails.send({
      from: 'Developers Paradise <newsletter@developersparadise.dev>',
      to: emails, // Note: In a massive production app, you should chunk this or use BCC/broadcast logic.
      subject: 'This week\'s top developer pain points to build',
      html: htmlContent
    });

    return NextResponse.json({ message: "Weekly newsletter sent successfully", count: emails.length });
    
  } catch (error: any) {
    console.error("Newsletter Cron Error:", error);
    return NextResponse.json({ error: "Failed to send newsletter", details: error.message }, { status: 500 });
  }
}
