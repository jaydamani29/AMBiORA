"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(data: { name: string; email: string; password: string }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Email is already in use." };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "An error occurred during registration." };
  }
}
