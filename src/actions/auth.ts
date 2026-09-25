"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(data: { name: string; email: string; password: string }) {
  try {
    const normalizedEmail = data.email?.toLowerCase().trim();
    if (!data.name || !normalizedEmail || !data.password || data.password.length < 6) {
      return { error: "Invalid registration details. Password must be at least 6 characters." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { error: "Email is already in use." };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "An error occurred during registration." };
  }
}
