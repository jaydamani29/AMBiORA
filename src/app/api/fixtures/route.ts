import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Allow public access to fixtures
    const session = await getServerSession(authOptions);
    
    const matches = await prisma.match.findMany({
      include: {
        teamA: { select: { id: true, name: true, code: true } },
        teamB: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    // Group by round
    const rounds = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, typeof matches>);

    return NextResponse.json({ rounds, matches });
  } catch (error) {
    console.error("Get fixtures error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}