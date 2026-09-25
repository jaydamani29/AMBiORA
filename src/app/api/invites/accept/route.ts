import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const acceptInviteSchema = z.object({
  inviteId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = acceptInviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid invite ID" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: validation.data.inviteId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Verify the invite is for this user
    if (invite.invitedEmail !== session.user.email) {
      return NextResponse.json(
        { error: "This invite is not for you" },
        { status: 403 }
      );
    }

    // Check invite status
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invite is no longer valid" },
        { status: 400 }
      );
    }

    // Check expiry
    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      );
    }

    // Check team size limit
    if (invite.team.members.length >= 5) {
      return NextResponse.json(
        { error: "Team is full" },
        { status: 400 }
      );
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

    // Accept invite in transaction
    await prisma.$transaction(async (tx) => {
      await tx.teamMembership.create({
        data: {
          userId: session.user.id,
          teamId: invite.teamId,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });
    });

    // Fetch updated team
    const updatedTeam = await prisma.team.findUnique({
      where: { id: invite.teamId },
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
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}