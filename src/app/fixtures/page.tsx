import { prisma } from "@/lib/prisma";

export default async function FixturesPage() {
  const teams = await prisma.team.findMany({
    include: { leader: true, members: { include: { user: true } } },
  });

  const matches = await prisma.match.findMany({
    orderBy: { round: 'asc' }
  });

  // Calculate standings
  const standings = teams.map(t => ({
    id: t.id,
    name: t.name,
    p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0
  }));

  matches.forEach(m => {
    if (m.scoreA === null || m.scoreB === null) return;
    const a = standings.find(s => s.id === m.teamAId);
    const b = standings.find(s => s.id === m.teamBId);
    if (!a || !b) return;

    a.p++; b.p++;
    a.gf += m.scoreA; a.ga += m.scoreB;
    b.gf += m.scoreB; b.ga += m.scoreA;

    if (m.scoreA > m.scoreB) { a.w++; b.l++; a.pts += 3; }
    else if (m.scoreB > m.scoreA) { b.w++; a.l++; b.pts += 3; }
    else { a.d++; b.d++; a.pts++; b.pts++; }
  });

  standings.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

  return (
    <main style={{ minHeight: "80vh", padding: "40px 5vw", position: "relative" }}>
      <h1 style={{ fontSize: "36px", color: "var(--ink)", marginBottom: "32px" }}>Tournament Standings</h1>

      {matches.length === 0 ? (
        <div className="empty" style={{ padding: "40px", textAlign: "center", border: "2px dashed var(--ink)", borderRadius: "var(--r)", color: "var(--ash)" }}>
          The tournament has not started yet. Fixtures are pending.
        </div>
      ) : (
        <>
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>Points Table</h2>
            <div className="wrap" style={{ overflowX: "auto", borderRadius: "var(--r)", border: "2px solid var(--ink)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--paper)" }}>
                <thead>
                  <tr>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>#</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "left" }}>Team</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>P</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>W</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>D</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>L</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>GD</th>
                    <th style={{ background: "var(--ink)", color: "var(--paper)", padding: "12px", textAlign: "center" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, index) => (
                    <tr key={t.id} style={{ background: index === 0 ? "rgba(244, 179, 196, 0.3)" : index % 2 === 0 ? "var(--paper)" : "var(--paper2)" }}>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)", fontWeight: index === 0 ? 700 : 400 }}>{index + 1}</td>
                      <td style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid var(--ash)", fontWeight: index === 0 ? 700 : 400 }}>{t.name}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}>{t.p}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}>{t.w}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}>{t.d}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}>{t.l}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}>{t.gf - t.ga}</td>
                      <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid var(--ash)" }}><b>{t.pts}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "24px", color: "var(--ink)", marginBottom: "16px" }}>Match Fixtures</h2>
            <div className="rounds" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
              {[1, 2, 3, 4, 5].map(round => {
                const roundMatches = matches.filter(m => m.round === round);
                if (roundMatches.length === 0) return null;
                return (
                  <div key={round} className="round" style={{ background: "var(--paper2)", border: "2px solid var(--ink)", borderRadius: "var(--r)", padding: "18px" }}>
                    <h3 style={{ fontSize: "20px", marginBottom: "12px", color: "var(--blossom)", borderBottom: "2px solid var(--ink)", paddingBottom: "8px" }}>Round {round}</h3>
                    {roundMatches.map(m => {
                      const teamA = teams.find(t => t.id === m.teamAId)?.name;
                      const teamB = teams.find(t => t.id === m.teamBId)?.name;
                      return (
                        <div key={m.id} className="match" style={{ display: "grid", gridTemplateColumns: "1fr 46px auto 46px 1fr", gap: "8px", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--ash)", fontWeight: 700, fontSize: "14px" }}>
                          <span style={{ textAlign: "right" }}>{teamA}</span>
                          <span style={{ textAlign: "center" }}>{m.scoreA !== null ? m.scoreA : "-"}</span>
                          <em style={{ color: "var(--blossom)", fontSize: "12px", fontStyle: "normal" }}>VS</em>
                          <span style={{ textAlign: "center" }}>{m.scoreB !== null ? m.scoreB : "-"}</span>
                          <span style={{ textAlign: "left" }}>{teamB}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
