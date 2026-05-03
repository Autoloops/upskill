import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "upskill — the skill registry your AI consults before it codes",
  description:
    "10,000+ vetted agent skills indexed from GitHub. Mixture of experts at the agent layer. Search before your AI codes from memory.",
  metadataBase: new URL("https://upskill.autoloops.ai"),
  openGraph: {
    title: "upskill — skill registry for AI agents",
    description:
      "10,000+ skills your AI agent searches before doing real work. Free, open source, MIT.",
    url: "https://upskill.autoloops.ai",
    siteName: "upskill",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "upskill — skill registry for AI agents",
    description: "10,000+ skills your AI agent searches before doing real work."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="page-bg min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
