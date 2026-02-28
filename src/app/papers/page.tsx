import { db } from "@/db";
import { papers, tags, paperTags } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { FIELDS, FIELD_IDS, type FieldId } from "@/types/fields";
import { FieldBadge } from "@/components/ui/field-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PapersPageProps {
  searchParams: Promise<{ field?: string; tag?: string; page?: string }>;
}

const PAGE_SIZE = 25;

export default async function PapersPage({ searchParams }: PapersPageProps) {
  const params = await searchParams;
  const fieldFilter = params.field as FieldId | undefined;
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10));

  let paperList: {
    id: number;
    arxivId: string;
    title: string;
    abstract: string;
    authors: string;
    fieldId: string;
    publishedAt: string;
    absUrl: string | null;
  }[] = [];

  try {
    const conditions = [];
    if (fieldFilter && FIELD_IDS.includes(fieldFilter)) {
      conditions.push(eq(papers.fieldId, fieldFilter));
    }

    paperList = await db
      .select({
        id: papers.id,
        arxivId: papers.arxivId,
        title: papers.title,
        abstract: papers.abstract,
        authors: papers.authors,
        fieldId: papers.fieldId,
        publishedAt: papers.publishedAt,
        absUrl: papers.absUrl,
      })
      .from(papers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(papers.publishedAt))
      .limit(PAGE_SIZE)
      .offset((pageNum - 1) * PAGE_SIZE);
  } catch {
    // DB not ready
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Papers
        </h1>

        {/* Field filter tabs */}
        <div className="flex gap-2">
          <Link
            href="/papers"
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              !fieldFilter
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            All
          </Link>
          {FIELD_IDS.map((fid) => (
            <Link
              key={fid}
              href={`/papers?field=${fid}`}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                fieldFilter === fid
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
              style={
                fieldFilter === fid
                  ? { backgroundColor: FIELDS[fid].color }
                  : undefined
              }
            >
              {FIELDS[fid].name}
            </Link>
          ))}
        </div>
      </div>

      {/* Paper list */}
      {paperList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No papers yet.</p>
          <p className="text-sm mt-2">
            Run <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">npm run crawl</code> to
            fetch papers from arXiv.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paperList.map((paper) => {
            const authorList: string[] = JSON.parse(paper.authors);
            const truncatedAbstract =
              paper.abstract.length > 300
                ? paper.abstract.slice(0, 300) + "..."
                : paper.abstract;

            return (
              <article
                key={paper.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FieldBadge
                        fieldId={paper.fieldId as FieldId}
                        size="sm"
                      />
                      <span className="text-xs text-gray-400">
                        {paper.arxivId}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(paper.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <a
                      href={paper.absUrl ?? `https://arxiv.org/abs/${paper.arxivId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-emerald-600 transition-colors"
                    >
                      {paper.title}
                    </a>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {authorList.slice(0, 5).join(", ")}
                      {authorList.length > 5 &&
                        ` +${authorList.length - 5} more`}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {truncatedAbstract}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {paperList.length >= PAGE_SIZE && (
        <div className="flex justify-center gap-4 pt-4">
          {pageNum > 1 && (
            <Link
              href={`/papers?${fieldFilter ? `field=${fieldFilter}&` : ""}page=${pageNum - 1}`}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200"
            >
              Previous
            </Link>
          )}
          <Link
            href={`/papers?${fieldFilter ? `field=${fieldFilter}&` : ""}page=${pageNum + 1}`}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200"
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
