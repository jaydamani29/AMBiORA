import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const declineInviteSchema = z.object({
  inviteId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = declineInviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid invite ID" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: validation.data.inviteId },
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

    // Decline invite
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decline invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}