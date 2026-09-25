import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateFixtures, updateMatchScore } from "@/actions/admin";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const teams = await prisma.team.findMany({
    include: { leader: true, members: { include: { user: true } } },
  });

  const matches = await prisma.match.findMany({
    orderBy: { round: 'asc' }
  });

  const canGenerate = teams.length >= 5;

  return (
    <main style={{ minHeight: "80vh", padding: "40px 5vw", position: "relative" }}>
      <h1 style={{ fontSize: "36px", color: "var(--ink)" }}>Owner Control Panel</h1>
      <p style={{ color: "var(--ash)", marginBottom: "32px" }}>Manage teams, fixtures, and update match scores.</p>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>Teams ({teams.length}/5)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {teams.map(team => (
            <div key={team.id} style={{ background: "var(--paper2)", padding: "20px", border: "2px solid var(--ink)", borderRadius: "var(--r)" }}>
              <h3 style={{ fontSize: "20px", color: "var(--blossom)", display: "flex", justifyContent: "space-between" }}>
                {team.name}
                <span style={{ fontSize: "14px", color: "var(--ash)" }}>{team.code}</span>
              </h3>
              <p style={{ fontSize: "14px", fontWeight: 700 }}>Leader: {team.leader.name}</p>
              <p style={{ fontSize: "14px", color: "var(--ash)" }}>Members: {team.members.length + 1}/5</p>
            </div>
          ))}
          {teams.length === 0 && <p style={{ color: "var(--ash)" }}>No teams registered yet.</p>}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "24px", color: "var(--ink)" }}>Fixtures & Matches</h2>
          <form action={async () => {
            "use server";
            await generateFixtures();
          }}>
            <button type="submit" className="btn sm" disabled={!canGenerate}>
              Generate Fixtures (Requires 5 Teams)
            </button>
          </form>
        </div>

        {matches.length > 0 ? (
          <div className="rounds">
            {[1, 2, 3, 4, 5].map(round => {
              const roundMatches = matches.filter(m => m.round === round);
              if (roundMatches.length === 0) return null;
              return (
                <div key={round} className="round" style={{ background: "var(--paper2)", padding: "16px", border: "2px solid var(--ink)", borderRadius: "var(--r)", marginBottom: "16px" }}>
                  <h3 style={{ color: "var(--blossom)", fontSize: "18px", borderBottom: "1px solid var(--ink)", paddingBottom: "8px", marginBottom: "12px" }}>Round {round}</h3>
                  {roundMatches.map(m => {
                    const teamA = teams.find(t => t.id === m.teamAId)?.name;
                    const teamB = teams.find(t => t.id === m.teamBId)?.name;
                    
                    const updateScore = updateMatchScore.bind(null, m.id);

                    return (
                      <form action={async (formData) => {
                        "use server";
                        await updateScore(Number(formData.get('scoreA')), Number(formData.get('scoreB')));
                      }} key={m.id} className="match" style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto 1fr", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ textAlign: "right", fontWeight: 700 }}>{teamA}</span>
                        <input type="number" name="scoreA" defaultValue={m.scoreA ?? ""} style={{ width: "60px", textAlign: "center" }} required min={0} />
                        <em style={{ color: "var(--blossom)" }}>VS</em>
                        <input type="number" name="scoreB" defaultValue={m.scoreB ?? ""} style={{ width: "60px", textAlign: "center" }} required min={0} />
                        <span style={{ fontWeight: 700 }}>{teamB}</span>
                        <button type="submit" className="btn ghost sm" style={{ gridColumn: "1 / -1" }}>Save Score</button>
                      </form>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty" style={{ padding: "40px", textAlign: "center", border: "2px dashed var(--ink)", borderRadius: "var(--r)", color: "var(--ash)" }}>
            Fixtures not generated yet.
          </div>
        )}
      </section>
    </main>
  );
}
