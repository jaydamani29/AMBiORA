import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTeam } from "@/actions/team";
import Link from "next/link";

export default async function CreateTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "MEMBER") {
    // Only unassigned members can create teams. Leaders already have one.
    redirect("/dashboard");
  }

  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div 
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          fontFamily: "'Shippori Mincho', serif",
          fontSize: "250px",
          color: "var(--petal)",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: -1,
          lineHeight: 1
        }}
        aria-hidden="true"
      >
        創
      </div>

      <div style={{
        background: "var(--paper2)",
        border: "2px solid var(--ink)",
        borderRadius: "var(--r)",
        padding: "40px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "8px 8px 0 var(--ink)",
      }}>
        <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "var(--ink)" }}>Forge Your Clan</h1>
        <p style={{ color: "var(--ash)", marginBottom: "24px" }}>Give your team a name and receive a code to invite your squad.</p>

        <form action={createTeam} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
              Clan Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Pixel Storm"
              required
              minLength={3}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <Link href="/dashboard" className="btn ghost" style={{ flex: 1, textAlign: "center" }}>Cancel</Link>
            <button type="submit" className="btn" style={{ flex: 2 }}>Create Clan</button>
          </div>
        </form>
      </div>
    </main>
  );
}
