import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { joinTeam } from "@/actions/team";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // If user is owner, redirect to admin panel
  if (session.user.role === "OWNER") {
    redirect("/admin");
  }

  // Find out if the user is in a team or is a leader
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamLeaderOf: {
        include: {
          members: { include: { user: true } },
          leader: true
        }
      },
      membership: {
        include: {
          team: {
            include: {
              members: { include: { user: true } },
              leader: true
            }
          }
        }
      }
    }
  });

  const isLeader = user?.role === "LEADER";
  const team = isLeader ? user?.teamLeaderOf : user?.membership?.team;

  return (
    <main style={{ minHeight: "80vh", padding: "40px 5vw", position: "relative" }}>
      <h1 style={{ fontSize: "36px", color: "var(--ink)" }}>Dashboard</h1>
      <p style={{ color: "var(--ash)", marginBottom: "32px" }}>Welcome back, {session.user.name}.</p>

      {!team ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <div style={{ background: "var(--paper2)", padding: "30px", border: "2px solid var(--ink)", borderRadius: "var(--r)", boxShadow: "4px 4px 0 var(--ink)" }}>
            <h2 style={{ color: "var(--blossom)", marginBottom: "10px", fontSize: "24px" }}>Start a Clan</h2>
            <p style={{ color: "var(--ash)", marginBottom: "20px" }}>Become a team leader and invite up to 4 other players.</p>
            <Link href="/team/create" className="btn">Create Team</Link>
          </div>
          <div style={{ background: "var(--paper2)", padding: "30px", border: "2px solid var(--ink)", borderRadius: "var(--r)", boxShadow: "4px 4px 0 var(--ink)" }}>
            <h2 style={{ color: "var(--ink)", marginBottom: "10px", fontSize: "24px" }}>Join a Clan</h2>
            <p style={{ color: "var(--ash)", marginBottom: "20px" }}>Got a code from your team leader? Enter it here.</p>
            <form action={async (formData: FormData) => {
              "use server";
              await joinTeam(formData);
            }} style={{ display: "flex", gap: "8px" }}>
              <input type="text" name="code" placeholder="Team Code" style={{ flex: 1 }} required />
              <button type="submit" className="btn ghost">Join</button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: "var(--paper2)", padding: "30px", border: "2px solid var(--ink)", borderRadius: "var(--r)", boxShadow: "4px 4px 0 var(--ink)", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "28px", color: "var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {team.name}
              {isLeader && <Link href="/team/manage" className="btn ghost sm">Manage Roster</Link>}
            </h2>
            <p style={{ color: "var(--ash)", marginTop: "8px" }}>Team Code: <b>{team.code}</b></p>
          </div>

          <h3 style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>Roster</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {/* Show leader */}
            <div style={{ background: "var(--paper)", padding: "16px", border: "2px solid var(--blossom)", borderRadius: "var(--r)", borderTop: "6px solid var(--blossom)" }}>
              <p style={{ fontWeight: 700 }}>{team.leader?.name || user?.name}</p>
              <p style={{ fontSize: "12px", color: "var(--ash)" }}>Leader</p>
            </div>
            {/* Show members */}
            {team.members?.map(m => (
              <div key={m.id} style={{ background: "var(--paper)", padding: "16px", border: "2px solid var(--ink)", borderRadius: "var(--r)", borderTop: "6px solid var(--ink)" }}>
                <p style={{ fontWeight: 700 }}>{m.user.name}</p>
                <p style={{ fontSize: "12px", color: "var(--ash)" }}>Member</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}