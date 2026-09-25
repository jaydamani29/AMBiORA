"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createTeam(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "OWNER") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length < 3) {
    return { error: "Team name must be at least 3 characters." };
  }

  try {
    // Generate a random 6-character alphanumeric code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    await prisma.$transaction(async (tx) => {
      // Create team
      await tx.team.create({
        data: {
          name: name.trim(),
          code,
          leaderId: session.user.id,
        },
      });

      // Update user role to LEADER
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "LEADER" },
      });
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { error: "You are already a leader of a team or code collided." };
    }
    return { error: "Failed to create team." };
  }
}

export async function joinTeam(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MEMBER") {
    return { error: "Unauthorized or already in a team." };
  }

  const code = formData.get("code") as string;
  if (!code) return { error: "Code is required." };

  try {
    const team = await prisma.team.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: { members: true },
    });

    if (!team) {
      return { error: "Invalid Team Code." };
    }

    // Leader + members
    if (team.members.length >= 4) {
      return { error: "Team is already full (5 players)." };
    }

    await prisma.teamMembership.create({
      data: {
        userId: session.user.id,
        teamId: team.id,
      },
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch {
    return { error: "Failed to join team. You might already be in one." };
  }
}
