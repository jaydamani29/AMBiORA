import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function ManageTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamLeaderOf: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
  });

  const team = user?.teamLeaderOf;

  if (!team) {
    redirect("/dashboard");
  }

  async function removeMember(formData: FormData) {
    "use server";
    const membershipId = formData.get("membershipId") as string;
    if (membershipId) {
      await prisma.teamMembership.delete({
        where: { id: membershipId },
      });
      revalidatePath("/team/manage");
      revalidatePath("/dashboard");
    }
  }

  return (
    <main style={{ minHeight: "80vh", padding: "40px 5vw", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "36px", color: "var(--ink)" }}>Manage Roster</h1>
          <p style={{ color: "var(--ash)" }}>Team: <b>{team.name}</b> (Code: <code>{team.code}</code>)</p>
        </div>
        <Link href="/dashboard" className="btn ghost sm">Back to Dashboard</Link>
      </div>

      <div style={{ background: "var(--paper2)", padding: "24px", border: "2px solid var(--ink)", borderRadius: "var(--r)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", color: "var(--ink)", marginBottom: "12px" }}>Invite Code</h2>
        <p style={{ color: "var(--ash)", marginBottom: "12px" }}>Share this code with up to 4 players so they can join your team directly:</p>
        <div style={{ display: "inline-block", background: "var(--paper)", padding: "10px 20px", border: "2px dashed var(--blossom)", borderRadius: "var(--r)", fontSize: "24px", fontWeight: 800, letterSpacing: "2px" }}>
          {team.code}
        </div>
      </div>

      <h2 style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>Current Members ({team.members.length + 1}/5)</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ background: "var(--paper)", padding: "16px", border: "2px solid var(--blossom)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 700 }}>{user.name} (You)</p>
            <p style={{ fontSize: "12px", color: "var(--ash)" }}>{user.email}</p>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--blossom)", textTransform: "uppercase" }}>Leader</span>
        </div>

        {team.members.map((m) => (
          <div key={m.id} style={{ background: "var(--paper)", padding: "16px", border: "2px solid var(--ink)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700 }}>{m.user.name}</p>
              <p style={{ fontSize: "12px", color: "var(--ash)" }}>{m.user.email}</p>
            </div>
            <form action={removeMember}>
              <input type="hidden" name="membershipId" value={m.id} />
              <button type="submit" className="btn ghost sm" style={{ color: "var(--rose)", borderColor: "var(--rose)" }}>
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
