import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
});

function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team membership
    const membership = await prisma.teamMembership.findUnique({
      where: { userId: session.user.id },
      include: {
        team: {
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
          },
        },
      },
    });

    // Also check if user is a team leader
    const ledTeam = await prisma.team.findUnique({
      where: { leaderId: session.user.id },
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
      },
    });

    const team = membership?.team || ledTeam;

    if (!team) {
      return NextResponse.json({ team: null });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a team (as member or leader)
    const existingMembership = await prisma.teamMembership.findUnique({
      where: { userId: session.user.id },
    });

    const existingLedTeam = await prisma.team.findUnique({
      where: { leaderId: session.user.id },
    });

    if (existingMembership || existingLedTeam) {
      return NextResponse.json(
        { error: "You already belong to a team" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Generate unique team code with retry
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateTeamCode();
      const existing = await prisma.team.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique team code" },
        { status: 500 }
      );
    }

    // Create team and membership in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: validation.data.name,
          code,
          leaderId: session.user.id,
        },
      });

      // Create membership for the leader
      await tx.teamMembership.create({
        data: {
          userId: session.user.id,
          teamId: newTeam.id,
        },
      });

      // Update user role to LEADER
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "LEADER" },
      });

      return newTeam;
    });

    // Fetch full team with relations
    const fullTeam = await prisma.team.findUnique({
      where: { id: team.id },
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
      },
    });

    return NextResponse.json({ team: fullTeam }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}