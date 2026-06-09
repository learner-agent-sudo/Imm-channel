import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { disclaimer } from "@/lib/rules/parameters";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imm Channel — your roadmap to Canadian PR and citizenship",
  description:
    "Answer a few anonymous questions and get a ranked, step-by-step pathway to Canadian permanent residence and citizenship — kept current as IRCC policy changes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-maple">🍁</span> Imm Channel
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium text-soft">
              <Link href="/plan" className="hover:text-ink">
                Plan my pathway
              </Link>
              <Link href="/updates" className="hover:text-ink">
                Policy updates
              </Link>
              <Link href="/methodology" className="hover:text-ink">
                Methodology
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-xs leading-relaxed text-soft">
            <p className="font-semibold text-ink">
              Independent tool — not the Government of Canada
            </p>
            <p>{disclaimer}</p>
            <p>
              Privacy: the planner runs entirely in your browser. Your answers
              are never uploaded, stored, or shared.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
