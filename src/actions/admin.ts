"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function generateFixtures() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  // Ensure there are exactly 5 teams, and all have exactly 5 members (leader + 4 members = 5)
  // Or just 5 teams total for the simplicity of the test
  const teams = await prisma.team.findMany({ include: { members: true, leader: true } });
  
  if (teams.length < 5) {
    return { error: "Need exactly 5 teams to generate fixtures." };
  }

  // Circle method round-robin for 5 teams
  // For 5 teams, we have 5 rounds. One team has a bye each round.
  let ids = teams.map(t => t.id).sort(() => Math.random() - 0.5);
  ids.push("BYE"); 
  const n = ids.length;

  try {
    // Clear existing matches
    await prisma.match.deleteMany({});

    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < n / 2; i++) {
        const a = ids[i];
        const b = ids[n - 1 - i];
        
        if (a !== "BYE" && b !== "BYE") {
          await prisma.match.create({
            data: {
              teamAId: a,
              teamBId: b,
              round: r + 1,
            },
          });
        }
      }
      // Rotate for next round
      ids = [ids[0], ids[n - 1], ...ids.slice(1, n - 1)];
    }

    revalidatePath("/admin");
    revalidatePath("/fixtures");
    return { success: true };
  } catch (error) {
    return { error: "Failed to generate fixtures." };
  }
}

export async function updateMatchScore(matchId: string, scoreA: number, scoreB: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { scoreA, scoreB, playedAt: new Date() },
    });
    revalidatePath("/admin");
    revalidatePath("/fixtures");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update score." };
  }
}
