import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const joinTeamSchema = z.object({
  code: z.string().length(6).toUpperCase(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a team
    const existingMembership = await prisma.teamMembership.findUnique({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You already belong to a team" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = joinTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid team code" },
        { status: 400 }
      );
    }

    // Find team by code
    const team = await prisma.team.findUnique({
      where: { code: validation.data.code },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check team size limit (max 5 members)
    if (team.members.length >= 5) {
      return NextResponse.json(
        { error: "Team is full (max 5 members)" },
        { status: 400 }
      );
    }

    // Check if user is the leader (shouldn't happen but just in case)
    if (team.leaderId === session.user.id) {
      return NextResponse.json(
        { error: "You are the leader of this team" },
        { status: 400 }
      );
    }

    // Create membership
    await prisma.$transaction(async (tx) => {
      await tx.teamMembership.create({
        data: {
          userId: session.user.id,
          teamId: team.id,
        },
      });

      // If there was a pending invite for this user, mark it as accepted
      await tx.invite.updateMany({
        where: {
          teamId: team.id,
          invitedEmail: session.user.email,
          status: "PENDING",
        },
        data: { status: "ACCEPTED" },
      });
    });

    // Fetch updated team
    const updatedTeam = await prisma.team.findUnique({
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

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Join team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}