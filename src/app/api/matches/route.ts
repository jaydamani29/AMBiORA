import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateScoreSchema = z.object({
  matchId: z.string().cuid(),
  scoreA: z.number().int().min(0).optional(),
  scoreB: z.number().int().min(0).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER can update scores
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateScoreSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { matchId, scoreA, scoreB } = validation.data;

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreA: scoreA ?? match.scoreA,
        scoreB: scoreB ?? match.scoreB,
        playedAt: (scoreA !== undefined && scoreB !== undefined) ? new Date() : match.playedAt,
      },
      include: {
        teamA: { select: { id: true, name: true, code: true } },
        teamB: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error("Update match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow public access to matches
    const matches = await prisma.match.findMany({
      include: {
        teamA: { select: { id: true, name: true, code: true } },
        teamB: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}