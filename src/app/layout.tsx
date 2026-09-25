import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambiora Arena – Esports Tournament",
  description: "Five clans. One blade. One champion.",
  themeColor: "#FBEDE9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700;800&family=Noto+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <header>
            <nav>
              <Link href="/" className="logo">
                Ambiora<b>Arena</b>
              </Link>
              <div>
                <Link href="/" id="n1">
                  Home
                </Link>
                <Link href="/dashboard" id="n2">
                  Dashboard
                </Link>
              </div>
            </nav>
          </header>
          {children}
          <footer>Ambiora Arena · Technical Department Task</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
