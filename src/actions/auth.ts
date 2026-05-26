"use server"

import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function registerUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    // Industry standard password requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return { 
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number." 
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0], // Default name to email prefix if not provided
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Something went wrong during registration" }
  }
}
