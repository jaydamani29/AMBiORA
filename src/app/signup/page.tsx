"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser({ name, email, password });
      
      if (res.error) {
        setError(res.error);
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Decorative Kanji watermark */}
      <div 
        style={{
          position: "absolute",
          top: "10%",
          right: "5%",
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
        録
      </div>

      <div style={{
        background: "var(--paper2)",
        border: "2px solid var(--ink)",
        borderRadius: "var(--r)",
        padding: "40px",
        width: "100%",
        maxWidth: "450px",
        boxShadow: "8px 8px 0 var(--ink)",
        position: "relative"
      }}>
        <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "var(--ink)" }}>Join the Arena</h1>
        <p style={{ color: "var(--ash)", marginBottom: "24px" }}>Create your account to register a clan or join one.</p>

        {error && (
          <div className="msg show" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
              Full Name or Alias
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Miyamoto Musashi"
              required
            />
          </div>

          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ronin@ambiora.com"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="password" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirm" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Confirm
              </label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: "100%", marginTop: "8px", textAlign: "center" }}
            disabled={loading}
          >
            {loading ? "Forging..." : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "var(--ash)" }}>
          Already registered?{" "}
          <Link href="/login" style={{ color: "var(--blossom)", fontWeight: 700, textDecoration: "underline" }}>
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}