import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is OWNER
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        invites: {
          where: { status: "PENDING" },
          select: { id: true, invitedEmail: true, createdAt: true, expiresAt: true },
        },
        _count: { select: { matchesA: true, matchesB: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Admin get teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}