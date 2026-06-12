import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: {
    default: "Psico Cursos — Sabrina",
    template: "%s · Psico Cursos",
  },
  description:
    "Plataforma de vídeos e cursos de psicologia. Assista no computador ou no celular.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Psico Cursos",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c184d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterSW />
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
            <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="font-semibold tracking-tight text-lg flex items-center gap-2"
              >
                <span className="inline-block h-6 w-6 rounded-md bg-brand-500" />
                Psico Cursos
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md hover:bg-white/5"
                >
                  Catálogo
                </Link>
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-md hover:bg-white/5 text-slate-300"
                >
                  Admin
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
            Psico Cursos · MVP · feito com cuidado para a Sabrina
          </footer>
        </div>
      </body>
    </html>
  );
}
