import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const email = "test@example.com";
  const password = "password123";
  
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Test user already exists. Go back to login.", email, password });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: "Test Developer",
        email: email,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "Success! Test user created. You can now log in.", email, password });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create user", details: error.message }, { status: 500 });
  }
}
