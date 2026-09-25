"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Something went wrong");
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
        入
      </div>

      <div style={{
        background: "var(--paper2)",
        border: "2px solid var(--ink)",
        borderRadius: "var(--r)",
        padding: "40px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "8px 8px 0 var(--ink)",
        position: "relative"
      }}>
        <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "var(--ink)" }}>Welcome Back</h1>
        <p style={{ color: "var(--ash)", marginBottom: "24px" }}>Enter your credentials to continue.</p>

        {error && (
          <div className="msg show" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: "100%", marginTop: "8px", textAlign: "center" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "var(--ash)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--blossom)", fontWeight: 700, textDecoration: "underline" }}>
            Create one
          </Link>
        </div>
      </div>
    </main>
  );
}