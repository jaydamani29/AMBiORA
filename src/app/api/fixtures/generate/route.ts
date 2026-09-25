import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is OWNER
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if fixtures already exist
    const existingMatches = await prisma.match.count();
    if (existingMatches > 0) {
      return NextResponse.json(
        { error: "Fixtures already generated" },
        { status: 400 }
      );
    }

    // Get all teams with full members
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Validate: exactly 5 teams, each with 5 members
    if (teams.length !== 5) {
      return NextResponse.json(
        { error: `Need exactly 5 teams, found ${teams.length}` },
        { status: 400 }
      );
    }

    for (const team of teams) {
      if (team.members.length !== 5) {
        return NextResponse.json(
          { error: `Team "${team.name}" has ${team.members.length} members, need 5` },
          { status: 400 }
        );
      }
    }

    // Generate round-robin fixtures for 5 teams
    // Each team plays 4 matches (one against each other team) = 10 total matches
    // 5 rounds, each round has 2 matches, 1 team gets a bye
    
    const teamIds = teams.map(t => t.id);
    const n = teamIds.length; // 5
    const matches: Array<{ teamAId: string; teamBId: string; round: number }> = [];

    // Circle method for odd number of teams
    // Add a dummy team for bye
    const circleTeams = [...teamIds, "BYE"]; // 6 slots
    const half = circleTeams.length / 2; // 3
    
    const fixed = circleTeams[0];
    let rotating = circleTeams.slice(1); // [team2, team3, team4, team5, BYE]
    
    for (let round = 0; round < n; round++) {
      // Pair up: fixed vs last, then pairs from rotating
      for (let i = 0; i < half; i++) {
        const a = i === 0 ? fixed : rotating[i - 1];
        const b = rotating[rotating.length - 1 - i];
        
        // Skip if either is BYE
        if (a === "BYE" || b === "BYE") continue;
        
        matches.push({ teamAId: a, teamBId: b, round: round + 1 });
      }
      
      // Rotate for next round: move last element to front
      rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
    }

    // Create all matches in a transaction
    await prisma.$transaction(async (tx) => {
      for (const match of matches) {
        await tx.match.create({
          data: {
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            round: match.round,
          },
        });
      }
    });

    // Fetch created matches with team info
    const createdMatches = await prisma.match.findMany({
      include: {
        teamA: { select: { id: true, name: true, code: true } },
        teamB: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({ matches: createdMatches }, { status: 201 });
  } catch (error) {
    console.error("Generate fixtures error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}