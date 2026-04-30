import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ADMIN_EMAILS = ['maruttewari12@gmail.com', 'myraanand06@gmail.com'];

export async function GET() {
  // Only allow admins to seed test data
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Seed route is disabled in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Seed route is disabled in production." }, { status: 403 });
  }

  return NextResponse.json({ message: "Seed route is restricted. Use the admin dashboard." });
}
