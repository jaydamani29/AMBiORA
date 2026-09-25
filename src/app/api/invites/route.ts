import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a team leader
    const team = await prisma.team.findUnique({
      where: { leaderId: session.user.id },
      include: {
        members: true,
        invites: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "You are not a team leader" },
        { status: 403 }
      );
    }

    // Check team size limit
    const totalMembers = team.members.length + team.invites.length;
    if (totalMembers >= 5) {
      return NextResponse.json(
        { error: "Team is full (max 5 members including pending invites)" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user already exists and is in a team
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { membership: true },
    });

    if (existingUser?.membership) {
      return NextResponse.json(
        { error: "This user is already in a team" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await prisma.invite.findFirst({
      where: {
        teamId: team.id,
        invitedEmail: email,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite is already pending for this email" },
        { status: 400 }
      );
    }

    // Create invite with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        teamId: team.id,
        invitedEmail: email,
        expiresAt,
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending invites for the current user's email
    const invites = await prisma.invite.findMany({
      where: {
        invitedEmail: session.user.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          include: {
            leader: { select: { id: true, name: true, email: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Get invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}