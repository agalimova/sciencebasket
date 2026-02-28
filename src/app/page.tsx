import Link from "next/link";
import { FIELDS, FIELD_IDS } from "@/types/fields";
import { db } from "@/db";
import { papers, jobs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

async function getFieldStats() {
  const stats: Record<string, { papers: number; jobs: number }> = {};

  for (const fieldId of FIELD_IDS) {
    const [paperCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(papers)
      .where(eq(papers.fieldId, fieldId));

    const [jobCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.fieldId, fieldId));

    stats[fieldId] = {
      papers: paperCount?.count ?? 0,
      jobs: jobCount?.count ?? 0,
    };
  }
  return stats;
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats: Record<string, { papers: number; jobs: number }> = {};
  try {
    stats = await getFieldStats();
  } catch {
    // DB not initialized yet — show zeros
    for (const fieldId of FIELD_IDS) {
      stats[fieldId] = { papers: 0, jobs: 0 };
    }
  }

  const totalPapers = Object.values(stats).reduce((s, v) => s + v.papers, 0);
  const totalJobs = Object.values(stats).reduce((s, v) => s + v.jobs, 0);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
          ScienceBasket
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          A technical digest of jobs, arXiv papers, and salary data across five
          scientific fields — filtered by curated tag ontologies.
        </p>
        <div className="mt-6 flex justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <span>
            <strong className="text-gray-900 dark:text-white">
              {totalPapers.toLocaleString()}
            </strong>{" "}
            papers
          </span>
          <span>
            <strong className="text-gray-900 dark:text-white">
              {totalJobs.toLocaleString()}
            </strong>{" "}
            jobs
          </span>
          <span>
            <strong className="text-gray-900 dark:text-white">5</strong> fields
          </span>
        </div>
      </section>

      {/* Field cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FIELD_IDS.map((fieldId) => {
          const field = FIELDS[fieldId];
          const fieldStats = stats[fieldId] ?? { papers: 0, jobs: 0 };

          return (
            <Link
              key={fieldId}
              href={`/papers?field=${fieldId}`}
              className="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: field.color }}
                />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600">
                  {field.name}
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {field.description}
              </p>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{fieldStats.papers} papers</span>
                <span>{fieldStats.jobs} jobs</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* How it works */}
      <section className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              1. Daily arXiv Crawl
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We pull new papers every day from arXiv across all five fields and
              tag them with our ontology.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              2. Unified Tag Ontology
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Papers and jobs share the same skill/topic tags — search
              &quot;Protein Structure Prediction&quot; to find both researchers
              and open roles.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              3. Two-Sided Discovery
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Researchers find relevant jobs. Companies find active researchers
              publishing in their niche. Tags bridge both sides.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
