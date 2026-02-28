import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/layout/nav";

export const metadata: Metadata = {
  title: "ScienceBasket — Jobs, Papers & Skills across Scientific Fields",
  description:
    "A technical digest of jobs, arXiv papers, and salary data across Computational Biology, ML/AI, Quantum Computing, Climate Tech, and Robotics — filtered by curated tag ontologies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
