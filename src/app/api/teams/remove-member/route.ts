import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const removeMemberSchema = z.object({
  userId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = removeMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Verify user is a team leader
    const team = await prisma.team.findUnique({
      where: { leaderId: session.user.id },
      include: {
        members: {
          where: { userId: validation.data.userId },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "You are not a team leader" },
        { status: 403 }
      );
    }

    // Cannot remove yourself as leader
    if (validation.data.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself as leader" },
        { status: 400 }
      );
    }

    // Check if member exists in team
    const membership = team.members[0];
    if (!membership) {
      return NextResponse.json(
        { error: "Member not found in your team" },
        { status: 404 }
      );
    }

    // Remove member in transaction
    await prisma.$transaction(async (tx) => {
      await tx.teamMembership.delete({
        where: { id: membership.id },
      });

      // If user has no other teams, reset role to MEMBER
      const otherMemberships = await tx.teamMembership.count({
        where: { userId: validation.data.userId },
      });

      if (otherMemberships === 0) {
        await tx.user.update({
          where: { id: validation.data.userId },
          data: { role: "MEMBER" },
        });
      }
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
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}